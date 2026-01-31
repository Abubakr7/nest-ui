'use client'

import { useState } from 'react'
import {
  Folder,
  FileText,
  FolderOpen,
  Code2,
  Check,
  Copy,
  Box
} from 'lucide-react'
import type { ProjectConfig, ModuleConfig, EntityConfig } from '../../app/page'

interface ProjectPreviewProps {
  config: ProjectConfig
  modules: ModuleConfig[]
  onGenerate: () => void
  isGenerating: boolean
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
}

export function ProjectPreview({ config, modules, onGenerate, isGenerating }: ProjectPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/modules']))
  const [copied, setCopied] = useState(false)

  // Get all entities from all modules
  const allEntities = modules.flatMap(m => m.entities.map(e => ({ ...e, moduleId: m.id, moduleName: m.name })))

  // Generate project structure
  const generateProjectStructure = (): FileNode => {
    const moduleNodes: FileNode[] = modules.map(mod => {
      const children: FileNode[] = []

      // Controller
      children.push({
        name: `${mod.name}.controller.ts`,
        type: 'file',
        content: generateControllerCode(mod, config)
      })

      // Service
      children.push({
        name: `${mod.name}.service.ts`,
        type: 'file',
        content: generateServiceCode(mod, config)
      })

      // Module
      children.push({
        name: `${mod.name}.module.ts`,
        type: 'file',
        content: generateModuleCode(mod, config)
      })

      // DTOs
      if (mod.entities.length > 0) {
        children.push({
          name: 'dto',
          type: 'folder',
          children: mod.entities.flatMap(entity => [
            {
              name: `create-${entity.name.toLowerCase()}.dto.ts`,
              type: 'file' as const,
              content: generateCreateDtoCode(entity)
            },
            {
              name: `update-${entity.name.toLowerCase()}.dto.ts`,
              type: 'file' as const,
              content: generateUpdateDtoCode(entity)
            }
          ])
        })
      }

      // Entities
      if (mod.entities.length > 0) {
        children.push({
          name: 'entities',
          type: 'folder',
          children: mod.entities.map(entity => ({
            name: `${entity.name.toLowerCase()}.entity.ts`,
            type: 'file' as const,
            content: generateEntityCode(entity, config)
          }))
        })
      }

      return {
        name: mod.name,
        type: 'folder',
        children
      }
    })

    return {
      name: config.name || 'nestjs-project',
      type: 'folder',
      children: [
        {
          name: 'src',
          type: 'folder',
          children: [
            {
              name: 'app.module.ts',
              type: 'file',
              content: generateAppModuleCode(modules, config)
            },
            {
              name: 'main.ts',
              type: 'file',
              content: generateMainCode(config)
            },
            {
              name: 'modules',
              type: 'folder',
              children: moduleNodes
            }
          ]
        },
        {
          name: 'package.json',
          type: 'file',
          content: generatePackageJson(config)
        },
        {
          name: 'tsconfig.json',
          type: 'file',
          content: generateTsConfig()
        },
        {
          name: 'nest-cli.json',
          type: 'file',
          content: generateNestCliJson()
        },
        ...(config.features.docker ? [{
          name: 'Dockerfile',
          type: 'file' as const,
          content: generateDockerfile()
        }, {
          name: 'docker-compose.yml',
          type: 'file' as const,
          content: generateDockerCompose(config)
        }] : []),
        {
          name: '.env.example',
          type: 'file',
          content: generateEnvExample(config)
        },
        {
          name: 'README.md',
          type: 'file',
          content: generateReadme(config, modules)
        }
      ]
    }
  }

  const projectStructure = generateProjectStructure()

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileContent = (path: string, node: FileNode = projectStructure): string | null => {
    const parts = path.split('/')
    if (parts.length === 1) {
      if (node.type === 'file' && node.name === parts[0]) {
        return node.content || ''
      }
      if (node.children) {
        const child = node.children.find(c => c.name === parts[0])
        if (child?.type === 'file') {
          return child.content || ''
        }
      }
      return null
    }

    if (node.children) {
      const child = node.children.find(c => c.name === parts[0])
      if (child) {
        return getFileContent(parts.slice(1).join('/'), child)
      }
    }
    return null
  }

  const renderTree = (node: FileNode, path: string = '', depth: number = 0): JSX.Element => {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const isExpanded = expandedFolders.has(fullPath)
    const isSelected = selectedFile === fullPath

    if (node.type === 'folder') {
      return (
        <div key={fullPath}>
          <button
            onClick={() => toggleFolder(fullPath)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-700/50 rounded text-sm ${
              isExpanded ? 'text-blue-400' : 'text-slate-300'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-400" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-400" />
            )}
            {node.name}
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTree(child, fullPath, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    const getFileIcon = (name: string) => {
      if (name.endsWith('.ts')) return <Code2 className="w-4 h-4 text-blue-400" />
      if (name.endsWith('.json')) return <FileText className="w-4 h-4 text-yellow-400" />
      if (name.endsWith('.yml') || name.endsWith('.yaml')) return <FileText className="w-4 h-4 text-pink-400" />
      if (name === 'Dockerfile') return <Box className="w-4 h-4 text-cyan-400" />
      if (name.endsWith('.md')) return <FileText className="w-4 h-4 text-slate-400" />
      return <FileText className="w-4 h-4 text-slate-400" />
    }

    return (
      <button
        key={fullPath}
        onClick={() => setSelectedFile(fullPath)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded text-sm ${
          isSelected ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-slate-700/50 text-slate-400'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {getFileIcon(node.name)}
        {node.name}
      </button>
    )
  }

  const handleCopyCode = () => {
    if (selectedFile) {
      const content = getFileContent(selectedFile)
      if (content) {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const selectedContent = selectedFile ? getFileContent(selectedFile) : null

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Предпросмотр проекта</h2>
        <p className="text-slate-400">Просмотрите сгенерированную структуру и код проекта</p>
      </div>

      {/* Project Summary */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-3">Конфигурация проекта</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Название:</span>
            <span className="ml-2 text-white">{config.name || 'Без названия'}</span>
          </div>
          <div>
            <span className="text-slate-400">API:</span>
            <span className="ml-2 text-white uppercase">{config.apiType}</span>
          </div>
          <div>
            <span className="text-slate-400">База данных:</span>
            <span className="ml-2 text-white capitalize">{config.database}</span>
          </div>
          <div>
            <span className="text-slate-400">ORM:</span>
            <span className="ml-2 text-white capitalize">{config.orm}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {config.features.swagger && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Swagger</span>}
          {config.features.websockets && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">WebSockets</span>}
          {config.features.caching && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Кэширование</span>}
          {config.features.queue && <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Очереди</span>}
          {config.features.docker && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Docker</span>}
          {config.features.cicd && <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">CI/CD</span>}
        </div>
      </div>

      {/* File Explorer and Code Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[400px]">
        {/* File Tree */}
        <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 overflow-hidden">
          <div className="p-3 border-b border-slate-600/50">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-yellow-400" />
              Структура проекта
            </h3>
          </div>
          <div className="p-2 overflow-y-auto h-[calc(100%-52px)]">
            {renderTree(projectStructure)}
          </div>
        </div>

        {/* Code Preview */}
        <div className="lg:col-span-2 bg-slate-700/30 rounded-xl border border-slate-600/50 overflow-hidden">
          <div className="p-3 border-b border-slate-600/50 flex items-center justify-between">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              {selectedFile || 'Выберите файл'}
            </h3>
            {selectedFile && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-sm text-slate-300"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Копировать
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-4 overflow-auto h-[calc(100%-52px)] bg-slate-900/50">
            {selectedContent ? (
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                {selectedContent}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Выберите файл для просмотра кода
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 text-center">
          <div className="text-3xl font-bold text-blue-400">{modules.length}</div>
          <div className="text-slate-400 text-sm">Модулей</div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 text-center">
          <div className="text-3xl font-bold text-green-400">{allEntities.length}</div>
          <div className="text-slate-400 text-sm">Сущностей</div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {allEntities.reduce((acc, e) => acc + e.fields.length, 0)}
          </div>
          <div className="text-slate-400 text-sm">Полей</div>
        </div>
      </div>
    </div>
  )
}

// Code generation functions
function generateControllerCode(mod: ModuleConfig, config: ProjectConfig): string {
  const decorators = config.apiType === 'rest'
    ? `@Controller('${mod.name}')\n${config.features.swagger ? `@ApiTags('${mod.name}')` : ''}`
    : `@Resolver()`

  const imports = [
    `import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'`,
    config.features.swagger ? `import { ApiTags, ApiOperation } from '@nestjs/swagger'` : '',
    `import { ${capitalize(mod.name)}Service } from './${mod.name}.service'`,
  ].filter(Boolean).join('\n')

  let methods = ''
  if (mod.generateCrud) {
    methods = `
  @Get()
  ${config.features.swagger ? `@ApiOperation({ summary: 'Get all ${mod.name}' })` : ''}
  findAll() {
    return this.${mod.name}Service.findAll()
  }

  @Get(':id')
  ${config.features.swagger ? `@ApiOperation({ summary: 'Get ${mod.name} by id' })` : ''}
  findOne(@Param('id') id: string) {
    return this.${mod.name}Service.findOne(id)
  }

  @Post()
  ${config.features.swagger ? `@ApiOperation({ summary: 'Create ${mod.name}' })` : ''}
  create(@Body() createDto: any) {
    return this.${mod.name}Service.create(createDto)
  }

  @Put(':id')
  ${config.features.swagger ? `@ApiOperation({ summary: 'Update ${mod.name}' })` : ''}
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.${mod.name}Service.update(id, updateDto)
  }

  @Delete(':id')
  ${config.features.swagger ? `@ApiOperation({ summary: 'Delete ${mod.name}' })` : ''}
  remove(@Param('id') id: string) {
    return this.${mod.name}Service.remove(id)
  }`
  }

  return `${imports}

${decorators}
export class ${capitalize(mod.name)}Controller {
  constructor(private readonly ${mod.name}Service: ${capitalize(mod.name)}Service) {}
${methods}
}
`
}

function generateServiceCode(mod: ModuleConfig, config: ProjectConfig): string {
  const orm = config.orm
  let repoImport = ''
  let repoInject = ''

  if (orm === 'typeorm' && mod.entities.length > 0) {
    repoImport = `import { InjectRepository } from '@nestjs/typeorm'\nimport { Repository } from 'typeorm'`
    repoInject = mod.entities.map(e =>
      `@InjectRepository(${capitalize(e.name)}) private ${e.name.toLowerCase()}Repo: Repository<${capitalize(e.name)}>`
    ).join(',\n    ')
  }

  return `import { Injectable } from '@nestjs/common'
${repoImport}

@Injectable()
export class ${capitalize(mod.name)}Service {
  constructor(${repoInject}) {}

  findAll() {
    // TODO: Implement findAll
    return []
  }

  findOne(id: string) {
    // TODO: Implement findOne
    return { id }
  }

  create(createDto: any) {
    // TODO: Implement create
    return createDto
  }

  update(id: string, updateDto: any) {
    // TODO: Implement update
    return { id, ...updateDto }
  }

  remove(id: string) {
    // TODO: Implement remove
    return { id }
  }
}
`
}

function generateModuleCode(mod: ModuleConfig, config: ProjectConfig): string {
  return `import { Module } from '@nestjs/common'
import { ${capitalize(mod.name)}Controller } from './${mod.name}.controller'
import { ${capitalize(mod.name)}Service } from './${mod.name}.service'

@Module({
  controllers: [${capitalize(mod.name)}Controller],
  providers: [${capitalize(mod.name)}Service],
  exports: [${capitalize(mod.name)}Service],
})
export class ${capitalize(mod.name)}Module {}
`
}

function generateEntityCode(entity: EntityConfig, config: ProjectConfig): string {
  const orm = config.orm

  if (orm === 'typeorm') {
    const columns = entity.fields.map(f => {
      const decorators = []
      if (f.name === 'id') {
        decorators.push('@PrimaryGeneratedColumn(\'uuid\')')
      } else {
        const columnOptions: string[] = []
        if (!f.isRequired) columnOptions.push('nullable: true')
        if (f.isUnique) columnOptions.push('unique: true')
        if (f.isArray) columnOptions.push('array: true')

        const options = columnOptions.length > 0 ? `{ ${columnOptions.join(', ')} }` : ''
        decorators.push(`@Column(${options})`)
      }

      const tsType = getTypeScriptType(f.type, f.isArray)
      return `  ${decorators.join('\n  ')}\n  ${f.name}: ${tsType}`
    }).join('\n\n')

    return `import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('${entity.name.toLowerCase()}')
export class ${capitalize(entity.name)} {
${columns}

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
`
  }

  if (orm === 'prisma') {
    return `// This entity is defined in prisma/schema.prisma
// model ${capitalize(entity.name)} {
//   ${entity.fields.map(f => `${f.name} ${getPrismaType(f.type)}`).join('\n//   ')}
// }
`
  }

  // Mongoose
  return `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class ${capitalize(entity.name)} extends Document {
${entity.fields.filter(f => f.name !== 'id').map(f => {
  const mongoType = getMongooseType(f.type)
  return `  @Prop(${f.isRequired ? '{ required: true }' : ''})\n  ${f.name}: ${mongoType}`
}).join('\n\n')}
}

export const ${capitalize(entity.name)}Schema = SchemaFactory.createForClass(${capitalize(entity.name)})
`
}

function generateCreateDtoCode(entity: EntityConfig): string {
  const fields = entity.fields
    .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.name))
    .map(f => {
      const tsType = getTypeScriptType(f.type, f.isArray)
      const optional = f.isRequired ? '' : '?'
      return `  ${f.name}${optional}: ${tsType}`
    }).join('\n')

  return `export class Create${capitalize(entity.name)}Dto {
${fields}
}
`
}

function generateUpdateDtoCode(entity: EntityConfig): string {
  return `import { PartialType } from '@nestjs/mapped-types'
import { Create${capitalize(entity.name)}Dto } from './create-${entity.name.toLowerCase()}.dto'

export class Update${capitalize(entity.name)}Dto extends PartialType(Create${capitalize(entity.name)}Dto) {}
`
}

function generateAppModuleCode(modules: ModuleConfig[], config: ProjectConfig): string {
  const moduleImports = modules.map(m =>
    `import { ${capitalize(m.name)}Module } from './modules/${m.name}/${m.name}.module'`
  ).join('\n')

  const dbImport = config.database !== 'none'
    ? config.orm === 'typeorm'
      ? `import { TypeOrmModule } from '@nestjs/typeorm'`
      : config.orm === 'mongoose'
        ? `import { MongooseModule } from '@nestjs/mongoose'`
        : ''
    : ''

  const dbModule = config.database !== 'none'
    ? config.orm === 'typeorm'
      ? `TypeOrmModule.forRoot({
      type: '${config.database === 'postgresql' ? 'postgres' : config.database}',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || ${config.database === 'postgresql' ? 5432 : 3306},
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '${config.name || 'app'}',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),`
      : config.orm === 'mongoose'
        ? `MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/${config.name || 'app'}'),`
        : ''
    : ''

  return `import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
${dbImport}
${moduleImports}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ${dbModule}
    ${modules.map(m => `${capitalize(m.name)}Module`).join(',\n    ')}
  ],
})
export class AppModule {}
`
}

function generateMainCode(config: ProjectConfig): string {
  const swaggerSetup = config.features.swagger ? `
  const swaggerConfig = new DocumentBuilder()
    .setTitle('${config.name || 'NestJS'} API')
    .setDescription('API documentation')
    .setVersion('1.0')
    ${config.auth === 'jwt' ? `.addBearerAuth()` : ''}
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)
` : ''

  const swaggerImport = config.features.swagger
    ? `import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'`
    : ''

  return `import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
${swaggerImport}
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.enableCors()
${swaggerSetup}
  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(\`Application running on: http://localhost:\${port}\`)
}
bootstrap()
`
}

function generatePackageJson(config: ProjectConfig): string {
  const deps: Record<string, string> = {
    '@nestjs/common': '^10.0.0',
    '@nestjs/core': '^10.0.0',
    '@nestjs/platform-express': '^10.0.0',
    '@nestjs/config': '^3.0.0',
    'reflect-metadata': '^0.1.13',
    'rxjs': '^7.8.1',
    'class-validator': '^0.14.0',
    'class-transformer': '^0.5.1',
  }

  if (config.features.swagger) {
    deps['@nestjs/swagger'] = '^7.0.0'
  }

  if (config.orm === 'typeorm') {
    deps['@nestjs/typeorm'] = '^10.0.0'
    deps['typeorm'] = '^0.3.17'
    if (config.database === 'postgresql') deps['pg'] = '^8.11.0'
    if (config.database === 'mysql') deps['mysql2'] = '^3.6.0'
    if (config.database === 'sqlite') deps['better-sqlite3'] = '^9.0.0'
  }

  if (config.orm === 'mongoose') {
    deps['@nestjs/mongoose'] = '^10.0.0'
    deps['mongoose'] = '^7.4.0'
  }

  if (config.auth === 'jwt') {
    deps['@nestjs/jwt'] = '^10.0.0'
    deps['@nestjs/passport'] = '^10.0.0'
    deps['passport'] = '^0.6.0'
    deps['passport-jwt'] = '^4.0.1'
    deps['bcrypt'] = '^5.1.0'
  }

  if (config.features.websockets) {
    deps['@nestjs/websockets'] = '^10.0.0'
    deps['@nestjs/platform-socket.io'] = '^10.0.0'
  }

  if (config.features.caching) {
    deps['@nestjs/cache-manager'] = '^2.0.0'
    deps['cache-manager'] = '^5.2.0'
  }

  if (config.features.queue) {
    deps['@nestjs/bull'] = '^10.0.0'
    deps['bull'] = '^4.11.0'
  }

  return JSON.stringify({
    name: config.name || 'nestjs-project',
    version: '1.0.0',
    description: config.description || 'NestJS application',
    scripts: {
      build: 'nest build',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:prod': 'node dist/main',
      test: 'jest',
      'test:e2e': 'jest --config ./test/jest-e2e.json'
    },
    dependencies: deps,
    devDependencies: {
      '@nestjs/cli': '^10.0.0',
      '@nestjs/testing': '^10.0.0',
      '@types/node': '^20.0.0',
      'typescript': '^5.1.0',
      'ts-node': '^10.9.0',
      'jest': '^29.5.0',
      '@types/jest': '^29.5.0',
      'ts-jest': '^29.1.0'
    }
  }, null, 2)
}

function generateTsConfig(): string {
  return JSON.stringify({
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
      noFallthroughCasesInSwitch: true
    }
  }, null, 2)
}

function generateNestCliJson(): string {
  return JSON.stringify({
    '$schema': 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    compilerOptions: {
      deleteOutDir: true
    }
  }, null, 2)
}

function generateDockerfile(): string {
  return `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
`
}

function generateDockerCompose(config: ProjectConfig): string {
  let services = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
`

  if (config.database === 'postgresql') {
    services += `      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=${config.name || 'app'}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${config.name || 'app'}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
`
  } else if (config.database === 'mongodb') {
    services += `      - MONGODB_URI=mongodb://mongo:27017/${config.name || 'app'}
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
`
  }

  return services
}

function generateEnvExample(config: ProjectConfig): string {
  let env = `NODE_ENV=development
PORT=3000
`

  if (config.database === 'postgresql' || config.database === 'mysql') {
    env += `
DB_HOST=localhost
DB_PORT=${config.database === 'postgresql' ? '5432' : '3306'}
DB_USER=root
DB_PASSWORD=
DB_NAME=${config.name || 'app'}
`
  } else if (config.database === 'mongodb') {
    env += `
MONGODB_URI=mongodb://localhost:27017/${config.name || 'app'}
`
  }

  if (config.auth === 'jwt') {
    env += `
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
`
  }

  return env
}

function generateReadme(config: ProjectConfig, modules: ModuleConfig[]): string {
  return `# ${config.name || 'NestJS Project'}

${config.description || 'A NestJS application generated by NestJS Architect.'}

## Features

- **API Type**: ${config.apiType.toUpperCase()}
- **Database**: ${config.database}
- **ORM**: ${config.orm}
- **Authentication**: ${config.auth}
${config.features.swagger ? '- Swagger API Documentation' : ''}
${config.features.websockets ? '- WebSocket Support' : ''}
${config.features.caching ? '- Caching' : ''}
${config.features.queue ? '- Queue Processing' : ''}
${config.features.docker ? '- Docker Support' : ''}

## Modules

${modules.map(m => `- **${capitalize(m.name)}**: ${m.description}`).join('\n')}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run start:dev
\`\`\`

${config.features.docker ? `
## Docker

\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d
\`\`\`
` : ''}

${config.features.swagger ? `
## API Documentation

Swagger documentation is available at: http://localhost:3000/api/docs
` : ''}

## License

MIT
`
}

// Utility functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getTypeScriptType(type: string, isArray?: boolean): string {
  const types: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    json: 'Record<string, any>',
    uuid: 'string',
    enum: 'string',
  }
  const tsType = types[type] || 'string'
  return isArray ? `${tsType}[]` : tsType
}

function getPrismaType(type: string): string {
  const types: Record<string, string> = {
    string: 'String',
    number: 'Int',
    boolean: 'Boolean',
    date: 'DateTime',
    json: 'Json',
    uuid: 'String @default(uuid())',
    enum: 'String',
  }
  return types[type] || 'String'
}

function getMongooseType(type: string): string {
  const types: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    json: 'Record<string, any>',
    uuid: 'string',
    enum: 'string',
  }
  return types[type] || 'string'
}
