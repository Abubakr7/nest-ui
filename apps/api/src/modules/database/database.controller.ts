import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from './database.service';
import { CreateEntityDto, CreateMigrationDto, DatabaseConfigDto } from './dto/database.dto';

@ApiTags('database')
@Controller('api/projects/:projectId/database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Setup database configuration' })
  async setup(
    @Param('projectId') projectId: string,
    @Body() dto: DatabaseConfigDto,
  ) {
    return this.databaseService.setup(projectId, dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get database configuration' })
  async getConfig(@Param('projectId') projectId: string) {
    return this.databaseService.getConfig(projectId);
  }

  @Get('entities')
  @ApiOperation({ summary: 'Get all entities' })
  async getEntities(@Param('projectId') projectId: string) {
    return this.databaseService.getEntities(projectId);
  }

  @Post('entities')
  @ApiOperation({ summary: 'Create new entity' })
  async createEntity(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEntityDto,
  ) {
    return this.databaseService.createEntity(projectId, dto);
  }

  @Put('entities/:entityName')
  @ApiOperation({ summary: 'Update entity' })
  async updateEntity(
    @Param('projectId') projectId: string,
    @Param('entityName') entityName: string,
    @Body() dto: CreateEntityDto,
  ) {
    return this.databaseService.updateEntity(projectId, entityName, dto);
  }

  @Delete('entities/:entityName')
  @ApiOperation({ summary: 'Delete entity' })
  async deleteEntity(
    @Param('projectId') projectId: string,
    @Param('entityName') entityName: string,
  ) {
    return this.databaseService.deleteEntity(projectId, entityName);
  }

  @Get('migrations')
  @ApiOperation({ summary: 'Get all migrations' })
  async getMigrations(@Param('projectId') projectId: string) {
    return this.databaseService.getMigrations(projectId);
  }

  @Post('migrations/generate')
  @ApiOperation({ summary: 'Generate new migration' })
  async generateMigration(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMigrationDto,
  ) {
    return this.databaseService.generateMigration(projectId, dto);
  }

  @Post('migrations/run')
  @ApiOperation({ summary: 'Run pending migrations' })
  async runMigrations(@Param('projectId') projectId: string) {
    return this.databaseService.runMigrations(projectId);
  }

  @Post('migrations/revert')
  @ApiOperation({ summary: 'Revert last migration' })
  async revertMigration(@Param('projectId') projectId: string) {
    return this.databaseService.revertMigration(projectId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Run database seeders' })
  async seed(@Param('projectId') projectId: string) {
    return this.databaseService.seed(projectId);
  }

  @Get('schema')
  @ApiOperation({ summary: 'Get database schema visualization' })
  async getSchema(@Param('projectId') projectId: string) {
    return this.databaseService.getSchema(projectId);
  }

  @Post('query')
  @ApiOperation({ summary: 'Execute raw SQL query (for debugging)' })
  async executeQuery(
    @Param('projectId') projectId: string,
    @Body() body: { query: string },
  ) {
    return this.databaseService.executeQuery(projectId, body.query);
  }

  @Get('tables')
  @ApiOperation({ summary: 'List all tables' })
  async getTables(@Param('projectId') projectId: string) {
    return this.databaseService.getTables(projectId);
  }

  @Get('tables/:tableName/data')
  @ApiOperation({ summary: 'Get table data' })
  async getTableData(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.databaseService.getTableData(projectId, tableName, page, limit);
  }
}
