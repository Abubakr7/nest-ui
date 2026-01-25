'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { FileTree } from './FileTree'
import { GeneratorPanel } from './GeneratorPanel'
import {
  FolderTree,
  Plus,
  Wrench,
  FileCode,
  Play,
  Square,
  Download,
  Hammer,
  RefreshCw,
} from 'lucide-react'

type SidebarTab = 'files' | 'generator'

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files')
  const { currentProject, startProject, stopProject, installDependencies, buildProject } =
    useProjectStore()
  const { loadFileTree, refreshFileTree } = useEditorStore()
  const [isRunning, setIsRunning] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject) {
      loadFileTree(currentProject.id)
      setIsRunning(currentProject.status === 'running')
    }
  }, [currentProject, loadFileTree])

  const handleStart = async () => {
    if (!currentProject) return
    setActionLoading('start')
    try {
      await startProject()
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to start project:', error)
    }
    setActionLoading(null)
  }

  const handleStop = async () => {
    if (!currentProject) return
    setActionLoading('stop')
    try {
      await stopProject()
      setIsRunning(false)
    } catch (error) {
      console.error('Failed to stop project:', error)
    }
    setActionLoading(null)
  }

  const handleInstall = async () => {
    if (!currentProject) return
    setActionLoading('install')
    try {
      await installDependencies()
    } catch (error) {
      console.error('Failed to install dependencies:', error)
    }
    setActionLoading(null)
  }

  const handleBuild = async () => {
    if (!currentProject) return
    setActionLoading('build')
    try {
      await buildProject()
    } catch (error) {
      console.error('Failed to build project:', error)
    }
    setActionLoading(null)
  }

  const handleRefresh = async () => {
    if (!currentProject) return
    await refreshFileTree(currentProject.id)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'files'
              ? 'bg-secondary text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${
            activeTab === 'generator'
              ? 'bg-secondary text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Generate
        </button>
      </div>

      {/* Project Actions */}
      <div className="p-2 border-b border-border shrink-0">
        <div className="flex gap-1">
          <button
            onClick={handleRefresh}
            className="p-2 rounded hover:bg-secondary transition-colors"
            title="Refresh files"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleInstall}
            disabled={actionLoading === 'install'}
            className="p-2 rounded hover:bg-secondary transition-colors disabled:opacity-50"
            title="Install dependencies"
          >
            <Download className={`w-4 h-4 ${actionLoading === 'install' ? 'animate-bounce' : ''}`} />
          </button>
          <button
            onClick={handleBuild}
            disabled={actionLoading === 'build'}
            className="p-2 rounded hover:bg-secondary transition-colors disabled:opacity-50"
            title="Build project"
          >
            <Hammer className={`w-4 h-4 ${actionLoading === 'build' ? 'animate-pulse' : ''}`} />
          </button>
          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={actionLoading === 'stop'}
              className="p-2 rounded hover:bg-secondary transition-colors text-red-500 disabled:opacity-50"
              title="Stop project"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={actionLoading === 'start'}
              className="p-2 rounded hover:bg-secondary transition-colors text-green-500 disabled:opacity-50"
              title="Start project"
            >
              <Play className={`w-4 h-4 ${actionLoading === 'start' ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'files' && <FileTree />}
        {activeTab === 'generator' && <GeneratorPanel />}
      </div>
    </div>
  )
}
