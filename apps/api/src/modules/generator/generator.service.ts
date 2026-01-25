import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import {
  GenerateModuleDto,
  GenerateControllerDto,
  GenerateServiceDto,
  GenerateDtoDto,
  GenerateGuardDto,
  GeneratePipeDto,
  GenerateMiddlewareDto,
  GenerateInterceptorDto,
  GenerateCrudDto,
} from './dto/generator.dto';

@Injectable()
export class GeneratorService {
  constructor(private readonly filesService: FilesService) {}

  async generateModule(
    projectId: string,
    dto: GenerateModuleDto,
  ): Promise<{ files: string[] }> {
    const moduleName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const basePath = `src/${dto.path || moduleName}`;

    const files: string[] = [];

    // Generate module file
    const moduleContent = this.generateModuleTemplate(className, dto);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/${moduleName}.module.ts`,
      content: moduleContent,
    });
    files.push(`${basePath}/${moduleName}.module.ts`);

    // Generate controller if requested
    if (dto.generateController !== false) {
      const controllerContent = this.generateControllerTemplate(className, moduleName);
      await this.filesService.createFile(projectId, {
        path: `${basePath}/${moduleName}.controller.ts`,
        content: controllerContent,
      });
      files.push(`${basePath}/${moduleName}.controller.ts`);
    }

    // Generate service if requested
    if (dto.generateService !== false) {
      const serviceContent = this.generateServiceTemplate(className);
      await this.filesService.createFile(projectId, {
        path: `${basePath}/${moduleName}.service.ts`,
        content: serviceContent,
      });
      files.push(`${basePath}/${moduleName}.service.ts`);
    }

    return { files };
  }

  async generateController(
    projectId: string,
    dto: GenerateControllerDto,
  ): Promise<{ path: string }> {
    const moduleName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || moduleName}/${moduleName}.controller.ts`;

    const content = this.generateControllerTemplate(className, moduleName, dto.methods);

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateService(
    projectId: string,
    dto: GenerateServiceDto,
  ): Promise<{ path: string }> {
    const moduleName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || moduleName}/${moduleName}.service.ts`;

    const content = this.generateServiceTemplate(className, dto.methods);

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateDto(
    projectId: string,
    dto: GenerateDtoDto,
  ): Promise<{ path: string }> {
    const moduleName = this.toKebabCase(dto.moduleName);
    const dtoName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || moduleName}/dto/${dtoName}.dto.ts`;

    const content = this.generateDtoTemplate(className, dto.fields);

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateGuard(
    projectId: string,
    dto: GenerateGuardDto,
  ): Promise<{ path: string }> {
    const guardName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || 'common/guards'}/${guardName}.guard.ts`;

    const content = `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ${className}Guard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // TODO: Implement guard logic
    return true;
  }
}
`;

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generatePipe(
    projectId: string,
    dto: GeneratePipeDto,
  ): Promise<{ path: string }> {
    const pipeName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || 'common/pipes'}/${pipeName}.pipe.ts`;

    const content = `import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ${className}Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // TODO: Implement pipe transformation logic
    return value;
  }
}
`;

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateMiddleware(
    projectId: string,
    dto: GenerateMiddlewareDto,
  ): Promise<{ path: string }> {
    const middlewareName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || 'common/middleware'}/${middlewareName}.middleware.ts`;

    const content = `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ${className}Middleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // TODO: Implement middleware logic
    next();
  }
}
`;

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateInterceptor(
    projectId: string,
    dto: GenerateInterceptorDto,
  ): Promise<{ path: string }> {
    const interceptorName = this.toKebabCase(dto.name);
    const className = this.toPascalCase(dto.name);
    const filePath = `src/${dto.path || 'common/interceptors'}/${interceptorName}.interceptor.ts`;

    const content = `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ${className}Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Before request handling
    const now = Date.now();

    return next.handle().pipe(
      map((data) => {
        // After request handling
        console.log(\`Response time: \${Date.now() - now}ms\`);
        return data;
      }),
    );
  }
}
`;

    await this.filesService.createFile(projectId, { path: filePath, content });
    return { path: filePath };
  }

  async generateCrud(
    projectId: string,
    dto: GenerateCrudDto,
  ): Promise<{ files: string[] }> {
    const moduleName = this.toKebabCase(dto.entityName);
    const className = this.toPascalCase(dto.entityName);
    const basePath = `src/${dto.path || moduleName}`;
    const files: string[] = [];

    // Generate module
    const moduleContent = `import { Module } from '@nestjs/common';
import { ${className}Controller } from './${moduleName}.controller';
import { ${className}Service } from './${moduleName}.service';

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
    await this.filesService.createFile(projectId, {
      path: `${basePath}/${moduleName}.module.ts`,
      content: moduleContent,
    });
    files.push(`${basePath}/${moduleName}.module.ts`);

    // Generate entity
    const entityContent = this.generateEntityTemplate(className, dto.fields);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/entities/${moduleName}.entity.ts`,
      content: entityContent,
    });
    files.push(`${basePath}/entities/${moduleName}.entity.ts`);

    // Generate DTOs
    const createDtoContent = this.generateDtoTemplate(`Create${className}`, dto.fields);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/dto/create-${moduleName}.dto.ts`,
      content: createDtoContent,
    });
    files.push(`${basePath}/dto/create-${moduleName}.dto.ts`);

    const updateDtoContent = this.generateUpdateDtoTemplate(className, moduleName);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/dto/update-${moduleName}.dto.ts`,
      content: updateDtoContent,
    });
    files.push(`${basePath}/dto/update-${moduleName}.dto.ts`);

    // Generate service with CRUD methods
    const serviceContent = this.generateCrudServiceTemplate(className, moduleName);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/${moduleName}.service.ts`,
      content: serviceContent,
    });
    files.push(`${basePath}/${moduleName}.service.ts`);

    // Generate controller with CRUD endpoints
    const controllerContent = this.generateCrudControllerTemplate(className, moduleName);
    await this.filesService.createFile(projectId, {
      path: `${basePath}/${moduleName}.controller.ts`,
      content: controllerContent,
    });
    files.push(`${basePath}/${moduleName}.controller.ts`);

    return { files };
  }

  private generateModuleTemplate(className: string, dto: GenerateModuleDto): string {
    const moduleName = this.toKebabCase(dto.name);
    const hasController = dto.generateController !== false;
    const hasService = dto.generateService !== false;

    let imports = "import { Module } from '@nestjs/common';\n";
    if (hasController) {
      imports += `import { ${className}Controller } from './${moduleName}.controller';\n`;
    }
    if (hasService) {
      imports += `import { ${className}Service } from './${moduleName}.service';\n`;
    }

    return `${imports}
