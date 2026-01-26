import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DependenciesService } from './dependencies.service';

@ApiTags('dependencies')
@Controller('api/projects/:projectId/dependencies')
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dependencies' })
  async getAll(@Param('projectId') projectId: string) {
    return this.dependenciesService.getAll(projectId);
  }

  @Get('outdated')
  @ApiOperation({ summary: 'Check for outdated packages' })
  async getOutdated(@Param('projectId') projectId: string) {
    return this.dependenciesService.getOutdated(projectId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Security audit' })
  async audit(@Param('projectId') projectId: string) {
    return this.dependenciesService.audit(projectId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search npm packages' })
  async search(@Query('q') query: string) {
    return this.dependenciesService.search(query);
  }

  @Get('info/:packageName')
  @ApiOperation({ summary: 'Get package info' })
  async getPackageInfo(@Param('packageName') packageName: string) {
    return this.dependenciesService.getPackageInfo(packageName);
  }

  @Post('install')
  @ApiOperation({ summary: 'Install package' })
  async install(
    @Param('projectId') projectId: string,
    @Body() body: { packages: string[]; dev?: boolean },
  ) {
    return this.dependenciesService.install(projectId, body.packages, body.dev);
  }

  @Delete('uninstall')
  @ApiOperation({ summary: 'Uninstall package' })
  async uninstall(
    @Param('projectId') projectId: string,
    @Body() body: { packages: string[] },
  ) {
    return this.dependenciesService.uninstall(projectId, body.packages);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update packages' })
  async update(
    @Param('projectId') projectId: string,
    @Body() body: { packages?: string[] },
  ) {
    return this.dependenciesService.update(projectId, body.packages);
  }

  @Get('scripts')
  @ApiOperation({ summary: 'Get npm scripts' })
  async getScripts(@Param('projectId') projectId: string) {
    return this.dependenciesService.getScripts(projectId);
  }

  @Post('scripts/run')
  @ApiOperation({ summary: 'Run npm script' })
  async runScript(
    @Param('projectId') projectId: string,
    @Body() body: { script: string },
  ) {
    return this.dependenciesService.runScript(projectId, body.script);
  }
}
