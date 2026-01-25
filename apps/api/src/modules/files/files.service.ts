import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CreateFileDto,
  UpdateFileDto,
  RenameFileDto,
  MoveFileDto,
  FileTreeNode,
} from './dto/file.dto';

@Injectable()
export class FilesService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  async getFileTree(projectId: string): Promise<FileTreeNode> {
    const projectPath = await this.getProjectPath(projectId);
    return this.buildFileTree(projectPath, projectPath);
  }

  async getFileContent(
    projectId: string,
    filePath: string,
  ): Promise<{ content: string; language: string }> {
    const fullPath = await this.resolveFilePath(projectId, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const language = this.getLanguageFromExtension(filePath);
      return { content, language };
    } catch {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
  }

  async createFile(
    projectId: string,
    dto: CreateFileDto,
  ): Promise<{ success: boolean; path: string }> {
    const fullPath = await this.resolveFilePath(projectId, dto.path);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Check if file already exists
    try {
      await fs.access(fullPath);
      throw new BadRequestException(`File already exists: ${dto.path}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }

    await fs.writeFile(fullPath, dto.content || '');
    return { success: true, path: dto.path };
  }

  async updateFile(
    projectId: string,
    dto: UpdateFileDto,
  ): Promise<{ success: boolean }> {
    const fullPath = await this.resolveFilePath(projectId, dto.path);

    try {
      await fs.access(fullPath);
    } catch {
      throw new NotFoundException(`File not found: ${dto.path}`);
    }

    await fs.writeFile(fullPath, dto.content);
    return { success: true };
  }

  async deleteFile(
    projectId: string,
    filePath: string,
  ): Promise<{ success: boolean }> {
    const fullPath = await this.resolveFilePath(projectId, filePath);

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await fs.rm(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
      return { success: true };
    } catch {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
  }

  async renameFile(
    projectId: string,
    dto: RenameFileDto,
  ): Promise<{ success: boolean; newPath: string }> {
    const oldPath = await this.resolveFilePath(projectId, dto.oldPath);
    const newPath = await this.resolveFilePath(projectId, dto.newPath);

    try {
      await fs.rename(oldPath, newPath);
      return { success: true, newPath: dto.newPath };
    } catch {
      throw new NotFoundException(`File not found: ${dto.oldPath}`);
    }
  }

  async moveFile(
    projectId: string,
    dto: MoveFileDto,
  ): Promise<{ success: boolean; newPath: string }> {
    const sourcePath = await this.resolveFilePath(projectId, dto.sourcePath);
    const destPath = await this.resolveFilePath(projectId, dto.destinationPath);

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    try {
      await fs.rename(sourcePath, destPath);
      return { success: true, newPath: dto.destinationPath };
    } catch {
      throw new NotFoundException(`File not found: ${dto.sourcePath}`);
    }
  }

  async createFolder(
    projectId: string,
    folderPath: string,
  ): Promise<{ success: boolean; path: string }> {
    const fullPath = await this.resolveFilePath(projectId, folderPath);

    await fs.mkdir(fullPath, { recursive: true });
    return { success: true, path: folderPath };
  }

  async searchFiles(
    projectId: string,
    query: string,
    type: 'name' | 'content',
  ): Promise<{ results: Array<{ path: string; matches?: string[] }> }> {
    const projectPath = await this.getProjectPath(projectId);
    const results: Array<{ path: string; matches?: string[] }> = [];

    await this.searchRecursive(projectPath, projectPath, query, type, results);
    return { results };
  }

  private async buildFileTree(
    basePath: string,
    currentPath: string,
  ): Promise<FileTreeNode> {
    const stats = await fs.stat(currentPath);
    const name = path.basename(currentPath);
    const relativePath = path.relative(basePath, currentPath);

    if (stats.isDirectory()) {
      // Skip node_modules and hidden directories
      if (name === 'node_modules' || name.startsWith('.')) {
        return {
          name,
          path: relativePath || '.',
          type: 'directory',
          children: [],
        };
      }

      const entries = await fs.readdir(currentPath);
      const children = await Promise.all(
        entries
          .filter((entry) => !entry.startsWith('.') && entry !== 'node_modules')
          .map((entry) => this.buildFileTree(basePath, path.join(currentPath, entry))),
      );

      // Sort: directories first, then files
      children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });

      return {
        name,
        path: relativePath || '.',
        type: 'directory',
        children,
      };
    }

    return {
      name,
      path: relativePath,
      type: 'file',
      extension: path.extname(name).slice(1),
    };
  }

  private async searchRecursive(
    basePath: string,
    currentPath: string,
    query: string,
    type: 'name' | 'content',
    results: Array<{ path: string; matches?: string[] }>,
  ): Promise<void> {
    const stats = await fs.stat(currentPath);
    const name = path.basename(currentPath);

    if (stats.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.') || name === 'dist') {
        return;
      }

      const entries = await fs.readdir(currentPath);
      await Promise.all(
        entries.map((entry) =>
          this.searchRecursive(
            basePath,
            path.join(currentPath, entry),
            query,
            type,
            results,
          ),
        ),
      );
      return;
    }

    const relativePath = path.relative(basePath, currentPath);

    if (type === 'name') {
      if (name.toLowerCase().includes(query.toLowerCase())) {
        results.push({ path: relativePath });
      }
    } else {
      // Content search
      try {
        const content = await fs.readFile(currentPath, 'utf-8');
        const lines = content.split('\n');
        const matches: string[] = [];

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            matches.push(`${index + 1}: ${line.trim().substring(0, 100)}`);
          }
        });

        if (matches.length > 0) {
          results.push({ path: relativePath, matches: matches.slice(0, 10) });
        }
      } catch {
        // Skip binary files
      }
    }
  }

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);

    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }
  }

  private async resolveFilePath(
    projectId: string,
    filePath: string,
  ): Promise<string> {
    const projectPath = await this.getProjectPath(projectId);
    const fullPath = path.join(projectPath, filePath);

    // Security check: ensure path doesn't escape project directory
    if (!fullPath.startsWith(projectPath)) {
      throw new BadRequestException('Invalid file path');
    }

    return fullPath;
  }

  private getLanguageFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.json': 'json',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.md': 'markdown',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.env': 'plaintext',
      '.sql': 'sql',
      '.graphql': 'graphql',
      '.prisma': 'prisma',
    };

    return languageMap[ext] || 'plaintext';
  }
}