@Module({
  imports: [],
  controllers: [${hasController ? `${className}Controller` : ''}],
  providers: [${hasService ? `${className}Service` : ''}],
  exports: [${hasService ? `${className}Service` : ''}],
})
export class ${className}Module {}
`;
  }

  private generateControllerTemplate(
    className: string,
    moduleName: string,
    methods?: string[],
  ): string {
    const defaultMethods = methods || ['findAll', 'findOne', 'create', 'update', 'remove'];

    const methodTemplates: Record<string, string> = {
      findAll: `
  @Get()
  @ApiOperation({ summary: 'Get all ${moduleName}s' })
  findAll() {
    return this.${this.toCamelCase(className)}Service.findAll();
  }`,
      findOne: `
  @Get(':id')
  @ApiOperation({ summary: 'Get ${moduleName} by ID' })
  findOne(@Param('id') id: string) {
    return this.${this.toCamelCase(className)}Service.findOne(id);
  }`,
      create: `
  @Post()
  @ApiOperation({ summary: 'Create new ${moduleName}' })
  create(@Body() createDto: any) {
    return this.${this.toCamelCase(className)}Service.create(createDto);
  }`,
      update: `
  @Put(':id')
  @ApiOperation({ summary: 'Update ${moduleName}' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.${this.toCamelCase(className)}Service.update(id, updateDto);
  }`,
      remove: `
  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${moduleName}' })
  remove(@Param('id') id: string) {
    return this.${this.toCamelCase(className)}Service.remove(id);
  }`,
    };

    const methodsCode = defaultMethods
      .filter((m) => methodTemplates[m])
      .map((m) => methodTemplates[m])
      .join('\n');

    return `import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ${className}Service } from './${moduleName}.service';

