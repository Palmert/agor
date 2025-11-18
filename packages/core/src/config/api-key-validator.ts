import type { Database } from '../db/client';
import type { UserID } from '../types';
import { resolveApiKey, resolveApiKeySync, type ApiKeyName } from './key-resolver';

/**
 * Validates an API key string to ensure it's not empty or whitespace-only
 *
 * @param apiKey - The API key to validate
 * @returns true if the key is valid (non-empty and not just whitespace)
 */
export function isValidApiKey(apiKey: string | undefined | null): apiKey is string {
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}

/**
 * Resolves and validates an API key with comprehensive fallback logic
 *
 * Priority:
 * 1. Per-user key (if user authenticated and key set in database)
 * 2. Global config.yaml
 * 3. Environment variables
 *
 * Returns undefined if no valid key is found (empty/whitespace keys are rejected)
 *
 * @param keyName - Name of the API key to resolve
 * @param context - Resolution context (user ID and database)
 * @returns Valid API key or undefined
 */
export async function resolveValidApiKey(
  keyName: ApiKeyName,
  context: { userId?: UserID; db?: Database } = {}
): Promise<string | undefined> {
  const apiKey = await resolveApiKey(keyName, context);
  return isValidApiKey(apiKey) ? apiKey : undefined;
}

/**
 * Synchronous version of resolveValidApiKey (only checks global + env, not per-user)
 * Use this when database access is not available
 *
 * @param keyName - Name of the API key to resolve
 * @returns Valid API key or undefined
 */
export function resolveValidApiKeySync(keyName: ApiKeyName): string | undefined {
  const apiKey = resolveApiKeySync(keyName);
  return isValidApiKey(apiKey) ? apiKey : undefined;
}

/**
 * Enhanced API key initialization with consistent validation and logging
 *
 * @param keyName - Name of the API key (for logging)
 * @param configKey - Key from config.yaml credentials
 * @param envKey - Key from environment variable
 * @param options - Configuration options
 * @returns Valid API key or undefined
 */
export function initializeValidApiKey(
  keyName: ApiKeyName,
  configKey: string | undefined,
  envKey: string | undefined,
  options: {
    /** Whether to set process.env if config key is valid */
    setEnvFromConfig?: boolean;
    /** Service name for logging (e.g., "Claude Code", "Codex", "Gemini") */
    serviceName?: string;
    /** Whether to show OAuth fallback warnings */
    showOAuthWarnings?: boolean;
    /** Custom OAuth setup instructions */
    oauthInstructions?: string[];
  } = {}
): string | undefined {
  const {
    setEnvFromConfig = false,
    serviceName,
    showOAuthWarnings = false,
    oauthInstructions,
  } = options;

  // Priority: config.yaml > env var
  // Set environment variable from config if requested and env is not already set
  if (isValidApiKey(configKey) && setEnvFromConfig && !envKey) {
    process.env[keyName] = configKey;
    console.log(`✅ Set ${keyName} from config for ${serviceName || keyName}`);
  }

  // Resolve final key with validation
  const resolvedKey = isValidApiKey(configKey)
    ? configKey
    : isValidApiKey(envKey)
      ? envKey
      : undefined;

  // Log result and provide guidance
  if (resolvedKey) {
    const source = isValidApiKey(configKey) ? 'config.yaml' : 'environment';
    console.log(`🔑 Using ${keyName} from ${source}${serviceName ? ` for ${serviceName}` : ''}`);
  } else {
    // No valid key found
    if (showOAuthWarnings) {
      console.warn(`⚠️  No ${keyName} found - will use OAuth authentication`);
      console.warn(`   To use API key: agor config set credentials.${keyName} <your-key>`);
      console.warn(`   Or set ${keyName} environment variable`);

      if (oauthInstructions) {
        oauthInstructions.forEach(instruction => console.warn(`   ${instruction}`));
      }
    } else {
      console.warn(`⚠️  No ${keyName} found - ${serviceName || 'service'} sessions may fail`);
      console.warn(`   Run: agor config set credentials.${keyName} <your-key>`);
      console.warn(`   Or set ${keyName} environment variable`);
    }
  }

  return resolvedKey;
}

/**
 * Simplified API key initialization using composition
 * Accepts just the key config object - automatically loads credentials from config
 *
 * @param keyConfig - The key configuration object from API_KEYS (e.g., API_KEYS.ANTHROPIC_API_KEY)
 * @param options - Optional configuration
 * @returns Valid API key or undefined
 *
 * @example
 * const apiKey = initializeApiKey(API_KEYS.ANTHROPIC_API_KEY);
 * const apiKey = initializeApiKey(API_KEYS.GEMINI_API_KEY, {
 *   showOAuthWarnings: true,
 * });
 */
export function initializeApiKey(
  keyConfig: { keyName: ApiKeyName; serviceName: string },
  options: {
    /** Whether to set process.env if config key is valid (default: true) */
    setEnvFromConfig?: boolean;
    /** Whether to show OAuth fallback warnings */
    showOAuthWarnings?: boolean;
    /** Custom OAuth setup instructions */
    oauthInstructions?: string[];
  } = {}
): string | undefined {
  const { setEnvFromConfig = true, ...restOptions } = options;

  // Import here to avoid circular dependency
  const { loadConfigSync } = require('./config-manager');
  const config = loadConfigSync();

  return initializeValidApiKey(
    keyConfig.keyName,
    config.credentials?.[keyConfig.keyName],
    process.env[keyConfig.keyName],
    {
      ...restOptions,
      setEnvFromConfig,
      serviceName: keyConfig.serviceName,
    }
  );
}

/**
 * Type guard to check if a value is a non-empty API key
 * Useful for TypeScript type narrowing
 */
export function hasValidApiKey<T extends { apiKey?: string | undefined }>(
  obj: T
): obj is T & { apiKey: string } {
  return isValidApiKey(obj.apiKey);
}

/**
 * Sanitize API key for logging (shows first 8 chars + "...")
 * Never logs the full key for security
 */
export function sanitizeApiKeyForLogging(apiKey: string | undefined | null): string {
  if (!isValidApiKey(apiKey)) return 'none';
  if (apiKey.length <= 12) return `${apiKey.substring(0, 4)}...`;
  return `${apiKey.substring(0, 8)}...`;
}

/**
 * Common API key validation errors
 */
export class ApiKeyValidationError extends Error {
  constructor(keyName: string, reason: 'empty' | 'whitespace' | 'missing') {
    const messages = {
      empty: `${keyName} is empty`,
      whitespace: `${keyName} contains only whitespace`,
      missing: `${keyName} is not provided`,
    };
    super(messages[reason]);
    this.name = 'ApiKeyValidationError';
  }
}

/**
 * Strict validation that throws errors instead of returning undefined
 * Use this when an API key is absolutely required
 */
export function requireValidApiKey(
  keyName: ApiKeyName,
  apiKey: string | undefined,
  context?: string
): string {
  if (apiKey === undefined || apiKey === null) {
    throw new ApiKeyValidationError(keyName, 'missing');
  }

  if (apiKey.trim().length === 0) {
    throw new ApiKeyValidationError(keyName, apiKey.length === 0 ? 'empty' : 'whitespace');
  }

  return apiKey;
}
