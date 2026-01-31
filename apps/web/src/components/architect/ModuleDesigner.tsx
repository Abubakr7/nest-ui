'use client'

import { useState } from 'react'
import { ModuleConfig, EntityConfig } from '@/app/page'
import { Plus, Trash2, Box, Edit2, Check, X, Copy, GripVertical } from 'lucide-react'

interface ModuleDesignerProps {
  modules: ModuleConfig[]
  onChange: (modules: ModuleConfig[]) => void
  database: string
}

const moduleTemplates = [
  { name: 'users', description: 'User management module', icon: '👤' },
  { name: 'auth', description: 'Authentication module', icon: '🔐' },
  { name: 'products', description: 'Product catalog module', icon: '📦' },
  { name: 'orders', description: 'Order management module', icon: '🛒' },
  { name: 'payments', description: 'Payment processing module', icon: '💳' },
  { name: 'notifications', description: 'Notification system module', icon: '🔔' },
  { name: 'files', description: 'File upload/storage module', icon: '📁' },
  { name: 'analytics', description: 'Analytics and reporting module', icon: '📊' },
]

export function ModuleDesigner({ modules, onChange, database }: ModuleDesignerProps) {
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleDesc, setNewModuleDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const addModule = (name: string, description: string = '') => {
    if (!name.trim()) return
    const moduleName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (modules.some(m => m.name === moduleName)) return

    const newModule: ModuleConfig = {
      id: crypto.randomUUID(),
      name: moduleName,
      description: description || `${moduleName} module`,
      generateCrud: true,
      entities: []
    }
    onChange([...modules, newModule])
    setNewModuleName('')
    setNewModuleDesc('')
  }

  const removeModule = (id: string) => {
    onChange(modules.filter(m => m.id !== id))
  }

  const startEditing = (module: ModuleConfig) => {
    setEditingId(module.id)
    setEditName(module.name)
    setEditDesc(module.description)
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    onChange(modules.map(m =>
      m.id === editingId
        ? { ...m, name: editName.toLowerCase().replace(/[^a-z0-9]/g, ''), description: editDesc }
        : m
    ))
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
  }

  const toggleCrud = (id: string) => {
    onChange(modules.map(m =>
      m.id === id ? { ...m, generateCrud: !m.generateCrud } : m
    ))
  }

  const addFromTemplate = (template: typeof moduleTemplates[0]) => {
    addModule(template.name, template.description)
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Module Designer</h2>
        <p className="text-slate-400 mb-8">Design your application modules</p>

        {/* Quick Add Templates */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Add Templates</h3>
          <div className="flex flex-wrap gap-2">
            {moduleTemplates.map((template) => {
              const exists = modules.some(m => m.name === template.name)
              return (
                <button
                  key={template.name}
                  onClick={() => !exists && addFromTemplate(template)}
                  disabled={exists}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    exists
                      ? 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed'
                      : 'border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300'
                  }`}
                >
                  <span>{template.icon}</span>
                  <span className="text-sm">{template.name}</span>
                  {exists && <Check className="w-3 h-3 text-green-500" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Module */}
        <div className="mb-8 p-4 rounded-xl border border-slate-700 bg-slate-900/30">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Add Custom Module</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="module-name"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newModuleDesc}
              onChange={(e) => setNewModuleDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => addModule(newModuleName, newModuleDesc)}
              disabled={!newModuleName.trim() || modules.some(m => m.name === newModuleName)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Your Modules ({modules.length})
          </h3>

          {modules.length === 0 ? (
            <div className="p-12 rounded-xl border-2 border-dashed border-slate-700 text-center">
              <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No modules yet</p>
              <p className="text-sm text-slate-500">
                Add modules from templates above or create custom ones
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  className="p-4 rounded-xl border border-slate-700 bg-slate-900/30 hover:border-slate-600 transition-all"
                >
                  {editingId === module.id ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={saveEdit}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <Box className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{module.name}</h4>
                          <p className="text-xs text-slate-400">{module.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* CRUD Toggle */}
                        <button
                          onClick={() => toggleCrud(module.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            module.generateCrud
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          CRUD {module.generateCrud ? 'ON' : 'OFF'}
                        </button>

                        {/* Entity count badge */}
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-xs text-slate-400">
                          {module.entities.length} entities
                        </span>

                        {/* Actions */}
                        <button
                          onClick={() => startEditing(module)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeModule(module.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        {modules.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>Next step:</strong> Define entities for each module. Entities are your data models
              (like User, Product, Order) with their fields and relationships.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
