'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'
import { FileTreeNode } from '@/lib/api'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Plus,
  FolderPlus,
  Trash2,
} from 'lucide-react'

export function FileTree() {
  const { currentProject } = useProjectStore()
  const { fileTree, openFile, createFile, createFolder, deleteFile } = useEditorStore()
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['.']))
  const [showNewFileInput, setShowNewFileInput] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file')

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleFileClick = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      toggleDir(node.path)
    } else {
      openFile(currentProject!.id, node.path)
    }
  }

  const handleNewFile = (parentPath: string, type: 'file' | 'folder') => {
    setShowNewFileInput(parentPath)
    setNewFileType(type)
    setNewFileName('')
  }

  const handleCreateNew = async () => {
    if (!currentProject || !newFileName.trim() || !showNewFileInput) return

    const path =
      showNewFileInput === '.' ? newFileName : `${showNewFileInput}/${newFileName}`

    if (newFileType === 'file') {
      await createFile(currentProject.id, path)
    } else {
      await createFolder(currentProject.id, path)
    }

    setShowNewFileInput(null)
    setNewFileName('')
  }

  const handleDelete = async (path: string) => {
    if (!currentProject) return
    if (confirm(`Delete ${path}?`)) {
      await deleteFile(currentProject.id, path)
    }
  }

  const getFileIcon = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      return expandedDirs.has(node.path) ? (
        <FolderOpen className="w-4 h-4 text-yellow-500" />
      ) : (
        <Folder className="w-4 h-4 text-yellow-500" />
      )
    }

    switch (node.extension) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-500" />
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-yellow-400" />
      case 'json':
        return <FileJson className="w-4 h-4 text-yellow-500" />
      case 'md':
        return <FileText className="w-4 h-4 text-gray-400" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path)
    const isDir = node.type === 'directory'

    return (
      <div key={node.path}>
        <div
          className="file-tree-item group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {isDir && (
            <span className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!isDir && <span className="w-4" />}
          {getFileIcon(node)}
          <span className="truncate flex-1 text-sm">{node.name}</span>

          {/* Actions */}
          <div className="hidden group-hover:flex items-center gap-1">
            {isDir && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNewFile(node.path, 'file')
                  }}
                  className="p-1 rounded hover:bg-background"
                  title="New file"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNewFile(node.path, 'folder')
                  }}
                  className="p-1 rounded hover:bg-background"
                  title="New folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
              </>
            )}
            {node.path !== '.' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(node.path)
                }}
                className="p-1 rounded hover:bg-background text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* New file/folder input */}
        {showNewFileInput === node.path && (
          <div
            className="flex items-center gap-2 py-1"
            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
          >
            {newFileType === 'folder' ? (
              <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew()
                if (e.key === 'Escape') setShowNewFileInput(null)
              }}
              onBlur={() => setShowNewFileInput(null)}
              autoFocus
              className="flex-1 px-2 py-0.5 text-sm bg-background border border-primary rounded focus:outline-none"
              placeholder={newFileType === 'folder' ? 'folder name' : 'filename.ts'}
            />
          </div>
        )}

        {/* Children */}
        {isDir && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  if (!fileTree) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">Loading files...</div>
    )
  }

  return (
    <div className="py-2">
      {/* Root actions */}
      <div className="px-2 pb-2 flex gap-1">
        <button
          onClick={() => handleNewFile('.', 'file')}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New File
        </button>
        <button
          onClick={() => handleNewFile('.', 'folder')}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <FolderPlus className="w-3 h-3" />
          New Folder
        </button>
      </div>

      {/* New file input at root */}
      {showNewFileInput === '.' && (
        <div className="flex items-center gap-2 px-2 py-1">
          {newFileType === 'folder' ? (
            <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
          ) : (
            <File className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateNew()
              if (e.key === 'Escape') setShowNewFileInput(null)
            }}
            onBlur={() => setShowNewFileInput(null)}
            autoFocus
            className="flex-1 px-2 py-0.5 text-sm bg-background border border-primary rounded focus:outline-none"
            placeholder={newFileType === 'folder' ? 'folder name' : 'filename.ts'}
          />
        </div>
      )}

      {/* File tree */}
      {fileTree.children?.map((child) => renderNode(child, 0))}
    </div>
  )
}
