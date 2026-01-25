'use client'

import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { X, Circle } from 'lucide-react'

// Dynamic import for Monaco Editor (client-side only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export function EditorPanel() {
  const { currentProject } = useProjectStore()
  const {
    openFiles,
    activeFile,
    setActiveFile,
    closeFile,
    updateFileContent,
    saveFile,
  } = useEditorStore()

  const activeFileData = openFiles.find((f) => f.path === activeFile)

  const handleSave = useCallback(async () => {
    if (currentProject && activeFile) {
      await saveFile(currentProject.id, activeFile)
    }
  }, [currentProject, activeFile, saveFile])

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    // Add keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave)

    // Configure TypeScript/JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    })
  }, [handleSave])

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No files open</p>
          <p className="text-sm">Select a file from the sidebar to edit</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto shrink-0">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`editor-tab ${activeFile === file.path ? 'active' : ''}`}
            onClick={() => setActiveFile(file.path)}
          >
            {file.isDirty && <Circle className="w-2 h-2 fill-current text-yellow-500" />}
            <span className="truncate max-w-[150px]">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeFile(file.path)
              }}
              className="ml-1 p-0.5 rounded hover:bg-background"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFileData && (
          <MonacoEditor
            height="100%"
            language={activeFileData.language}
            value={activeFileData.content}
            onChange={(value) => updateFileContent(activeFile!, value || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          {activeFileData && (
            <>
              <span>{activeFileData.language}</span>
              <span>{activeFileData.path}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {activeFileData?.isDirty && <span className="text-yellow-500">Modified</span>}
          <span>Ctrl+S to save</span>
        </div>
      </div>
    </div>
  )
}
