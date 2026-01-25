import { Injectable } from '@nestjs/common';
import * as path from 'path';

// Dynamic import for node-pty (optional dependency)
let pty: any;
try {
  pty = require('node-pty');
} catch {
  console.warn('node-pty not available, terminal feature disabled');
}

interface TerminalInstance {
  pty: any;
  projectId: string;
}

@Injectable()
export class TerminalService {
  private terminals: Map<string, TerminalInstance> = new Map();
  private readonly projectsDir = path.join(process.cwd(), '..', '..', 'projects');

  createTerminal(
    clientId: string,
    projectId: string,
    cols: number,
    rows: number,
  ): any | null {
    if (!pty) {
      console.warn('Terminal feature not available');
      return null;
    }

    // Close existing terminal for this client
    this.closeTerminal(clientId);

    const projectPath = path.join(this.projectsDir, projectId);
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    try {
      const terminal = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: projectPath,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
      });

      this.terminals.set(clientId, {
        pty: terminal,
        projectId,
      });

      return terminal;
    } catch (error) {
      console.error('Failed to create terminal:', error);
      return null;
    }
  }

  writeToTerminal(clientId: string, data: string): void {
    const terminal = this.terminals.get(clientId);
    if (terminal?.pty) {
      terminal.pty.write(data);
    }
  }

  resizeTerminal(clientId: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(clientId);
    if (terminal?.pty) {
      terminal.pty.resize(cols, rows);
    }
  }

  closeTerminal(clientId: string): void {
    const terminal = this.terminals.get(clientId);
    if (terminal?.pty) {
      terminal.pty.kill();
      this.terminals.delete(clientId);
    }
  }

  getTerminal(clientId: string): TerminalInstance | undefined {
    return this.terminals.get(clientId);
  }
}
