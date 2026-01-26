import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnvironmentService } from './environment.service';

@ApiTags('environment')
@Controller('api/projects/:projectId/env')
export class EnvironmentController {
  constructor(private readonly envService: EnvironmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all environment files' })
  async getEnvFiles(@Param('projectId') projectId: string) {
    return this.envService.getEnvFiles(projectId);
  }

  @Get(':envName')
  @ApiOperation({ summary: 'Get environment variables from file' })
  async getEnvVariables(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
  ) {
    return this.envService.getEnvVariables(projectId, envName);
  }

  @Post(':envName')
  @ApiOperation({ summary: 'Create new environment file' })
  async createEnvFile(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
    @Body() body: { variables: Record<string, string> },
  ) {
    return this.envService.createEnvFile(projectId, envName, body.variables);
  }

  @Put(':envName')
  @ApiOperation({ summary: 'Update environment variables' })
  async updateEnvVariables(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
    @Body() body: { variables: Record<string, string> },
  ) {
    return this.envService.updateEnvFile(projectId, envName, body.variables);
  }

  @Delete(':envName')
  @ApiOperation({ summary: 'Delete environment file' })
  async deleteEnvFile(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
  ) {
    return this.envService.deleteEnvFile(projectId, envName);
  }

  @Post(':envName/variable')
  @ApiOperation({ summary: 'Add or update single variable' })
  async setVariable(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
    @Body() body: { key: string; value: string },
  ) {
    return this.envService.setVariable(projectId, envName, body.key, body.value);
  }

  @Delete(':envName/variable/:key')
  @ApiOperation({ summary: 'Delete single variable' })
  async deleteVariable(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
    @Param('key') key: string,
  ) {
    return this.envService.deleteVariable(projectId, envName, key);
  }

  @Post('generate-example')
  @ApiOperation({ summary: 'Generate .env.example from .env' })
  async generateExample(@Param('projectId') projectId: string) {
    return this.envService.generateExample(projectId);
  }

  @Get('validate/:envName')
  @ApiOperation({ summary: 'Validate env file against example' })
  async validate(
    @Param('projectId') projectId: string,
    @Param('envName') envName: string,
  ) {
    return this.envService.validate(projectId, envName);
  }
}
