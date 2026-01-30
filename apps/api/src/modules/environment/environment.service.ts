import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EnvironmentService {
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

  async getEnvFiles(projectId: string): Promise<string[]> {
    const projectPath = await this.getProjectPath(projectId);
    const files = await fs.readdir(projectPath);

    return files.filter(
      (f) => f === '.env' || f.startsWith('.env.') || f.endsWith('.env'),
    );
  }

  async getEnvVariables(
    projectId: string,
    envName: string,
  ): Promise<Record<string, string>> {
    const projectPath = await this.getProjectPath(projectId);
    const envPath = path.join(projectPath, envName);

    try {
      const content = await fs.readFile(envPath, 'utf-8');
      return this.parseEnvFile(content);
    } catch {
      throw new NotFoundException(`Environment file ${envName} not found`);
    }
  }

  async createEnvFile(
    projectId: string,
    envName: string,
    variables: Record<string, string>,
  ): Promise<{ success: boolean }> {
    const projectPath = await this.getProjectPath(projectId);
    const envPath = path.join(projectPath, envName);

    const content = this.stringifyEnvFile(variables);
    await fs.writeFile(envPath, content);

    return { success: true };
  }

  async updateEnvFile(
    projectId: string,
    envName: string,
    variables: Record<string, string>,
  ): Promise<{ success: boolean }> {
    return this.createEnvFile(projectId, envName, variables);
  }

  async deleteEnvFile(
    projectId: string,
    envName: string,
  ): Promise<{ success: boolean }> {
    const projectPath = await this.getProjectPath(projectId);
    const envPath = path.join(projectPath, envName);

    try {
      await fs.unlink(envPath);
      return { success: true };
    } catch {
      throw new NotFoundException(`Environment file ${envName} not found`);
    }
  }

  async setVariable(
    projectId: string,
    envName: string,
    key: string,
    value: string,
  ): Promise<{ success: boolean }> {
    const variables: Record<string, string> = await this.getEnvVariables(projectId, envName).catch(
      () => ({} as Record<string, string>),
    );
    variables[key] = value;
    return this.updateEnvFile(projectId, envName, variables);
  }

  async deleteVariable(
    projectId: string,
    envName: string,
    key: string,
  ): Promise<{ success: boolean }> {
    const variables = await this.getEnvVariables(projectId, envName);
    delete variables[key];
    return this.updateEnvFile(projectId, envName, variables);
  }

  async generateExample(projectId: string): Promise<{ success: boolean }> {
    const variables: Record<string, string> = await this.getEnvVariables(projectId, '.env').catch(
      () => ({} as Record<string, string>),
    );

    const exampleVariables: Record<string, string> = {};
    for (const key of Object.keys(variables)) {
      // Mask sensitive values
      if (
        key.includes('SECRET') ||
        key.includes('PASSWORD') ||
        key.includes('KEY') ||
        key.includes('TOKEN')
      ) {
        exampleVariables[key] = 'your-secret-here';
      } else if (key.includes('URL') || key.includes('HOST')) {
        exampleVariables[key] = 'localhost';
      } else if (key.includes('PORT')) {
        exampleVariables[key] = variables[key];
      } else {
        exampleVariables[key] = 'your-value-here';
      }
    }

    return this.createEnvFile(projectId, '.env.example', exampleVariables);
  }

  async validate(
    projectId: string,
    envName: string,
  ): Promise<{
    valid: boolean;
    missing: string[];
    extra: string[];
  }> {
    const example = await this.getEnvVariables(projectId, '.env.example').catch(
      () => ({}),
    );
    const current = await this.getEnvVariables(projectId, envName).catch(
      () => ({}),
    );

    const exampleKeys = new Set(Object.keys(example));
    const currentKeys = new Set(Object.keys(current));

    const missing = [...exampleKeys].filter((k) => !currentKeys.has(k));
    const extra = [...currentKeys].filter((k) => !exampleKeys.has(k));

    return {
      valid: missing.length === 0,
      missing,
      extra,
    };
  }

  private parseEnvFile(content: string): Record<string, string> {
    const variables: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      variables[key] = value;
    }

    return variables;
  }

  private stringifyEnvFile(variables: Record<string, string>): string {
    const lines: string[] = [];

    // Group variables by category
    const categories: Record<string, string[]> = {
      app: [],
      database: [],
      auth: [],
      other: [],
    };

    for (const [key, value] of Object.entries(variables)) {
      const line = value.includes(' ') ? `${key}="${value}"` : `${key}=${value}`;

      if (key.startsWith('DB_') || key.includes('DATABASE')) {
        categories.database.push(line);
      } else if (
        key.includes('JWT') ||
        key.includes('SECRET') ||
        key.includes('AUTH')
      ) {
        categories.auth.push(line);
      } else if (
        key.startsWith('APP_') ||
        key === 'PORT' ||
        key === 'NODE_ENV'
      ) {
        categories.app.push(line);
      } else {
        categories.other.push(line);
      }
    }

    if (categories.app.length) {
      lines.push('# Application');
      lines.push(...categories.app);
      lines.push('');
    }

    if (categories.database.length) {
      lines.push('# Database');
      lines.push(...categories.database);
      lines.push('');
    }

    if (categories.auth.length) {
      lines.push('# Authentication');
      lines.push(...categories.auth);
      lines.push('');
    }

    if (categories.other.length) {
      lines.push('# Other');
      lines.push(...categories.other);
    }

    return lines.join('\n').trim() + '\n';
  }
}
