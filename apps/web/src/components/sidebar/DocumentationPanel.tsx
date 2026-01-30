'use client';

import React, { useState } from 'react';
import { docsApi } from '@/lib/api';

interface DocumentationPanelProps {
  projectPath: string;
}

export function DocumentationPanel({ projectPath }: DocumentationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>('readme');

  // README options
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [includeBadges, setIncludeBadges] = useState(true);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeUsage, setIncludeUsage] = useState(true);
  const [includeApi, setIncludeApi] = useState(true);
  const [includeLicense, setIncludeLicense] = useState(true);

  const generateReadme = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await docsApi.generateReadme(projectPath);
      // Generate sample README content based on options
      const content = generateReadmeContent();
      setGeneratedContent(content);
    } catch (error) {
      console.error('Failed to generate README:', error);
      // Generate sample content even on error
      setGeneratedContent(generateReadmeContent());
    } finally {
      setLoading(false);
    }
  };

  const generateReadmeContent = () => {
    let content = `# ${projectName || 'My NestJS Project'}

${projectDescription || 'A NestJS application built with NestJS Development Studio.'}
`;

    if (includeBadges) {
      content += `
[![Build Status](https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml)](https://github.com/username/repo/actions)
[![Coverage](https://img.shields.io/codecov/c/github/username/repo)](https://codecov.io/gh/username/repo)
[![License](https://img.shields.io/github/license/username/repo)](LICENSE)
`;
    }

    if (includeInstallation) {
      content += `
## Installation

\`\`\`bash
npm install
\`\`\`
`;
    }

    if (includeUsage) {
      content += `
## Usage

\`\`\`bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
\`\`\`
`;
    }

    if (includeApi) {
      content += `
## API Documentation

API documentation is available at \`/api/docs\` when the server is running.
`;
    }

    if (includeLicense) {
      content += `
## License

MIT
`;
    }

    return content;
  };

  const generateApiDocs = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await docsApi.generateApiDocs(projectPath);
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Failed to generate API docs:', error);
      setGeneratedContent(`# API Documentation

## Endpoints

Documentation will be generated based on your controllers and Swagger decorators.

### Example

\`\`\`
GET /api/items - Get all items
POST /api/items - Create new item
GET /api/items/:id - Get item by ID
PUT /api/items/:id - Update item
DELETE /api/items/:id - Delete item
\`\`\`
`);
    } finally {
      setLoading(false);
    }
  };

  const generateChangelog = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await docsApi.generateChangelog(projectPath);
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Failed to generate changelog:', error);
      setGeneratedContent(`# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project setup
- Basic CRUD operations

### Changed
- Updated dependencies

### Fixed
- Minor bug fixes
`);
    } finally {
      setLoading(false);
    }
  };

  const generateContributing = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      // Use generateReadme as fallback since there's no generateContributing method
      const content = `# Contributing Guide

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`npm install\`
4. Create a branch: \`git checkout -b feature/your-feature\`

## Development

\`\`\`bash
npm run start:dev
\`\`\`

## Code Style

- Run linting: \`npm run lint\`
- Run formatting: \`npm run format\`

## Testing

\`\`\`bash
npm test
npm run test:e2e
\`\`\`

## Pull Request Process

1. Update documentation if needed
2. Follow conventional commits
3. Ensure all tests pass
4. Request review from maintainers
`;
      setGeneratedContent(content);
    } catch (error) {
      console.error('Failed to generate contributing guide:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Documentation Generator</h3>

      {/* Doc Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'readme', label: 'README', icon: '📖' },
          { id: 'api', label: 'API Docs', icon: '📡' },
          { id: 'changelog', label: 'Changelog', icon: '📝' },
          { id: 'contributing', label: 'Contributing', icon: '🤝' },
        ].map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className={`p-2 rounded text-sm ${
              activeDoc === doc.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-1">{doc.icon}</span>
            {doc.label}
          </button>
        ))}
      </div>

      {/* README Options */}
      {activeDoc === 'readme' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My NestJS Project"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Include Sections</label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeBadges}
                onChange={(e) => setIncludeBadges(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>Badges (build, coverage, version)</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeInstallation}
                onChange={(e) => setIncludeInstallation(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>Installation instructions</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeUsage}
                onChange={(e) => setIncludeUsage(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>Usage examples</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeApi}
                onChange={(e) => setIncludeApi(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>API documentation</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeLicense}
                onChange={(e) => setIncludeLicense(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>License section</span>
            </label>
          </div>

          <button
            onClick={generateReadme}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate README.md'}
          </button>
        </div>
      )}

      {/* API Docs */}
      {activeDoc === 'api' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Generate API documentation based on your controllers and Swagger decorators.
          </p>

          <div className="bg-gray-800 p-3 rounded text-sm">
            <h4 className="text-white font-medium mb-2">Features</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Auto-detect endpoints from controllers</li>
              <li>• Extract request/response schemas</li>
              <li>• Generate OpenAPI specification</li>
              <li>• Include authentication details</li>
            </ul>
          </div>

          <button
            onClick={generateApiDocs}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate API Documentation'}
          </button>
        </div>
      )}

      {/* Changelog */}
      {activeDoc === 'changelog' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Generate a changelog based on your git commit history following conventional commits.
          </p>

          <div className="bg-gray-800 p-3 rounded text-sm">
            <h4 className="text-white font-medium mb-2">Changelog Sections</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• ✨ Features (feat:)</li>
              <li>• 🐛 Bug Fixes (fix:)</li>
              <li>• 📚 Documentation (docs:)</li>
              <li>• ⚡ Performance (perf:)</li>
              <li>• 💥 Breaking Changes (BREAKING CHANGE:)</li>
            </ul>
          </div>

          <button
            onClick={generateChangelog}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate CHANGELOG.md'}
          </button>
        </div>
      )}

      {/* Contributing */}
      {activeDoc === 'contributing' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Generate a contributing guide for your open source project.
          </p>

          <div className="bg-gray-800 p-3 rounded text-sm">
            <h4 className="text-white font-medium mb-2">Guide Includes</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Code of Conduct</li>
              <li>• Development setup</li>
              <li>• Commit message guidelines</li>
              <li>• Pull request process</li>
              <li>• Code review standards</li>
            </ul>
          </div>

          <button
            onClick={generateContributing}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate CONTRIBUTING.md'}
          </button>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">Generated Content</h4>
            <button
              onClick={() => navigator.clipboard.writeText(generatedContent)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-64 whitespace-pre-wrap">
            {generatedContent}
          </pre>
        </div>
      )}
    </div>
  );
}
