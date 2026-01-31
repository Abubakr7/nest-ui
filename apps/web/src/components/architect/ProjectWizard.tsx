'use client'

import { ProjectConfig } from '@/app/page'
import {
  Server,
  Database,
  Shield,
  Zap,
  GitBranch,
  Container,
  Radio,
  Layers,
  FileJson,
  Globe
} from 'lucide-react'

interface ProjectWizardProps {
  config: ProjectConfig
  onChange: (config: ProjectConfig) => void
}

export function ProjectWizard({ config, onChange }: ProjectWizardProps) {
  const updateConfig = (updates: Partial<ProjectConfig>) => {
    onChange({ ...config, ...updates })
  }

  const updateFeatures = (key: keyof ProjectConfig['features'], value: boolean) => {
    onChange({
      ...config,
      features: { ...config.features, [key]: value }
    })
  }

  // Auto-select ORM based on database
  const handleDatabaseChange = (database: ProjectConfig['database']) => {
    let orm: ProjectConfig['orm'] = 'typeorm'
    if (database === 'mongodb') {
      orm = 'mongoose'
    }
    onChange({ ...config, database, orm })
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Project Configuration</h2>
        <p className="text-slate-400 mb-8">Configure your NestJS project settings</p>

        {/* Project Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="my-awesome-api"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="A powerful REST API built with NestJS"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* API Type */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            API Type
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => updateConfig({ apiType: 'rest' })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                config.apiType === 'rest'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  config.apiType === 'rest' ? 'bg-blue-500' : 'bg-slate-700'
                }`}>
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">REST API</h3>
                  <p className="text-xs text-slate-400">With Swagger/OpenAPI</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Classic REST endpoints with automatic Swagger documentation
              </p>
            </button>

            <button
              type="button"
              onClick={() => updateConfig({ apiType: 'graphql' })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                config.apiType === 'graphql'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  config.apiType === 'graphql' ? 'bg-purple-500' : 'bg-slate-700'
                }`}>
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">GraphQL</h3>
                  <p className="text-xs text-slate-400">Apollo Server</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Flexible queries with GraphQL Playground
              </p>
            </button>
          </div>
        </div>

        {/* Database */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Database
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'postgresql', name: 'PostgreSQL', icon: '🐘' },
              { id: 'mongodb', name: 'MongoDB', icon: '🍃' },
              { id: 'mysql', name: 'MySQL', icon: '🐬' },
              { id: 'sqlite', name: 'SQLite', icon: '📁' },
              { id: 'none', name: 'None', icon: '❌' },
            ].map((db) => (
              <button
                key={db.id}
                type="button"
                onClick={() => handleDatabaseChange(db.id as ProjectConfig['database'])}
                className={`p-3 rounded-xl border-2 transition-all ${
                  config.database === db.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-2xl mb-1">{db.icon}</div>
                <div className="text-sm font-medium text-white">{db.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ORM Selection (if SQL database) */}
        {config.database !== 'mongodb' && config.database !== 'none' && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              ORM
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateConfig({ orm: 'typeorm' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  config.orm === 'typeorm'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config.orm === 'typeorm' ? 'bg-orange-500' : 'bg-slate-700'
                  }`}>
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">TypeORM</h3>
                    <p className="text-xs text-slate-400">Decorator-based, migrations</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ orm: 'prisma' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  config.orm === 'prisma'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config.orm === 'prisma' ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}>
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Prisma</h3>
                    <p className="text-xs text-slate-400">Schema-first, type-safe</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Authentication */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Authentication
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'jwt', name: 'JWT', icon: Shield, desc: 'Token-based' },
              { id: 'oauth', name: 'OAuth 2.0', icon: Globe, desc: 'Social login' },
              { id: 'session', name: 'Session', icon: FileJson, desc: 'Cookie-based' },
              { id: 'none', name: 'None', icon: Zap, desc: 'No auth' },
            ].map((auth) => {
              const Icon = auth.icon
              return (
                <button
                  key={auth.id}
                  type="button"
                  onClick={() => updateConfig({ auth: auth.id as ProjectConfig['auth'] })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    config.auth === auth.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${
                    config.auth === auth.id ? 'text-cyan-400' : 'text-slate-400'
                  }`} />
                  <div className="text-sm font-medium text-white">{auth.name}</div>
                  <div className="text-xs text-slate-500">{auth.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Additional Features */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Additional Features
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'swagger', name: 'Swagger', icon: FileJson, desc: 'API docs' },
              { key: 'websockets', name: 'WebSockets', icon: Radio, desc: 'Real-time' },
              { key: 'caching', name: 'Caching', icon: Zap, desc: 'Redis cache' },
              { key: 'queue', name: 'Queue', icon: Layers, desc: 'Bull MQ' },
              { key: 'docker', name: 'Docker', icon: Container, desc: 'Containerized' },
              { key: 'cicd', name: 'CI/CD', icon: GitBranch, desc: 'GitHub Actions' },
            ].map((feature) => {
              const Icon = feature.icon
              const isEnabled = config.features[feature.key as keyof ProjectConfig['features']]
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => updateFeatures(feature.key as keyof ProjectConfig['features'], !isEnabled)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isEnabled
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${
                    isEnabled ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                  <div className="text-sm font-medium text-white">{feature.name}</div>
                  <div className="text-xs text-slate-500">{feature.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
