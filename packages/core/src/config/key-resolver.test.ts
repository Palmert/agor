/**
 * API Key Resolver Tests
 *
 * Tests runtime API key resolution with user-level keys
 * Precedence: Per-user (DB) > Environment variable > Global config.yaml
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_KEYS, type ApiKeyName, resolveApiKey, resolveApiKeySync } from './key-resolver';

// Mock dependencies
vi.mock('./config-manager', () => ({
  loadConfig: vi.fn(),
  loadConfigSync: vi.fn(),
}));

vi.mock('../db', () => ({
  decryptApiKey: vi.fn((encrypted: string) => {
    // Simple mock decryption: just reverse the string
    return encrypted.split('').reverse().join('');
  }),
  eq: vi.fn((field: any, value: any) => ({ field, value })), // Return something for Drizzle
}));

vi.mock('../db/schema', () => ({
  users: {
    user_id: 'user_id_column',
    data: 'data_column',
  },
}));

// Mock database wrapper to intercept select() calls
vi.mock('../db/database-wrapper', () => ({
  select: vi.fn((db: any) => {
    // If the db has a mock select chain, use it
    if (db?._mockSelectChain) {
      return db._mockSelectChain;
    }
    // Otherwise return a default mock
    return {
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          one: vi.fn().mockResolvedValue(null),
        })),
      })),
    };
  }),
}));

import { decryptApiKey } from '../db';
import type { UserID } from '../types';
import { loadConfig, loadConfigSync } from './config-manager';

describe('API_KEYS Registry', () => {
  it('should export all API key configurations', () => {
    expect(API_KEYS.ANTHROPIC_API_KEY).toBeDefined();
    expect(API_KEYS.OPENAI_API_KEY).toBeDefined();
    expect(API_KEYS.GEMINI_API_KEY).toBeDefined();
  });

  it('should have correct metadata for Anthropic', () => {
    const config = API_KEYS.ANTHROPIC_API_KEY;
    expect(config.keyName).toBe('ANTHROPIC_API_KEY');
    expect(config.serviceName).toBe('Claude Code');
    expect(config.label).toBe('Anthropic API Key');
    expect(config.placeholder).toBe('sk-ant-api03-...');
    expect(config.docUrl).toBe('https://console.anthropic.com');
  });

  it('should have correct metadata for OpenAI', () => {
    const config = API_KEYS.OPENAI_API_KEY;
    expect(config.keyName).toBe('OPENAI_API_KEY');
    expect(config.serviceName).toBe('Codex');
    expect(config.label).toBe('OpenAI API Key');
    expect(config.placeholder).toBe('sk-proj-...');
    expect(config.docUrl).toBe('https://platform.openai.com/api-keys');
  });

  it('should have correct metadata for Gemini', () => {
    const config = API_KEYS.GEMINI_API_KEY;
    expect(config.keyName).toBe('GEMINI_API_KEY');
    expect(config.serviceName).toBe('Gemini');
    expect(config.label).toBe('Gemini API Key');
    expect(config.placeholder).toBe('AIza...');
    expect(config.docUrl).toBe('https://aistudio.google.com/app/apikey');
  });
});

describe('resolveApiKeySync', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return env key when available', () => {
    process.env.ANTHROPIC_API_KEY = 'env-anthropic-key';
    vi.mocked(loadConfigSync).mockReturnValue({
      credentials: { ANTHROPIC_API_KEY: 'config-anthropic-key' },
    } as any);

    const result = resolveApiKeySync('ANTHROPIC_API_KEY');

    expect(result).toBe('env-anthropic-key');
  });

  it('should fall back to config when env is not set', () => {
    delete process.env.OPENAI_API_KEY;
    vi.mocked(loadConfigSync).mockReturnValue({
      credentials: { OPENAI_API_KEY: 'config-openai-key' },
    } as any);

    const result = resolveApiKeySync('OPENAI_API_KEY');

    expect(result).toBe('config-openai-key');
  });

  it('should return undefined when no key is found', () => {
    delete process.env.GEMINI_API_KEY;
    vi.mocked(loadConfigSync).mockReturnValue({
      credentials: {},
    } as any);

    const result = resolveApiKeySync('GEMINI_API_KEY');

    expect(result).toBeUndefined();
  });

  it('should return undefined when config has no credentials', () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.mocked(loadConfigSync).mockReturnValue({} as any);

    const result = resolveApiKeySync('ANTHROPIC_API_KEY');

    expect(result).toBeUndefined();
  });

  it('should prioritize env over config (12-factor compliance)', () => {
    process.env.OPENAI_API_KEY = 'env-key';
    vi.mocked(loadConfigSync).mockReturnValue({
      credentials: { OPENAI_API_KEY: 'config-key' },
    } as any);

    const result = resolveApiKeySync('OPENAI_API_KEY');

    expect(result).toBe('env-key');
  });
});

describe('resolveApiKey (async with user context)', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Precedence: per-user > env > config', () => {
    it('should return per-user key when available (highest precedence)', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {
                  api_keys: {
                    ANTHROPIC_API_KEY: 'encrypted-user-key', // Reversed: key-resu-detpyrcne
                  },
                },
              }),
            })),
          })),
        },
      } as any;

      process.env.ANTHROPIC_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { ANTHROPIC_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('ANTHROPIC_API_KEY', { userId, db: mockDb });

      // Should decrypt and return per-user key
      expect(result).toBe('yek-resu-detpyrcne'); // Decrypted (reversed)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('per-user API key'));
    });

    it('should return env key when per-user key is not set', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {
                  api_keys: {}, // No key set
                },
              }),
            })),
          })),
        },
      } as any;

      process.env.OPENAI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { OPENAI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('OPENAI_API_KEY', { userId, db: mockDb });

      expect(result).toBe('env-key');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('environment variable'));
    });

    it('should return config key when per-user and env are not set', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {
                  api_keys: {},
                },
              }),
            })),
          })),
        },
      } as any;

      delete process.env.GEMINI_API_KEY;
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { GEMINI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('GEMINI_API_KEY', { userId, db: mockDb });

      expect(result).toBe('config-key');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('global API key'));
    });

    it('should return undefined when no key is found anywhere', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: { api_keys: {} },
              }),
            })),
          })),
        },
      } as any;

      delete process.env.ANTHROPIC_API_KEY;
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: {},
      } as any);

      const result = await resolveApiKey('ANTHROPIC_API_KEY', { userId, db: mockDb });

      expect(result).toBeUndefined();
    });
  });

  describe('User context handling', () => {
    it('should skip per-user lookup when userId is not provided', async () => {
      const mockDb = {
        select: vi.fn(),
      } as any;

      process.env.OPENAI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { OPENAI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('OPENAI_API_KEY', { db: mockDb });

      expect(result).toBe('env-key');
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should skip per-user lookup when db is not provided', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;

      process.env.GEMINI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { GEMINI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('GEMINI_API_KEY', { userId });

      expect(result).toBe('env-key');
    });

    it('should work with empty context object', async () => {
      process.env.ANTHROPIC_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { ANTHROPIC_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('ANTHROPIC_API_KEY', {});

      expect(result).toBe('env-key');
    });

    it('should work with no context parameter', async () => {
      process.env.OPENAI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { OPENAI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('OPENAI_API_KEY');

      expect(result).toBe('env-key');
    });
  });

  describe('Error handling', () => {
    it('should fall back to env/config when DB query fails', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockRejectedValue(new Error('DB connection failed')),
            })),
          })),
        },
      } as any;

      process.env.ANTHROPIC_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { ANTHROPIC_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('ANTHROPIC_API_KEY', { userId, db: mockDb });

      expect(result).toBe('env-key');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to resolve per-user key'),
        expect.any(Error)
      );
    });

    it('should fall back to env/config when user not found', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue(null), // User not found
            })),
          })),
        },
      } as any;

      process.env.OPENAI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { OPENAI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('OPENAI_API_KEY', { userId, db: mockDb });

      expect(result).toBe('env-key');
    });

    it('should fall back to env/config when decryption fails', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {
                  api_keys: {
                    GEMINI_API_KEY: 'corrupted-encrypted-key',
                  },
                },
              }),
            })),
          })),
        },
      } as any;

      // Mock decryption failure
      vi.mocked(decryptApiKey).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      process.env.GEMINI_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { GEMINI_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('GEMINI_API_KEY', { userId, db: mockDb });

      expect(result).toBe('env-key');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle user data without api_keys field', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {}, // No api_keys field
              }),
            })),
          })),
        },
      } as any;

      process.env.ANTHROPIC_API_KEY = 'env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { ANTHROPIC_API_KEY: 'config-key' },
      } as any);

      const result = await resolveApiKey('ANTHROPIC_API_KEY', { userId, db: mockDb });

      expect(result).toBe('env-key');
    });
  });

  describe('Security: No key leakage in logs', () => {
    it('should not log full API keys from per-user source', async () => {
      const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;
      const sensitiveKey = 'sk-ant-api03-very-secret-key-123456789';

      // Mock decryptApiKey to return the sensitive key
      vi.mocked(decryptApiKey).mockReturnValueOnce(sensitiveKey);

      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: userId,
                data: {
                  api_keys: {
                    ANTHROPIC_API_KEY: 'encrypted-sensitive-key', // Will be decrypted
                  },
                },
              }),
            })),
          })),
        },
      } as any;

      await resolveApiKey('ANTHROPIC_API_KEY', { userId, db: mockDb });

      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain(sensitiveKey);
      expect(allLogs).toContain('ANTHROPIC_API_KEY'); // Should log key name
      expect(allLogs).toContain('per-user'); // Should indicate per-user source
    });

    it('should not log full API keys from env source', async () => {
      const sensitiveKey = 'sk-proj-very-secret-openai-key-987654321';
      process.env.OPENAI_API_KEY = sensitiveKey;
      vi.mocked(loadConfig).mockResolvedValue({ credentials: {} } as any);

      await resolveApiKey('OPENAI_API_KEY', {});

      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain(sensitiveKey);
      expect(allLogs).toContain('OPENAI_API_KEY'); // Should log key name
    });

    it('should not log full API keys from config source', async () => {
      const sensitiveKey = 'AIzaSyABC123-very-secret-gemini-key';
      delete process.env.GEMINI_API_KEY;
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { GEMINI_API_KEY: sensitiveKey },
      } as any);

      await resolveApiKey('GEMINI_API_KEY', {});

      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain(sensitiveKey);
      expect(allLogs).toContain('GEMINI_API_KEY');
    });
  });

  describe('All API key types', () => {
    const keyTypes: ApiKeyName[] = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'];

    keyTypes.forEach((keyType) => {
      it(`should resolve ${keyType} with correct precedence`, async () => {
        const userId = '01234567-89ab-cdef-0123-456789abcdef' as UserID;

        // Reset mock to return decrypted value for this test
        vi.mocked(decryptApiKey).mockReturnValueOnce('yek-resu-detpyrcne');

        const mockDb = {
          _mockSelectChain: {
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                one: vi.fn().mockResolvedValue({
                  user_id: userId,
                  data: {
                    api_keys: {
                      [keyType]: 'encrypted-user-key',
                    },
                  },
                }),
              })),
            })),
          },
        } as any;

        delete process.env[keyType]; // Ensure env doesn't override
        vi.mocked(loadConfig).mockResolvedValue({
          credentials: { [keyType]: 'config-key' },
        } as any);

        const result = await resolveApiKey(keyType, { userId, db: mockDb });

        // Should use per-user key (highest precedence)
        expect(result).toBe('yek-resu-detpyrcne'); // Decrypted
      });
    });
  });

  describe('Integration patterns', () => {
    it('should work with typical agent tool usage pattern', async () => {
      // Simulate typical usage in Claude/Codex/Gemini prompt services
      const session = {
        session_id: 'session-123',
        created_by: '01234567-89ab-cdef-0123-456789abcdef' as UserID,
      };

      const mockDb = {
        _mockSelectChain: {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              one: vi.fn().mockResolvedValue({
                user_id: session.created_by,
                data: {
                  api_keys: {
                    ANTHROPIC_API_KEY: 'encrypted-user-anthropic-key',
                  },
                },
              }),
            })),
          })),
        },
      } as any;

      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { ANTHROPIC_API_KEY: 'config-anthropic-key' },
      } as any);

      const resolvedKey = await resolveApiKey('ANTHROPIC_API_KEY', {
        userId: session.created_by,
        db: mockDb,
      });

      expect(resolvedKey).toBeDefined();
      expect(typeof resolvedKey).toBe('string');
    });

    it('should handle anonymous user (no userId)', async () => {
      process.env.OPENAI_API_KEY = 'global-env-key';
      vi.mocked(loadConfig).mockResolvedValue({
        credentials: { OPENAI_API_KEY: 'config-key' },
      } as any);

      // Anonymous user - should fall back to env/config
      const resolvedKey = await resolveApiKey('OPENAI_API_KEY', {
        userId: undefined,
        db: {} as any,
      });

      expect(resolvedKey).toBe('global-env-key');
    });
  });
});
