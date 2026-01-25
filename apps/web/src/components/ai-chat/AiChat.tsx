'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { aiApi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import {
  Send,
  Code,
  FileCode,
  TestTube,
  Wrench,
  Bug,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type AiAction = 'chat' | 'generate' | 'explain' | 'test' | 'refactor' | 'fix'

export function AiChat() {
  const { currentProject } = useProjectStore()
  const { openFiles, activeFile } = useEditorStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AiAction>('chat')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeFileData = openFiles.find((f) => f.path === activeFile)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const actions: Array<{ type: AiAction; icon: React.ReactNode; label: string }> = [
    { type: 'chat', icon: <Sparkles className="w-4 h-4" />, label: 'Chat' },
    { type: 'generate', icon: <Code className="w-4 h-4" />, label: 'Generate' },
    { type: 'explain', icon: <FileCode className="w-4 h-4" />, label: 'Explain' },
    { type: 'test', icon: <TestTube className="w-4 h-4" />, label: 'Test' },
    { type: 'refactor', icon: <Wrench className="w-4 h-4" />, label: 'Refactor' },
    { type: 'fix', icon: <Bug className="w-4 h-4" />, label: 'Fix Error' },
  ]

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let response: string

      switch (selectedAction) {
        case 'generate':
          const genResult = await aiApi.generate({
            description: input,
            context: activeFileData?.content,
          })
          response = `**Generated Code:**\n\`\`\`typescript\n${genResult.code}\n\`\`\`\n\n**Explanation:**\n${genResult.explanation}`
          break

        case 'explain':
          if (!activeFileData) {
            response = 'Please open a file first to explain its code.'
          } else {
            const explainResult = await aiApi.explain({
              code: activeFileData.content,
              language: activeFileData.language,
            })
            response = explainResult.explanation
          }
          break

        case 'test':
          if (!activeFileData) {
            response = 'Please open a file first to generate tests.'
          } else {
            const testResult = await aiApi.generateTest({
              code: activeFileData.content,
            })
            response = `**Generated Tests:**\n\`\`\`typescript\n${testResult.testCode}\n\`\`\``
          }
          break

        case 'refactor':
          if (!activeFileData) {
            response = 'Please open a file first to refactor.'
          } else {
            const refactorResult = await aiApi.refactor({
              code: activeFileData.content,
              instructions: input,
            })
            response = `**Refactored Code:**\n\`\`\`typescript\n${refactorResult.refactoredCode}\n\`\`\`\n\n**Changes:**\n${refactorResult.changes.map((c) => `- ${c}`).join('\n')}`
          }
          break

        case 'fix':
          if (!activeFileData) {
            response = 'Please open a file first to fix errors.'
          } else {
            const fixResult = await aiApi.fixError({
              code: activeFileData.content,
              error: input,
            })
            response = `**Fixed Code:**\n\`\`\`typescript\n${fixResult.fixedCode}\n\`\`\`\n\n**Explanation:**\n${fixResult.explanation}`
          }
          break

        default:
          const chatResult = await aiApi.chat({
            message: input,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            projectContext: currentProject?.name,
          })
          response = chatResult.response
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks: Array<{ lang: string; code: string }> = []
    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({ lang: match[1] || 'text', code: match[2] })
    }
    return blocks
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Claude AI helps you write better NestJS code
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border shrink-0">
        {actions.map((action) => (
          <button
            key={action.type}
            onClick={() => setSelectedAction(action.type)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              selectedAction === action.type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Active File Indicator */}
      {activeFileData && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border shrink-0">
          Working with: <span className="text-primary">{activeFileData.name}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start a conversation with AI</p>
            <p className="text-xs mt-1">
              Select an action above or just chat about your project
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'ml-8 bg-primary/20 rounded-lg p-3'
                : 'mr-8 bg-secondary rounded-lg p-3'
            }`}
          >
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match && !className

                    if (isInline) {
                      return (
                        <code className="bg-background px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      )
                    }

                    const codeContent = String(children).replace(/\n$/, '')

                    return (
                      <div className="relative group">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyCode(codeContent, message.id)}
                            className="p-1 rounded bg-background/50 hover:bg-background"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <pre className="bg-background p-3 rounded overflow-x-auto">
                          <code className={`text-xs ${className}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              selectedAction === 'chat'
                ? 'Ask anything about NestJS...'
                : selectedAction === 'generate'
                ? 'Describe what you want to generate...'
                : selectedAction === 'fix'
                ? 'Paste the error message...'
                : `${selectedAction} the current file...`
            }
            className="flex-1 px-3 py-2 text-sm rounded bg-background border border-border focus:border-primary focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
