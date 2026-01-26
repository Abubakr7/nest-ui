'use client';

import React, { useState, useEffect } from 'react';
import { envApi } from '@/lib/api';

interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvironmentPanelProps {
  projectPath: string;
}

export function EnvironmentPanel({ projectPath }: EnvironmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [activeEnv, setActiveEnv] = useState<'development' | 'production' | 'test'>('development');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadVariables();
  }, [projectPath, activeEnv]);

  const loadVariables = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const result = await envApi.getVariables(projectPath, activeEnv);
      setVariables(result.variables || []);
    } catch (error) {
      console.error('Failed to load environment variables:', error);
      setVariables([]);
    } finally {
      setLoading(false);
    }
  };

  const addVariable = async () => {
    if (!newKey.trim()) return;
    setLoading(true);
    try {
      await envApi.setVariable(projectPath, activeEnv, newKey, newValue, newIsSecret);
      setNewKey('');
      setNewValue('');
      setNewIsSecret(false);
      await loadVariables();
    } catch (error) {
      console.error('Failed to add variable:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVariable = async (key: string) => {
    if (!confirm(`Delete variable ${key}?`)) return;
    setLoading(true);
    try {
      await envApi.deleteVariable(projectPath, activeEnv, key);
      await loadVariables();
    } catch (error) {
      console.error('Failed to delete variable:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToEnv = async (targetEnv: string) => {
    setLoading(true);
    try {
      await envApi.copyEnv(projectPath, activeEnv, targetEnv);
      alert(`Copied to ${targetEnv} environment`);
    } catch (error) {
      console.error('Failed to copy environment:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskValue = (value: string, isSecret: boolean) => {
    if (isSecret && !showSecrets) {
      return '••••••••';
    }
    return value;
  };

  const commonVariables = [
    { key: 'DATABASE_URL', value: 'postgresql://user:password@localhost:5432/db' },
    { key: 'JWT_SECRET', value: 'your-secret-key' },
    { key: 'PORT', value: '3000' },
    { key: 'NODE_ENV', value: activeEnv },
    { key: 'REDIS_URL', value: 'redis://localhost:6379' },
    { key: 'API_KEY', value: '' },
  ];

  const addCommonVariable = (variable: { key: string; value: string }) => {
    setNewKey(variable.key);
    setNewValue(variable.value);
    setNewIsSecret(variable.key.includes('SECRET') || variable.key.includes('KEY'));
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Environment Variables</h3>

      {/* Environment Selector */}
      <div className="flex space-x-2">
        {(['development', 'production', 'test'] as const).map((env) => (
          <button
            key={env}
            onClick={() => setActiveEnv(env)}
            className={`px-3 py-1 text-sm rounded ${
              activeEnv === env
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {env}
          </button>
        ))}
      </div>

      {/* Show Secrets Toggle */}
      <label className="flex items-center space-x-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={showSecrets}
          onChange={(e) => setShowSecrets(e.target.checked)}
          className="rounded bg-gray-800 border-gray-700"
        />
        <span>Show secret values</span>
      </label>

      {/* Variables List */}
      <div className="space-y-2 max-h-48 overflow-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : variables.length === 0 ? (
          <p className="text-gray-400 text-sm">No variables defined</p>
        ) : (
          variables.map((variable) => (
            <div
              key={variable.key}
              className="flex items-center justify-between bg-gray-800 p-2 rounded"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-blue-400">{variable.key}</span>
                {variable.isSecret && (
                  <span className="ml-2 text-xs text-yellow-500">🔒</span>
                )}
                <p className="text-xs text-gray-400 truncate">
                  {maskValue(variable.value, variable.isSecret)}
                </p>
              </div>
              <button
                onClick={() => deleteVariable(variable.key)}
                className="text-red-400 hover:text-red-300 text-sm ml-2"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add New Variable */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Add Variable</h4>

        <div>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
            placeholder="VARIABLE_NAME"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <input
            type={newIsSecret && !showSecrets ? 'password' : 'text'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          />
        </div>

        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={newIsSecret}
            onChange={(e) => setNewIsSecret(e.target.checked)}
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Mark as secret</span>
        </label>

        <button
          onClick={addVariable}
          disabled={loading || !newKey.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm"
        >
          Add Variable
        </button>
      </div>

      {/* Common Variables */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Common Variables</h4>
        <div className="flex flex-wrap gap-2">
          {commonVariables.map((variable) => (
            <button
              key={variable.key}
              onClick={() => addCommonVariable(variable)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded"
            >
              {variable.key}
            </button>
          ))}
        </div>
      </div>

      {/* Copy Environment */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Copy to Environment</h4>
        <div className="flex space-x-2">
          {(['development', 'production', 'test'] as const)
            .filter((env) => env !== activeEnv)
            .map((env) => (
              <button
                key={env}
                onClick={() => copyToEnv(env)}
                disabled={loading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 px-2 rounded text-sm"
              >
                → {env}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
