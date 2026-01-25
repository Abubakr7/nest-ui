import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeneratorService } from './generator.service';
import {
  GenerateModuleDto,
  GenerateControllerDto,
  GenerateServiceDto,
  GenerateDtoDto,
  GenerateGuardDto,
  GeneratePipeDto,
  GenerateMiddlewareDto,
  GenerateInterceptorDto,
  GenerateCrudDto,
} from './dto/generator.dto';

@ApiTags('generator')
@Controller('api/projects/:projectId/generate')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('module')
  @ApiOperation({ summary: 'Generate a new NestJS module' })
  @ApiResponse({ status: 201, description: 'Module generated successfully' })
  async generateModule(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateModuleDto,
  ) {
    return this.generatorService.generateModule(projectId, dto);
  }

  @Post('controller')
  @ApiOperation({ summary: 'Generate a new controller' })
  async generateController(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateControllerDto,
  ) {
    return this.generatorService.generateController(projectId, dto);
  }

  @Post('service')
  @ApiOperation({ summary: 'Generate a new service' })
  async generateService(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateServiceDto,
  ) {
    return this.generatorService.generateService(projectId, dto);
  }

  @Post('dto')
  @ApiOperation({ summary: 'Generate a new DTO' })
  async generateDto(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateDtoDto,
  ) {
    return this.generatorService.generateDto(projectId, dto);
  }

  @Post('guard')
  @ApiOperation({ summary: 'Generate a new guard' })
  async generateGuard(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateGuardDto,
  ) {
    return this.generatorService.generateGuard(projectId, dto);
  }

  @Post('pipe')
  @ApiOperation({ summary: 'Generate a new pipe' })
  async generatePipe(
    @Param('projectId') projectId: string,
    @Body() dto: GeneratePipeDto,
  ) {
    return this.generatorService.generatePipe(projectId, dto);
  }

  @Post('middleware')
  @ApiOperation({ summary: 'Generate a new middleware' })
  async generateMiddleware(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateMiddlewareDto,
  ) {
    return this.generatorService.generateMiddleware(projectId, dto);
  }

  @Post('interceptor')
  @ApiOperation({ summary: 'Generate a new interceptor' })
  async generateInterceptor(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateInterceptorDto,
  ) {
    return this.generatorService.generateInterceptor(projectId, dto);
  }

  @Post('crud')
  @ApiOperation({ summary: 'Generate complete CRUD module' })
  async generateCrud(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateCrudDto,
  ) {
    return this.generatorService.generateCrud(projectId, dto);
  }
}
