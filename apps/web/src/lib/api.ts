const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Projects API
export const projectsApi = {
  getAll: () => fetchApi<Project[]>('/api/projects'),
  getOne: (id: string) => fetchApi<Project>(`/api/projects/${id}`),
  create: (data: CreateProjectDto) =>
    fetchApi<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateProjectDto) =>
    fetchApi<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
  install: (id: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${id}/install`, {
      method: 'POST',
    }),
  build: (id: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${id}/build`, {
      method: 'POST',
    }),
  start: (id: string) =>
    fetchApi<{ success: boolean; port: number }>(`/api/projects/${id}/start`, {
      method: 'POST',
    }),
  stop: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${id}/stop`, {
      method: 'POST',
    }),
  getStatus: (id: string) =>
    fetchApi<{ status: string; port?: number }>(`/api/projects/${id}/status`),
}

// Files API
export const filesApi = {
  getTree: (projectId: string) =>
    fetchApi<FileTreeNode>(`/api/projects/${projectId}/files/tree`),
  getContent: (projectId: string, path: string) =>
    fetchApi<{ content: string; language: string }>(
      `/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`
    ),
  create: (projectId: string, data: { path: string; content?: string }) =>
    fetchApi<{ success: boolean; path: string }>(
      `/api/projects/${projectId}/files`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  update: (projectId: string, data: { path: string; content: string }) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/files`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (projectId: string, path: string) =>
    fetchApi<{ success: boolean }>(
      `/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
      }
    ),
  createFolder: (projectId: string, path: string) =>
    fetchApi<{ success: boolean; path: string }>(
      `/api/projects/${projectId}/files/folder`,
      {
        method: 'POST',
        body: JSON.stringify({ path }),
      }
    ),
  search: (projectId: string, query: string, type: 'name' | 'content' = 'name') =>
    fetchApi<{ results: Array<{ path: string; matches?: string[] }> }>(
      `/api/projects/${projectId}/files/search?query=${encodeURIComponent(query)}&type=${type}`
    ),
}

// Generator API
export const generatorApi = {
  generateModule: (projectId: string, data: GenerateModuleDto) =>
    fetchApi<{ files: string[] }>(
      `/api/projects/${projectId}/generate/module`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  generateController: (projectId: string, data: { name: string; path?: string }) =>
    fetchApi<{ path: string }>(
      `/api/projects/${projectId}/generate/controller`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  generateService: (projectId: string, data: { name: string; path?: string }) =>
    fetchApi<{ path: string }>(
      `/api/projects/${projectId}/generate/service`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  generateDto: (
    projectId: string,
    data: { name: string; moduleName: string; fields?: Array<{ name: string; type: string }> }
  ) =>
    fetchApi<{ path: string }>(`/api/projects/${projectId}/generate/dto`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateCrud: (
    projectId: string,
    data: { entityName: string; fields?: Array<{ name: string; type: string }> }
  ) =>
    fetchApi<{ files: string[] }>(`/api/projects/${projectId}/generate/crud`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateGuard: (projectId: string, data: { name: string }) =>
    fetchApi<{ path: string }>(`/api/projects/${projectId}/generate/guard`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generatePipe: (projectId: string, data: { name: string }) =>
    fetchApi<{ path: string }>(`/api/projects/${projectId}/generate/pipe`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateMiddleware: (projectId: string, data: { name: string }) =>
    fetchApi<{ path: string }>(
      `/api/projects/${projectId}/generate/middleware`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  generateInterceptor: (projectId: string, data: { name: string }) =>
    fetchApi<{ path: string }>(
      `/api/projects/${projectId}/generate/interceptor`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
}

// AI API
export const aiApi = {
  generate: (data: { description: string; type?: string; context?: string }) =>
    fetchApi<{ code: string; explanation: string }>('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  explain: (data: { code: string; language?: string }) =>
    fetchApi<{ explanation: string }>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  refactor: (data: { code: string; instructions?: string }) =>
    fetchApi<{ refactoredCode: string; changes: string[] }>('/api/ai/refactor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateTest: (data: { code: string }) =>
    fetchApi<{ testCode: string }>('/api/ai/generate-test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  fixError: (data: { code: string; error: string; stackTrace?: string }) =>
    fetchApi<{ fixedCode: string; explanation: string }>('/api/ai/fix-error', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  chat: (data: {
    message: string
    history?: Array<{ role: string; content: string }>
    projectContext?: string
  }) =>
    fetchApi<{ response: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateModule: (data: {
    description: string
    moduleName: string
    features: string[]
  }) =>
    fetchApi<{ files: Array<{ path: string; content: string }> }>(
      '/api/ai/generate-module',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  generateApi: (data: {
    entityName: string
    fields: Array<{ name: string; type: string }>
  }) =>
    fetchApi<{ files: Array<{ path: string; content: string }> }>(
      '/api/ai/generate-api',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
}

// API Tester
export const apiTesterApi = {
  sendRequest: (data: {
    url: string
    method: string
    headers?: Array<{ key: string; value: string; enabled?: boolean }>
    params?: Array<{ key: string; value: string; enabled?: boolean }>
    body?: any
    bodyType?: string
  }) =>
    fetchApi<{
      status: number
      statusText: string
      headers: Record<string, string>
      body: any
      time: number
      size: number
    }>('/api/api-tester/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHistory: () => fetchApi<any[]>('/api/api-tester/history'),
  clearHistory: () =>
    fetchApi<{ success: boolean }>('/api/api-tester/history', {
      method: 'DELETE',
    }),
  getCollections: () => fetchApi<any[]>('/api/api-tester/collections'),
  createCollection: (data: { name: string; description?: string }) =>
    fetchApi<any>('/api/api-tester/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Types
export interface Project {
  id: string
  name: string
  description: string
  path: string
  createdAt: string
  updatedAt: string
  status: 'running' | 'stopped' | 'building'
  config: {
    database?: string
    authentication?: string
    swagger?: boolean
    websockets?: boolean
  }
}

export interface CreateProjectDto {
  name: string
  description?: string
  database?: string
  authentication?: string
  swagger?: boolean
  websockets?: boolean
}

export interface UpdateProjectDto {
  name?: string
  description?: string
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
  children?: FileTreeNode[]
}

export interface GenerateModuleDto {
  name: string
  path?: string
  generateController?: boolean
  generateService?: boolean
}

// Git API
export const gitApi = {
  init: (projectId: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/init`, {
      method: 'POST',
    }),
  status: (projectId: string) =>
    fetchApi<{
      branch: string
      ahead: number
      behind: number
      staged: Array<{ file: string; status: string }>
      unstaged: Array<{ file: string; status: string }>
      untracked: string[]
    }>(`/api/projects/${projectId}/git/status`),
  log: (projectId: string, limit: number = 50) =>
    fetchApi<Array<{
      hash: string
      shortHash: string
      message: string
      author: string
      date: string
    }>>(`/api/projects/${projectId}/git/log?limit=${limit}`),
  branches: (projectId: string) =>
    fetchApi<{ current: string; local: string[]; remote: string[] }>(
      `/api/projects/${projectId}/git/branches`
    ),
  checkout: (projectId: string, branch: string, create: boolean = false) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/checkout`, {
      method: 'POST',
      body: JSON.stringify({ branch, create }),
    }),
  diff: (projectId: string, staged: boolean = false) =>
    fetchApi<string>(`/api/projects/${projectId}/git/diff?staged=${staged}`),
  add: (projectId: string, files: string[]) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/add`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    }),
  commit: (projectId: string, message: string) =>
    fetchApi<{ success: boolean; hash: string }>(`/api/projects/${projectId}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  push: (projectId: string, remote?: string, branch?: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/push`, {
      method: 'POST',
      body: JSON.stringify({ remote, branch }),
    }),
  pull: (projectId: string, remote?: string, branch?: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/pull`, {
      method: 'POST',
      body: JSON.stringify({ remote, branch }),
    }),
  discard: (projectId: string, files: string[]) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/git/discard`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    }),
}

