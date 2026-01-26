import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LintingService } from './linting.service';

@ApiTags('linting')
@Controller('api/projects/:projectId/linting')
export class LintingController {
  constructor(private readonly lintingService: LintingService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Setup ESLint and Prettier' })
  async setup(@Param('projectId') projectId: string) {
    return this.lintingService.setup(projectId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get linting configuration status' })
  async getStatus(@Param('projectId') projectId: string) {
    return this.lintingService.getStatus(projectId);
  }

  @Post('lint')
  @ApiOperation({ summary: 'Run ESLint on project' })
  async lint(
    @Param('projectId') projectId: string,
    @Body() body: { fix?: boolean },
  ) {
    return this.lintingService.lint(projectId, body.fix);
  }

  @Post('lint/file')
  @ApiOperation({ summary: 'Lint specific file' })
  async lintFile(
    @Param('projectId') projectId: string,
    @Body() body: { file: string; fix?: boolean },
  ) {
    return this.lintingService.lintFile(projectId, body.file, body.fix);
  }

  @Post('format')
  @ApiOperation({ summary: 'Format code with Prettier' })
  async format(@Param('projectId') projectId: string) {
    return this.lintingService.format(projectId);
  }

  @Post('format/file')
  @ApiOperation({ summary: 'Format specific file' })
  async formatFile(
    @Param('projectId') projectId: string,
    @Body() body: { file: string },
  ) {
    return this.lintingService.formatFile(projectId, body.file);
  }

  @Get('config/eslint')
  @ApiOperation({ summary: 'Get ESLint config' })
  async getEslintConfig(@Param('projectId') projectId: string) {
    return this.lintingService.getEslintConfig(projectId);
  }

  @Post('config/eslint')
  @ApiOperation({ summary: 'Update ESLint config' })
  async updateEslintConfig(
    @Param('projectId') projectId: string,
    @Body() config: any,
  ) {
    return this.lintingService.updateEslintConfig(projectId, config);
  }

  @Get('config/prettier')
  @ApiOperation({ summary: 'Get Prettier config' })
  async getPrettierConfig(@Param('projectId') projectId: string) {
    return this.lintingService.getPrettierConfig(projectId);
  }

  @Post('config/prettier')
  @ApiOperation({ summary: 'Update Prettier config' })
  async updatePrettierConfig(
    @Param('projectId') projectId: string,
    @Body() config: any,
  ) {
    return this.lintingService.updatePrettierConfig(projectId, config);
  }
}
