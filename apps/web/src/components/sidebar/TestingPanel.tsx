'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { testingApi } from '@/lib/api'
import { TestTube, Play, CheckCircle, XCircle, Clock, BarChart2, RefreshCw } from 'lucide-react'

export function TestingPanel() {
  const { currentProject } = useProjectStore()
  const [tests, setTests] = useState<{ unit: string[]; e2e: string[]; total: number } | null>(null)
  const [results, setResults] = useState<any>(null)
  const [coverage, setCoverage] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')

  const loadTests = async () => {
    if (!currentProject) return
    try {
      const data = await testingApi.discover(currentProject.id)
      setTests(data)
    } catch (error) {
      console.error('Failed to discover tests:', error)
    }
  }

  useEffect(() => {
    loadTests()
  }, [currentProject])

  const handleRunAll = async (withCoverage: boolean = false) => {
    if (!currentProject) return
    setIsRunning(true)
    setOutput('')
    try {
      const result = await testingApi.runAll(currentProject.id, { coverage: withCoverage })
      setResults(result)
      setOutput(result.output)
      if (withCoverage) {
        const cov = await testingApi.getCoverage(currentProject.id)
        setCoverage(cov)
      }
    } catch (error: any) {
      setOutput('Error: ' + error.message)
    }
    setIsRunning(false)
  }

  const handleRunFile = async (file: string) => {
    if (!currentProject) return
    setIsRunning(true)
    setOutput('')
    try {
      const result = await testingApi.runFile(currentProject.id, file)
      setOutput(result.output)
    } catch (error: any) {
      setOutput('Error: ' + error.message)
    }
    setIsRunning(false)
  }

  const handleSetup = async () => {
    if (!currentProject) return
    try {
      const result = await testingApi.setup(currentProject.id)
      alert('Jest setup complete: ' + result.files.join(', '))
      loadTests()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <TestTube className="w-4 h-4 text-primary" />
            Tests
          </h3>
          <button onClick={loadTests} className="p-1 rounded hover:bg-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        {results && (
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle className="w-3 h-3" /> {results.summary.passed}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="w-3 h-3" /> {results.summary.failed}
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <Clock className="w-3 h-3" /> {results.summary.skipped}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 border-b border-border flex gap-2">
        <button
          onClick={() => handleRunAll(false)}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Play className="w-3 h-3" />
          Run All
        </button>
        <button
          onClick={() => handleRunAll(true)}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded bg-secondary disabled:opacity-50"
        >
          <BarChart2 className="w-3 h-3" />
          Coverage
        </button>
      </div>

      {/* Test Files */}
      <div className="flex-1 overflow-auto">
        {tests ? (
          <>
            {tests.unit.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-secondary/50 text-xs font-medium">
                  Unit Tests ({tests.unit.length})
                </div>
                {tests.unit.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between px-3 py-1 text-sm hover:bg-secondary/30 cursor-pointer"
                    onClick={() => handleRunFile(file)}
                  >
                    <span className="truncate text-xs">{file}</span>
                    <Play className="w-3 h-3 opacity-50" />
                  </div>
                ))}
              </div>
            )}

            {tests.e2e.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-secondary/50 text-xs font-medium">
                  E2E Tests ({tests.e2e.length})
                </div>
                {tests.e2e.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between px-3 py-1 text-sm hover:bg-secondary/30 cursor-pointer"
                    onClick={() => handleRunFile(file)}
                  >
                    <span className="truncate text-xs">{file}</span>
                    <Play className="w-3 h-3 opacity-50" />
                  </div>
                ))}
              </div>
            )}

            {tests.total === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No tests found</p>
                <button
                  onClick={handleSetup}
                  className="px-3 py-1 text-xs rounded bg-secondary hover:bg-secondary/80"
                >
                  Setup Jest
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
        )}
      </div>

      {/* Coverage */}
      {coverage && (
        <div className="p-2 border-t border-border">
          <div className="text-xs font-medium mb-2">Coverage</div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <div className="font-bold">{coverage.total.lines.toFixed(0)}%</div>
              <div className="text-muted-foreground">Lines</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{coverage.total.statements.toFixed(0)}%</div>
              <div className="text-muted-foreground">Stmts</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{coverage.total.functions.toFixed(0)}%</div>
              <div className="text-muted-foreground">Funcs</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{coverage.total.branches.toFixed(0)}%</div>
              <div className="text-muted-foreground">Branch</div>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="max-h-32 overflow-auto p-2 border-t border-border bg-black/50 font-mono text-xs whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  )
}