// Dependencies API
export const dependenciesApi = {
  getAll: (projectId: string) =>
    fetchApi<{
      dependencies: Array<{ name: string; version: string }>
      devDependencies: Array<{ name: string; version: string }>
    }>(`/api/projects/${projectId}/dependencies`),
  getOutdated: (projectId: string) =>
    fetchApi<Array<{ name: string; current: string; wanted: string; latest: string }>>(
      `/api/projects/${projectId}/dependencies/outdated`
    ),
  audit: (projectId: string) =>
    fetchApi<{
      vulnerabilities: { total: number; critical: number; high: number; moderate: number; low: number }
      advisories: Array<{ id: number; title: string; severity: string; module: string }>
    }>(`/api/projects/${projectId}/dependencies/audit`),
  search: (query: string) =>
    fetchApi<Array<{ name: string; version: string; description: string; downloads: number }>>(
      `/api/projects/any/dependencies/search?q=${encodeURIComponent(query)}`
    ),
  install: (projectId: string, packages: string[], dev: boolean = false) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/dependencies/install`, {
      method: 'POST',
      body: JSON.stringify({ packages, dev }),
    }),
  uninstall: (projectId: string, packages: string[]) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/dependencies/uninstall`, {
      method: 'DELETE',
      body: JSON.stringify({ packages }),
    }),
  getScripts: (projectId: string) =>
    fetchApi<Record<string, string>>(`/api/projects/${projectId}/dependencies/scripts`),
  runScript: (projectId: string, script: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/dependencies/scripts/run`, {
      method: 'POST',
      body: JSON.stringify({ script }),
    }),
}

// Testing API
export const testingApi = {
  discover: (projectId: string) =>
    fetchApi<{ unit: string[]; e2e: string[]; total: number }>(
      `/api/projects/${projectId}/testing/discover`
    ),
  runAll: (projectId: string, options?: { coverage?: boolean }) =>
    fetchApi<{
      success: boolean
      summary: { passed: number; failed: number; skipped: number; total: number }
      output: string
    }>(`/api/projects/${projectId}/testing/run`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),
  runFile: (projectId: string, file: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/testing/run/file`, {
      method: 'POST',
      body: JSON.stringify({ file }),
    }),
  getCoverage: (projectId: string) =>
    fetchApi<{
      total: { lines: number; statements: number; functions: number; branches: number }
      files: Array<{ file: string; lines: number; statements: number; functions: number; branches: number }>
    }>(`/api/projects/${projectId}/testing/coverage`),
  setup: (projectId: string) =>
    fetchApi<{ success: boolean; files: string[] }>(`/api/projects/${projectId}/testing/setup`, {
      method: 'POST',
    }),
}

