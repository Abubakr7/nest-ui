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
