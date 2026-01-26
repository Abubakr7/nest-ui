import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CreateEntityDto, CreateMigrationDto, DatabaseConfigDto, EntityField } from './dto/database.dto';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseService {
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

  async setup(projectId: string, dto: DatabaseConfigDto): Promise<{ success: boolean; files: string[] }> {
    const projectPath = await this.getProjectPath(projectId);
    const files: string[] = [];

    // Create database config based on ORM type
    if (dto.orm === 'prisma') {
      await this.setupPrisma(projectPath, dto);
      files.push('prisma/schema.prisma');
    } else if (dto.orm === 'typeorm') {
      await this.setupTypeORM(projectPath, dto);
      files.push('src/database/database.module.ts', 'ormconfig.json');
    }

    return { success: true, files };
  }

  private async setupPrisma(projectPath: string, dto: DatabaseConfigDto): Promise<void> {
    await fs.mkdir(path.join(projectPath, 'prisma'), { recursive: true });

    const providerMap: Record<string, string> = {
      postgresql: 'postgresql',
      mysql: 'mysql',
      mongodb: 'mongodb',
      sqlite: 'sqlite',
    };

    const schema = `// Prisma Schema
// Documentation: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${providerMap[dto.type] || 'postgresql'}"
  url      = env("DATABASE_URL")
}

// Add your models below
`;

    await fs.writeFile(path.join(projectPath, 'prisma', 'schema.prisma'), schema);

    // Add to .env
    const envPath = path.join(projectPath, '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {}

    if (!envContent.includes('DATABASE_URL')) {
      const dbUrl = this.getDatabaseUrl(dto);
      envContent += `\nDATABASE_URL="${dbUrl}"\n`;
      await fs.writeFile(envPath, envContent);
    }
  }

  private async setupTypeORM(projectPath: string, dto: DatabaseConfigDto): Promise<void> {
    await fs.mkdir(path.join(projectPath, 'src', 'database'), { recursive: true });

    const typeMap: Record<string, string> = {
      postgresql: 'postgres',
      mysql: 'mysql',
      mongodb: 'mongodb',
      sqlite: 'sqlite',
    };

    const ormConfig = {
      type: typeMap[dto.type] || 'postgres',
      host: dto.host || 'localhost',
      port: dto.port || 5432,
      username: dto.username || 'postgres',
      password: dto.password || 'password',
      database: dto.database || 'nestui',
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/database/migrations/*.js'],
      synchronize: false,
    };

    await fs.writeFile(
      path.join(projectPath, 'ormconfig.json'),
      JSON.stringify(ormConfig, null, 2),
    );

    const databaseModule = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: '${ormConfig.type}',
      host: process.env.DB_HOST || '${dto.host || 'localhost'}',
      port: parseInt(process.env.DB_PORT) || ${dto.port || 5432},
      username: process.env.DB_USER || '${dto.username || 'postgres'}',
      password: process.env.DB_PASSWORD || '${dto.password || 'password'}',
      database: process.env.DB_NAME || '${dto.database || 'nestui'}',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class DatabaseModule {}
`;

    await fs.writeFile(
      path.join(projectPath, 'src', 'database', 'database.module.ts'),
      databaseModule,
    );
  }

  private getDatabaseUrl(dto: DatabaseConfigDto): string {
    const host = dto.host || 'localhost';
    const port = dto.port || 5432;
    const user = dto.username || 'postgres';
    const pass = dto.password || 'password';
    const db = dto.database || 'nestui';

    switch (dto.type) {
      case 'postgresql':
        return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
      case 'mysql':
        return `mysql://${user}:${pass}@${host}:${port}/${db}`;
      case 'mongodb':
        return `mongodb://${user}:${pass}@${host}:${port}/${db}`;
      case 'sqlite':
        return `file:./dev.db`;
      default:
        return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
    }
  }

  async getConfig(projectId: string): Promise<any> {
    const projectPath = await this.getProjectPath(projectId);

    // Check for Prisma
    try {
      const schema = await fs.readFile(
        path.join(projectPath, 'prisma', 'schema.prisma'),
        'utf-8',
      );
      return { orm: 'prisma', schema };
    } catch {}

    // Check for TypeORM
    try {
      const config = await fs.readFile(
        path.join(projectPath, 'ormconfig.json'),
        'utf-8',
      );
      return { orm: 'typeorm', config: JSON.parse(config) };
    } catch {}

    return { orm: null };
  }

  async getEntities(projectId: string): Promise<Array<{ name: string; fields: EntityField[] }>> {
    const projectPath = await this.getProjectPath(projectId);
    const entities: Array<{ name: string; fields: EntityField[] }> = [];

    // Try to find entity files
    const srcPath = path.join(projectPath, 'src');
    try {
      const findEntities = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            await findEntities(fullPath);
          } else if (entry.name.endsWith('.entity.ts')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const entity = this.parseEntityFile(content);
            if (entity) {
              entities.push(entity);
            }
          }
        }
      };
      await findEntities(srcPath);
    } catch {}

    return entities;
  }

  private parseEntityFile(content: string): { name: string; fields: EntityField[] } | null {
    const classMatch = content.match(/export class (\w+)/);
    if (!classMatch) return null;

    const name = classMatch[1];
    const fields: EntityField[] = [];

    // Parse fields (simplified)
    const fieldRegex = /@Column\([^)]*\)[\s\n]+(\w+)\??\s*:\s*(\w+)/g;
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
      fields.push({
        name: match[1],
        type: match[2],
        nullable: content.includes(`${match[1]}?`),
      });
    }

    // Parse primary column
    const primaryMatch = content.match(/@PrimaryGeneratedColumn\([^)]*\)[\s\n]+(\w+)/);
    if (primaryMatch) {
      fields.unshift({
        name: primaryMatch[1],
        type: 'number',
        primary: true,
      });
    }

    return { name, fields };
  }

  async createEntity(projectId: string, dto: CreateEntityDto): Promise<{ path: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const entityName = dto.name.toLowerCase();
    const className = dto.name.charAt(0).toUpperCase() + dto.name.slice(1);

    const entityDir = path.join(projectPath, 'src', entityName, 'entities');
    await fs.mkdir(entityDir, { recursive: true });

    const fieldsCode = dto.fields
      .map((field) => {
        const decorators: string[] = [];

        if (field.primary) {
          decorators.push('@PrimaryGeneratedColumn()');
        } else {
          const columnOptions: string[] = [];
          if (field.nullable) columnOptions.push('nullable: true');
          if (field.unique) columnOptions.push('unique: true');
          if (field.default !== undefined) columnOptions.push(`default: ${JSON.stringify(field.default)}`);

          const optionsStr = columnOptions.length > 0 ? `{ ${columnOptions.join(', ')} }` : '';
          decorators.push(`@Column(${optionsStr})`);
        }

        if (field.relation) {
          const relationType = field.relation.type;
          const target = field.relation.target;
          decorators.push(`@${relationType}(() => ${target})`);
        }

        return `  ${decorators.join('\n  ')}
  ${field.name}${field.nullable ? '?' : ''}: ${field.type};`;
      })
      .join('\n\n');

    const entityContent = `import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  OneToOne,
} from 'typeorm';

@Entity('${entityName}s')
export class ${className} {
${fieldsCode}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;

    const entityPath = path.join(entityDir, `${entityName}.entity.ts`);
    await fs.writeFile(entityPath, entityContent);

    return { path: `src/${entityName}/entities/${entityName}.entity.ts` };
  }

  async updateEntity(projectId: string, entityName: string, dto: CreateEntityDto): Promise<{ path: string }> {
    // First delete old entity, then create new one
    await this.deleteEntity(projectId, entityName);
    return this.createEntity(projectId, dto);
  }

  async deleteEntity(projectId: string, entityName: string): Promise<{ success: boolean }> {
    const projectPath = await this.getProjectPath(projectId);
    const entityPath = path.join(projectPath, 'src', entityName.toLowerCase(), 'entities', `${entityName.toLowerCase()}.entity.ts`);

    try {
      await fs.unlink(entityPath);
    } catch {}

    return { success: true };
  }

  async getMigrations(projectId: string): Promise<Array<{ name: string; timestamp: string; executed: boolean }>> {
    const projectPath = await this.getProjectPath(projectId);
    const migrations: Array<{ name: string; timestamp: string; executed: boolean }> = [];

    // Check for Prisma migrations
    try {
      const migrationsDir = path.join(projectPath, 'prisma', 'migrations');
      const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          migrations.push({
            name: entry.name,
            timestamp: entry.name.split('_')[0] || '',
            executed: true, // Simplified
          });
        }
      }
    } catch {}

    // Check for TypeORM migrations
    try {
      const migrationsDir = path.join(projectPath, 'src', 'database', 'migrations');
      const entries = await fs.readdir(migrationsDir);

      for (const entry of entries) {
        if (entry.endsWith('.ts')) {
          migrations.push({
            name: entry.replace('.ts', ''),
            timestamp: entry.match(/^\d+/)?.[0] || '',
            executed: false,
          });
        }
      }
    } catch {}

    return migrations;
  }

  async generateMigration(projectId: string, dto: CreateMigrationDto): Promise<{ path: string }> {
    const projectPath = await this.getProjectPath(projectId);
    const timestamp = Date.now();
    const migrationName = `${timestamp}-${dto.name}`;

    // For TypeORM style
    const migrationsDir = path.join(projectPath, 'src', 'database', 'migrations');
    await fs.mkdir(migrationsDir, { recursive: true });

    const migrationContent = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${dto.name}${timestamp} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration logic here
    ${dto.sql || '// await queryRunner.query(`CREATE TABLE ...`);'}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your rollback logic here
    ${dto.rollbackSql || '// await queryRunner.query(`DROP TABLE ...`);'}
  }
}
`;

    const migrationPath = path.join(migrationsDir, `${migrationName}.ts`);
    await fs.writeFile(migrationPath, migrationContent);

    return { path: `src/database/migrations/${migrationName}.ts` };
  }

  async runMigrations(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      // Try Prisma first
      const { stdout } = await execAsync('npx prisma migrate deploy', { cwd: projectPath });
      return { success: true, output: stdout };
    } catch {
      try {
        // Try TypeORM
        const { stdout } = await execAsync('npx typeorm migration:run', { cwd: projectPath });
        return { success: true, output: stdout };
      } catch (error: any) {
        return { success: false, output: error.message };
      }
    }
  }

  async revertMigration(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      const { stdout } = await execAsync('npx typeorm migration:revert', { cwd: projectPath });
      return { success: true, output: stdout };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async seed(projectId: string): Promise<{ success: boolean; output: string }> {
    const projectPath = await this.getProjectPath(projectId);

    try {
      // Try Prisma seed
      const { stdout } = await execAsync('npx prisma db seed', { cwd: projectPath });
      return { success: true, output: stdout };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async getSchema(projectId: string): Promise<{ entities: any[]; relations: any[] }> {
    const entities = await this.getEntities(projectId);

    const relations: Array<{ from: string; to: string; type: string }> = [];

    for (const entity of entities) {
      for (const field of entity.fields) {
        if (field.relation) {
          relations.push({
            from: entity.name,
            to: field.relation.target,
            type: field.relation.type,
          });
        }
      }
    }

    return { entities, relations };
  }

  async executeQuery(projectId: string, query: string): Promise<{ success: boolean; result?: any; error?: string }> {
    // This is a placeholder - actual implementation would connect to the DB
    return {
      success: false,
      error: 'Direct query execution requires database connection configuration',
    };
  }

  async getTables(projectId: string): Promise<string[]> {
    const entities = await this.getEntities(projectId);
    return entities.map((e) => e.name.toLowerCase() + 's');
  }

  async getTableData(
    projectId: string,
    tableName: string,
    page: number,
    limit: number,
  ): Promise<{ data: any[]; total: number }> {
    // Placeholder - would need actual DB connection
    return { data: [], total: 0 };
  }
}
