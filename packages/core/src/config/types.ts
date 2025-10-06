/**
 * Agor Configuration Types
 */

/**
 * Active CLI context (stateful)
 *
 * Values that change frequently during CLI usage.
 */
export interface AgorContext {
  /** Active board (slug, ID, or name) */
  board?: string;

  /** Active session (full UUID or short ID) */
  session?: string;

  /** Active repo reference (path | slug | slug:worktree) */
  repo?: string;

  /** Preferred agent for new sessions */
  agent?: string;
}

/**
 * Global default values
 */
export interface AgorDefaults {
  /** Default board for new sessions */
  board?: string;

  /** Default agent for new sessions */
  agent?: string;
}

/**
 * Display settings
 */
export interface AgorDisplaySettings {
  /** Table style: unicode, ascii, or minimal */
  tableStyle?: 'unicode' | 'ascii' | 'minimal';

  /** Enable color output */
  colorOutput?: boolean;

  /** Short ID length (default: 8) */
  shortIdLength?: number;
}

/**
 * Complete Agor configuration
 */
export interface AgorConfig {
  /** Active context (stateful CLI) */
  context?: AgorContext;

  /** Global defaults */
  defaults?: AgorDefaults;

  /** Display settings */
  display?: AgorDisplaySettings;
}

/**
 * Valid context keys that can be set/get
 */
export type ContextKey = keyof AgorContext;

/**
 * Valid config keys (includes nested keys with dot notation)
 */
export type ConfigKey =
  | ContextKey
  | `defaults.${keyof AgorDefaults}`
  | `display.${keyof AgorDisplaySettings}`;
