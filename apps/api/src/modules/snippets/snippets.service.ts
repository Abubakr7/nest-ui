import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSnippetDto, Snippet } from './dto/snippets.dto';

@Injectable()
export class SnippetsService {
  private customSnippets: Map<string, Snippet> = new Map();

  private readonly builtInSnippets: Snippet[] = [
    // Controllers
    {
      id: 'nest-controller',
      name: 'NestJS Controller',
      description: 'Basic NestJS controller with CRUD endpoints',
      category: 'controller',
      prefix: 'nest-ctrl',
      body: `import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('\${1:resource}')
@Controller('\${1:resource}')
export class \${2:Resource}Controller {
  @Get()
  @ApiOperation({ summary: 'Get all \${1:resource}' })
  findAll() {
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get \${1:resource} by ID' })
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  @ApiOperation({ summary: 'Create \${1:resource}' })
  create(@Body() dto: any) {
    return dto;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update \${1:resource}' })
  update(@Param('id') id: string, @Body() dto: any) {
    return { id, ...dto };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete \${1:resource}' })
  remove(@Param('id') id: string) {
    return { deleted: true };
  }
}`,
    },
    // Services
    {
      id: 'nest-service',
      name: 'NestJS Service',
      description: 'Basic NestJS service with CRUD methods',
      category: 'service',
      prefix: 'nest-svc',
      body: `import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class \${1:Resource}Service {
  private items: any[] = [];

  findAll() {
    return this.items;
  }

  findOne(id: string) {
    const item = this.items.find(i => i.id === id);
    if (!item) {
      throw new NotFoundException(\`\${1:Resource} \${id} not found\`);
    }
    return item;
  }

  create(dto: any) {
    const item = { id: Date.now().toString(), ...dto };
    this.items.push(item);
    return item;
  }

  update(id: string, dto: any) {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new NotFoundException(\`\${1:Resource} \${id} not found\`);
    }
    this.items[index] = { ...this.items[index], ...dto };
    return this.items[index];
  }

  remove(id: string) {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new NotFoundException(\`\${1:Resource} \${id} not found\`);
    }
    this.items.splice(index, 1);
  }
}`,
    },
    // DTOs
    {
      id: 'nest-dto',
      name: 'NestJS DTO',
      description: 'Data Transfer Object with validation',
      category: 'dto',
      prefix: 'nest-dto',
      body: `import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class \${1:Create}\${2:Resource}Dto {
  @ApiProperty({ description: '\${3:Field description}' })
  @IsString()
  \${4:field}: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  \${5:optionalField}?: string;
}`,
    },
    // Guards
    {
      id: 'nest-guard',
      name: 'NestJS Guard',
      description: 'Authentication guard',
      category: 'guard',
      prefix: 'nest-guard',
      body: `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class \${1:Auth}Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Validate token here
    return true;
  }
}`,
    },
    // Pipes
    {
      id: 'nest-pipe',
      name: 'NestJS Pipe',
      description: 'Validation/transformation pipe',
      category: 'pipe',
      prefix: 'nest-pipe',
      body: `import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class \${1:Validation}Pipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('Value is required');
    }
    return value;
  }
}`,
    },
    // Interceptors
    {
      id: 'nest-interceptor',
      name: 'NestJS Interceptor',
      description: 'Request/response interceptor',
      category: 'interceptor',
      prefix: 'nest-int',
      body: `import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class \${1:Transform}Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    return next.handle().pipe(
      tap(() => console.log(\`Request took \${Date.now() - now}ms\`)),
      map(data => ({ data, timestamp: new Date().toISOString() })),
    );
  }
}`,
    },
    // Middleware
    {
      id: 'nest-middleware',
      name: 'NestJS Middleware',
      description: 'Request middleware',
      category: 'middleware',
      prefix: 'nest-mid',
      body: `import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class \${1:Logger}Middleware implements NestMiddleware {
  private logger = new Logger('\${1:Logger}Middleware');

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(\`\${req.method} \${req.url}\`);
    next();
  }
}`,
    },
    // Exception Filters
    {
      id: 'nest-exception-filter',
      name: 'NestJS Exception Filter',
      description: 'Custom exception filter',
      category: 'filter',
      prefix: 'nest-filter',
      body: `import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class \${1:All}ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}`,
    },
    // Decorators
    {
      id: 'nest-decorator',
      name: 'NestJS Custom Decorator',
      description: 'Custom parameter decorator',
      category: 'decorator',
      prefix: 'nest-dec',
      body: `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const \${1:CurrentUser} = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);`,
    },
    // Module
    {
      id: 'nest-module',
      name: 'NestJS Module',
      description: 'NestJS module with imports',
      category: 'module',
      prefix: 'nest-mod',
      body: `import { Module } from '@nestjs/common';
import { \${1:Resource}Controller } from './\${2:resource}.controller';
import { \${1:Resource}Service } from './\${2:resource}.service';

@Module({
  imports: [],
  controllers: [\${1:Resource}Controller],
  providers: [\${1:Resource}Service],
  exports: [\${1:Resource}Service],
})
export class \${1:Resource}Module {}`,
    },
  ];

