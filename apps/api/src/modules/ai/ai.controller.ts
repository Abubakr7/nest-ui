import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AiService } from './ai.service';
import {
  GenerateCodeDto,
  ExplainCodeDto,
  RefactorCodeDto,
  GenerateTestDto,
  ChatMessageDto,
  FixErrorDto,
} from './dto/ai.dto';

@ApiTags('ai')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate code based on description' })
  @ApiResponse({ status: 200, description: 'Generated code' })
  async generateCode(@Body() dto: GenerateCodeDto) {
    return this.aiService.generateCode(dto);
  }

  @Post('generate/stream')
  @Sse()
  @ApiOperation({ summary: 'Generate code with streaming response' })
  generateCodeStream(@Body() dto: GenerateCodeDto): Observable<MessageEvent> {
    return this.aiService.generateCodeStream(dto);
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain code functionality' })
  async explainCode(@Body() dto: ExplainCodeDto) {
    return this.aiService.explainCode(dto);
  }

  @Post('refactor')
  @ApiOperation({ summary: 'Suggest code refactoring' })
  async refactorCode(@Body() dto: RefactorCodeDto) {
    return this.aiService.refactorCode(dto);
  }

  @Post('generate-test')
  @ApiOperation({ summary: 'Generate unit tests for code' })
  async generateTest(@Body() dto: GenerateTestDto) {
    return this.aiService.generateTest(dto);
  }

  @Post('fix-error')
  @ApiOperation({ summary: 'Analyze and fix code errors' })
  async fixError(@Body() dto: FixErrorDto) {
    return this.aiService.fixError(dto);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI about the project' })
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiService.chat(dto);
  }

  @Post('chat/stream')
  @Sse()
  @ApiOperation({ summary: 'Chat with AI with streaming response' })
  chatStream(@Body() dto: ChatMessageDto): Observable<MessageEvent> {
    return this.aiService.chatStream(dto);
  }

  @Post('generate-module')
  @ApiOperation({ summary: 'Generate complete NestJS module' })
  async generateModule(
    @Body() dto: { description: string; moduleName: string; features: string[] },
  ) {
    return this.aiService.generateModule(dto);
  }

  @Post('generate-api')
  @ApiOperation({ summary: 'Generate REST API from description' })
  async generateApi(
    @Body() dto: { entityName: string; fields: Array<{ name: string; type: string }> },
  ) {
    return this.aiService.generateApi(dto);
  }
}
