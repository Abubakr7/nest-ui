import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AiService } from '../ai/ai.service';

const execAsync = promisify(exec);

@Injectable()
export class DocumentationService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  constructor(private readonly aiService: AiService) {}

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  async generateReadme(projectId: string): Promise<{ content: string; path: string }> {
    const projectPath = await this.getProjectPath(projectId);

    // Read package.json for project info
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'),
    );

    // Get project structure
    const structure = await this.getProjectStructure(projectPath);

    // Get endpoints from controllers
    const endpoints = await this.discoverEndpoints(projectPath);

    const readme = `# ${packageJson.name}

${packageJson.description || 'A NestJS application'}

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Copy the example environment file and configure your settings:

\`\`\`bash
cp .env.example .env
\`\`\`

## Running the app

\`\`\`bash
# development
npm run start:dev

# production mode
npm run start:prod
\`\`\`

## Testing

\`\`\`bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
\`\`\`

## API Endpoints

${endpoints.map((e) => `- \`${e.method}\` ${e.path} - ${e.description || ''}`).join('\n')}

## Project Structure

\`\`\`
${structure}
\`\`\`

## Built With

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## License

${packageJson.license || 'MIT'}
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);

    return { content: readme, path: 'README.md' };
  }

  async generateApiDocs(projectId: string): Promise<{ content: string; path: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const endpoints = await this.discoverEndpoints(projectPath);

    const docs = `# API Documentation

## Base URL

\`http://localhost:3000\`

## Endpoints

${endpoints.map((e) => `
### ${e.method} ${e.path}

${e.description || 'No description'}

**Controller:** \`${e.controller}\`

**Parameters:**
${e.params.length > 0 ? e.params.map((p) => `- \`${p}\``).join('\n') : 'None'}

