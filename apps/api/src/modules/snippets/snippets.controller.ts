import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SnippetsService } from './snippets.service';
import { CreateSnippetDto } from './dto/snippets.dto';

@ApiTags('snippets')
@Controller('api/snippets')
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all snippets' })
  async getAll(@Query('category') category?: string) {
    return this.snippetsService.getAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get snippet categories' })
  async getCategories() {
    return this.snippetsService.getCategories();
  }

  @Get('built-in')
  @ApiOperation({ summary: 'Get built-in NestJS snippets' })
  async getBuiltIn() {
    return this.snippetsService.getBuiltInSnippets();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get snippet by ID' })
  async getOne(@Param('id') id: string) {
    return this.snippetsService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom snippet' })
  async create(@Body() dto: CreateSnippetDto) {
    return this.snippetsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update snippet' })
  async update(@Param('id') id: string, @Body() dto: CreateSnippetDto) {
    return this.snippetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete snippet' })
  async delete(@Param('id') id: string) {
    return this.snippetsService.delete(id);
  }

  @Get('templates/project')
  @ApiOperation({ summary: 'Get project templates' })
  async getProjectTemplates() {
    return this.snippetsService.getProjectTemplates();
  }

  @Get('templates/module')
  @ApiOperation({ summary: 'Get module templates' })
  async getModuleTemplates() {
    return this.snippetsService.getModuleTemplates();
  }
}
