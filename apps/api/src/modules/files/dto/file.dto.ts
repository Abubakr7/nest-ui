import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({ description: 'File path relative to project root' })
  @IsString()
  path: string;

  @ApiPropertyOptional({ description: 'File content' })
  @IsString()
  @IsOptional()
  content?: string;
}

export class UpdateFileDto {
  @ApiProperty({ description: 'File path relative to project root' })
  @IsString()
  path: string;

  @ApiProperty({ description: 'New file content' })
  @IsString()
  content: string;
}

export class RenameFileDto {
  @ApiProperty({ description: 'Current file path' })
  @IsString()
  oldPath: string;

  @ApiProperty({ description: 'New file path' })
  @IsString()
  newPath: string;
}

export class MoveFileDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  sourcePath: string;

  @ApiProperty({ description: 'Destination file path' })
  @IsString()
  destinationPath: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileTreeNode[];
}
