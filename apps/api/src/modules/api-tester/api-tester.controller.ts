import { Controller, Post, Get, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTesterService } from './api-tester.service';
import { SendRequestDto, SaveRequestDto, CreateCollectionDto } from './dto/api-tester.dto';

@ApiTags('api-tester')
@Controller('api/api-tester')
export class ApiTesterController {
  constructor(private readonly apiTesterService: ApiTesterService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send HTTP request' })
  @ApiResponse({ status: 200, description: 'Request response' })
  async sendRequest(@Body() dto: SendRequestDto) {
    return this.apiTesterService.sendRequest(dto);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get all request collections' })
  async getCollections() {
    return this.apiTesterService.getCollections();
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create new collection' })
  async createCollection(@Body() dto: CreateCollectionDto) {
    return this.apiTesterService.createCollection(dto);
  }

  @Get('collections/:id')
  @ApiOperation({ summary: 'Get collection by ID' })
  async getCollection(@Param('id') id: string) {
    return this.apiTesterService.getCollection(id);
  }

  @Delete('collections/:id')
  @ApiOperation({ summary: 'Delete collection' })
  async deleteCollection(@Param('id') id: string) {
    return this.apiTesterService.deleteCollection(id);
  }

  @Post('collections/:collectionId/requests')
  @ApiOperation({ summary: 'Save request to collection' })
  async saveRequest(
    @Param('collectionId') collectionId: string,
    @Body() dto: SaveRequestDto,
  ) {
    return this.apiTesterService.saveRequest(collectionId, dto);
  }

  @Delete('collections/:collectionId/requests/:requestId')
  @ApiOperation({ summary: 'Delete request from collection' })
  async deleteRequest(
    @Param('collectionId') collectionId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.apiTesterService.deleteRequest(collectionId, requestId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get request history' })
  async getHistory() {
    return this.apiTesterService.getHistory();
  }

  @Delete('history')
  @ApiOperation({ summary: 'Clear request history' })
  async clearHistory() {
    return this.apiTesterService.clearHistory();
  }
}
