import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DockerConfigDto {
  @ApiPropertyOptional({ description: 'Node.js version', default: '20' })
  @IsString()
  @IsOptional()
  nodeVersion?: string;

  @ApiPropertyOptional({ description: 'Application port', default: 3000 })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ description: 'Use multi-stage build', default: true })
  @IsBoolean()
  @IsOptional()
  multiStage?: boolean;

  @ApiPropertyOptional({ description: 'Database type: postgresql, mysql, mongodb' })
  @IsString()
  @IsOptional()
  database?: string;

  @ApiPropertyOptional({ description: 'Include Redis' })
  @IsBoolean()
  @IsOptional()
  redis?: boolean;
}
