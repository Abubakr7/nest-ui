'use client'

import { useState } from 'react'
import { Terminal } from './Terminal'
import { ApiTester } from '../api-tester/ApiTester'
import { Terminal as TerminalIcon, Send, FileText } from 'lucide-react'

type BottomTab = 'terminal' | 'api-tester' | 'output'

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>('terminal')
  const [output, setOutput] = useState<string[]>([])

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'terminal'
              ? 'bg-secondary text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          Terminal
        </button>
        <button
          onClick={() => setActiveTab('api-tester')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'api-tester'
              ? 'bg-secondary text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send className="w-4 h-4" />
          API Tester
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'output'
              ? 'bg-secondary text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          Output
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && <Terminal />}
        {activeTab === 'api-tester' && <ApiTester />}
        {activeTab === 'output' && (
          <div className="h-full overflow-auto p-4 font-mono text-sm">
            {output.length === 0 ? (
              <p className="text-muted-foreground">No output yet</p>
            ) : (
              output.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
