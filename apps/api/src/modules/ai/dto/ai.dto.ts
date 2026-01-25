import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCodeDto {
  @ApiProperty({ description: 'Description of code to generate' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Type of code: controller, service, module, dto, guard, pipe' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Additional context about the project' })
  @IsString()
  @IsOptional()
  context?: string;
}

export class ExplainCodeDto {
  @ApiProperty({ description: 'Code to explain' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Programming language' })
  @IsString()
  @IsOptional()
  language?: string;
}

export class RefactorCodeDto {
  @ApiProperty({ description: 'Code to refactor' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Specific refactoring instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class GenerateTestDto {
  @ApiProperty({ description: 'Code to generate tests for' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Test framework (jest by default)' })
  @IsString()
  @IsOptional()
  framework?: string;
}

export class FixErrorDto {
  @ApiProperty({ description: 'Code with error' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Error message' })
  @IsString()
  error: string;

  @ApiPropertyOptional({ description: 'Stack trace if available' })
  @IsString()
  @IsOptional()
  stackTrace?: string;
}

class ChatHistoryMessage {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Chat history' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessage)
  @IsOptional()
  history?: ChatHistoryMessage[];

  @ApiPropertyOptional({ description: 'Current project context' })
  @IsString()
  @IsOptional()
  projectContext?: string;
}
