import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateModuleDto {
  @ApiProperty({ description: 'Module name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: 'Generate controller', default: true })
  @IsBoolean()
  @IsOptional()
  generateController?: boolean;

  @ApiPropertyOptional({ description: 'Generate service', default: true })
  @IsBoolean()
  @IsOptional()
  generateService?: boolean;
}

export class GenerateControllerDto {
  @ApiProperty({ description: 'Controller name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: 'Methods to generate' })
  @IsArray()
  @IsOptional()
  methods?: string[];
}

export class GenerateServiceDto {
  @ApiProperty({ description: 'Service name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: 'Methods to generate' })
  @IsArray()
  @IsOptional()
  methods?: string[];
}

class FieldDefinition {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class GenerateDtoDto {
  @ApiProperty({ description: 'DTO name (without Dto suffix)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Module this DTO belongs to' })
  @IsString()
  moduleName: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: 'DTO fields' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinition)
  @IsOptional()
  fields?: FieldDefinition[];
}

export class GenerateGuardDto {
  @ApiProperty({ description: 'Guard name (without Guard suffix)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;
}

export class GeneratePipeDto {
  @ApiProperty({ description: 'Pipe name (without Pipe suffix)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;
}

export class GenerateMiddlewareDto {
  @ApiProperty({ description: 'Middleware name (without Middleware suffix)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;
}

export class GenerateInterceptorDto {
  @ApiProperty({ description: 'Interceptor name (without Interceptor suffix)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;
}

export class GenerateCrudDto {
  @ApiProperty({ description: 'Entity name' })
  @IsString()
  entityName: string;

  @ApiPropertyOptional({ description: 'Path relative to src folder' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: 'Entity fields' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinition)
  @IsOptional()
  fields?: Array<{ name: string; type: string }>;
}
