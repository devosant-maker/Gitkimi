'use client'

import { useEffect, useRef } from 'react'
import { X, Terminal, Minimize2 } from 'lucide-react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useWorkspace } from '@/lib/store'
import 'xterm/css/xterm.css'

export function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { setShowTerminal } = useWorkspace()

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return

    const term = new XTerm({
      theme: {
        background: '#010409',
        foreground: '#c9d1d9',
        cursor: '#c9d1d9',
        selectionBackground: '#1f6feb',
        black: '#010409',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#e3b341',
        blue: '#79c0ff',
        magenta: '#d2a8ff',
        cyan: '#56d4dd',
        white: '#c9d1d9',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#39c5cf',
        brightWhite: '#ffffff'
      },
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace, "Apple Color Emoji"',
      cursorBlink: true,
      cursorStyle: 'block',
      rows: 12,
      scrollback: 1000,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)

    setTimeout(() => {
      fitAddon.fit()
      fitAddonRef.current = fitAddon
    }, 100)

    term.writeln('\x1b[1;32m╔══════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[1;32m║      Git Workspace Terminal v1.0     ║\x1b[0m')
    term.writeln('\x1b[1;32m╚══════════════════════════════════════╝\x1b[0m')
    term.writeln('\x1b[2mType "help" for available commands\x1b[0m')
    term.writeln('')

    let currentLine = ''
    let commandHistory: string[] = []
    let historyIndex = -1

    const prompt = () => {
      term.write('\r\n\x1b[1;34m$\x1b[0m ')
    }

    term.onData((data) => {
      const code = data.charCodeAt(0)

      if (code === 13) {
        term.writeln('')
        const cmd = currentLine.trim()
        if (cmd) {
          commandHistory.push(cmd)
          historyIndex = commandHistory.length
          handleCommand(cmd, term)
        }
        currentLine = ''
        prompt()
      } else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
      } else if (code === 27) {
        if (data.length === 3 && data[2] === 'A') {
          if (historyIndex > 0) {
            historyIndex--
            currentLine = commandHistory[historyIndex]
            term.write(`\x1b[2K\r\x1b[1;34m$\x1b[0m ${currentLine}`)
          }
        } else if (data.length === 3 && data[2] === 'B') {
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++
            currentLine = commandHistory[historyIndex]
            term.write(`\x1b[2K\r\x1b[1;34m$\x1b[0m ${currentLine}`)
          } else {
            historyIndex = commandHistory.length
            currentLine = ''
            term.write(`\x1b[2K\r\x1b[1;34m$\x1b[0m `)
          }
        }
      } else if (code >= 32 && code !== 27) {
        currentLine += data
        term.write(data)
      }
    })

    prompt()
    terminalRef.current = term

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)
    setTimeout(() => term.focus(), 200)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
      terminalRef.current = null
    }
  }, [])

  const handleCommand = (cmd: string, term: XTerm) => {
    const args = cmd.split(' ').filter(Boolean)
    const command = args[0]?.toLowerCase()

    switch (command) {
      case 'help':
        term.writeln('\x1b[1;36mAvailable commands:\x1b[0m')
        term.writeln('  \x1b[33mhelp\x1b[0m     - Show this help message')
        term.writeln('  \x1b[33mclear\x1b[0m    - Clear terminal')
        term.writeln('  \x1b[33mecho\x1b[0m     - Print text')
        term.writeln('  \x1b[33mpwd\x1b[0m      - Print working directory')
        term.writeln('  \x1b[33mls\x1b[0m       - List files')
        term.writeln('  \x1b[33mdate\x1b[0m     - Show current date')
        term.writeln('  \x1b[33mwhoami\x1b[0m   - Show current user')
        term.writeln('  \x1b[33mnpm\x1b[0m      - Info about npm (not available)')
        term.writeln('  \x1b[33mgit\x1b[0m      - Info about git (use left panel)')
        break
      case 'clear':
        term.clear()
        break
      case 'echo':
        term.writeln(args.slice(1).join(' ') || '')
        break
      case 'pwd':
        term.writeln('\x1b[32m/workspace\x1b[0m')
        break
      case 'ls':
        term.writeln('\x1b[1;33m.\x1b[0m   \x1b[1;33m..\x1b[0m   src/   public/   package.json   README.md')
        break
      case 'date':
        term.writeln(new Date().toString())
        break
      case 'whoami':
        term.writeln('\x1b[32mipad-developer\x1b[0m')
        break
      case 'npm':
        term.writeln('\x1b[33m⚠ npm is not available in browser environment.\x1b[0m')
        term.writeln('\x1b[2mUse the Git panel for repository operations.\x1b[0m')
        break
      case 'git':
        term.writeln('\x1b[33mℹ Use the Source Control panel on the left for Git operations.\x1b[0m')
        break
      case '':
        break
      default:
        term.writeln(`\x1b[31m✖ Command not found: ${command}\x1b[0m`)
        term.writeln(`\x1b[2mType "help" for available commands\x1b[0m`)
    }
  }

  return (
    <div className="flex h-full flex-col bg-workspace-sidebar">
      <div className="flex h-9 items-center justify-between border-b border-workspace-border px-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-workspace-muted" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-workspace-muted">Terminal</span>
        </div>
        <div className="flex gap-0.5">
          <button 
            onClick={() => setShowTerminal(false)} 
            className="touch-min rounded p-1 hover:bg-workspace-hover"
            title="Hide"
          >
            <Minimize2 className="h-3.5 w-3.5 text-workspace-muted" />
          </button>
          <button 
            onClick={() => setShowTerminal(false)} 
            className="touch-min rounded p-1 hover:bg-workspace-hover"
            title="Close"
          >
            <X className="h-3.5 w-3.5 text-workspace-muted" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden p-1" />
    </div>
  )
}