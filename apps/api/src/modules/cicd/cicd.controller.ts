import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CicdService } from './cicd.service';
import { GenerateCicdDto } from './dto/cicd.dto';

@ApiTags('cicd')
@Controller('api/projects/:projectId/cicd')
export class CicdController {
  constructor(private readonly cicdService: CicdService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate CI/CD configuration' })
  async generate(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateCicdDto,
  ) {
    return this.cicdService.generate(projectId, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get CI/CD configuration status' })
  async getStatus(@Param('projectId') projectId: string) {
    return this.cicdService.getStatus(projectId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available CI/CD templates' })
  async getTemplates() {
    return this.cicdService.getTemplates();
  }

  @Post('github-actions')
  @ApiOperation({ summary: 'Generate GitHub Actions workflow' })
  async generateGithubActions(
    @Param('projectId') projectId: string,
    @Body() body: { deploy?: string; docker?: boolean },
  ) {
    return this.cicdService.generateGithubActions(projectId, body);
  }

  @Post('gitlab-ci')
  @ApiOperation({ summary: 'Generate GitLab CI configuration' })
  async generateGitlabCi(
    @Param('projectId') projectId: string,
    @Body() body: { deploy?: string; docker?: boolean },
  ) {
    return this.cicdService.generateGitlabCi(projectId, body);
  }

  @Post('jenkins')
  @ApiOperation({ summary: 'Generate Jenkinsfile' })
  async generateJenkins(
    @Param('projectId') projectId: string,
    @Body() body: { deploy?: string; docker?: boolean },
  ) {
    return this.cicdService.generateJenkins(projectId, body);
  }
}
