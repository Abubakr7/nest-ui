import { Injectable, NotFoundException } from '@nestjs/common';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateProjectDto, UpdateProjectDto, Project } from './dto/project.dto';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private projects: Map<string, Project> = new Map();

  async findAll(): Promise<Project[]> {
    await this.loadProjects();
    return Array.from(this.projects.values());
  }

  async findOne(id: string): Promise<Project> {
    await this.loadProjects();
    const project = this.projects.get(id);
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const id = this.generateId(dto.name);
    const projectPath = path.join(this.projectsDir, id);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Generate NestJS project structure
    await this.generateNestProject(projectPath, dto);

    const project: Project = {
      id,
      name: dto.name,
      description: dto.description || '',
      path: projectPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'stopped',
      config: {
        database: dto.database,
        authentication: dto.authentication,
        swagger: dto.swagger ?? true,
        websockets: dto.websockets ?? false,
      },
    };

    // Save project metadata
    await fs.writeFile(
      path.join(projectPath, 'nest-ui.json'),
      JSON.stringify(project, null, 2),
    );

    this.projects.set(id, project);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    const updated: Project = {
      ...project,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(project.path, 'nest-ui.json'),
      JSON.stringify(updated, null, 2),
    );

    this.projects.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const project = await this.findOne(id);

    // Stop if running
    await this.stop(id);

    // Remove directory
    await fs.rm(project.path, { recursive: true, force: true });

    this.projects.delete(id);
    return { success: true };
  }

  async installDependencies(id: string): Promise<{ success: boolean; output: string }> {
    const project = await this.findOne(id);

    try {
      const { stdout, stderr } = await execAsync('npm install', {
        cwd: project.path,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async build(id: string): Promise<{ success: boolean; output: string }> {
    const project = await this.findOne(id);

    try {
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: project.path,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async start(id: string): Promise<{ success: boolean; port: number }> {
    const project = await this.findOne(id);

    if (this.runningProcesses.has(id)) {
      return { success: true, port: 3000 + this.getPortOffset(id) };
    }

    const port = 3000 + this.getPortOffset(id);
    const child = spawn('npm', ['run', 'start:dev'], {
      cwd: project.path,
      env: { ...process.env, PORT: port.toString() },
      detached: true,
    });

    this.runningProcesses.set(id, child);

    project.status = 'running';
    this.projects.set(id, project);

    return { success: true, port };
  }

  async stop(id: string): Promise<{ success: boolean }> {
    const child = this.runningProcesses.get(id);

    if (child) {
      child.kill('SIGTERM');
      this.runningProcesses.delete(id);
    }

    const project = this.projects.get(id);
    if (project) {
      project.status = 'stopped';
      this.projects.set(id, project);
    }

    return { success: true };
  }

  async getStatus(id: string): Promise<{ status: string; port?: number }> {
    const project = await this.findOne(id);
    const isRunning = this.runningProcesses.has(id);

    return {
      status: isRunning ? 'running' : 'stopped',
      port: isRunning ? 3000 + this.getPortOffset(id) : undefined,
    };
  }

  private async loadProjects(): Promise<void> {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      const dirs = await fs.readdir(this.projectsDir, { withFileTypes: true });

      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const metaPath = path.join(this.projectsDir, dir.name, 'nest-ui.json');
          try {
            const content = await fs.readFile(metaPath, 'utf-8');
            const project = JSON.parse(content) as Project;
            this.projects.set(project.id, project);
          } catch {
            // Skip directories without nest-ui.json
          }
        }
      }
    } catch {
      // Projects directory doesn't exist yet
    }
  }

  private async generateNestProject(projectPath: string, dto: CreateProjectDto): Promise<void> {
    // Create package.json
    const packageJson = {
      name: dto.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: dto.description || 'NestJS project created with NestUI',
      scripts: {
        build: 'nest build',
        format: 'prettier --write "src/**/*.ts"',
        start: 'nest start',
        'start:dev': 'nest start --watch',
        'start:debug': 'nest start --debug --watch',
        'start:prod': 'node dist/main',
        lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:cov': 'jest --coverage',
      },
      dependencies: {
        '@nestjs/common': '^10.0.0',
        '@nestjs/core': '^10.0.0',
        '@nestjs/platform-express': '^10.0.0',
        'reflect-metadata': '^0.1.13',
        rxjs: '^7.8.1',
        ...(dto.swagger && { '@nestjs/swagger': '^7.0.0' }),
        ...(dto.websockets && {
          '@nestjs/websockets': '^10.0.0',
          '@nestjs/platform-socket.io': '^10.0.0',
        }),
      },
      devDependencies: {
        '@nestjs/cli': '^10.0.0',
        '@nestjs/schematics': '^10.0.0',
        '@types/express': '^4.17.17',
        '@types/node': '^20.3.1',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        eslint: '^8.42.0',
        prettier: '^3.0.0',
        'source-map-support': '^0.5.21',
        'ts-loader': '^9.4.3',
        'ts-node': '^10.9.1',
        'tsconfig-paths': '^4.2.0',
        typescript: '^5.1.3',
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2021',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: true,
        noImplicitAny: true,
        strictBindCallApply: true,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2),
    );

    // Create nest-cli.json
    const nestCli = {
      $schema: 'https://json.schemastore.org/nest-cli',
      collection: '@nestjs/schematics',
      sourceRoot: 'src',
      compilerOptions: { deleteOutDir: true },
    };

    await fs.writeFile(
      path.join(projectPath, 'nest-cli.json'),
      JSON.stringify(nestCli, null, 2),
    );

    // Create src directory and main files
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });

    // main.ts
    const mainTs = `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
${dto.swagger ? "import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';" : ''}
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

${dto.swagger ? `  const config = new DocumentBuilder()
    .setTitle('${dto.name} API')
    .setDescription('${dto.description || 'API documentation'}')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
` : ''}
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(\`Application running on http://localhost:\${port}\`);
}

bootstrap();
`;

    await fs.writeFile(path.join(projectPath, 'src', 'main.ts'), mainTs);

    // app.module.ts
    const appModuleTs = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

    await fs.writeFile(path.join(projectPath, 'src', 'app.module.ts'), appModuleTs);

    // app.controller.ts
    const appControllerTs = `import { Controller, Get } from '@nestjs/common';
${dto.swagger ? "import { ApiTags, ApiOperation } from '@nestjs/swagger';" : ''}
import { AppService } from './app.service';

${dto.swagger ? "@ApiTags('app')" : ''}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  ${dto.swagger ? "@ApiOperation({ summary: 'Get hello message' })" : ''}
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  ${dto.swagger ? "@ApiOperation({ summary: 'Health check endpoint' })" : ''}
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
`;

    await fs.writeFile(path.join(projectPath, 'src', 'app.controller.ts'), appControllerTs);

    // app.service.ts
    const appServiceTs = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from ${dto.name}!';
  }
}
`;

    await fs.writeFile(path.join(projectPath, 'src', 'app.service.ts'), appServiceTs);
  }

  private generateId(name: string): string {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now().toString(36);
    return `${slug}-${timestamp}`;
  }

  private getPortOffset(id: string): number {
    const ids = Array.from(this.projects.keys());
    return ids.indexOf(id) + 1;
  }
}