  getAll(category?: string): Snippet[] {
    let snippets = [...this.builtInSnippets, ...Array.from(this.customSnippets.values())];

    if (category) {
      snippets = snippets.filter((s) => s.category === category);
    }

    return snippets;
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const snippet of this.builtInSnippets) {
      categories.add(snippet.category);
    }
    for (const snippet of this.customSnippets.values()) {
      categories.add(snippet.category);
    }
    return Array.from(categories);
  }

  getBuiltInSnippets(): Snippet[] {
    return this.builtInSnippets;
  }

  getOne(id: string): Snippet {
    const builtIn = this.builtInSnippets.find((s) => s.id === id);
    if (builtIn) return builtIn;

    const custom = this.customSnippets.get(id);
    if (custom) return custom;

    throw new NotFoundException(`Snippet ${id} not found`);
  }

  create(dto: CreateSnippetDto): Snippet {
    const snippet: Snippet = {
      id: `custom-${Date.now()}`,
      ...dto,
    };

    this.customSnippets.set(snippet.id, snippet);
    return snippet;
  }

  update(id: string, dto: CreateSnippetDto): Snippet {
    if (!this.customSnippets.has(id)) {
      throw new NotFoundException(`Snippet ${id} not found`);
    }

    const snippet: Snippet = { id, ...dto };
    this.customSnippets.set(id, snippet);
    return snippet;
  }

  delete(id: string): { success: boolean } {
    if (!this.customSnippets.has(id)) {
      throw new NotFoundException(`Snippet ${id} not found`);
    }

    this.customSnippets.delete(id);
    return { success: true };
  }

  getProjectTemplates(): Array<{ id: string; name: string; description: string; features: string[] }> {
    return [
      {
        id: 'basic',
        name: 'Basic API',
        description: 'Simple REST API with basic CRUD',
        features: ['REST API', 'Swagger', 'Validation'],
      },
      {
        id: 'auth',
        name: 'API with Authentication',
        description: 'REST API with JWT authentication',
        features: ['REST API', 'JWT Auth', 'Guards', 'Swagger'],
      },
      {
        id: 'database',
        name: 'API with Database',
        description: 'REST API with TypeORM/Prisma',
        features: ['REST API', 'Database', 'Migrations', 'Swagger'],
      },
      {
        id: 'microservice',
        name: 'Microservice',
        description: 'NestJS microservice with message broker',
        features: ['Microservice', 'Message Queue', 'Events'],
      },
      {
        id: 'graphql',
        name: 'GraphQL API',
        description: 'GraphQL API with Code-First approach',
        features: ['GraphQL', 'Resolvers', 'Subscriptions'],
      },
      {
        id: 'fullstack',
        name: 'Full Stack',
        description: 'Complete backend with all features',
        features: ['REST API', 'GraphQL', 'Auth', 'Database', 'WebSockets', 'Swagger'],
      },
    ];
  }

  getModuleTemplates(): Array<{ id: string; name: string; description: string; files: string[] }> {
    return [
      {
        id: 'crud',
        name: 'CRUD Module',
        description: 'Complete CRUD module with entity',
        files: ['module', 'controller', 'service', 'entity', 'dto'],
      },
      {
        id: 'auth',
        name: 'Auth Module',
        description: 'Authentication module with JWT',
        files: ['module', 'controller', 'service', 'guard', 'strategy', 'dto'],
      },
      {
        id: 'upload',
        name: 'File Upload Module',
        description: 'File upload handling module',
        files: ['module', 'controller', 'service', 'interceptor'],
      },
      {
        id: 'mail',
        name: 'Mail Module',
        description: 'Email sending module',
        files: ['module', 'service', 'templates'],
      },
      {
        id: 'websocket',
        name: 'WebSocket Module',
        description: 'Real-time WebSocket module',
        files: ['module', 'gateway', 'service'],
      },
    ];
  }
}
