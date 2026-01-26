import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DockerService } from './docker.service';
import { DockerConfigDto } from './dto/docker.dto';

@ApiTags('docker')
@Controller('api/projects/:projectId/docker')
export class DockerController {
  constructor(private readonly dockerService: DockerService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate Docker configuration' })
  async generate(
    @Param('projectId') projectId: string,
    @Body() dto: DockerConfigDto,
  ) {
    return this.dockerService.generateDockerConfig(projectId, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Docker status' })
  async getStatus(@Param('projectId') projectId: string) {
    return this.dockerService.getStatus(projectId);
  }

  @Post('build')
  @ApiOperation({ summary: 'Build Docker image' })
  async build(@Param('projectId') projectId: string) {
    return this.dockerService.buildImage(projectId);
  }

  @Post('up')
  @ApiOperation({ summary: 'Start containers with docker-compose' })
  async up(
    @Param('projectId') projectId: string,
    @Body() body: { detach?: boolean },
  ) {
    return this.dockerService.composeUp(projectId, body.detach);
  }

  @Post('down')
  @ApiOperation({ summary: 'Stop containers' })
  async down(@Param('projectId') projectId: string) {
    return this.dockerService.composeDown(projectId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get container logs' })
  async logs(
    @Param('projectId') projectId: string,
  ) {
    return this.dockerService.getLogs(projectId);
  }

  @Get('containers')
  @ApiOperation({ summary: 'List containers' })
  async containers(@Param('projectId') projectId: string) {
    return this.dockerService.listContainers(projectId);
  }
}
