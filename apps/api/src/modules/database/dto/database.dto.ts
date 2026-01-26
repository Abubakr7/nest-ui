import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLITE = 'sqlite',
}

export enum OrmType {
  PRISMA = 'prisma',
  TYPEORM = 'typeorm',
}

export class DatabaseConfigDto {
  @ApiProperty({ enum: DatabaseType })
  @IsEnum(DatabaseType)
  type: DatabaseType;

  @ApiProperty({ enum: OrmType })
  @IsEnum(OrmType)
  orm: OrmType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  database?: string;
}

export class EntityField {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  primary?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  nullable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  unique?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  default?: any;

  @ApiPropertyOptional()
  @IsOptional()
  relation?: {
    type: 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne';
    target: string;
  };
}

export class CreateEntityDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [EntityField] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityField)
  fields: EntityField[];
}

export class CreateMigrationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sql?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rollbackSql?: string;
}
