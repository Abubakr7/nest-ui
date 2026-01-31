'use client'

import { useState } from 'react'
import { ModuleConfig, EntityConfig, FieldConfig, RelationConfig } from '@/app/page'
import {
  Plus, Trash2, Database, Edit2, Check, X, ChevronDown, ChevronRight,
  Hash, Type, Calendar, ToggleLeft, FileJson, Key, Link, List
} from 'lucide-react'

interface EntityDesignerProps {
  modules: ModuleConfig[]
  onChange: (modules: ModuleConfig[]) => void
  database: string
  orm: string
}

const fieldTypes = [
  { type: 'string', label: 'String', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'json', label: 'JSON', icon: FileJson },
  { type: 'uuid', label: 'UUID', icon: Key },
  { type: 'enum', label: 'Enum', icon: List },
]

const relationTypes = [
  { type: 'one-to-one', label: 'One to One' },
  { type: 'one-to-many', label: 'One to Many' },
  { type: 'many-to-one', label: 'Many to One' },
  { type: 'many-to-many', label: 'Many to Many' },
]

export function EntityDesigner({ modules, onChange, database, orm }: EntityDesignerProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    modules[0]?.id || null
  )
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [newEntityName, setNewEntityName] = useState('')
  const [addingFieldTo, setAddingFieldTo] = useState<string | null>(null)
  const [newField, setNewField] = useState<Partial<FieldConfig>>({
    name: '',
    type: 'string',
    isRequired: true,
    isUnique: false,
    isArray: false
  })

  const selectedModule = modules.find(m => m.id === selectedModuleId)

  const updateModule = (moduleId: string, updates: Partial<ModuleConfig>) => {
    onChange(modules.map(m => m.id === moduleId ? { ...m, ...updates } : m))
  }

  const addEntity = (moduleId: string) => {
    if (!newEntityName.trim()) return
    const entityName = newEntityName.charAt(0).toUpperCase() + newEntityName.slice(1).toLowerCase()
    const module = modules.find(m => m.id === moduleId)
    if (!module || module.entities.some(e => e.name === entityName)) return

    const newEntity: EntityConfig = {
      id: crypto.randomUUID(),
      name: entityName,
      fields: [
        { id: crypto.randomUUID(), name: 'id', type: 'uuid', isRequired: true, isUnique: true, isArray: false },
        { id: crypto.randomUUID(), name: 'createdAt', type: 'date', isRequired: true, isUnique: false, isArray: false },
        { id: crypto.randomUUID(), name: 'updatedAt', type: 'date', isRequired: true, isUnique: false, isArray: false },
      ],
      relations: []
    }

    updateModule(moduleId, { entities: [...module.entities, newEntity] })
    setNewEntityName('')
    setExpandedEntities(new Set([...Array.from(expandedEntities), newEntity.id]))
  }

  const removeEntity = (moduleId: string, entityId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return
    updateModule(moduleId, { entities: module.entities.filter(e => e.id !== entityId) })
  }

  const addField = (moduleId: string, entityId: string) => {
    if (!newField.name?.trim()) return
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const updatedEntities = module.entities.map(e => {
      if (e.id !== entityId) return e
      const field: FieldConfig = {
        id: crypto.randomUUID(),
        name: newField.name!.toLowerCase().replace(/[^a-z0-9]/g, ''),
        type: (newField.type || 'string') as FieldConfig['type'],
        isRequired: newField.isRequired ?? true,
        isUnique: newField.isUnique ?? false,
        isArray: newField.isArray ?? false,
        enumValues: newField.enumValues
      }
      return { ...e, fields: [...e.fields, field] }
    })

    updateModule(moduleId, { entities: updatedEntities })
    setNewField({ name: '', type: 'string', isRequired: true, isUnique: false, isArray: false })
    setAddingFieldTo(null)
  }

  const removeField = (moduleId: string, entityId: string, fieldId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const updatedEntities = module.entities.map(e => {
      if (e.id !== entityId) return e
      return { ...e, fields: e.fields.filter(f => f.id !== fieldId) }
    })

    updateModule(moduleId, { entities: updatedEntities })
  }

  const toggleExpanded = (entityId: string) => {
    const newExpanded = new Set(expandedEntities)
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId)
    } else {
      newExpanded.add(entityId)
    }
    setExpandedEntities(newExpanded)
  }

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(f => f.type === type)
    return fieldType?.icon || Type
  }

  // Get all entities across all modules for relations
  const allEntities = modules.flatMap(m => m.entities.map(e => ({ ...e, moduleName: m.name })))

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Entity Designer</h2>
        <p className="text-slate-400 mb-8">Define data models for your modules</p>

        <div className="flex gap-6">
          {/* Module Selector */}
          <div className="w-64 shrink-0">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Modules</h3>
            <div className="space-y-1">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedModuleId === module.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{module.name}</div>
                  <div className="text-xs opacity-70">{module.entities.length} entities</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entity Editor */}
          <div className="flex-1">
            {selectedModule ? (
              <>
                {/* Add Entity */}
                <div className="mb-6 p-4 rounded-xl border border-slate-700 bg-slate-900/30">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newEntityName}
                      onChange={(e) => setNewEntityName(e.target.value)}
                      placeholder="EntityName (e.g., User, Product)"
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => addEntity(selectedModule.id)}
                      disabled={!newEntityName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Entity
                    </button>
                  </div>
                </div>

                {/* Entity List */}
                {selectedModule.entities.length === 0 ? (
                  <div className="p-12 rounded-xl border-2 border-dashed border-slate-700 text-center">
                    <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-2">No entities in {selectedModule.name}</p>
                    <p className="text-sm text-slate-500">Add your first entity above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedModule.entities.map(entity => {
                      const isExpanded = expandedEntities.has(entity.id)
                      return (
                        <div
                          key={entity.id}
                          className="rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden"
                        >
                          {/* Entity Header */}
                          <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                            onClick={() => toggleExpanded(entity.id)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                <Database className="w-4 h-4 text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{entity.name}</h4>
                                <p className="text-xs text-slate-400">{entity.fields.length} fields</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeEntity(selectedModule.id, entity.id)
                              }}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Entity Fields */}
                          {isExpanded && (
                            <div className="border-t border-slate-700 p-4">
                              <div className="space-y-2">
                                {entity.fields.map(field => {
                                  const FieldIcon = getFieldIcon(field.type)
                                  return (
                                    <div
                                      key={field.id}
                                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FieldIcon className="w-4 h-4 text-slate-400" />
                                        <span className="font-mono text-sm text-white">{field.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                          {field.type}
                                          {field.isArray && '[]'}
                                        </span>
                                        {field.isRequired && (
                                          <span className="text-xs text-red-400">required</span>
                                        )}
                                        {field.isUnique && (
                                          <span className="text-xs text-yellow-400">unique</span>
                                        )}
                                      </div>
                                      {!['id', 'createdAt', 'updatedAt'].includes(field.name) && (
                                        <button
                                          onClick={() => removeField(selectedModule.id, entity.id, field.id)}
                                          className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}

                                {/* Add Field Form */}
                                {addingFieldTo === entity.id ? (
                                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-3">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newField.name || ''}
                                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                        placeholder="fieldName"
                                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                                        autoFocus
                                      />
                                      <select
                                        value={newField.type || 'string'}
                                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                                        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                                      >
                                        {fieldTypes.map(ft => (
                                          <option key={ft.type} value={ft.type}>{ft.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={newField.isRequired ?? true}
                                          onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                                          className="rounded bg-slate-700 border-slate-600"
                                        />
                                        Required
                                      </label>
                                      <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={newField.isUnique ?? false}
                                          onChange={(e) => setNewField({ ...newField, isUnique: e.target.checked })}
                                          className="rounded bg-slate-700 border-slate-600"
                                        />
                                        Unique
                                      </label>
                                      <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={newField.isArray ?? false}
                                          onChange={(e) => setNewField({ ...newField, isArray: e.target.checked })}
                                          className="rounded bg-slate-700 border-slate-600"
                                        />
                                        Array
                                      </label>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setAddingFieldTo(null)}
                                        className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => addField(selectedModule.id, entity.id)}
                                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
                                      >
                                        Add Field
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAddingFieldTo(entity.id)}
                                    className="w-full p-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 text-sm flex items-center justify-center gap-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Field
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400">Select a module to design its entities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
