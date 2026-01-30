'use client'

import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'

export function Terminal() {
  const { currentProject } = useProjectStore()
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [terminalInstance, setTerminalInstance] = useState<any>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!terminalRef.current || !currentProject) return

    let xterm: any
    let fitAddon: any
    let socket: any

    const initTerminal = async () => {
      try {
        // Dynamic imports for xterm
        const { Terminal } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')
        // CSS is imported via link tag in layout or global styles

        // Create terminal
        xterm = new Terminal({
          theme: {
            background: '#0d1117',
            foreground: '#c9d1d9',
            cursor: '#58a6ff',
            cursorAccent: '#0d1117',
            selectionBackground: '#264f78',
            black: '#0d1117',
            red: '#ff7b72',
            green: '#3fb950',
            yellow: '#d29922',
            blue: '#58a6ff',
            magenta: '#bc8cff',
            cyan: '#39c5cf',
            white: '#b1bac4',
            brightBlack: '#6e7681',
            brightRed: '#ffa198',
            brightGreen: '#56d364',
            brightYellow: '#e3b341',
            brightBlue: '#79c0ff',
            brightMagenta: '#d2a8ff',
            brightCyan: '#56d4dd',
            brightWhite: '#f0f6fc',
          },
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontSize: 14,
          cursorBlink: true,
        })

        fitAddon = new FitAddon()
        xterm.loadAddon(fitAddon)

        xterm.open(terminalRef.current!)
        fitAddon.fit()

        setTerminalInstance(xterm)

        // Connect to WebSocket
        const { io } = await import('socket.io-client')
        socket = io('http://localhost:4000/terminal', {
          transports: ['websocket'],
        })

        socketRef.current = socket

        socket.on('connect', () => {
          setIsConnected(true)
          xterm.writeln('\x1b[32mConnected to terminal server\x1b[0m')
          xterm.writeln('')

          // Create terminal session
          socket.emit('terminal:create', {
            projectId: currentProject.id,
            cols: xterm.cols,
            rows: xterm.rows,
          })
        })

        socket.on('terminal:created', () => {
          xterm.writeln('\x1b[34mTerminal session started\x1b[0m')
          xterm.writeln('')
        })

        socket.on('terminal:output', (data: { data: string }) => {
          xterm.write(data.data)
        })

        socket.on('terminal:exit', (data: { exitCode: number }) => {
          xterm.writeln('')
          xterm.writeln(`\x1b[33mProcess exited with code ${data.exitCode}\x1b[0m`)
        })

        socket.on('terminal:error', (data: { message: string }) => {
          xterm.writeln(`\x1b[31mError: ${data.message}\x1b[0m`)
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
          xterm.writeln('')
          xterm.writeln('\x1b[31mDisconnected from terminal server\x1b[0m')
        })

        // Handle user input
        xterm.onData((data: string) => {
          if (socket?.connected) {
            socket.emit('terminal:input', { input: data })
          }
        })

        // Handle resize
        const handleResize = () => {
          fitAddon.fit()
          if (socket?.connected) {
            socket.emit('terminal:resize', {
              cols: xterm.cols,
              rows: xterm.rows,
            })
          }
        }

        window.addEventListener('resize', handleResize)

        // ResizeObserver for panel resizing
        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit()
          if (socket?.connected) {
            socket.emit('terminal:resize', {
              cols: xterm.cols,
              rows: xterm.rows,
            })
          }
        })

        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current)
        }

        return () => {
          window.removeEventListener('resize', handleResize)
          resizeObserver.disconnect()
        }
      } catch (error) {
        console.error('Failed to initialize terminal:', error)
      }
    }

    initTerminal()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('terminal:close')
        socketRef.current.disconnect()
      }
      if (terminalInstance) {
        terminalInstance.dispose()
      }
    }
  }, [currentProject])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-1 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentProject?.name || 'No project'}
        </span>
      </div>
      <div ref={terminalRef} className="flex-1 bg-[#0d1117]" />
    </div>
  )
}
