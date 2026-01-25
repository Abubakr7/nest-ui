import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiTags('projects')
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'List of all projects' })
  async findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new NestJS project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project settings' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/install')
  @ApiOperation({ summary: 'Install project dependencies' })
  async installDependencies(@Param('id') id: string) {
    return this.projectsService.installDependencies(id);
  }

  @Post(':id/build')
  @ApiOperation({ summary: 'Build the project' })
  async build(@Param('id') id: string) {
    return this.projectsService.build(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start the project in development mode' })
  async start(@Param('id') id: string) {
    return this.projectsService.start(id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop the running project' })
  async stop(@Param('id') id: string) {
    return this.projectsService.stop(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get project running status' })
  async getStatus(@Param('id') id: string) {
    return this.projectsService.getStatus(id);
  }
}
