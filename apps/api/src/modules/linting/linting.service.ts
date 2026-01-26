import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LintResult {
  file: string;
  errors: number;
  warnings: number;
  messages: Array<{
    line: number;
    column: number;
    severity: 'error' | 'warning';
    message: string;
    ruleId: string;
  }>;
}

@Injectable()
export class LintingService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  async setup(projectId: string): Promise<{ success: boolean; files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);
    const files: string[] = [];

    // ESLint config
    const eslintConfig = {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: '.',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      root: true,
      env: {
        node: true,
        jest: true,
      },
      ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
      rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    };

    await fs.writeFile(
      path.join(projectPath, '.eslintrc.js'),
      `module.exports = ${JSON.stringify(eslintConfig, null, 2)};\n`,
    );
    files.push('.eslintrc.js');

    // Prettier config
    const prettierConfig = {
      singleQuote: true,
      trailingComma: 'all',
      tabWidth: 2,
      semi: true,
      printWidth: 100,
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'lf',
    };

    await fs.writeFile(
      path.join(projectPath, '.prettierrc'),
      JSON.stringify(prettierConfig, null, 2),
    );
    files.push('.prettierrc');

    // Prettier ignore
    const prettierIgnore = `dist
node_modules
coverage
*.md
`;
    await fs.writeFile(path.join(projectPath, '.prettierignore'), prettierIgnore);
    files.push('.prettierignore');

    // ESLint ignore
    const eslintIgnore = `dist
node_modules
coverage
`;
    await fs.writeFile(path.join(projectPath, '.eslintignore'), eslintIgnore);
    files.push('.eslintignore');

    return { success: true, files };
  }

  async getStatus(projectId: string): Promise<{
    eslint: boolean;
    prettier: boolean;
    eslintConfig: string | null;
    prettierConfig: string | null;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    let eslint = false;
    let prettier = false;
    let eslintConfig: string | null = null;
    let prettierConfig: string | null = null;

    const eslintFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc'];
    for (const file of eslintFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        eslint = true;
        eslintConfig = file;
        break;
      } catch {}
    }

    const prettierFiles = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
    for (const file of prettierFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        prettier = true;
        prettierConfig = file;
        break;
      } catch {}
    }

    return { eslint, prettier, eslintConfig, prettierConfig };
  }

  async lint(
    projectId: string,
    fix: boolean = false,
  ): Promise<{
    success: boolean;
    totalErrors: number;
    totalWarnings: number;
    results: LintResult[];
  }> {
    const projectPath = await this.getProjectPath(projectId);
    const fixFlag = fix ? '--fix' : '';

    try {
      const { stdout } = await execAsync(
        `npx eslint "src/**/*.ts" ${fixFlag} --format json`,
        { cwd: projectPath },
      );

      const results = JSON.parse(stdout);
      return this.formatLintResults(results);
    } catch (error: any) {
      // ESLint exits with code 1 if there are errors
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.formatLintResults(results);
        } catch {}
      }

      return {
        success: false,
        totalErrors: 0,
        totalWarnings: 0,
        results: [],
      };
    }
  }

  async lintFile(
    projectId: string,
    file: string,
    fix: boolean = false,
  ): Promise<LintResult | null> {
    const projectPath = await this.getProjectPath(projectId);
    const fixFlag = fix ? '--fix' : '';

    try {
      const { stdout } = await execAsync(
        `npx eslint "${file}" ${fixFlag} --format json`,
        { cwd: projectPath },
      );

      const results = JSON.parse(stdout);
      if (results.length > 0) {
        return this.formatSingleResult(results[0], projectPath);
      }
      return null;
    } catch (error: any) {
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          if (results.length > 0) {
            return this.formatSingleResult(results[0], projectPath);
          }
        } catch {}
      }
      return null;
    }
  }

  async format(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync(
        'npx prettier --write "src/**/*.ts"',
        { cwd: projectPath },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async formatFile(
    projectId: string,
    file: string,
  ): Promise<{ success: boolean; content?: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      await execAsync(`npx prettier --write "${file}"`, { cwd: projectPath });
      const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
      return { success: true, content };
    } catch (error: any) {
      return { success: false };
    }
  }

  async getEslintConfig(projectId: string): Promise<any> {
    const projectPath = await this.getProjectPath(projectId);

    const configFiles = ['.eslintrc.js', '.eslintrc.json', '.eslintrc'];
    for (const file of configFiles) {
      try {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
        if (file.endsWith('.js')) {
          // Extract object from module.exports
          const match = content.match(/module\.exports\s*=\s*({[\s\S]*});?\s*$/);
          if (match) {
            return JSON.parse(match[1].replace(/'/g, '"'));
          }
        }
        return JSON.parse(content);
      } catch {}
    }

    return null;
  }

  async updateEslintConfig(projectId: string, config: any): Promise<{ success: boolean }> {
    const projectPath = await this.getProjectPath(projectId);

    await fs.writeFile(
      path.join(projectPath, '.eslintrc.js'),
      `module.exports = ${JSON.stringify(config, null, 2)};\n`,
    );

    return { success: true };
  }

  async getPrettierConfig(projectId: string): Promise<any> {
    const projectPath = await this.getProjectPath(projectId);

    const configFiles = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
    for (const file of configFiles) {
      try {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
        return JSON.parse(content);
      } catch {}
    }

    return null;
  }

  async updatePrettierConfig(projectId: string, config: any): Promise<{ success: boolean }> {
    const projectPath = await this.getProjectPath(projectId);

    await fs.writeFile(
      path.join(projectPath, '.prettierrc'),
      JSON.stringify(config, null, 2),
    );

    return { success: true };
  }

  private formatLintResults(results: any[]): {
    success: boolean;
    totalErrors: number;
    totalWarnings: number;
    results: LintResult[];
  } {
    let totalErrors = 0;
    let totalWarnings = 0;

    const formatted = results.map((r: any) => {
      totalErrors += r.errorCount;
      totalWarnings += r.warningCount;

      return {
        file: r.filePath,
        errors: r.errorCount,
        warnings: r.warningCount,
        messages: r.messages.map((m: any) => ({
          line: m.line,
          column: m.column,
          severity: m.severity === 2 ? 'error' : 'warning',
          message: m.message,
          ruleId: m.ruleId,
        })),
      };
    });

    return {
      success: totalErrors === 0,
      totalErrors,
      totalWarnings,
      results: formatted,
    };
  }

  private formatSingleResult(result: any, projectPath: string): LintResult {
    return {
      file: path.relative(projectPath, result.filePath),
      errors: result.errorCount,
      warnings: result.warningCount,
      messages: result.messages.map((m: any) => ({
        line: m.line,
        column: m.column,
        severity: m.severity === 2 ? 'error' : 'warning',
        message: m.message,
        ruleId: m.ruleId,
      })),
    };
  }
}
