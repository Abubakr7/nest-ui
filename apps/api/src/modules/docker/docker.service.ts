import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DockerConfigDto } from './dto/docker.dto';

const execAsync = promisify(exec);

@Injectable()
export class DockerService {
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

  async generateDockerConfig(
    projectId: string,
    dto: DockerConfigDto,
  ): Promise<{ files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);
    const files: string[] = [];

    // Generate Dockerfile
    const dockerfile = this.generateDockerfile(dto);
    await fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);
    files.push('Dockerfile');

    // Generate .dockerignore
    const dockerignore = `node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.*
coverage
.nyc_output
*.md
.vscode
.idea
`;
    await fs.writeFile(path.join(projectPath, '.dockerignore'), dockerignore);
    files.push('.dockerignore');

    // Generate docker-compose.yml
    const dockerCompose = this.generateDockerCompose(dto, projectId);
    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
    files.push('docker-compose.yml');

    // Generate docker-compose.dev.yml for development
    const dockerComposeDev = this.generateDockerComposeDev(dto, projectId);
    await fs.writeFile(path.join(projectPath, 'docker-compose.dev.yml'), dockerComposeDev);
    files.push('docker-compose.dev.yml');

    return { files };
  }

  private generateDockerfile(dto: DockerConfigDto): string {
    const nodeVersion = dto.nodeVersion || '20';
    const isMultiStage = dto.multiStage !== false;

    if (isMultiStage) {
      return `# Build stage
FROM node:${nodeVersion}-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:${nodeVersion}-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE ${dto.port || 3000}

USER node

CMD ["node", "dist/main.js"]
`;
    }

    return `FROM node:${nodeVersion}-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE ${dto.port || 3000}

USER node

CMD ["node", "dist/main.js"]
`;
  }

  private generateDockerCompose(dto: DockerConfigDto, projectId: string): string {
    const services: string[] = [];

    // App service
    services.push(`  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${projectId}-app
    ports:
      - "\${PORT:-3000}:${dto.port || 3000}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`);

    // Database service
    if (dto.database) {
      const dbService = this.generateDatabaseService(dto.database, projectId);
      services.push(dbService);

      // Add depends_on to app
      services[0] = services[0].replace(
        'restart: unless-stopped',
        `depends_on:
      - db
    restart: unless-stopped`,
      );
    }

    // Redis service
    if (dto.redis) {
      services.push(`  redis:
    image: redis:alpine
    container_name: ${projectId}-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped`);
    }

    let volumes = '';
    if (dto.database || dto.redis) {
      const volumeList: string[] = [];
      if (dto.database) volumeList.push('  db_data:');
      if (dto.redis) volumeList.push('  redis_data:');
      volumes = `\nvolumes:\n${volumeList.join('\n')}`;
    }

    return `version: '3.8'

services:
${services.join('\n\n')}
${volumes}
`;
  }

  private generateDatabaseService(dbType: string, projectId: string): string {
    switch (dbType) {
      case 'postgresql':
        return `  db:
    image: postgres:15-alpine
    container_name: ${projectId}-db
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-password}
      POSTGRES_DB: \${DB_NAME:-nestui}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped`;

      case 'mysql':
        return `  db:
    image: mysql:8
    container_name: ${projectId}-db
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_USER: \${DB_USER:-mysql}
      MYSQL_PASSWORD: \${DB_PASSWORD:-password}
      MYSQL_DATABASE: \${DB_NAME:-nestui}
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped`;

      case 'mongodb':
        return `  db:
    image: mongo:6
    container_name: ${projectId}-db
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${DB_USER:-mongo}
      MONGO_INITDB_ROOT_PASSWORD: \${DB_PASSWORD:-password}
    ports:
      - "27017:27017"
    volumes:
      - db_data:/data/db
    restart: unless-stopped`;

      default:
        return '';
    }
  }

  private generateDockerComposeDev(dto: DockerConfigDto, projectId: string): string {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    container_name: ${projectId}-dev
    ports:
      - "\${PORT:-3000}:${dto.port || 3000}"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run start:dev
    restart: unless-stopped
`;
  }

  async getStatus(projectId: string): Promise<{
    hasDockerfile: boolean;
    hasCompose: boolean;
    containers: Array<{ name: string; status: string }>;
  }> {
    const projectPath = await this.getProjectPath(projectId);

    let hasDockerfile = false;
    let hasCompose = false;

    try {
      await fs.access(path.join(projectPath, 'Dockerfile'));
      hasDockerfile = true;
    } catch {}

    try {
      await fs.access(path.join(projectPath, 'docker-compose.yml'));
      hasCompose = true;
    } catch {}

    const containers = await this.listContainers(projectId);

    return { hasDockerfile, hasCompose, containers };
  }

  async buildImage(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync(
        `docker build -t ${projectId}:latest .`,
        { cwd: projectPath, timeout: 300000 },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async composeUp(projectId: string, detach: boolean = true): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const flags = detach ? '-d' : '';

    try {
      const { stdout, stderr } = await execAsync(
        `docker-compose up ${flags} --build`,
        { cwd: projectPath, timeout: 300000 },
      );
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async composeDown(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout, stderr } = await execAsync('docker-compose down', {
        cwd: projectPath,
      });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async getLogs(projectId: string): Promise<{ logs: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout } = await execAsync('docker-compose logs --tail=100', {
        cwd: projectPath,
      });
      return { logs: stdout };
    } catch (error: any) {
      return { logs: error.message };
    }
  }

  async listContainers(projectId: string): Promise<Array<{ name: string; status: string }>> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout } = await execAsync(
        'docker-compose ps --format json',
        { cwd: projectPath },
      );

      if (!stdout.trim()) return [];

      const lines = stdout.trim().split('\n');
      return lines.map((line) => {
        try {
          const container = JSON.parse(line);
          return { name: container.Name, status: container.State };
        } catch {
          return { name: 'unknown', status: 'unknown' };
        }
      });
    } catch {
      return [];
    }
  }
}
