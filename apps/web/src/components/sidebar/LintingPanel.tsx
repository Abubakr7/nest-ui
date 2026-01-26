'use client';

import React, { useState } from 'react';
import { lintingApi } from '@/lib/api';

interface LintError {
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning';
}

interface LintingPanelProps {
  projectPath: string;
}

export function LintingPanel({ projectPath }: LintingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [errors, setErrors] = useState<LintError[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'lint' | 'format' | 'setup'>('lint');

  const runLint = async (fix = false) => {
    setLoading(true);
    try {
      const result = await lintingApi.lint(projectPath, fix);
      setErrors(result.errors || []);
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run lint:', error);
    } finally {
      setLoading(false);
    }
  };

  const runFormat = async (check = false) => {
    setLoading(true);
    try {
      const result = await lintingApi.format(projectPath, check);
      if (!check) {
        alert(`Formatted ${result.filesChanged || 0} files`);
      }
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run format:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEslint = async () => {
    setSetupLoading(true);
    try {
      await lintingApi.setupEslint(projectPath);
      alert('ESLint configuration created successfully!');
    } catch (error) {
      console.error('Failed to setup ESLint:', error);
    } finally {
      setSetupLoading(false);
    }
  };

  const setupPrettier = async () => {
    setSetupLoading(true);
    try {
      await lintingApi.setupPrettier(projectPath);
      alert('Prettier configuration created successfully!');
    } catch (error) {
      console.error('Failed to setup Prettier:', error);
    } finally {
      setSetupLoading(false);
    }
  };

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Code Quality</h3>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('lint')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'lint'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          ESLint
        </button>
        <button
          onClick={() => setActiveTab('format')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'format'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Prettier
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'setup'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Setup
        </button>
      </div>

      {activeTab === 'lint' && (
        <div className="space-y-4">
          {/* Summary */}
          {lastRun && (
            <div className="flex items-center space-x-4 text-sm">
              {errorCount > 0 && (
                <span className="text-red-400">
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-400">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <span className="text-green-400">No issues found!</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runLint(false)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
            >
              {loading ? 'Running...' : 'Run Lint'}
            </button>
            <button
              onClick={() => runLint(true)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
            >
              {loading ? 'Fixing...' : 'Fix Issues'}
            </button>
          </div>

          {/* Errors List */}
          {errors.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-auto">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    error.severity === 'error'
                      ? 'bg-red-900/30 border border-red-800'
                      : 'bg-yellow-900/30 border border-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-200 truncate">
                      {error.file.split('/').pop()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {error.line}:{error.column}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{error.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{error.rule}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'format' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Format your code using Prettier for consistent code style.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runFormat(true)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
            >
              {loading ? 'Checking...' : 'Check Format'}
            </button>
            <button
              onClick={() => runFormat(false)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
            >
              {loading ? 'Formatting...' : 'Format All'}
            </button>
          </div>

          <div className="bg-gray-800 p-3 rounded text-sm text-gray-300">
            <h4 className="font-medium mb-2">Formatting Options</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>• Single quotes for strings</li>
              <li>• Trailing commas in multi-line</li>
              <li>• 2 space indentation</li>
              <li>• 100 character print width</li>
              <li>• Semicolons enabled</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Initialize or update linting and formatting configuration for your project.
          </p>

          <div className="space-y-3">
            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-sm font-medium text-white mb-2">ESLint</h4>
              <p className="text-xs text-gray-400 mb-2">
                Configure ESLint with TypeScript and NestJS recommended rules.
              </p>
              <button
                onClick={setupEslint}
                disabled={setupLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
              >
                {setupLoading ? 'Setting up...' : 'Setup ESLint'}
              </button>
            </div>

            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-sm font-medium text-white mb-2">Prettier</h4>
              <p className="text-xs text-gray-400 mb-2">
                Configure Prettier for consistent code formatting.
              </p>
              <button
                onClick={setupPrettier}
                disabled={setupLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
              >
                {setupLoading ? 'Setting up...' : 'Setup Prettier'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <p className="text-xs text-gray-500">
              Note: Setup will create/update configuration files in your project root.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
