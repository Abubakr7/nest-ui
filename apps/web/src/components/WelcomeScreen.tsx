'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { FolderPlus, Rocket, Code2, Database, Shield, FileJson, Zap } from 'lucide-react'

export function WelcomeScreen() {
  const { projects, createProject, selectProject, isLoading } = useProjectStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    database: 'none',
    authentication: 'none',
    swagger: true,
    websockets: false,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      await createProject(formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        database: 'none',
        authentication: 'none',
        swagger: true,
        websockets: false,
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code2 className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">NestJS Development Studio</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Build NestJS projects entirely through UI - no IDE required
          </p>
        </div>

        {showCreateForm ? (
          /* Create Project Form */
          <div className="bg-secondary/50 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="my-awesome-api"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-primary focus:outline-none"
                  placeholder="A brief description of your project"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Database className="w-4 h-4 inline mr-2" />
                    Database
                  </label>
                  <select
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Authentication
                  </label>
                  <select
                    value={formData.authentication}
                    onChange={(e) => setFormData({ ...formData, authentication: e.target.value })}
                    className="w-full px-4 py-2 rounded-md bg-background border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="jwt">JWT</option>
                    <option value="session">Session</option>
                    <option value="oauth">OAuth</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.swagger}
                    onChange={(e) => setFormData({ ...formData, swagger: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <FileJson className="w-4 h-4" />
                  <span>Swagger API Docs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.websockets}
                    onChange={(e) => setFormData({ ...formData, websockets: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <Zap className="w-4 h-4" />
                  <span>WebSockets</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Project Selection / Create */
          <div className="space-y-8">
            {/* Create New Project Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full p-6 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-secondary/30 transition-all flex items-center justify-center gap-4"
            >
              <FolderPlus className="w-8 h-8 text-primary" />
              <div className="text-left">
                <h3 className="text-xl font-semibold">Create New Project</h3>
                <p className="text-muted-foreground">Start a new NestJS project from scratch</p>
              </div>
            </button>

            {/* Existing Projects */}
            {projects.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => selectProject(project.id)}
                      className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left flex items-center gap-4"
                    >
                      <Rocket className="w-6 h-6 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <Code2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Code Editor</h4>
                <p className="text-sm text-muted-foreground">Monaco Editor with IntelliSense</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">AI Assistant</h4>
                <p className="text-sm text-muted-foreground">Claude AI integration</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 text-center">
                <FileJson className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">API Tester</h4>
                <p className="text-sm text-muted-foreground">Built-in API testing</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
