'use client';

import React, { useState } from 'react';
import { cicdApi } from '@/lib/api';

interface CicdPanelProps {
  projectPath: string;
}

type CIProvider = 'github' | 'gitlab' | 'jenkins';

export function CicdPanel({ projectPath }: CicdPanelProps) {
  const [loading, setLoading] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CIProvider>('github');

  // GitHub Actions options
  const [includeTests, setIncludeTests] = useState(true);
  const [includeLint, setIncludeLint] = useState(true);
  const [includeBuild, setIncludeBuild] = useState(true);
  const [includeDocker, setIncludeDocker] = useState(false);
  const [includeDeploy, setIncludeDeploy] = useState(false);
  const [nodeVersion, setNodeVersion] = useState('20');

  const generateConfig = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await cicdApi.generate(projectPath, {
        provider: selectedProvider,
        docker: includeDocker,
        deploy: includeDeploy ? 'production' : undefined,
      });

      // Generate a sample config content for display
      const configContent = generateSampleConfig(selectedProvider, {
        tests: includeTests,
        lint: includeLint,
        build: includeBuild,
        docker: includeDocker,
        deploy: includeDeploy,
        nodeVersion,
      });

      setGeneratedConfig(configContent);
    } catch (error) {
      console.error('Failed to generate CI/CD config:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleConfig = (provider: CIProvider, options: any): string => {
    if (provider === 'github') {
      return `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${options.nodeVersion}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
${options.lint ? `
      - name: Run linting
        run: npm run lint
` : ''}${options.tests ? `
      - name: Run tests
        run: npm test
` : ''}${options.build ? `
      - name: Build
        run: npm run build
` : ''}${options.docker ? `
      - name: Build Docker image
        run: docker build -t myapp .
` : ''}`;
    } else if (provider === 'gitlab') {
      return `stages:
  - install
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "${options.nodeVersion}"

cache:
  paths:
    - node_modules/

install:
  stage: install
  script:
    - npm ci
${options.lint ? `
lint:
  stage: test
  script:
    - npm run lint
` : ''}${options.tests ? `
test:
  stage: test
  script:
    - npm test
` : ''}${options.build ? `
build:
  stage: build
  script:
    - npm run build
` : ''}`;
    } else {
      return `pipeline {
    agent any

    tools {
        nodejs 'NodeJS ${options.nodeVersion}'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
${options.lint ? `
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
` : ''}${options.tests ? `
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
` : ''}${options.build ? `
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
` : ''}    }
}`;
    }
  }

  const getProviderInfo = () => {
    switch (selectedProvider) {
      case 'github':
        return {
          name: 'GitHub Actions',
          file: '.github/workflows/ci.yml',
          icon: '🐙',
        };
      case 'gitlab':
        return {
          name: 'GitLab CI',
          file: '.gitlab-ci.yml',
          icon: '🦊',
        };
      case 'jenkins':
        return {
          name: 'Jenkins',
          file: 'Jenkinsfile',
          icon: '🔧',
        };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">CI/CD Configuration</h3>

      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">CI/CD Provider</label>
        <div className="grid grid-cols-3 gap-2">
          {(['github', 'gitlab', 'jenkins'] as const).map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`p-2 rounded text-center ${
                selectedProvider === provider
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="text-lg">
                {provider === 'github' && '🐙'}
                {provider === 'gitlab' && '🦊'}
                {provider === 'jenkins' && '🔧'}
              </div>
              <div className="text-xs capitalize">{provider}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Node Version */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Node.js Version</label>
        <select
          value={nodeVersion}
          onChange={(e) => setNodeVersion(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
        >
          <option value="20">Node.js 20 (LTS)</option>
          <option value="18">Node.js 18 (LTS)</option>
          <option value="16">Node.js 16</option>
        </select>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Pipeline Steps</label>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={includeLint}
            onChange={(e) => setIncludeLint(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Lint (ESLint)</span>
        </label>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={includeTests}
            onChange={(e) => setIncludeTests(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Tests (Jest)</span>
        </label>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={includeBuild}
            onChange={(e) => setIncludeBuild(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Build</span>
        </label>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={includeDocker}
            onChange={(e) => setIncludeDocker(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Docker Build & Push</span>
        </label>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={includeDeploy}
            onChange={(e) => setIncludeDeploy(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Deploy</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateConfig}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
      >
        {loading ? 'Generating...' : `Generate ${providerInfo.name} Config`}
      </button>

      {/* Generated Config */}
      {generatedConfig && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">
              {providerInfo.icon} {providerInfo.file}
            </h4>
            <button
              onClick={() => navigator.clipboard.writeText(generatedConfig)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-64">
            {generatedConfig}
          </pre>
        </div>
      )}

      {/* Info */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Pipeline Features</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Caching for faster builds</li>
          <li>• Parallel job execution</li>
          <li>• Environment-specific deployments</li>
          <li>• Automatic versioning support</li>
          <li>• Slack/Discord notifications (optional)</li>
        </ul>
      </div>
    </div>
  );
}
