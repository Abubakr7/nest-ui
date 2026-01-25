import { IsString, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

class KeyValuePair {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  enabled?: boolean;
}

export class SendRequestDto {
  @ApiProperty({ description: 'Request URL' })
  @IsString()
  url: string;

  @ApiProperty({ enum: HttpMethod })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiPropertyOptional({ description: 'Request headers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValuePair)
  @IsOptional()
  headers?: KeyValuePair[];

  @ApiPropertyOptional({ description: 'Query parameters' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValuePair)
  @IsOptional()
  params?: KeyValuePair[];

  @ApiPropertyOptional({ description: 'Request body' })
  @IsOptional()
  body?: any;

  @ApiPropertyOptional({ description: 'Body type: json, form-data, raw' })
  @IsString()
  @IsOptional()
  bodyType?: 'json' | 'form-data' | 'raw';
}

export class SaveRequestDto extends SendRequestDto {
  @ApiProperty({ description: 'Request name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Request description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export interface SavedRequest {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers?: KeyValuePair[];
  params?: KeyValuePair[];
  body?: any;
  bodyType?: 'json' | 'form-data' | 'raw';
  createdAt: string;
  updatedAt: string;
}

export interface RequestCollection {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestHistoryItem {
  id: string;
  request: SendRequestDto;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
    size: number;
  };
  timestamp: string;
}
