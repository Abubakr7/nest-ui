import { Injectable, NotFoundException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { GitCommitDto, GitCheckoutDto, GitPushDto, GitPullDto, GitStashDto } from './dto/git.dto';

const execAsync = promisify(exec);

@Injectable()
export class GitService {
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  private async getProjectPath(projectId: string): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    try {
      await fs.access(projectPath);
      return projectPath;
    } catch {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async execGit(projectId: string, command: string): Promise<string> {
    const cwd = await this.getProjectPath(projectId);
    try {
      const { stdout } = await execAsync(`git ${command}`, { cwd });
      return stdout.trim();
    } catch (error: any) {
      throw new Error(error.stderr || error.message);
    }
  }

  async init(projectId: string): Promise<{ success: boolean }> {
    await this.execGit(projectId, 'init');
    // Create .gitignore
    const projectPath = await this.getProjectPath(projectId);
    const gitignore = `node_modules
dist
.env
.env.local
*.log
coverage
.DS_Store
`;
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
    return { success: true };
  }

  async status(projectId: string): Promise<{
    branch: string;
    ahead: number;
    behind: number;
    staged: Array<{ file: string; status: string }>;
    unstaged: Array<{ file: string; status: string }>;
    untracked: string[];
  }> {
    const projectPath = await this.getProjectPath(projectId);

    // Check if git is initialized
    try {
      await fs.access(path.join(projectPath, '.git'));
    } catch {
      return {
        branch: '',
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
      };
    }

    const branch = await this.execGit(projectId, 'branch --show-current').catch(() => 'main');

    let ahead = 0;
    let behind = 0;
    try {
      const aheadBehind = await this.execGit(projectId, 'rev-list --left-right --count HEAD...@{u}');
      const [a, b] = aheadBehind.split('\t').map(Number);
      ahead = a || 0;
      behind = b || 0;
    } catch {
      // No upstream set
    }

    const statusOutput = await this.execGit(projectId, 'status --porcelain').catch(() => '');

    const staged: Array<{ file: string; status: string }> = [];
    const unstaged: Array<{ file: string; status: string }> = [];
    const untracked: string[] = [];

    const statusMap: Record<string, string> = {
      M: 'modified',
      A: 'added',
      D: 'deleted',
      R: 'renamed',
      C: 'copied',
      U: 'unmerged',
    };

    for (const line of statusOutput.split('\n').filter(Boolean)) {
      const stagedStatus = line[0];
      const unstagedStatus = line[1];
      const file = line.slice(3);

      if (stagedStatus === '?') {
        untracked.push(file);
      } else {
        if (stagedStatus !== ' ') {
          staged.push({ file, status: statusMap[stagedStatus] || stagedStatus });
        }
        if (unstagedStatus !== ' ' && unstagedStatus !== '?') {
          unstaged.push({ file, status: statusMap[unstagedStatus] || unstagedStatus });
        }
      }
    }

    return { branch, ahead, behind, staged, unstaged, untracked };
  }

  async log(projectId: string, limit: number): Promise<Array<{
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: string;
    refs: string;
  }>> {
    try {
      const output = await this.execGit(
        projectId,
        `log --pretty=format:"%H|%h|%s|%an|%ae|%ci|%D" -n ${limit}`,
      );

      if (!output) return [];

      return output.split('\n').map((line) => {
        const [hash, shortHash, message, author, email, date, refs] = line.split('|');
        return { hash, shortHash, message, author, email, date, refs: refs || '' };
      });
    } catch {
      return [];
    }
  }

  async branches(projectId: string): Promise<{
    current: string;
    local: string[];
    remote: string[];
  }> {
    const current = await this.execGit(projectId, 'branch --show-current').catch(() => 'main');

    const localOutput = await this.execGit(projectId, 'branch').catch(() => '');
    const local = localOutput
      .split('\n')
      .map((b) => b.replace('*', '').trim())
      .filter(Boolean);

    const remoteOutput = await this.execGit(projectId, 'branch -r').catch(() => '');
    const remote = remoteOutput
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    return { current, local, remote };
  }

  async checkout(projectId: string, dto: GitCheckoutDto): Promise<{ success: boolean }> {
    if (dto.create) {
      await this.execGit(projectId, `checkout -b ${dto.branch}`);
    } else {
      await this.execGit(projectId, `checkout ${dto.branch}`);
    }
    return { success: true };
  }

  async diff(projectId: string, staged: boolean): Promise<string> {
    const flag = staged ? '--staged' : '';
    return this.execGit(projectId, `diff ${flag}`).catch(() => '');
  }

  async diffFile(projectId: string, file: string): Promise<string> {
    return this.execGit(projectId, `diff -- "${file}"`).catch(() => '');
  }

  async add(projectId: string, files: string[]): Promise<{ success: boolean }> {
    const fileList = files.length === 0 ? '.' : files.map((f) => `"${f}"`).join(' ');
    await this.execGit(projectId, `add ${fileList}`);
    return { success: true };
  }

  async reset(projectId: string, files: string[]): Promise<{ success: boolean }> {
    const fileList = files.map((f) => `"${f}"`).join(' ');
    await this.execGit(projectId, `reset HEAD -- ${fileList}`);
    return { success: true };
  }

  async commit(projectId: string, dto: GitCommitDto): Promise<{ success: boolean; hash: string }> {
    const message = dto.message.replace(/"/g, '\\"');
    await this.execGit(projectId, `commit -m "${message}"`);
    const hash = await this.execGit(projectId, 'rev-parse HEAD');
    return { success: true, hash };
  }

  async push(projectId: string, dto: GitPushDto): Promise<{ success: boolean }> {
    const remote = dto.remote || 'origin';
    const branch = dto.branch || '';
    const flags = dto.force ? '-f' : '';
    await this.execGit(projectId, `push ${flags} ${remote} ${branch}`.trim());
    return { success: true };
  }

  async pull(projectId: string, dto: GitPullDto): Promise<{ success: boolean }> {
    const remote = dto.remote || 'origin';
    const branch = dto.branch || '';
    await this.execGit(projectId, `pull ${remote} ${branch}`.trim());
    return { success: true };
  }

  async stash(projectId: string, dto: GitStashDto): Promise<{ success: boolean }> {
    const message = dto.message ? `-m "${dto.message}"` : '';
    await this.execGit(projectId, `stash push ${message}`.trim());
    return { success: true };
  }

  async stashPop(projectId: string): Promise<{ success: boolean }> {
    await this.execGit(projectId, 'stash pop');
    return { success: true };
  }

  async stashList(projectId: string): Promise<Array<{ index: number; message: string }>> {
    const output = await this.execGit(projectId, 'stash list').catch(() => '');
    if (!output) return [];

    return output.split('\n').map((line, index) => ({
      index,
      message: line,
    }));
  }

  async discard(projectId: string, files: string[]): Promise<{ success: boolean }> {
    const fileList = files.map((f) => `"${f}"`).join(' ');
    await this.execGit(projectId, `checkout -- ${fileList}`);
    return { success: true };
  }

  async remotes(projectId: string): Promise<Array<{ name: string; url: string }>> {
    const output = await this.execGit(projectId, 'remote -v').catch(() => '');
    if (!output) return [];

    const remotes = new Map<string, string>();
    for (const line of output.split('\n')) {
      const match = line.match(/^(\S+)\s+(\S+)/);
      if (match) {
        remotes.set(match[1], match[2]);
      }
    }

    return Array.from(remotes.entries()).map(([name, url]) => ({ name, url }));
  }

  async addRemote(projectId: string, name: string, url: string): Promise<{ success: boolean }> {
    await this.execGit(projectId, `remote add ${name} ${url}`);
    return { success: true };
  }

  async merge(projectId: string, branch: string): Promise<{ success: boolean }> {
    await this.execGit(projectId, `merge ${branch}`);
    return { success: true };
  }

  async blame(projectId: string, file: string): Promise<Array<{
    hash: string;
    author: string;
    date: string;
    line: number;
    content: string;
  }>> {
    const output = await this.execGit(projectId, `blame --line-porcelain "${file}"`).catch(() => '');
    if (!output) return [];

    const lines: Array<{ hash: string; author: string; date: string; line: number; content: string }> = [];
    const chunks = output.split(/^([a-f0-9]{40})/m).filter(Boolean);

    for (let i = 0; i < chunks.length; i += 2) {
      const hash = chunks[i];
      const data = chunks[i + 1] || '';
      const authorMatch = data.match(/^author (.+)$/m);
      const dateMatch = data.match(/^author-time (\d+)$/m);
      const lineMatch = data.match(/^(\d+) \d+/);
      const contentMatch = data.match(/\t(.*)$/m);

      if (authorMatch && lineMatch) {
        lines.push({
          hash: hash.slice(0, 8),
          author: authorMatch[1],
          date: dateMatch ? new Date(parseInt(dateMatch[1]) * 1000).toISOString() : '',
          line: parseInt(lineMatch[1]),
          content: contentMatch ? contentMatch[1] : '',
        });
      }
    }

    return lines;
  }
}