---
`).join('')}
`;

    const docsDir = path.join(projectPath, 'docs');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, 'API.md'), docs);

    return { content: docs, path: 'docs/API.md' };
  }

  async generateModuleDocs(
    projectId: string,
    moduleName: string,
  ): Promise<{ content: string; path: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const moduleDir = path.join(projectPath, 'src', moduleName);

    // Read module files
    let moduleContent = '';
    let controllerContent = '';
    let serviceContent = '';

    try {
      moduleContent = await fs.readFile(
        path.join(moduleDir, `${moduleName}.module.ts`),
        'utf-8',
      );
    } catch {}

    try {
      controllerContent = await fs.readFile(
        path.join(moduleDir, `${moduleName}.controller.ts`),
        'utf-8',
      );
    } catch {}

    try {
      serviceContent = await fs.readFile(
        path.join(moduleDir, `${moduleName}.service.ts`),
        'utf-8',
      );
    } catch {}

    const docs = `# ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module

## Overview

This module handles ${moduleName} functionality.

## Files

- \`${moduleName}.module.ts\` - Module definition
- \`${moduleName}.controller.ts\` - HTTP endpoints
- \`${moduleName}.service.ts\` - Business logic

## Controller Endpoints

${this.extractEndpointsFromController(controllerContent, moduleName)}

## Service Methods

${this.extractMethodsFromService(serviceContent)}

## Usage

\`\`\`typescript
import { ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module } from './${moduleName}/${moduleName}.module';

@Module({
  imports: [${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module],
})
export class AppModule {}
\`\`\`
`;

    const docsDir = path.join(projectPath, 'docs', 'modules');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, `${moduleName}.md`), docs);

    return { content: docs, path: `docs/modules/${moduleName}.md` };
  }

  async generateChangelog(projectId: string): Promise<{ content: string; path: string }> {
    const projectPath = await this.getProjectPath(projectId);

    let commits: string[] = [];
    try {
      const { stdout } = await execAsync(
        'git log --pretty=format:"%h - %s (%ci)" -n 50',
        { cwd: projectPath },
      );
      commits = stdout.split('\n').filter(Boolean);
    } catch {}

    const changelog = `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project setup

### Changed

### Fixed

### Removed

## Recent Commits

${commits.map((c) => `- ${c}`).join('\n') || 'No commits yet'}

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`;

    await fs.writeFile(path.join(projectPath, 'CHANGELOG.md'), changelog);

    return { content: changelog, path: 'CHANGELOG.md' };
  }

  async generateContributing(projectId: string): Promise<{ content: string; path: string }> {
    const projectPath = await this.getProjectPath(projectId);

    const contributing = `# Contributing

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Development Process

1. Fork the repo and create your branch from \`main\`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style

- Use TypeScript
- Follow the existing code style
- Run \`npm run lint\` before committing
- Run \`npm run format\` to format code

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation only changes
- \`style:\` Code style changes (formatting, etc)
- \`refactor:\` Code refactoring
- \`test:\` Adding or updating tests
- \`chore:\` Maintenance tasks

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with a note describing your changes
3. The PR will be merged once you have the sign-off of a maintainer

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
`;

    await fs.writeFile(path.join(projectPath, 'CONTRIBUTING.md'), contributing);

    return { content: contributing, path: 'CONTRIBUTING.md' };
  }

  async getSwaggerSpec(projectId: string): Promise<any> {
    const projectPath = await this.getProjectPath(projectId);
    const endpoints = await this.discoverEndpoints(projectPath);

    // Generate basic OpenAPI spec
    const spec = {
      openapi: '3.0.0',
      info: {
        title: projectId,
        version: '1.0.0',
      },
      paths: {} as Record<string, any>,
    };

    for (const endpoint of endpoints) {
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {};
      }
      spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        tags: [endpoint.controller],
        responses: {
          '200': { description: 'Success' },
        },
      };
    }

    return spec;
  }

  async addJsDocComments(
    projectId: string,
    file: string,
  ): Promise<{ content: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const filePath = path.join(projectPath, file);

    const content = await fs.readFile(filePath, 'utf-8');

    // Use AI to add JSDoc comments
    const result = await this.aiService.generateCode({
      description: `Add comprehensive JSDoc comments to the following TypeScript code. Keep all existing code intact, only add documentation comments:\n\n${content}`,
      type: 'documentation',
    });

    await fs.writeFile(filePath, result.code);

    return { content: result.code };
  }

  async getDocTree(projectId: string): Promise<Array<{ name: string; path: string; type: string }>> {
    const projectPath = await this.getProjectPath(projectId);
    const docs: Array<{ name: string; path: string; type: string }> = [];

    const docFiles = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE'];
    for (const file of docFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        docs.push({ name: file, path: file, type: 'root' });
      } catch {}
    }

    // Check docs folder
    try {
      const docsDir = path.join(projectPath, 'docs');
      const entries = await fs.readdir(docsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          docs.push({ name: entry.name, path: `docs/${entry.name}`, type: 'docs' });
        } else if (entry.isDirectory()) {
          const subEntries = await fs.readdir(path.join(docsDir, entry.name));
          for (const subEntry of subEntries) {
            if (subEntry.endsWith('.md')) {
              docs.push({
                name: subEntry,
                path: `docs/${entry.name}/${subEntry}`,
                type: entry.name,
              });
            }
          }
        }
      }
    } catch {}

    return docs;
  }

  private async getProjectStructure(projectPath: string): Promise<string> {
    const lines: string[] = [];

    const walk = async (dir: string, prefix: string = ''): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const filtered = entries.filter(
        (e) => !['node_modules', 'dist', '.git', 'coverage'].includes(e.name),
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        const isLast = i === filtered.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        lines.push(prefix + connector + entry.name);

        if (entry.isDirectory()) {
          await walk(path.join(dir, entry.name), newPrefix);
        }
      }
    };

    const srcPath = path.join(projectPath, 'src');
    try {
      lines.push('src/');
      await walk(srcPath, '');
    } catch {}

    return lines.join('\n');
  }

  private async discoverEndpoints(projectPath: string): Promise<Array<{
    method: string;
    path: string;
    controller: string;
    description: string;
    params: string[];
  }>> {
    const endpoints: Array<{
      method: string;
      path: string;
      controller: string;
      description: string;
      params: string[];
    }> = [];

    const srcPath = path.join(projectPath, 'src');

    const findControllers = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && entry.name !== 'node_modules') {
            await findControllers(fullPath);
          } else if (entry.name.endsWith('.controller.ts')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const controllerEndpoints = this.parseControllerEndpoints(content);
            endpoints.push(...controllerEndpoints);
          }
        }
      } catch {}
    };

    await findControllers(srcPath);

    return endpoints;
  }

  private parseControllerEndpoints(content: string): Array<{
    method: string;
    path: string;
    controller: string;
    description: string;
    params: string[];
  }> {
    const endpoints: Array<{
      method: string;
      path: string;
      controller: string;
      description: string;
      params: string[];
    }> = [];

    const controllerMatch = content.match(/@Controller\(['"]([^'"]*)['"]\)/);
    const basePath = controllerMatch ? `/${controllerMatch[1]}` : '';

    const classMatch = content.match(/export class (\w+)/);
    const controllerName = classMatch ? classMatch[1] : 'Unknown';

    const methodRegex = /@(Get|Post|Put|Patch|Delete)\(['"]?([^'")\s]*)?['"]?\)/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const subPath = match[2] || '';
      const fullPath = `${basePath}${subPath ? '/' + subPath : ''}`.replace(/\/+/g, '/');

      // Extract params
      const params: string[] = [];
      const paramMatches = fullPath.match(/:(\w+)/g);
      if (paramMatches) {
        params.push(...paramMatches.map((p) => p.slice(1)));
      }

      endpoints.push({
        method,
        path: fullPath || '/',
        controller: controllerName,
        description: '',
        params,
      });
    }

    return endpoints;
  }

  private extractEndpointsFromController(content: string, moduleName: string): string {
    if (!content) return 'No controller found';

    const lines: string[] = [];
    const methodRegex = /@(Get|Post|Put|Patch|Delete)\(['"]?([^'")\s]*)?['"]?\)[\s\S]*?(\w+)\([^)]*\)/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2] || '/';
      const funcName = match[3];

      lines.push(`- \`${method}\` \`/${moduleName}${path ? '/' + path : ''}\` - ${funcName}`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No endpoints found';
  }

  private extractMethodsFromService(content: string): string {
    if (!content) return 'No service found';

    const lines: string[] = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      if (!['constructor'].includes(methodName)) {
        lines.push(`- \`${methodName}()\``);
      }
    }

    return lines.length > 0 ? lines.join('\n') : 'No methods found';
  }
}
