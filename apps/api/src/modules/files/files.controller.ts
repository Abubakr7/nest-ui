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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import {
  CreateFileDto,
  UpdateFileDto,
  RenameFileDto,
  MoveFileDto,
} from './dto/file.dto';

@ApiTags('files')
@Controller('api/projects/:projectId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get project file tree' })
  @ApiResponse({ status: 200, description: 'File tree structure' })
  async getFileTree(@Param('projectId') projectId: string) {
    return this.filesService.getFileTree(projectId);
  }

  @Get('content')
  @ApiOperation({ summary: 'Get file content' })
  @ApiQuery({ name: 'path', description: 'File path relative to project root' })
  async getFileContent(
    @Param('projectId') projectId: string,
    @Query('path') filePath: string,
  ) {
    return this.filesService.getFileContent(projectId, filePath);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new file' })
  @ApiResponse({ status: 201, description: 'File created successfully' })
  async createFile(
    @Param('projectId') projectId: string,
    @Body() createFileDto: CreateFileDto,
  ) {
    return this.filesService.createFile(projectId, createFileDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update file content' })
  async updateFile(
    @Param('projectId') projectId: string,
    @Body() updateFileDto: UpdateFileDto,
  ) {
    return this.filesService.updateFile(projectId, updateFileDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file' })
  @ApiQuery({ name: 'path', description: 'File path to delete' })
  async deleteFile(
    @Param('projectId') projectId: string,
    @Query('path') filePath: string,
  ) {
    return this.filesService.deleteFile(projectId, filePath);
  }

  @Post('rename')
  @ApiOperation({ summary: 'Rename a file' })
  async renameFile(
    @Param('projectId') projectId: string,
    @Body() renameFileDto: RenameFileDto,
  ) {
    return this.filesService.renameFile(projectId, renameFileDto);
  }

  @Post('move')
  @ApiOperation({ summary: 'Move a file to another location' })
  async moveFile(
    @Param('projectId') projectId: string,
    @Body() moveFileDto: MoveFileDto,
  ) {
    return this.filesService.moveFile(projectId, moveFileDto);
  }

  @Post('folder')
  @ApiOperation({ summary: 'Create a new folder' })
  async createFolder(
    @Param('projectId') projectId: string,
    @Body() body: { path: string },
  ) {
    return this.filesService.createFolder(projectId, body.path);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search files by name or content' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiQuery({ name: 'type', description: 'Search type: name or content' })
  async searchFiles(
    @Param('projectId') projectId: string,
    @Query('query') query: string,
    @Query('type') type: 'name' | 'content' = 'name',
  ) {
    return this.filesService.searchFiles(projectId, query, type);
  }
}
