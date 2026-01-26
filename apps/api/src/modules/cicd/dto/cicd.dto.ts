import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CicdProvider {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  JENKINS = 'jenkins',
}

export class GenerateCicdDto {
  @ApiProperty({ enum: CicdProvider })
  @IsEnum(CicdProvider)
  provider: CicdProvider;

  @ApiPropertyOptional({ description: 'Deployment target: vercel, railway, render' })
  @IsString()
  @IsOptional()
  deploy?: string;

  @ApiPropertyOptional({ description: 'Include Docker build' })
  @IsBoolean()
  @IsOptional()
  docker?: boolean;
}
