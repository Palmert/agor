import { decryptApiKey, eq } from '../db';
import type { Database } from '../db/client';
import { select } from '../db/database-wrapper';
import { users } from '../db/schema';
import type { UserID } from '../types';
import { loadConfig, loadConfigSync } from './config-manager';

export type ApiKeyName = 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY';

export interface KeyResolutionContext {
  /** User ID for per-user key lookup */
  userId?: UserID;
  /** Database instance for user lookup */
  db?: Database;
}

/**
 * API Key Configuration
 * Simple data structure describing an API key's metadata
 */
export interface ApiKeyConfig {
  /** API key name (e.g., 'ANTHROPIC_API_KEY') */
  readonly keyName: ApiKeyName;
  /** Human-readable service name (e.g., 'Claude Code') */
  readonly serviceName: string;
  /** UI display label (e.g., 'Anthropic API Key') */
  readonly label: string;
  /** UI description/subtitle (e.g., '(Claude Code / Agent SDK)') */
  readonly description: string;
  /** UI input placeholder (e.g., 'sk-ant-api03-...') */
  readonly placeholder: string;
  /** Documentation URL for obtaining the key */
  readonly docUrl: string;
}

/**
 * API Key Registry
 * Composition-focused: Self-contained config objects
 *
 * Usage:
 *   initializeApiKey(API_KEYS.ANTHROPIC_API_KEY, config.credentials)
 *   const key = resolveApiKeySync(API_KEYS.OPENAI_API_KEY.keyName)
 *   const key = await resolveApiKey(API_KEYS.GEMINI_API_KEY.keyName, { userId, db })
 */
export const API_KEYS = {
  ANTHROPIC_API_KEY: {
    keyName: 'ANTHROPIC_API_KEY',
    serviceName: 'Claude Code',
    label: 'Anthropic API Key',
    description: '(Claude Code / Agent SDK)',
    placeholder: 'sk-ant-api03-...',
    docUrl: 'https://console.anthropic.com',
  },
  OPENAI_API_KEY: {
    keyName: 'OPENAI_API_KEY',
    serviceName: 'Codex',
    label: 'OpenAI API Key',
    description: '(Codex)',
    placeholder: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys',
  },
  GEMINI_API_KEY: {
    keyName: 'GEMINI_API_KEY',
    serviceName: 'Gemini',
    label: 'Gemini API Key',
    description: '',
    placeholder: 'AIza...',
    docUrl: 'https://aistudio.google.com/app/apikey',
  },
} as const satisfies Record<ApiKeyName, ApiKeyConfig>;

/**
 * Resolve API key with precedence:
 * 1. Per-user key (if user authenticated and key set in database)
 * 2. Environment variables
 * 3. Global config.yaml
 *
 * @param keyName - Name of the API key to resolve
 * @param context - Resolution context (user ID and database)
 * @returns Decrypted API key or undefined if not found
 */
export async function resolveApiKey(
  keyName: ApiKeyName,
  context: KeyResolutionContext = {}
): Promise<string | undefined> {
  // 1. Check per-user key (highest precedence)
  if (context.userId && context.db) {
    try {
      const row = await select(context.db)
        .from(users)
        .where(eq(users.user_id, context.userId))
        .one();

      if (row) {
        const data = row.data as { api_keys?: Record<string, string> };
        const encryptedKey = data.api_keys?.[keyName];

        if (encryptedKey) {
          const decryptedKey = decryptApiKey(encryptedKey);
          console.log(
            `🔑 Using per-user API key for ${keyName} (user: ${context.userId.substring(0, 8)})`
          );
          return decryptedKey;
        }
      }
    } catch (err) {
      console.error(`Failed to resolve per-user key for ${keyName}:`, err);
      // Fall through to global/env fallback
    }
  }

  // 2. Check environment variable (second precedence)
  const envKey = process.env[keyName];
  if (envKey) {
    console.log(`🔑 Using environment variable for ${keyName}`);
    return envKey;
  }

  // 3. Fallback to global config.yaml (lowest precedence)
  const config = await loadConfig();
  const globalKey = config.credentials?.[keyName];
  if (globalKey) {
    console.log(`🔑 Using global API key for ${keyName} (from config.yaml)`);
    return globalKey;
  }

  // No key found
  return undefined;
}

/**
 * Synchronous version of resolveApiKey (only checks env + global, not per-user)
 * Use this when database access is not available
 *
 * Priority: Environment variable > Global config.yaml
 */
export function resolveApiKeySync(keyName: ApiKeyName): string | undefined {
  // Check environment variable first
  const envKey = process.env[keyName];
  if (envKey) return envKey;

  // Fallback to global config.yaml
  const config = loadConfigSync();
  return config.credentials?.[keyName];
}
