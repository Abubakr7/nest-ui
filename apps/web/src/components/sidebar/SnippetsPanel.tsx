'use client';

import React, { useState, useEffect } from 'react';
import { snippetsApi } from '@/lib/api';

interface Snippet {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  language: string;
}

interface SnippetsPanelProps {
  projectPath: string;
  onInsertCode?: (code: string) => void;
}

export function SnippetsPanel({ projectPath, onInsertCode }: SnippetsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [templates, setTemplates] = useState<Snippet[]>([]);
  const [activeTab, setActiveTab] = useState<'snippets' | 'templates' | 'custom'>('snippets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  // Custom snippet form
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('custom');
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    loadSnippets();
    loadTemplates();
  }, [projectPath]);

  const loadSnippets = async () => {
    try {
      const result = await snippetsApi.getSnippets();
      setSnippets(result.snippets || getDefaultSnippets());
    } catch (error) {
      setSnippets(getDefaultSnippets());
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await snippetsApi.getTemplates();
      setTemplates(result.templates || getDefaultTemplates());
    } catch (error) {
      setTemplates(getDefaultTemplates());
    }
  };

  const getDefaultSnippets = (): Snippet[] => [
    {
      id: '1',
      name: 'NestJS Controller',
      description: 'Basic REST controller with CRUD endpoints',
      category: 'controller',
      language: 'typescript',
      code: `import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';

@Controller('items')
export class ItemsController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() createDto: any) {
    return createDto;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return { id, ...updateDto };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { id };
  }
}`,
    },
    {
      id: '2',
      name: 'NestJS Service',
      description: 'Injectable service with repository pattern',
      category: 'service',
      language: 'typescript',
      code: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly repository: Repository<Item>,
  ) {}

  async findAll(): Promise<Item[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.repository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(\`Item #\${id} not found\`);
    }
    return item;
  }

  async create(createDto: CreateItemDto): Promise<Item> {
    const item = this.repository.create(createDto);
    return this.repository.save(item);
  }

  async update(id: string, updateDto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.repository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repository.remove(item);
  }
}`,
    },
    {
      id: '3',
      name: 'TypeORM Entity',
      description: 'Database entity with common columns',
      category: 'entity',
      language: 'typescript',
      code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`,
    },
    {
      id: '4',
      name: 'DTO with Validation',
      description: 'Data transfer object with class-validator',
      category: 'dto',
      language: 'typescript',
      code: `import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is item active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}`,
    },
    {
      id: '5',
      name: 'Auth Guard',
      description: 'JWT authentication guard',
      category: 'guard',
      language: 'typescript',
      code: `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}`,
    },
    {
      id: '6',
      name: 'Custom Decorator',
      description: 'Parameter decorator for current user',
      category: 'decorator',
      language: 'typescript',
      code: `import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage:
// @Get('profile')
// getProfile(@CurrentUser() user: User) {
//   return user;
// }`,
    },
  ];

  const getDefaultTemplates = (): Snippet[] => [
    {
      id: 't1',
      name: 'CRUD Module',
      description: 'Complete CRUD module with controller, service, and entity',
      category: 'module',
      language: 'typescript',
      code: 'Full CRUD module template - generates multiple files',
    },
    {
      id: 't2',
      name: 'Auth Module',
      description: 'Authentication module with JWT strategy',
      category: 'auth',
      language: 'typescript',
      code: 'Authentication module template - generates auth files',
    },
  ];

  const categories = ['all', 'controller', 'service', 'entity', 'dto', 'guard', 'decorator', 'custom'];

  const filteredSnippets = (activeTab === 'snippets' ? snippets : templates).filter((snippet) => {
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const saveCustomSnippet = async () => {
    if (!customName.trim() || !customCode.trim()) return;

    setLoading(true);
    try {
      await snippetsApi.saveSnippet({
        name: customName,
        description: customDescription,
        category: customCategory,
        code: customCode,
        language: 'typescript',
      });
      await loadSnippets();
      setCustomName('');
      setCustomDescription('');
      setCustomCode('');
      alert('Snippet saved successfully!');
    } catch (error) {
      console.error('Failed to save snippet:', error);
    } finally {
      setLoading(false);
    }
  };

  const insertSnippet = (code: string) => {
    if (onInsertCode) {
      onInsertCode(code);
    } else {
      navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Code Snippets</h3>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('snippets')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'snippets'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Snippets
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'templates'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'custom'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Create
        </button>
      </div>

      {(activeTab === 'snippets' || activeTab === 'templates') && (
        <>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          />

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Snippets List */}
          <div className="space-y-2 max-h-64 overflow-auto">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                onClick={() => setSelectedSnippet(snippet)}
                className={`p-3 rounded cursor-pointer ${
                  selectedSnippet?.id === snippet.id
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{snippet.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{snippet.category}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{snippet.description}</p>
              </div>
            ))}
          </div>

          {/* Selected Snippet Preview */}
          {selectedSnippet && (
            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-300">{selectedSnippet.name}</h4>
                <button
                  onClick={() => insertSnippet(selectedSnippet.code)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                  Insert
                </button>
              </div>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-48">
                {selectedSnippet.code}
              </pre>
            </div>
          )}
        </>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Snippet Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="My Custom Snippet"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="What does this snippet do?"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            >
              {categories.filter((c) => c !== 'all').map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Code</label>
            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="// Your code here..."
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm font-mono resize-none"
            />
          </div>

          <button
            onClick={saveCustomSnippet}
            disabled={loading || !customName.trim() || !customCode.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Saving...' : 'Save Snippet'}
          </button>
        </div>
      )}
    </div>
  );
}