// Docker API
export const dockerApi = {
  generate: (projectId: string, config: { nodeVersion?: string; port?: number; database?: string; redis?: boolean }) =>
    fetchApi<{ files: string[] }>(`/api/projects/${projectId}/docker/generate`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  getStatus: (projectId: string) =>
    fetchApi<{ hasDockerfile: boolean; hasCompose: boolean; containers: Array<{ name: string; status: string }> }>(
      `/api/projects/${projectId}/docker/status`
    ),
  build: (projectId: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/docker/build`, {
      method: 'POST',
    }),
  up: (projectId: string, detach: boolean = true) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/docker/up`, {
      method: 'POST',
      body: JSON.stringify({ detach }),
    }),
  down: (projectId: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/docker/down`, {
      method: 'POST',
    }),
  logs: (projectId: string) =>
    fetchApi<{ logs: string }>(`/api/projects/${projectId}/docker/logs`),
}

// Environment API
export const envApi = {
  getFiles: (projectId: string) =>
    fetchApi<string[]>(`/api/projects/${projectId}/env`),
  getVariables: (projectId: string, envName: string) =>
    fetchApi<Record<string, string>>(`/api/projects/${projectId}/env/${envName}`),
  createFile: (projectId: string, envName: string, variables: Record<string, string>) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/env/${envName}`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    }),
  updateFile: (projectId: string, envName: string, variables: Record<string, string>) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/env/${envName}`, {
      method: 'PUT',
      body: JSON.stringify({ variables }),
    }),
  deleteFile: (projectId: string, envName: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${projectId}/env/${envName}`, {
      method: 'DELETE',
    }),
  validate: (projectId: string, envName: string) =>
    fetchApi<{ valid: boolean; missing: string[]; extra: string[] }>(
      `/api/projects/${projectId}/env/validate/${envName}`
    ),
}

