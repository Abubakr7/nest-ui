import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  file: string;
  tests: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>;
}

@Injectable()
export class TestingService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');
  private lastResults: Map<string, TestResult[]> = new Map();

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  async discoverTests(projectId: string): Promise<{
    unit: string[];
    e2e: string[];
    total: number;
  }> {
    const projectPath = await this.getProjectPath(projectId);
    const unit: string[] = [];
    const e2e: string[] = [];

    const findTests = async (dir: string, isE2e: boolean = false): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === 'dist') continue;

          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(projectPath, fullPath);

          if (entry.isDirectory()) {
            await findTests(fullPath, entry.name === 'e2e' || entry.name === 'test');
          } else if (
            entry.name.endsWith('.spec.ts') ||
            entry.name.endsWith('.test.ts')
          ) {
            if (isE2e || entry.name.includes('e2e')) {
              e2e.push(relativePath);
            } else {
              unit.push(relativePath);
            }
          }
        }
      } catch {}
    };

    await findTests(projectPath);

    return { unit, e2e, total: unit.length + e2e.length };
  }

  async runAllTests(
    projectId: string,
    options: { watch?: boolean; coverage?: boolean } = {},
  ): Promise<{
    success: boolean;
    summary: { passed: number; failed: number; skipped: number; total: number };
    output: string;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    const flags: string[] = [];
    if (options.watch) flags.push('--watch');
    if (options.coverage) flags.push('--coverage');
    flags.push('--json');

    try {
      const { stdout, stderr } = await execAsync(
        `npm test -- ${flags.join(' ')}`,
        { cwd: projectPath, timeout: 120000 },
      );

      const result = this.parseJestOutput(stdout);
      return {
        success: result.success,
        summary: result.summary,
        output: stdout + stderr,
      };
    } catch (error: any) {
      const result = this.parseJestOutput(error.stdout || '');
      return {
        success: false,
        summary: result.summary,
        output: error.stdout || error.message,
      };
    }
  }

  async runTestFile(
    projectId: string,
    file: string,
    watch: boolean = false,
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const flags = watch ? '--watch' : '';

    try {
      const { stdout, stderr } = await execAsync(
        `npm test -- ${flags} "${file}"`,
        { cwd: projectPath, timeout: 60000 },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.stdout || error.message };
    }
  }

  async runTestPattern(
    projectId: string,
    pattern: string,
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync(
        `npm test -- --testNamePattern="${pattern}"`,
        { cwd: projectPath, timeout: 60000 },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.stdout || error.message };
    }
  }

  async getCoverageReport(projectId: string): Promise<{
    total: { lines: number; statements: number; functions: number; branches: number };
    files: Array<{
      file: string;
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    }>;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const coveragePath = path.join(projectPath, 'coverage', 'coverage-summary.json');
      const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));

      const total = {
        lines: coverage.total.lines.pct,
        statements: coverage.total.statements.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
      };

      const files = Object.entries(coverage)
        .filter(([key]) => key !== 'total')
        .map(([file, data]: [string, any]) => ({
          file: path.relative(projectPath, file),
          lines: data.lines.pct,
          statements: data.statements.pct,
          functions: data.functions.pct,
          branches: data.branches.pct,
        }));

      return { total, files };
    } catch {
      return {
        total: { lines: 0, statements: 0, functions: 0, branches: 0 },
        files: [],
      };
    }
  }

  async getLastResults(projectId: string): Promise<TestResult[]> {
    return this.lastResults.get(projectId) || [];
  }

  async runE2eTests(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync('npm run test:e2e', {
        cwd: projectPath,
        timeout: 180000,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.stdout || error.message };
    }
  }

  async setupJest(projectId: string): Promise<{ success: boolean; files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);
    const files: string[] = [];

    // Create jest.config.js
    const jestConfig = `module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
`;

    await fs.writeFile(path.join(projectPath, 'jest.config.js'), jestConfig);
    files.push('jest.config.js');

    // Create test folder
    await fs.mkdir(path.join(projectPath, 'test'), { recursive: true });

    // Create e2e config
    const e2eConfig = `import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default config;
`;

    await fs.writeFile(path.join(projectPath, 'test', 'jest-e2e.json'), e2eConfig);
    files.push('test/jest-e2e.json');

    // Create sample e2e test
    const e2eTest = `import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
`;

    await fs.writeFile(path.join(projectPath, 'test', 'app.e2e-spec.ts'), e2eTest);
    files.push('test/app.e2e-spec.ts');

    return { success: true, files };
  }

  private parseJestOutput(output: string): {
    success: boolean;
    summary: { passed: number; failed: number; skipped: number; total: number };
  } {
    try {
      const json = JSON.parse(output);
      return {
        success: json.success,
        summary: {
          passed: json.numPassedTests || 0,
          failed: json.numFailedTests || 0,
          skipped: json.numPendingTests || 0,
          total: json.numTotalTests || 0,
        },
      };
    } catch {
      // Parse from text output
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      const skippedMatch = output.match(/(\d+) skipped/);

      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;

      return {
        success: failed === 0,
        summary: { passed, failed, skipped, total: passed + failed + skipped },
      };
    }
  }
}
