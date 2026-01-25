'use client'

import { useState } from 'react'
import { apiTesterApi } from '@/lib/api'
import { Send, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'text-green-500',
  POST: 'text-yellow-500',
  PUT: 'text-blue-500',
  PATCH: 'text-purple-500',
  DELETE: 'text-red-500',
}

export function ApiTester() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('http://localhost:3001')
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ])
  const [params, setParams] = useState<KeyValuePair[]>([])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<{
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    time: number
    size: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')

  const handleSend = async () => {
    setIsLoading(true)
    setResponse(null)

    try {
      const result = await apiTesterApi.sendRequest({
        url,
        method,
        headers: headers.filter((h) => h.enabled && h.key),
        params: params.filter((p) => p.enabled && p.key),
        body: body ? JSON.parse(body) : undefined,
        bodyType: 'json',
      })
      setResponse(result)
    } catch (error: any) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: { error: error.message },
        time: 0,
        size: 0,
      })
    }

    setIsLoading(false)
  }

  const addKeyValue = (
    list: KeyValuePair[],
    setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => {
    setList([...list, { key: '', value: '', enabled: true }])
  }

  const updateKeyValue = (
    list: KeyValuePair[],
    setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    const newList = [...list]
    newList[index] = { ...newList[index], [field]: value }
    setList(newList)
  }

  const removeKeyValue = (
    list: KeyValuePair[],
    setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index))
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500'
    if (status >= 300 && status < 400) return 'text-yellow-500'
    if (status >= 400) return 'text-red-500'
    return 'text-gray-500'
  }

  return (
    <div className="h-full flex">
      {/* Request Panel */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* URL Bar */}
        <div className="flex items-center gap-2 p-2 border-b border-border">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className={`px-2 py-1.5 rounded bg-secondary font-medium text-sm ${methodColors[method]}`}
          >
            {Object.keys(methodColors).map((m) => (
              <option key={m} value={m} className="text-foreground">
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded bg-background border border-border focus:border-primary focus:outline-none"
            placeholder="Enter URL"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Request Tabs */}
        <div className="flex border-b border-border">
          {(['params', 'headers', 'body'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'params' && params.length > 0 && (
                <span className="ml-1 text-xs text-primary">({params.length})</span>
              )}
              {tab === 'headers' && headers.length > 0 && (
                <span className="ml-1 text-xs text-primary">({headers.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'params' && (
            <KeyValueEditor
              items={params}
              setItems={setParams}
              placeholder={{ key: 'Parameter', value: 'Value' }}
            />
          )}
          {activeTab === 'headers' && (
            <KeyValueEditor
              items={headers}
              setItems={setHeaders}
              placeholder={{ key: 'Header', value: 'Value' }}
            />
          )}
          {activeTab === 'body' && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-full p-2 text-sm font-mono bg-background border border-border rounded focus:border-primary focus:outline-none resize-none"
              placeholder='{ "key": "value" }'
            />
          )}
        </div>
      </div>

      {/* Response Panel */}
      <div className="flex-1 flex flex-col">
        {response ? (
          <>
            {/* Response Status */}
            <div className="flex items-center gap-4 p-2 border-b border-border">
              <span className={`font-medium ${getStatusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-sm text-muted-foreground">{response.time}ms</span>
              <span className="text-sm text-muted-foreground">
                {(response.size / 1024).toFixed(2)} KB
              </span>
            </div>

            {/* Response Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setResponseTab('body')}
                className={`px-4 py-2 text-sm transition-colors ${
                  responseTab === 'body'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setResponseTab('headers')}
                className={`px-4 py-2 text-sm transition-colors ${
                  responseTab === 'headers'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Headers ({Object.keys(response.headers).length})
              </button>
            </div>

            {/* Response Content */}
            <div className="flex-1 overflow-auto p-2">
              {responseTab === 'body' && (
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {typeof response.body === 'object'
                    ? JSON.stringify(response.body, null, 2)
                    : response.body}
                </pre>
              )}
              {responseTab === 'headers' && (
                <div className="space-y-1">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex text-sm">
                      <span className="text-primary font-medium min-w-[200px]">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Send a request to see the response</p>
          </div>
        )}
      </div>
    </div>
  )
}

function KeyValueEditor({
  items,
  setItems,
  placeholder,
}: {
  items: KeyValuePair[]
  setItems: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  placeholder: { key: string; value: string }
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index].enabled = e.target.checked
              setItems(newItems)
            }}
            className="w-4 h-4"
          />
          <input
            type="text"
            value={item.key}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index].key = e.target.value
              setItems(newItems)
            }}
            className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary focus:outline-none"
            placeholder={placeholder.key}
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index].value = e.target.value
              setItems(newItems)
            }}
            className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary focus:outline-none"
            placeholder={placeholder.value}
          />
          <button
            onClick={() => setItems(items.filter((_, i) => i !== index))}
            className="p-1 text-red-500 hover:bg-secondary rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => setItems([...items, { key: '', value: '', enabled: true }])}
        className="flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-4 h-4" />
        Add
      </button>
    </div>
  )
}
