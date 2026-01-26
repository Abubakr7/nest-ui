'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { FileTree } from './FileTree'
import { GeneratorPanel } from './GeneratorPanel'
import { GitPanel } from './GitPanel'
import { DependenciesPanel } from './DependenciesPanel'
import { TestingPanel } from './TestingPanel'
import { DockerPanel } from './DockerPanel'
import { EnvironmentPanel } from './EnvironmentPanel'
import { LintingPanel } from './LintingPanel'
import { CicdPanel } from './CicdPanel'
import { DocumentationPanel } from './DocumentationPanel'
import { SnippetsPanel } from './SnippetsPanel'
import {
  FolderTree,
  Wrench,
  Play,
  Square,
  Download,
  Hammer,
  RefreshCw,
  GitBranch,
  Package,
  TestTube,
  Container,
  Key,
  CheckCircle,
  Workflow,
  FileText,
  Code,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type SidebarTab =
  | 'files'
  | 'generator'
  | 'git'
  | 'dependencies'
  | 'testing'
  | 'docker'
  | 'environment'
  | 'linting'
  | 'cicd'
  | 'documentation'
  | 'snippets'

interface TabConfig {
  id: SidebarTab
  label: string
  icon: React.ReactNode
  shortLabel: string
}

const tabs: TabConfig[] = [
  { id: 'files', label: 'Files', shortLabel: 'Files', icon: <FolderTree className="w-4 h-4" /> },
  { id: 'generator', label: 'Generator', shortLabel: 'Gen', icon: <Wrench className="w-4 h-4" /> },
  { id: 'git', label: 'Git', shortLabel: 'Git', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'dependencies', label: 'Dependencies', shortLabel: 'Deps', icon: <Package className="w-4 h-4" /> },
  { id: 'testing', label: 'Testing', shortLabel: 'Test', icon: <TestTube className="w-4 h-4" /> },
  { id: 'docker', label: 'Docker', shortLabel: 'Docker', icon: <Container className="w-4 h-4" /> },
  { id: 'environment', label: 'Environment', shortLabel: 'Env', icon: <Key className="w-4 h-4" /> },
  { id: 'linting', label: 'Code Quality', shortLabel: 'Lint', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'cicd', label: 'CI/CD', shortLabel: 'CI/CD', icon: <Workflow className="w-4 h-4" /> },
  { id: 'documentation', label: 'Documentation', shortLabel: 'Docs', icon: <FileText className="w-4 h-4" /> },
  { id: 'snippets', label: 'Snippets', shortLabel: 'Snip', icon: <Code className="w-4 h-4" /> },
]

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files')
  const [tabPage, setTabPage] = useState(0)
  const { currentProject, startProject, stopProject, installDependencies, buildProject } =
    useProjectStore()
  const { loadFileTree, refreshFileTree } = useEditorStore()
  const [isRunning, setIsRunning] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const tabsPerPage = 6
  const totalPages = Math.ceil(tabs.length / tabsPerPage)
  const visibleTabs = tabs.slice(tabPage * tabsPerPage, (tabPage + 1) * tabsPerPage)

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

  const projectPath = currentProject?.path || ''

  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return <FileTree />
      case 'generator':
        return <GeneratorPanel />
      case 'git':
        return <GitPanel projectPath={projectPath} />
      case 'dependencies':
        return <DependenciesPanel projectPath={projectPath} />
      case 'testing':
        return <TestingPanel projectPath={projectPath} />
      case 'docker':
        return <DockerPanel projectPath={projectPath} />
      case 'environment':
        return <EnvironmentPanel projectPath={projectPath} />
      case 'linting':
        return <LintingPanel projectPath={projectPath} />
      case 'cicd':
        return <CicdPanel projectPath={projectPath} />
      case 'documentation':
        return <DocumentationPanel projectPath={projectPath} />
      case 'snippets':
        return <SnippetsPanel projectPath={projectPath} />
      default:
        return <FileTree />
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab Navigation with Pagination */}
      <div className="border-b border-border shrink-0">
        <div className="flex items-center">
          {tabPage > 0 && (
            <button
              onClick={() => setTabPage(tabPage - 1)}
              className="p-1 hover:bg-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 flex overflow-hidden">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors min-w-0 ${
                  activeTab === tab.id
                    ? 'bg-secondary text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                title={tab.label}
              >
                {tab.icon}
                <span className="truncate w-full text-center">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
          {tabPage < totalPages - 1 && (
            <button
              onClick={() => setTabPage(tabPage + 1)}
              className="p-1 hover:bg-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Page indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 py-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setTabPage(i)}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === tabPage ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
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
        {renderContent()}
      </div>
    </div>
  )
}
