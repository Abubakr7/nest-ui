'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { gitApi } from '@/lib/api'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Plus,
  Minus,
  RotateCcw,
  Upload,
  Download,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'

export function GitPanel() {
  const { currentProject } = useProjectStore()
  const [status, setStatus] = useState<any>(null)
  const [commitMessage, setCommitMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [log, setLog] = useState<any[]>([])
  const [showLog, setShowLog] = useState(false)

  const loadStatus = async () => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      const [statusData, logData] = await Promise.all([
        gitApi.status(currentProject.id),
        gitApi.log(currentProject.id, 10),
      ])
      setStatus(statusData)
      setLog(logData)
    } catch (error) {
      console.error('Failed to load git status:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadStatus()
  }, [currentProject])

  const handleStageAll = async () => {
    if (!currentProject) return
    await gitApi.add(currentProject.id, [])
    loadStatus()
  }

  const handleUnstageAll = async () => {
    if (!currentProject || !status) return
    const files = status.staged.map((f: any) => f.file)
    // Reset staged files
    loadStatus()
  }

  const handleCommit = async () => {
    if (!currentProject || !commitMessage.trim()) return
    setIsLoading(true)
    try {
      await gitApi.commit(currentProject.id, commitMessage)
      setCommitMessage('')
      loadStatus()
    } catch (error) {
      console.error('Failed to commit:', error)
    }
    setIsLoading(false)
  }

  const handlePush = async () => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      await gitApi.push(currentProject.id)
      loadStatus()
    } catch (error) {
      console.error('Failed to push:', error)
    }
    setIsLoading(false)
  }

  const handlePull = async () => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      await gitApi.pull(currentProject.id)
      loadStatus()
    } catch (error) {
      console.error('Failed to pull:', error)
    }
    setIsLoading(false)
  }

  const handleDiscard = async (file: string) => {
    if (!currentProject) return
    if (confirm(`Discard changes in ${file}?`)) {
      await gitApi.discard(currentProject.id, [file])
      loadStatus()
    }
  }

  if (!status) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        {isLoading ? 'Loading...' : 'No git repository'}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{status.branch || 'main'}</span>
          {status.ahead > 0 && (
            <span className="text-xs text-green-500">+{status.ahead}</span>
          )}
          {status.behind > 0 && (
            <span className="text-xs text-yellow-500">-{status.behind}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={loadStatus} className="p-1 rounded hover:bg-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handlePull} className="p-1 rounded hover:bg-secondary" title="Pull">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handlePush} className="p-1 rounded hover:bg-secondary" title="Push">
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-auto">
        {/* Staged Changes */}
        {status.staged.length > 0 && (
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
              <span className="text-xs font-medium">Staged Changes ({status.staged.length})</span>
              <button onClick={handleUnstageAll} className="text-xs text-muted-foreground hover:text-foreground">
                Unstage All
              </button>
            </div>
            {status.staged.map((file: any) => (
              <div key={file.file} className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-secondary/30">
                <span className="text-green-500 text-xs">{file.status[0].toUpperCase()}</span>
                <span className="truncate flex-1">{file.file}</span>
              </div>
            ))}
          </div>
        )}

        {/* Unstaged Changes */}
        {status.unstaged.length > 0 && (
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
              <span className="text-xs font-medium">Changes ({status.unstaged.length})</span>
              <button onClick={handleStageAll} className="text-xs text-muted-foreground hover:text-foreground">
                Stage All
              </button>
            </div>
            {status.unstaged.map((file: any) => (
              <div key={file.file} className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-secondary/30 group">
                <span className="text-yellow-500 text-xs">{file.status[0].toUpperCase()}</span>
                <span className="truncate flex-1">{file.file}</span>
                <button
                  onClick={() => handleDiscard(file.file)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background text-red-500"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Untracked Files */}
        {status.untracked.length > 0 && (
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
              <span className="text-xs font-medium">Untracked ({status.untracked.length})</span>
            </div>
            {status.untracked.map((file: string) => (
              <div key={file} className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-secondary/30">
                <span className="text-gray-500 text-xs">U</span>
                <span className="truncate flex-1">{file}</span>
              </div>
            ))}
          </div>
        )}

        {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No changes
          </div>
        )}
      </div>

      {/* Commit Input */}
      <div className="p-3 border-t border-border space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message"
          className="w-full px-3 py-2 text-sm rounded bg-background border border-border focus:border-primary focus:outline-none resize-none"
          rows={2}
        />
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || status.staged.length === 0 || isLoading}
          className="w-full py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
        >
          <GitCommit className="w-4 h-4 inline mr-2" />
          Commit
        </button>
      </div>

      {/* Recent Commits */}
      {showLog && log.length > 0 && (
        <div className="border-t border-border max-h-40 overflow-auto">
          <div className="px-3 py-2 bg-secondary/50 text-xs font-medium">Recent Commits</div>
          {log.map((commit) => (
            <div key={commit.hash} className="px-3 py-1 text-xs hover:bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono">{commit.shortHash}</span>
                <span className="truncate">{commit.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowLog(!showLog)}
        className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground border-t border-border"
      >
        {showLog ? 'Hide' : 'Show'} History
      </button>
    </div>
  )
}
