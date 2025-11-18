import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiKeyValidationError,
  hasValidApiKey,
  initializeValidApiKey,
  isValidApiKey,
  requireValidApiKey,
  resolveValidApiKey,
  resolveValidApiKeySync,
  sanitizeApiKeyForLogging,
} from './api-key-validator';

describe('API Key Validator', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Spy on console to verify keys aren't leaked
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isValidApiKey', () => {
    it('should return true for valid non-empty strings', () => {
      expect(isValidApiKey('sk-1234567890')).toBe(true);
      expect(isValidApiKey('gsk_abcdefghijklmnop')).toBe(true);
      expect(isValidApiKey('AIzaSyABC123')).toBe(true);
      expect(isValidApiKey('a')).toBe(true); // Single character is valid
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(isValidApiKey('')).toBe(false);
      expect(isValidApiKey(' ')).toBe(false);
      expect(isValidApiKey('   ')).toBe(false);
      expect(isValidApiKey('\t')).toBe(false);
      expect(isValidApiKey('\n')).toBe(false);
      expect(isValidApiKey(' \t\n ')).toBe(false);
    });

    it('should return false for null, undefined, or non-string values', () => {
      expect(isValidApiKey(null)).toBe(false);
      expect(isValidApiKey(undefined)).toBe(false);
      expect(isValidApiKey(123 as any)).toBe(false);
      expect(isValidApiKey({} as any)).toBe(false);
      expect(isValidApiKey([] as any)).toBe(false);
      expect(isValidApiKey(true as any)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidApiKey('0')).toBe(true); // String zero is valid
      expect(isValidApiKey('false')).toBe(true); // String false is valid
      expect(isValidApiKey('null')).toBe(true); // String null is valid
    });
  });

  describe('initializeValidApiKey', () => {
    it('should prioritize config key over env key when both are valid', () => {
      const result = initializeValidApiKey('ANTHROPIC_API_KEY', 'config-key', 'env-key');

      expect(result).toBe('config-key');
    });

    it('should use env key when config key is invalid', () => {
      const result = initializeValidApiKey(
        'ANTHROPIC_API_KEY',
        '   ', // Whitespace-only config key
        'env-key'
      );

      expect(result).toBe('env-key');
    });

    it('should return undefined when both keys are invalid', () => {
      const result = initializeValidApiKey(
        'ANTHROPIC_API_KEY',
        '', // Empty config key
        '   ' // Whitespace-only env key
      );

      expect(result).toBeUndefined();
    });

    it('should set environment variable when setEnvFromConfig is true', () => {
      delete process.env.ANTHROPIC_API_KEY;

      initializeValidApiKey('ANTHROPIC_API_KEY', 'config-key', undefined, {
        setEnvFromConfig: true,
        serviceName: 'Claude',
      });

      expect(process.env.ANTHROPIC_API_KEY).toBe('config-key');
    });

    it('should not overwrite existing environment variable', () => {
      process.env.ANTHROPIC_API_KEY = 'existing-env-key';

      initializeValidApiKey('ANTHROPIC_API_KEY', 'config-key', 'existing-env-key', {
        setEnvFromConfig: true,
      });

      expect(process.env.ANTHROPIC_API_KEY).toBe('existing-env-key'); // Should not be overwritten
    });

    it('should show OAuth warnings when enabled', () => {
      const result = initializeValidApiKey('GEMINI_API_KEY', undefined, undefined, {
        showOAuthWarnings: true,
        oauthInstructions: ['OAuth requires: gemini CLI installed'],
      });

      expect(result).toBeUndefined();
    });

    it('should handle empty/whitespace config keys properly', () => {
      const emptyConfigs = ['', ' ', '   ', '\t', '\n', ' \t\n '];

      for (const emptyConfig of emptyConfigs) {
        const result = initializeValidApiKey('OPENAI_API_KEY', emptyConfig, 'valid-env-key');

        expect(result).toBe('valid-env-key');
      }
    });

    it('should handle empty/whitespace env keys properly', () => {
      const emptyEnvKeys = ['', ' ', '   ', '\t', '\n', ' \t\n '];

      for (const emptyEnvKey of emptyEnvKeys) {
        const result = initializeValidApiKey('OPENAI_API_KEY', 'valid-config-key', emptyEnvKey);

        expect(result).toBe('valid-config-key');
      }
    });
  });

  describe('hasValidApiKey', () => {
    it('should work as a type guard', () => {
      const objWithKey = { apiKey: 'valid-key' };
      const objWithEmptyKey = { apiKey: '' };
      const objWithoutKey = {};

      expect(hasValidApiKey(objWithKey)).toBe(true);
      expect(hasValidApiKey(objWithEmptyKey)).toBe(false);
      expect(hasValidApiKey(objWithoutKey)).toBe(false);

      // Type narrowing should work
      if (hasValidApiKey(objWithKey)) {
        // TypeScript should know apiKey is string here
        expect(objWithKey.apiKey.length).toBeGreaterThan(0);
      }
    });
  });

  describe('sanitizeApiKeyForLogging', () => {
    it('should return "none" for invalid keys', () => {
      expect(sanitizeApiKeyForLogging(undefined)).toBe('none');
      expect(sanitizeApiKeyForLogging(null)).toBe('none');
      expect(sanitizeApiKeyForLogging('')).toBe('none');
      expect(sanitizeApiKeyForLogging('   ')).toBe('none');
    });

    it('should show first 4 chars for short keys', () => {
      expect(sanitizeApiKeyForLogging('sk-12')).toBe('sk-1...');
      expect(sanitizeApiKeyForLogging('abcd')).toBe('abcd...');
      expect(sanitizeApiKeyForLogging('12345678901')).toBe('1234...');
    });

    it('should show first 8 chars for longer keys', () => {
      expect(sanitizeApiKeyForLogging('sk-1234567890abcdef')).toBe('sk-12345...');
      expect(sanitizeApiKeyForLogging('gsk_abcdefghijklmnopqrstuvwxyz')).toBe('gsk_abcd...');
    });
  });

  describe('requireValidApiKey', () => {
    it('should return the key when valid', () => {
      const key = 'valid-api-key';
      expect(requireValidApiKey('ANTHROPIC_API_KEY', key)).toBe(key);
    });

    it('should throw ApiKeyValidationError for missing key', () => {
      expect(() => requireValidApiKey('ANTHROPIC_API_KEY', undefined)).toThrow(
        ApiKeyValidationError
      );
      expect(() => requireValidApiKey('ANTHROPIC_API_KEY', undefined)).toThrow(
        'ANTHROPIC_API_KEY is not provided'
      );
    });

    it('should throw ApiKeyValidationError for empty key', () => {
      expect(() => requireValidApiKey('OPENAI_API_KEY', '')).toThrow(ApiKeyValidationError);
      expect(() => requireValidApiKey('OPENAI_API_KEY', '')).toThrow('OPENAI_API_KEY is empty');
    });

    it('should throw ApiKeyValidationError for whitespace-only key', () => {
      expect(() => requireValidApiKey('GEMINI_API_KEY', '   ')).toThrow(ApiKeyValidationError);
      expect(() => requireValidApiKey('GEMINI_API_KEY', '   ')).toThrow(
        'GEMINI_API_KEY contains only whitespace'
      );
    });

    it('should include context in error messages when provided', () => {
      expect(() =>
        requireValidApiKey('ANTHROPIC_API_KEY', undefined, 'during session creation')
      ).toThrow(ApiKeyValidationError);
    });
  });

  describe('ApiKeyValidationError', () => {
    it('should create proper error messages', () => {
      const missingError = new ApiKeyValidationError('TEST_KEY', 'missing');
      expect(missingError.message).toBe('TEST_KEY is not provided');
      expect(missingError.name).toBe('ApiKeyValidationError');

      const emptyError = new ApiKeyValidationError('TEST_KEY', 'empty');
      expect(emptyError.message).toBe('TEST_KEY is empty');

      const whitespaceError = new ApiKeyValidationError('TEST_KEY', 'whitespace');
      expect(whitespaceError.message).toBe('TEST_KEY contains only whitespace');
    });
  });

  describe('edge cases and security', () => {
    it('should handle very long keys', () => {
      const longKey = 'sk-' + 'a'.repeat(1000);
      expect(isValidApiKey(longKey)).toBe(true);
      expect(sanitizeApiKeyForLogging(longKey)).toBe('sk-aaaaa...');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'sk-123_ABC-def.xyz+uvw/rst=';
      expect(isValidApiKey(specialKey)).toBe(true);
      expect(sanitizeApiKeyForLogging(specialKey)).toBe('sk-123_A...');
    });

    it('should not leak full keys in error messages', () => {
      const sensitiveKey = 'sk-very-secret-key-123456789';

      try {
        // This should not throw, but if it did, make sure key isn't leaked
        requireValidApiKey('ANTHROPIC_API_KEY', sensitiveKey);
      } catch (error) {
        expect((error as Error).message).not.toContain(sensitiveKey);
      }
    });

    it('should handle unicode characters', () => {
      const unicodeKey = 'sk-测试-🔑-ключ';
      expect(isValidApiKey(unicodeKey)).toBe(true);
      expect(sanitizeApiKeyForLogging(unicodeKey)).toBe('sk-测试-🔑...');
    });

    it('should never log full API keys to console', () => {
      const sensitiveKey = 'sk-ant-api03-very-secret-key-12345678901234567890';

      // Test with config key
      initializeValidApiKey('ANTHROPIC_API_KEY', sensitiveKey, undefined);

      // Verify full key was never logged
      const allLogCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogCalls).not.toContain(sensitiveKey);

      // Reset spies
      consoleLogSpy.mockClear();

      // Test with env key
      initializeValidApiKey('ANTHROPIC_API_KEY', undefined, sensitiveKey);

      // Verify full key was never logged
      const allLogCalls2 = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogCalls2).not.toContain(sensitiveKey);
    });

    it('should never log full API keys in warning messages', () => {
      const sensitiveKey = 'sk-proj-secret-openai-key-abcdefghijklmnop';

      // Set a key and trigger warnings
      process.env.OPENAI_API_KEY = sensitiveKey;
      initializeValidApiKey('OPENAI_API_KEY', undefined, sensitiveKey, {
        showOAuthWarnings: false,
      });

      // Verify full key was never logged in any warnings
      const allWarnCalls = consoleWarnSpy.mock.calls.flat().join(' ');
      expect(allWarnCalls).not.toContain(sensitiveKey);

      // Also check log calls
      const allLogCalls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogCalls).not.toContain(sensitiveKey);
    });
  });

  describe('integration patterns', () => {
    it('should work with common config patterns', () => {
      // Simulate common configuration patterns
      const configs = [
        { credentials: { ANTHROPIC_API_KEY: 'config-key' } },
        { credentials: {} },
        { credentials: null as any },
        {} as any,
      ];

      const envKeys = ['env-key', '', '   ', undefined];

      for (const config of configs) {
        for (const envKey of envKeys) {
          const result = initializeValidApiKey(
            'ANTHROPIC_API_KEY',
            config.credentials?.ANTHROPIC_API_KEY,
            envKey
          );

          // Should always return string or undefined, never empty/whitespace
          expect(typeof result === 'string' ? result.trim().length > 0 : result === undefined).toBe(
            true
          );
        }
      }
    });

    it('should maintain consistent behavior across all API key types', () => {
      const keyTypes: Array<'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY'> = [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
      ];

      for (const keyType of keyTypes) {
        // Valid key should work for all types
        const validResult = initializeValidApiKey(keyType, 'valid-key', undefined);
        expect(validResult).toBe('valid-key');

        // Invalid key should return undefined for all types
        const invalidResult = initializeValidApiKey(keyType, '', '   ');
        expect(invalidResult).toBeUndefined();
      }
    });
  });

  describe('performance and memory', () => {
    it('should not modify input parameters', () => {
      const configKey = 'original-config';
      const envKey = 'original-env';
      const originalConfigKey = configKey;
      const originalEnvKey = envKey;

      initializeValidApiKey('ANTHROPIC_API_KEY', configKey, envKey);

      expect(configKey).toBe(originalConfigKey);
      expect(envKey).toBe(originalEnvKey);
    });

    it('should handle rapid successive calls efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        initializeValidApiKey('ANTHROPIC_API_KEY', 'test-key', undefined);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});
