import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Try to load node-pty (optional)
let pty: any = null;
try {
  pty = require('node-pty');
  console.log('node-pty loaded successfully');
} catch {
  console.log('node-pty not available, using fallback terminal');
}

// Fallback terminal class that mimics node-pty interface
class FallbackTerminal extends EventEmitter {
  private process: ChildProcess | null = null;
  private shell: string;
  private cwd: string;

  constructor(shell: string, args: string[], options: { cwd: string; env?: any }) {
    super();
    this.shell = shell;
    this.cwd = options.cwd;
    this.start(options.env);
  }

  private start(env?: any) {
    this.process = spawn(this.shell, ['-i'], {
      cwd: this.cwd,
      env: { ...process.env, ...env, TERM: 'xterm-256color' },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (this.process.stdout) {
      this.process.stdout.on('data', (data: Buffer) => {
        this.emit('data', data.toString());
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on('data', (data: Buffer) => {
        this.emit('data', data.toString());
      });
    }

    this.process.on('exit', (code) => {
      this.emit('exit', { exitCode: code || 0 });
    });

    this.process.on('error', (err) => {
      this.emit('data', `\r\nError: ${err.message}\r\n`);
    });

    // Send welcome message
    setTimeout(() => {
      this.emit('data', `\x1b[32mNestJS Development Studio Terminal\x1b[0m\r\n`);
      this.emit('data', `\x1b[90mWorking directory: ${this.cwd}\x1b[0m\r\n\r\n`);
      this.emit('data', `$ `);
    }, 100);
  }

  write(data: string) {
    if (this.process && this.process.stdin) {
      // Handle special keys
      if (data === '\r') {
        this.process.stdin.write('\n');
        this.emit('data', '\r\n');
      } else if (data === '\x7f' || data === '\b') {
        // Backspace
        this.emit('data', '\b \b');
      } else if (data === '\x03') {
        // Ctrl+C
        this.process.kill('SIGINT');
        this.emit('data', '^C\r\n$ ');
      } else {
        this.process.stdin.write(data);
        this.emit('data', data);
      }
    }
  }

  resize(cols: number, rows: number) {
    // Fallback doesn't support resize
  }

  kill() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  onData(callback: (data: string) => void) {
    this.on('data', callback);
  }

  onExit(callback: (data: { exitCode: number }) => void) {
    this.on('exit', callback);
  }
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
    // Close existing terminal for this client
    this.closeTerminal(clientId);

    // Determine working directory
    let workingDir = this.projectsDir;
    if (projectId && projectId !== 'default') {
      const projectPath = path.join(this.projectsDir, projectId);
      if (fs.existsSync(projectPath)) {
        workingDir = projectPath;
      }
    }

    // Ensure the directory exists
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    try {
      let terminal: any;

      if (pty) {
        // Use node-pty if available
        terminal = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols,
          rows,
          cwd: workingDir,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
          },
        });
      } else {
        // Use fallback terminal
        terminal = new FallbackTerminal(shell, [], {
          cwd: workingDir,
          env: process.env,
        });
      }

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
    if (terminal?.pty && terminal.pty.resize) {
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