@ApiTags('${moduleName}')
@Controller('${moduleName}')
export class ${className}Controller {
  constructor(private readonly ${this.toCamelCase(className)}Service: ${className}Service) {}
${methodsCode}
}
`;
  }

  private generateServiceTemplate(className: string, methods?: string[]): string {
    const defaultMethods = methods || ['findAll', 'findOne', 'create', 'update', 'remove'];

    const methodTemplates: Record<string, string> = {
      findAll: `
  findAll() {
    // TODO: Implement findAll logic
    return [];
  }`,
      findOne: `
  findOne(id: string) {
    // TODO: Implement findOne logic
    return { id };
  }`,
      create: `
  create(createDto: any) {
    // TODO: Implement create logic
    return { id: 'new-id', ...createDto };
  }`,
      update: `
  update(id: string, updateDto: any) {
    // TODO: Implement update logic
    return { id, ...updateDto };
  }`,
      remove: `
  remove(id: string) {
    // TODO: Implement remove logic
    return { deleted: true, id };
  }`,
    };

    const methodsCode = defaultMethods
      .filter((m) => methodTemplates[m])
      .map((m) => methodTemplates[m])
      .join('\n');

    return `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className}Service {
${methodsCode}
}
`;
  }

  private generateDtoTemplate(
    className: string,
    fields?: Array<{ name: string; type: string; required?: boolean }>,
  ): string {
    const fieldTemplates = (fields || [])
      .map((field) => {
        const decorators = [];
        decorators.push(`@ApiProperty({ description: '${field.name}' })`);

        if (field.required !== false) {
          if (field.type === 'string') decorators.push('@IsString()');
          if (field.type === 'number') decorators.push('@IsNumber()');
          if (field.type === 'boolean') decorators.push('@IsBoolean()');
        } else {
          decorators.push('@IsOptional()');
        }

        return `  ${decorators.join('\n  ')}
  ${field.name}${field.required === false ? '?' : ''}: ${field.type};`;
      })
      .join('\n\n');

    return `import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ${className}Dto {
${fieldTemplates || '  // Add your fields here'}
}
`;
  }

  private generateEntityTemplate(
    className: string,
    fields?: Array<{ name: string; type: string }>,
  ): string {
    const fieldTemplates = (fields || [])
      .map((field) => `  ${field.name}: ${field.type};`)
      .join('\n');

    return `export class ${className} {
  id: string;
${fieldTemplates}
  createdAt: Date;
  updatedAt: Date;
}
`;
  }

  private generateUpdateDtoTemplate(className: string, moduleName: string): string {
    return `import { PartialType } from '@nestjs/swagger';
import { Create${className}Dto } from './create-${moduleName}.dto';

export class Update${className}Dto extends PartialType(Create${className}Dto) {}
`;
  }

  private generateCrudServiceTemplate(className: string, moduleName: string): string {
    const camelName = this.toCamelCase(className);
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { Create${className}Dto } from './dto/create-${moduleName}.dto';
import { Update${className}Dto } from './dto/update-${moduleName}.dto';
import { ${className} } from './entities/${moduleName}.entity';

@Injectable()
export class ${className}Service {
  private ${camelName}s: ${className}[] = [];

  findAll(): ${className}[] {
    return this.${camelName}s;
  }

  findOne(id: string): ${className} {
    const ${camelName} = this.${camelName}s.find((item) => item.id === id);
    if (!${camelName}) {
      throw new NotFoundException(\`${className} with ID \${id} not found\`);
    }
    return ${camelName};
  }

  create(createDto: Create${className}Dto): ${className} {
    const ${camelName}: ${className} = {
      id: Date.now().toString(),
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ${className};
    this.${camelName}s.push(${camelName});
    return ${camelName};
  }

  update(id: string, updateDto: Update${className}Dto): ${className} {
    const index = this.${camelName}s.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(\`${className} with ID \${id} not found\`);
    }
    this.${camelName}s[index] = {
      ...this.${camelName}s[index],
      ...updateDto,
      updatedAt: new Date(),
    };
    return this.${camelName}s[index];
  }

  remove(id: string): void {
    const index = this.${camelName}s.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(\`${className} with ID \${id} not found\`);
    }
    this.${camelName}s.splice(index, 1);
  }
}
`;
  }

  private generateCrudControllerTemplate(className: string, moduleName: string): string {
    const camelName = this.toCamelCase(className);
    return `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${className}Service } from './${moduleName}.service';
import { Create${className}Dto } from './dto/create-${moduleName}.dto';
import { Update${className}Dto } from './dto/update-${moduleName}.dto';

@ApiTags('${moduleName}')
@Controller('${moduleName}')
export class ${className}Controller {
  constructor(private readonly ${camelName}Service: ${className}Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${moduleName}s' })
  @ApiResponse({ status: 200, description: 'Return all ${moduleName}s' })
  findAll() {
    return this.${camelName}Service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${moduleName} by ID' })
  @ApiResponse({ status: 200, description: 'Return ${moduleName}' })
  @ApiResponse({ status: 404, description: '${className} not found' })
  findOne(@Param('id') id: string) {
    return this.${camelName}Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new ${moduleName}' })
  @ApiResponse({ status: 201, description: '${className} created' })
  create(@Body() createDto: Create${className}Dto) {
    return this.${camelName}Service.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${moduleName}' })
  @ApiResponse({ status: 200, description: '${className} updated' })
  @ApiResponse({ status: 404, description: '${className} not found' })
  update(@Param('id') id: string, @Body() updateDto: Update${className}Dto) {
    return this.${camelName}Service.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete ${moduleName}' })
  @ApiResponse({ status: 204, description: '${className} deleted' })
  @ApiResponse({ status: 404, description: '${className} not found' })
  remove(@Param('id') id: string) {
    return this.${camelName}Service.remove(id);
  }
}
`;
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}