// Linting API
export const lintingApi = {
  setup: (projectId: string) =>
    fetchApi<{ success: boolean; files: string[] }>(`/api/projects/${projectId}/linting/setup`, {
      method: 'POST',
    }),
  getStatus: (projectId: string) =>
    fetchApi<{ eslint: boolean; prettier: boolean; eslintConfig: string | null; prettierConfig: string | null }>(
      `/api/projects/${projectId}/linting/status`
    ),
  lint: (projectId: string, fix: boolean = false) =>
    fetchApi<{
      success: boolean
      totalErrors: number
      totalWarnings: number
      results: Array<{ file: string; errors: number; warnings: number; messages: any[] }>
    }>(`/api/projects/${projectId}/linting/lint`, {
      method: 'POST',
      body: JSON.stringify({ fix }),
    }),
  format: (projectId: string) =>
    fetchApi<{ success: boolean; output: string }>(`/api/projects/${projectId}/linting/format`, {
      method: 'POST',
    }),
}

// CI/CD API
export const cicdApi = {
  generate: (projectId: string, config: { provider: string; deploy?: string; docker?: boolean }) =>
    fetchApi<{ files: string[] }>(`/api/projects/${projectId}/cicd/generate`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  getStatus: (projectId: string) =>
    fetchApi<{ github: boolean; gitlab: boolean; jenkins: boolean }>(
      `/api/projects/${projectId}/cicd/status`
    ),
  getTemplates: () =>
    fetchApi<Array<{ id: string; name: string; description: string }>>('/api/projects/any/cicd/templates'),
}

// Documentation API
export const docsApi = {
  generateReadme: (projectId: string) =>
    fetchApi<{ content: string; path: string }>(`/api/projects/${projectId}/docs/readme`, {
      method: 'POST',
    }),
  generateApiDocs: (projectId: string) =>
    fetchApi<{ content: string; path: string }>(`/api/projects/${projectId}/docs/api`, {
      method: 'POST',
    }),
  generateModuleDocs: (projectId: string, moduleName: string) =>
    fetchApi<{ content: string; path: string }>(`/api/projects/${projectId}/docs/module/${moduleName}`, {
      method: 'POST',
    }),
  generateChangelog: (projectId: string) =>
    fetchApi<{ content: string; path: string }>(`/api/projects/${projectId}/docs/changelog`, {
      method: 'POST',
    }),
  getDocTree: (projectId: string) =>
    fetchApi<Array<{ name: string; path: string; type: string }>>(`/api/projects/${projectId}/docs/tree`),
}

// Snippets API
export const snippetsApi = {
  getAll: (category?: string) =>
    fetchApi<Array<{ id: string; name: string; description: string; category: string; prefix: string; body: string }>>(
      `/api/snippets${category ? `?category=${category}` : ''}`
    ),
  getCategories: () => fetchApi<string[]>('/api/snippets/categories'),
  getBuiltIn: () =>
    fetchApi<Array<{ id: string; name: string; description: string; category: string; prefix: string; body: string }>>(
      '/api/snippets/built-in'
    ),
  create: (snippet: { name: string; description?: string; category: string; prefix: string; body: string }) =>
    fetchApi<any>('/api/snippets', {
      method: 'POST',
      body: JSON.stringify(snippet),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/snippets/${id}`, {
      method: 'DELETE',
    }),
  getProjectTemplates: () =>
    fetchApi<Array<{ id: string; name: string; description: string; features: string[] }>>(
      '/api/snippets/templates/project'
    ),
  getModuleTemplates: () =>
    fetchApi<Array<{ id: string; name: string; description: string; files: string[] }>>(
      '/api/snippets/templates/module'
    ),
}
