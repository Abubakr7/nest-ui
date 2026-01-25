'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { generatorApi } from '@/lib/api'
import {
  Box,
  Server,
  FileCode,
  FileJson,
  Shield,
  Filter,
  Layers,
  ArrowRightLeft,
  Database,
} from 'lucide-react'

type GeneratorType =
  | 'module'
  | 'controller'
  | 'service'
  | 'dto'
  | 'guard'
  | 'pipe'
  | 'middleware'
  | 'interceptor'
  | 'crud'

const generators: Array<{
  type: GeneratorType
  label: string
  icon: React.ReactNode
  description: string
}> = [
  { type: 'crud', label: 'CRUD Module', icon: <Database className="w-4 h-4" />, description: 'Full CRUD with entity' },
  { type: 'module', label: 'Module', icon: <Box className="w-4 h-4" />, description: 'NestJS module' },
  { type: 'controller', label: 'Controller', icon: <Server className="w-4 h-4" />, description: 'REST controller' },
  { type: 'service', label: 'Service', icon: <FileCode className="w-4 h-4" />, description: 'Business logic' },
  { type: 'dto', label: 'DTO', icon: <FileJson className="w-4 h-4" />, description: 'Data transfer object' },
  { type: 'guard', label: 'Guard', icon: <Shield className="w-4 h-4" />, description: 'Auth guard' },
  { type: 'pipe', label: 'Pipe', icon: <Filter className="w-4 h-4" />, description: 'Transform/validate' },
  { type: 'middleware', label: 'Middleware', icon: <Layers className="w-4 h-4" />, description: 'Request middleware' },
  { type: 'interceptor', label: 'Interceptor', icon: <ArrowRightLeft className="w-4 h-4" />, description: 'Intercept requests' },
]

export function GeneratorPanel() {
  const { currentProject } = useProjectStore()
  const { refreshFileTree } = useEditorStore()
  const [selectedType, setSelectedType] = useState<GeneratorType | null>(null)
  const [name, setName] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [fields, setFields] = useState<Array<{ name: string; type: string }>>([
    { name: '', type: 'string' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleAddField = () => {
    setFields([...fields, { name: '', type: 'string' }])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = (index: number, key: 'name' | 'type', value: string) => {
    const newFields = [...fields]
    newFields[index][key] = value
    setFields(newFields)
  }

  const handleGenerate = async () => {
    if (!currentProject || !selectedType || !name.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      let response: { files?: string[]; path?: string }

      switch (selectedType) {
        case 'module':
          response = await generatorApi.generateModule(currentProject.id, { name })
          break
        case 'controller':
          response = await generatorApi.generateController(currentProject.id, { name })
          break
        case 'service':
          response = await generatorApi.generateService(currentProject.id, { name })
          break
        case 'dto':
          response = await generatorApi.generateDto(currentProject.id, {
            name,
            moduleName: moduleName || name,
            fields: fields.filter((f) => f.name.trim()),
          })
          break
        case 'guard':
          response = await generatorApi.generateGuard(currentProject.id, { name })
          break
        case 'pipe':
          response = await generatorApi.generatePipe(currentProject.id, { name })
          break
        case 'middleware':
          response = await generatorApi.generateMiddleware(currentProject.id, { name })
          break
        case 'interceptor':
          response = await generatorApi.generateInterceptor(currentProject.id, { name })
          break
        case 'crud':
          response = await generatorApi.generateCrud(currentProject.id, {
            entityName: name,
            fields: fields.filter((f) => f.name.trim()),
          })
          break
      }

      const files = response.files || (response.path ? [response.path] : [])
      setResult(`Generated: ${files.join(', ')}`)

      // Refresh file tree
      await refreshFileTree(currentProject.id)

      // Reset form
      setName('')
      setModuleName('')
      setFields([{ name: '', type: 'string' }])
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    }

    setIsLoading(false)
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Generate NestJS Components</h3>

      {/* Generator Type Selection */}
      <div className="grid grid-cols-3 gap-2">
        {generators.map((gen) => (
          <button
            key={gen.type}
            onClick={() => setSelectedType(gen.type)}
            className={`p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors ${
              selectedType === gen.type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
            title={gen.description}
          >
            {gen.icon}
            <span>{gen.label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      {selectedType && (
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium mb-1">
              {selectedType === 'crud' ? 'Entity Name' : 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded bg-background border border-border focus:border-primary focus:outline-none"
              placeholder={selectedType === 'crud' ? 'User' : 'users'}
            />
          </div>

          {selectedType === 'dto' && (
            <div>
              <label className="block text-xs font-medium mb-1">Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded bg-background border border-border focus:border-primary focus:outline-none"
                placeholder="users"
              />
            </div>
          )}

          {/* Fields for CRUD and DTO */}
          {(selectedType === 'crud' || selectedType === 'dto') && (
            <div>
              <label className="block text-xs font-medium mb-1">Fields</label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded bg-background border border-border focus:border-primary focus:outline-none"
                      placeholder="fieldName"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                      className="px-2 py-1 text-xs rounded bg-background border border-border focus:border-primary focus:outline-none"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="Date">Date</option>
                      <option value="string[]">string[]</option>
                      <option value="number[]">number[]</option>
                    </select>
                    {fields.length > 1 && (
                      <button
                        onClick={() => handleRemoveField(index)}
                        className="px-2 text-red-500 hover:bg-secondary rounded"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddField}
                  className="w-full py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  + Add Field
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !name.trim()}
            className="w-full py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>

          {result && (
            <div
              className={`p-2 rounded text-xs ${
                result.startsWith('Error')
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
