import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentationService } from './documentation.service';

@ApiTags('documentation')
@Controller('api/projects/:projectId/docs')
export class DocumentationController {
  constructor(private readonly docService: DocumentationService) {}

  @Post('readme')
  @ApiOperation({ summary: 'Generate README.md' })
  async generateReadme(@Param('projectId') projectId: string) {
    return this.docService.generateReadme(projectId);
  }

  @Post('api')
  @ApiOperation({ summary: 'Generate API documentation' })
  async generateApiDocs(@Param('projectId') projectId: string) {
    return this.docService.generateApiDocs(projectId);
  }

  @Post('module/:moduleName')
  @ApiOperation({ summary: 'Generate module documentation' })
  async generateModuleDocs(
    @Param('projectId') projectId: string,
    @Param('moduleName') moduleName: string,
  ) {
    return this.docService.generateModuleDocs(projectId, moduleName);
  }

  @Post('changelog')
  @ApiOperation({ summary: 'Generate CHANGELOG from git commits' })
  async generateChangelog(@Param('projectId') projectId: string) {
    return this.docService.generateChangelog(projectId);
  }

  @Post('contributing')
  @ApiOperation({ summary: 'Generate CONTRIBUTING.md' })
  async generateContributing(@Param('projectId') projectId: string) {
    return this.docService.generateContributing(projectId);
  }

  @Get('swagger')
  @ApiOperation({ summary: 'Get Swagger/OpenAPI spec' })
  async getSwaggerSpec(@Param('projectId') projectId: string) {
    return this.docService.getSwaggerSpec(projectId);
  }

  @Post('jsdoc')
  @ApiOperation({ summary: 'Add JSDoc comments to file' })
  async addJsDoc(
    @Param('projectId') projectId: string,
    @Body() body: { file: string },
  ) {
    return this.docService.addJsDocComments(projectId, body.file);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get documentation structure' })
  async getDocTree(@Param('projectId') projectId: string) {
    return this.docService.getDocTree(projectId);
  }
}
