/**
 * Context Resolver
 *
 * Resolves configuration values using priority: flag → context → defaults → prompt
 */

import { loadConfig } from './config-manager';
import type { AgorConfig, ContextKey } from './types';

/**
 * Resolve a configuration value
 *
 * Priority order:
 * 1. Explicit flag value (highest priority)
 * 2. Active context value
 * 3. Global default value
 * 4. undefined (caller should prompt if required)
 *
 * @param key - Context key to resolve
 * @param flagValue - Value from CLI flag (optional)
 * @param config - Loaded config (optional, will load if not provided)
 * @returns Resolved value or undefined
 *
 * @example
 * // With explicit flag
 * await resolveValue('board', 'experiments')
 * // => 'experiments'
 *
 * @example
 * // From context (no flag provided)
 * await resolveValue('board')
 * // => 'main' (from context or defaults)
 */
export async function resolveValue(
  key: ContextKey,
  flagValue?: string,
  config?: AgorConfig
): Promise<string | undefined> {
  // 1. Explicit flag value (highest priority)
  if (flagValue !== undefined && flagValue !== null && flagValue !== '') {
    return flagValue;
  }

  // Load config if not provided
  const cfg = config || (await loadConfig());

  // 2. Active context value
  const contextValue = cfg.context?.[key];
  if (contextValue !== undefined && contextValue !== null && contextValue !== '') {
    return contextValue;
  }

  // 3. Global default value
  const defaultValue = cfg.defaults?.[key as keyof typeof cfg.defaults];
  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    return defaultValue;
  }

  // 4. Not found - caller should prompt if required
  return undefined;
}

/**
 * Resolve multiple values at once
 *
 * @param keys - Array of context keys to resolve
 * @param flagValues - Map of flag values (optional)
 * @param config - Loaded config (optional)
 * @returns Map of resolved values
 *
 * @example
 * await resolveValues(['board', 'agent'], { board: 'experiments' })
 * // => { board: 'experiments', agent: 'claude-code' }
 */
export async function resolveValues(
  keys: ContextKey[],
  flagValues?: Partial<Record<ContextKey, string>>,
  config?: AgorConfig
): Promise<Partial<Record<ContextKey, string>>> {
  const cfg = config || (await loadConfig());
  const resolved: Partial<Record<ContextKey, string>> = {};

  for (const key of keys) {
    const value = await resolveValue(key, flagValues?.[key], cfg);
    if (value !== undefined) {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Get effective config (merged context + defaults)
 *
 * Returns a flattened view of all effective values.
 *
 * @param config - Loaded config (optional)
 * @returns Effective configuration values
 */
export async function getEffectiveConfig(
  config?: AgorConfig
): Promise<Record<string, string | undefined>> {
  const cfg = config || (await loadConfig());

  return {
    // Context values
    board: await resolveValue('board', undefined, cfg),
    session: await resolveValue('session', undefined, cfg),
    repo: await resolveValue('repo', undefined, cfg),
    agent: await resolveValue('agent', undefined, cfg),

    // Display settings
    tableStyle: cfg.display?.tableStyle,
    colorOutput:
      cfg.display?.colorOutput !== undefined ? String(cfg.display.colorOutput) : undefined,
    shortIdLength:
      cfg.display?.shortIdLength !== undefined ? String(cfg.display.shortIdLength) : undefined,
  };
}
