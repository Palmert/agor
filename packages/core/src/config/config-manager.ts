/**
 * Agor Config Manager
 *
 * Handles loading and saving YAML configuration file.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
import type { AgorConfig, AgorContext, ContextKey } from './types';

/**
 * Get Agor home directory (~/.agor)
 */
export function getAgorHome(): string {
  return path.join(os.homedir(), '.agor');
}

/**
 * Get config file path (~/.agor/config.yaml)
 */
export function getConfigPath(): string {
  return path.join(getAgorHome(), 'config.yaml');
}

/**
 * Ensure ~/.agor directory exists
 */
async function ensureAgorHome(): Promise<void> {
  const agorHome = getAgorHome();
  try {
    await fs.access(agorHome);
  } catch {
    await fs.mkdir(agorHome, { recursive: true });
  }
}

/**
 * Load config from ~/.agor/config.yaml
 *
 * Returns default config if file doesn't exist.
 */
export async function loadConfig(): Promise<AgorConfig> {
  const configPath = getConfigPath();

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(content) as AgorConfig;
    return config || {};
  } catch (error) {
    // File doesn't exist or parse error - return default config
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return getDefaultConfig();
    }
    throw new Error(
      `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Save config to ~/.agor/config.yaml
 */
export async function saveConfig(config: AgorConfig): Promise<void> {
  await ensureAgorHome();

  const configPath = getConfigPath();
  const content = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  await fs.writeFile(configPath, content, 'utf-8');
}

/**
 * Get default config
 */
export function getDefaultConfig(): AgorConfig {
  return {
    context: {},
    defaults: {
      board: 'main',
      agent: 'claude-code',
    },
    display: {
      tableStyle: 'unicode',
      colorOutput: true,
      shortIdLength: 8,
    },
  };
}

/**
 * Get context value
 *
 * @param key - Context key to retrieve
 * @returns Value or undefined if not set
 */
export async function getContext(key: ContextKey): Promise<string | undefined> {
  const config = await loadConfig();
  return config.context?.[key];
}

/**
 * Set context value
 *
 * @param key - Context key to set
 * @param value - Value to set
 */
export async function setContext(key: ContextKey, value: string): Promise<void> {
  const config = await loadConfig();

  if (!config.context) {
    config.context = {};
  }

  config.context[key] = value;

  await saveConfig(config);
}

/**
 * Unset context value
 *
 * @param key - Context key to clear
 */
export async function unsetContext(key: ContextKey): Promise<void> {
  const config = await loadConfig();

  if (config.context && key in config.context) {
    delete config.context[key];
    await saveConfig(config);
  }
}

/**
 * Clear all context
 */
export async function clearContext(): Promise<void> {
  const config = await loadConfig();
  config.context = {};
  await saveConfig(config);
}

/**
 * Get all context values
 */
export async function getAllContext(): Promise<AgorContext> {
  const config = await loadConfig();
  return config.context || {};
}

/**
 * Initialize config file with defaults if it doesn't exist
 */
export async function initConfig(): Promise<void> {
  const configPath = getConfigPath();

  try {
    await fs.access(configPath);
    // File exists, don't overwrite
  } catch {
    // File doesn't exist, create with defaults
    await saveConfig(getDefaultConfig());
  }
}
