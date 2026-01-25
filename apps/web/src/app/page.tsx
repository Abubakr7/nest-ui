'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { EditorPanel } from '@/components/editor/EditorPanel'
import { BottomPanel } from '@/components/terminal/BottomPanel'
import { AiChat } from '@/components/ai-chat/AiChat'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import { useProjectStore } from '@/stores/projectStore'
import { WelcomeScreen } from '@/components/WelcomeScreen'

export default function Home() {
  const { currentProject, isLoading, loadProjects } = useProjectStore()
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200)
  const [aiPanelWidth, setAiPanelWidth] = useState(350)
  const [showAiPanel, setShowAiPanel] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  if (!currentProject) {
    return <WelcomeScreen />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-primary">NestJS Studio</h1>
          <ProjectSelector />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="px-3 py-1.5 text-sm rounded bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {showAiPanel ? 'Hide AI' : 'Show AI'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div style={{ width: sidebarWidth }} className="shrink-0 border-r border-border">
          <Sidebar />
        </div>

        {/* Resizer */}
        <div
          className="panel-resizer"
          onMouseDown={(e) => {
            const startX = e.clientX
            const startWidth = sidebarWidth
            const onMouseMove = (e: MouseEvent) => {
              const newWidth = startWidth + (e.clientX - startX)
              setSidebarWidth(Math.max(200, Math.min(500, newWidth)))
            }
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove)
              document.removeEventListener('mouseup', onMouseUp)
            }
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }}
        />

        {/* Center - Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <EditorPanel />
          </div>

          {/* Horizontal Resizer */}
          <div
            className="h-1 bg-border hover:bg-primary cursor-row-resize transition-colors"
            onMouseDown={(e) => {
              const startY = e.clientY
              const startHeight = bottomPanelHeight
              const onMouseMove = (e: MouseEvent) => {
                const newHeight = startHeight - (e.clientY - startY)
                setBottomPanelHeight(Math.max(100, Math.min(400, newHeight)))
              }
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
              }
              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)
            }}
          />

          {/* Bottom Panel (Terminal, API Tester, etc.) */}
          <div style={{ height: bottomPanelHeight }} className="shrink-0 border-t border-border">
            <BottomPanel />
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <>
            <div
              className="panel-resizer"
              onMouseDown={(e) => {
                const startX = e.clientX
                const startWidth = aiPanelWidth
                const onMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth - (e.clientX - startX)
                  setAiPanelWidth(Math.max(300, Math.min(600, newWidth)))
                }
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove)
                  document.removeEventListener('mouseup', onMouseUp)
                }
                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
              }}
            />
            <div style={{ width: aiPanelWidth }} className="shrink-0 border-l border-border">
              <AiChat />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
