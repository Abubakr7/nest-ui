import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  latest?: string;
  type: 'dependency' | 'devDependency';
}

@Injectable()
export class DependenciesService {
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

  async getAll(projectId: string): Promise<{
    dependencies: PackageInfo[];
    devDependencies: PackageInfo[];
  }> {
    const projectPath = await this.getProjectPath(projectId);
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'),
    );

    const dependencies = Object.entries(packageJson.dependencies || {}).map(
      ([name, version]) => ({
        name,
        version: version as string,
        type: 'dependency' as const,
      }),
    );

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(
      ([name, version]) => ({
        name,
        version: version as string,
        type: 'devDependency' as const,
      }),
    );

    return { dependencies, devDependencies };
  }

  async getOutdated(projectId: string): Promise<Array<{
    name: string;
    current: string;
    wanted: string;
    latest: string;
  }>> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout } = await execAsync('npm outdated --json', { cwd: projectPath });
      const outdated = JSON.parse(stdout || '{}');

      return Object.entries(outdated).map(([name, info]: [string, any]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
      }));
    } catch (error: any) {
      // npm outdated exits with code 1 if there are outdated packages
      if (error.stdout) {
        const outdated = JSON.parse(error.stdout || '{}');
        return Object.entries(outdated).map(([name, info]: [string, any]) => ({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
        }));
      }
      return [];
    }
  }

  async audit(projectId: string): Promise<{
    vulnerabilities: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
    advisories: Array<{
      id: number;
      title: string;
      severity: string;
      module: string;
    }>;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout } = await execAsync('npm audit --json', { cwd: projectPath });
      const audit = JSON.parse(stdout);

      return {
        vulnerabilities: audit.metadata?.vulnerabilities || {
          total: 0,
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
        },
        advisories: Object.values(audit.advisories || {}).map((adv: any) => ({
          id: adv.id,
          title: adv.title,
          severity: adv.severity,
          module: adv.module_name,
        })),
      };
    } catch (error: any) {
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          return {
            vulnerabilities: audit.metadata?.vulnerabilities || {
              total: 0,
              critical: 0,
              high: 0,
              moderate: 0,
              low: 0,
            },
            advisories: [],
          };
        } catch {}
      }
      return {
        vulnerabilities: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
        advisories: [],
      };
    }
  }

  async search(query: string): Promise<Array<{
    name: string;
    version: string;
    description: string;
    downloads: number;
  }>> {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`,
      );
      const data = await response.json();

      return data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || '',
        downloads: obj.downloads?.weekly || 0,
      }));
    } catch {
      return [];
    }
  }

  async getPackageInfo(packageName: string): Promise<{
    name: string;
    version: string;
    description: string;
    homepage?: string;
    repository?: string;
    license?: string;
    dependencies: Record<string, string>;
    versions: string[];
  } | null> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      const data = await response.json();

      return {
        name: data.name,
        version: data['dist-tags']?.latest,
        description: data.description,
        homepage: data.homepage,
        repository: data.repository?.url,
        license: data.license,
        dependencies: data.versions?.[data['dist-tags']?.latest]?.dependencies || {},
        versions: Object.keys(data.versions || {}).slice(-10).reverse(),
      };
    } catch {
      return null;
    }
  }

  async install(
    projectId: string,
    packages: string[],
    dev: boolean = false,
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const flag = dev ? '-D' : '-S';
    const packageList = packages.join(' ');

    try {
      const { stdout, stderr } = await execAsync(
        `npm install ${flag} ${packageList}`,
        { cwd: projectPath },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async uninstall(
    projectId: string,
    packages: string[],
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const packageList = packages.join(' ');

    try {
      const { stdout, stderr } = await execAsync(`npm uninstall ${packageList}`, {
        cwd: projectPath,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async update(
    projectId: string,
    packages?: string[],
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const packageList = packages?.join(' ') || '';

    try {
      const { stdout, stderr } = await execAsync(`npm update ${packageList}`, {
        cwd: projectPath,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async getScripts(projectId: string): Promise<Record<string, string>> {
    const projectPath = await this.getProjectPath(projectId);
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'),
    );

    return packageJson.scripts || {};
  }

  async runScript(
    projectId: string,
    script: string,
  ): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync(`npm run ${script}`, {
        cwd: projectPath,
        timeout: 60000,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }
}
