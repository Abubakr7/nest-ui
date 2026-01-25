'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { ChevronDown, Check, Trash2, ExternalLink } from 'lucide-react'

export function ProjectSelector() {
  const { projects, currentProject, selectProject, deleteProject } = useProjectStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <span className="text-sm font-medium truncate max-w-[200px]">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-border rounded-md shadow-lg z-20">
            <div className="p-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Switch Project</span>
            </div>
            <div className="max-h-64 overflow-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    selectProject(project.id)
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-secondary transition-colors ${
                    currentProject?.id === project.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {currentProject?.id === project.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.status === 'running' ? (
                          <span className="text-green-500">Running</span>
                        ) : (
                          <span>Stopped</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {project.status === 'running' && (
                      <a
                        href={`http://localhost:${3000 + projects.indexOf(project) + 1}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                        title="Open in browser"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="p-1 rounded hover:bg-background text-red-500"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No projects yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
