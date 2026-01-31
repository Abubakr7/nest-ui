'use client'

import { useState } from 'react'
import { ProjectWizard } from '@/components/architect/ProjectWizard'
import { ModuleDesigner } from '@/components/architect/ModuleDesigner'
import { EntityDesigner } from '@/components/architect/EntityDesigner'
import { ProjectPreview } from '@/components/architect/ProjectPreview'
import {
  Layers,
  Database,
  Box,
  Eye,
  Download,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react'

export interface ProjectConfig {
  name: string
  description: string
  apiType: 'rest' | 'graphql'
  database: 'postgresql' | 'mongodb' | 'mysql' | 'sqlite' | 'none'
  orm: 'typeorm' | 'prisma' | 'mongoose'
  auth: 'jwt' | 'oauth' | 'session' | 'none'
  features: {
    swagger: boolean
    websockets: boolean
    caching: boolean
    queue: boolean
    microservices: boolean
    docker: boolean
    cicd: boolean
  }
}

export interface ModuleConfig {
  id: string
  name: string
  description: string
  generateCrud: boolean
  entities: EntityConfig[]
}

export interface EntityConfig {
  id: string
  name: string
  fields: FieldConfig[]
  relations: RelationConfig[]
}

export interface FieldConfig {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'uuid' | 'enum'
  isRequired: boolean
  isUnique: boolean
  isArray: boolean
  defaultValue?: string
  enumValues?: string[]
}

export interface RelationConfig {
  id: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  targetEntity: string
  fieldName: string
}

const steps = [
  { id: 'config', title: 'Project Setup', icon: Sparkles, description: 'Basic configuration' },
  { id: 'modules', title: 'Modules', icon: Box, description: 'Design your modules' },
  { id: 'entities', title: 'Entities', icon: Database, description: 'Define data models' },
  { id: 'preview', title: 'Preview & Export', icon: Eye, description: 'Review and download' },
]

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
    name: '',
    description: '',
    apiType: 'rest',
    database: 'postgresql',
    orm: 'typeorm',
    auth: 'jwt',
    features: {
      swagger: true,
      websockets: false,
      caching: false,
      queue: false,
      microservices: false,
      docker: true,
      cicd: true,
    },
  })
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return projectConfig.name.length >= 3
      case 1:
        return modules.length > 0
      case 2:
        return modules.some(m => m.entities.length > 0)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('http://localhost:4000/api/architect/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: projectConfig, modules }),
      })
      const data = await response.json()
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NestJS Architect</h1>
                <p className="text-xs text-slate-400">Visual Project Designer</p>
              </div>
            </div>

            {/* Step indicators */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Step indicator */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = steps[currentStep].icon
                return <Icon className="w-5 h-5 text-blue-400" />
              })()}
              <div>
                <p className="text-white font-medium">{steps[currentStep].title}</p>
                <p className="text-xs text-slate-400">{steps[currentStep].description}</p>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {currentStep + 1} / {steps.length}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 min-h-[600px]">
          {currentStep === 0 && (
            <ProjectWizard
              config={projectConfig}
              onChange={setProjectConfig}
            />
          )}

          {currentStep === 1 && (
            <ModuleDesigner
              modules={modules}
              onChange={setModules}
              database={projectConfig.database}
            />
          )}

          {currentStep === 2 && (
            <EntityDesigner
              modules={modules}
              onChange={setModules}
              database={projectConfig.database}
              orm={projectConfig.orm}
            />
          )}

          {currentStep === 3 && (
            <ProjectPreview
              config={projectConfig}
              modules={modules}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Project
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
