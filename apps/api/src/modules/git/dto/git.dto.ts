import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GitCommitDto {
  @ApiProperty({ description: 'Commit message' })
  @IsString()
  message: string;
}

export class GitCheckoutDto {
  @ApiProperty({ description: 'Branch name' })
  @IsString()
  branch: string;

  @ApiPropertyOptional({ description: 'Create new branch' })
  @IsBoolean()
  @IsOptional()
  create?: boolean;
}

export class GitPushDto {
  @ApiPropertyOptional({ description: 'Remote name', default: 'origin' })
  @IsString()
  @IsOptional()
  remote?: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ description: 'Force push' })
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}

export class GitPullDto {
  @ApiPropertyOptional({ description: 'Remote name', default: 'origin' })
  @IsString()
  @IsOptional()
  remote?: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsString()
  @IsOptional()
  branch?: string;
}

export class GitStashDto {
  @ApiPropertyOptional({ description: 'Stash message' })
  @IsString()
  @IsOptional()
  message?: string;
}
