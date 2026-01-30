'use client';

import React, { useState } from 'react';
import { dockerApi } from '@/lib/api';

interface DockerPanelProps {
  projectPath: string;
}

export function DockerPanel({ projectPath }: DockerPanelProps) {
  const [loading, setLoading] = useState(false);
  const [dockerfile, setDockerfile] = useState<string | null>(null);
  const [dockerCompose, setDockerCompose] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dockerfile' | 'compose'>('dockerfile');

  // Dockerfile options
  const [nodeVersion, setNodeVersion] = useState('20-alpine');
  const [port, setPort] = useState('3000');

  // Docker Compose options
  const [includePostgres, setIncludePostgres] = useState(true);
  const [includeRedis, setIncludeRedis] = useState(false);
  const [includeMongo, setIncludeMongo] = useState(false);
  const [includeRabbitMQ, setIncludeRabbitMQ] = useState(false);

  const generateDockerfile = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      await dockerApi.generate(projectPath, {
        nodeVersion,
        port: parseInt(port),
      });
      // Generate sample Dockerfile content
      const content = `FROM node:${nodeVersion}

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE ${port}

CMD ["node", "dist/main"]`;
      setDockerfile(content);
    } catch (error) {
      console.error('Failed to generate Dockerfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDockerCompose = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const services: string[] = [];
      if (includePostgres) services.push('postgres');
      if (includeRedis) services.push('redis');
      if (includeMongo) services.push('mongodb');
      if (includeRabbitMQ) services.push('rabbitmq');

      await dockerApi.generate(projectPath, {
        nodeVersion,
        port: parseInt(port),
        redis: includeRedis,
        database: includePostgres ? 'postgres' : includeMongo ? 'mongodb' : undefined,
      });

      // Generate sample docker-compose content
      let content = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
    depends_on:`;

      if (includePostgres) {
        content += `
      - postgres
`;
      }
      if (includeRedis) {
        content += `
      - redis
`;
      }
      if (includeMongo) {
        content += `
      - mongodb
`;
      }
      if (includeRabbitMQ) {
        content += `
      - rabbitmq
`;
      }

      if (includePostgres) {
        content += `
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nestdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
`;
      }

      if (includeRedis) {
        content += `
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`;
      }

      if (includeMongo) {
        content += `
  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db
`;
      }

      if (includeRabbitMQ) {
        content += `
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
`;
      }

      content += `
volumes:`;
      if (includePostgres) content += `
  postgres_data:`;
      if (includeMongo) content += `
  mongo_data:`;

      setDockerCompose(content);
    } catch (error) {
      console.error('Failed to generate docker-compose:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildImage = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      await dockerApi.build(projectPath);
      alert('Docker image built successfully!');
    } catch (error) {
      console.error('Failed to build Docker image:', error);
    } finally {
      setLoading(false);
    }
  };

  const runContainer = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      await dockerApi.up(projectPath);
      alert('Container started successfully!');
    } catch (error) {
      console.error('Failed to run container:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Docker Integration</h3>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('dockerfile')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'dockerfile'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Dockerfile
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'compose'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Docker Compose
        </button>
      </div>

      {activeTab === 'dockerfile' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Node Version</label>
            <select
              value={nodeVersion}
              onChange={(e) => setNodeVersion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
            >
              <option value="20-alpine">20-alpine (recommended)</option>
              <option value="20">20</option>
              <option value="18-alpine">18-alpine</option>
              <option value="18">18</option>
              <option value="16-alpine">16-alpine</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Port</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              placeholder="3000"
            />
          </div>

          <button
            onClick={generateDockerfile}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate Dockerfile'}
          </button>

          {dockerfile && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Generated Dockerfile:</h4>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-64">
                {dockerfile}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-400 mb-2">Services</label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includePostgres}
                onChange={(e) => setIncludePostgres(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>PostgreSQL</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeRedis}
                onChange={(e) => setIncludeRedis(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>Redis</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeMongo}
                onChange={(e) => setIncludeMongo(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>MongoDB</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeRabbitMQ}
                onChange={(e) => setIncludeRabbitMQ(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700"
              />
              <span>RabbitMQ</span>
            </label>
          </div>

          <button
            onClick={generateDockerCompose}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            {loading ? 'Generating...' : 'Generate docker-compose.yml'}
          </button>

          {dockerCompose && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Generated docker-compose.yml:</h4>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-64">
                {dockerCompose}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Docker Actions */}
      <div className="border-t border-gray-700 pt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Docker Commands</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={buildImage}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm"
          >
            Build Image
          </button>
          <button
            onClick={runContainer}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm"
          >
            Run Container
          </button>
        </div>
      </div>
    </div>
  );
}
