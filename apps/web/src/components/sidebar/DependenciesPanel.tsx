'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { dependenciesApi } from '@/lib/api'
import { Package, Search, Plus, Trash2, AlertTriangle, RefreshCw, Play } from 'lucide-react'

interface DependenciesPanelProps {
  projectPath: string;
}

export function DependenciesPanel({ projectPath }: DependenciesPanelProps) {
  const { currentProject } = useProjectStore()
  const [deps, setDeps] = useState<any>(null)
  const [outdated, setOutdated] = useState<any[]>([])
  const [audit, setAudit] = useState<any>(null)
  const [scripts, setScripts] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [installPackage, setInstallPackage] = useState('')
  const [isDev, setIsDev] = useState(false)
  const [activeTab, setActiveTab] = useState<'deps' | 'scripts' | 'audit'>('deps')

  const loadData = async () => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      const [depsData, outdatedData, auditData, scriptsData] = await Promise.all([
        dependenciesApi.getAll(currentProject.id),
        dependenciesApi.getOutdated(currentProject.id),
        dependenciesApi.audit(currentProject.id),
        dependenciesApi.getScripts(currentProject.id),
      ])
      setDeps(depsData)
      setOutdated(outdatedData)
      setAudit(auditData)
      setScripts(scriptsData)
    } catch (error) {
      console.error('Failed to load dependencies:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [currentProject])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsLoading(true)
    try {
      const results = await dependenciesApi.search(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search:', error)
    }
    setIsLoading(false)
  }

  const handleInstall = async (packageName?: string) => {
    if (!currentProject) return
    const pkg = packageName || installPackage
    if (!pkg.trim()) return

    setIsLoading(true)
    try {
      await dependenciesApi.install(currentProject.id, [pkg], isDev)
      setInstallPackage('')
      setSearchResults([])
      loadData()
    } catch (error) {
      console.error('Failed to install:', error)
    }
    setIsLoading(false)
  }

  const handleUninstall = async (packageName: string) => {
    if (!currentProject) return
    if (!confirm(`Uninstall ${packageName}?`)) return

    setIsLoading(true)
    try {
      await dependenciesApi.uninstall(currentProject.id, [packageName])
      loadData()
    } catch (error) {
      console.error('Failed to uninstall:', error)
    }
    setIsLoading(false)
  }

  const handleRunScript = async (script: string) => {
    if (!currentProject) return
    setIsLoading(true)
    try {
      const result = await dependenciesApi.runScript(currentProject.id, script)
      alert(result.output)
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['deps', 'scripts', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-xs capitalize ${
              activeTab === tab
                ? 'bg-secondary text-foreground border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
          >
            {tab === 'deps' ? 'Packages' : tab}
            {tab === 'audit' && audit?.vulnerabilities?.total > 0 && (
              <span className="ml-1 text-red-500">({audit.vulnerabilities.total})</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'deps' && (
        <>
          {/* Install Input */}
          <div className="p-2 border-b border-border space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={installPackage}
                onChange={(e) => setInstallPackage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
                placeholder="Package name"
                className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleInstall()}
                disabled={isLoading}
                className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isDev}
                onChange={(e) => setIsDev(e.target.checked)}
              />
              Dev dependency
            </label>
          </div>

          {/* Dependencies List */}
          <div className="flex-1 overflow-auto">
            {deps && (
              <>
                <div className="px-2 py-1 bg-secondary/50 text-xs font-medium">
                  Dependencies ({deps.dependencies.length})
                </div>
                {deps.dependencies.map((dep: any) => {
                  const isOutdated = outdated.find((o) => o.name === dep.name)
                  return (
                    <div
                      key={dep.name}
                      className="flex items-center justify-between px-2 py-1 text-sm hover:bg-secondary/30 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{dep.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{dep.version}</span>
                        {isOutdated && (
                          <span className="text-xs text-yellow-500" title={`Latest: ${isOutdated.latest}`}>
                            !
                          </span>
                        )}
                        <button
                          onClick={() => handleUninstall(dep.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className="px-2 py-1 bg-secondary/50 text-xs font-medium mt-2">
                  Dev Dependencies ({deps.devDependencies.length})
                </div>
                {deps.devDependencies.map((dep: any) => (
                  <div
                    key={dep.name}
                    className="flex items-center justify-between px-2 py-1 text-sm hover:bg-secondary/30 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{dep.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dep.version}</span>
                      <button
                        onClick={() => handleUninstall(dep.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'scripts' && (
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {Object.entries(scripts).map(([name, command]) => (
            <div
              key={name}
              className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium">{name}</div>
                <div className="text-xs text-muted-foreground truncate">{command}</div>
              </div>
              <button
                onClick={() => handleRunScript(name)}
                disabled={isLoading}
                className="p-1 text-green-500 hover:bg-secondary rounded"
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audit' && audit && (
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 bg-red-500/20 rounded text-center">
              <div className="text-lg font-bold">{audit.vulnerabilities.critical}</div>
              <div className="text-xs">Critical</div>
            </div>
            <div className="p-2 bg-orange-500/20 rounded text-center">
              <div className="text-lg font-bold">{audit.vulnerabilities.high}</div>
              <div className="text-xs">High</div>
            </div>
            <div className="p-2 bg-yellow-500/20 rounded text-center">
              <div className="text-lg font-bold">{audit.vulnerabilities.moderate}</div>
              <div className="text-xs">Moderate</div>
            </div>
            <div className="p-2 bg-blue-500/20 rounded text-center">
              <div className="text-lg font-bold">{audit.vulnerabilities.low}</div>
              <div className="text-xs">Low</div>
            </div>
          </div>

          {audit.advisories?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Advisories</div>
              {audit.advisories.map((adv: any) => (
                <div key={adv.id} className="p-2 bg-secondary/30 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{adv.module}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{adv.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={loadData}
        className="p-2 border-t border-border text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
      >
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  )
}
