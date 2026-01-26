import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSnippetDto {
  @ApiProperty({ description: 'Snippet name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Snippet description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Snippet category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Trigger prefix' })
  @IsString()
  prefix: string;

  @ApiProperty({ description: 'Snippet body/code' })
  @IsString()
  body: string;
}

export interface Snippet {
  id: string;
  name: string;
  description?: string;
  category: string;
  prefix: string;
  body: string;
}
