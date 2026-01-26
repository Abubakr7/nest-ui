import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestingService } from './testing.service';

@ApiTags('testing')
@Controller('api/projects/:projectId/testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get('discover')
  @ApiOperation({ summary: 'Discover all test files' })
  async discover(@Param('projectId') projectId: string) {
    return this.testingService.discoverTests(projectId);
  }

  @Post('run')
  @ApiOperation({ summary: 'Run all tests' })
  async runAll(
    @Param('projectId') projectId: string,
    @Body() body: { watch?: boolean; coverage?: boolean },
  ) {
    return this.testingService.runAllTests(projectId, body);
  }

  @Post('run/file')
  @ApiOperation({ summary: 'Run tests in specific file' })
  async runFile(
    @Param('projectId') projectId: string,
    @Body() body: { file: string; watch?: boolean },
  ) {
    return this.testingService.runTestFile(projectId, body.file, body.watch);
  }

  @Post('run/pattern')
  @ApiOperation({ summary: 'Run tests matching pattern' })
  async runPattern(
    @Param('projectId') projectId: string,
    @Body() body: { pattern: string },
  ) {
    return this.testingService.runTestPattern(projectId, body.pattern);
  }

  @Get('coverage')
  @ApiOperation({ summary: 'Get coverage report' })
  async getCoverage(@Param('projectId') projectId: string) {
    return this.testingService.getCoverageReport(projectId);
  }

  @Get('results')
  @ApiOperation({ summary: 'Get last test results' })
  async getResults(@Param('projectId') projectId: string) {
    return this.testingService.getLastResults(projectId);
  }

  @Post('e2e')
  @ApiOperation({ summary: 'Run e2e tests' })
  async runE2e(@Param('projectId') projectId: string) {
    return this.testingService.runE2eTests(projectId);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Setup Jest configuration' })
  async setup(@Param('projectId') projectId: string) {
    return this.testingService.setupJest(projectId);
  }
}
