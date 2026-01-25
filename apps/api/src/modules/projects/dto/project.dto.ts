import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DatabaseType {
  NONE = 'none',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLITE = 'sqlite',
}

export enum AuthType {
  NONE = 'none',
  JWT = 'jwt',
  SESSION = 'session',
  OAUTH = 'oauth',
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: DatabaseType, default: DatabaseType.NONE })
  @IsEnum(DatabaseType)
  @IsOptional()
  database?: DatabaseType;

  @ApiPropertyOptional({ enum: AuthType, default: AuthType.NONE })
  @IsEnum(AuthType)
  @IsOptional()
  authentication?: AuthType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  swagger?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  websockets?: boolean;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'stopped' | 'building';
  config: {
    database?: DatabaseType;
    authentication?: AuthType;
    swagger?: boolean;
    websockets?: boolean;
  };
}
