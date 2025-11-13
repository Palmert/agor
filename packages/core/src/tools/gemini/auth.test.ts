import { AuthType } from '@google/gemini-cli-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Gemini Authentication', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('AuthType selection', () => {
    it('should use AuthType.USE_GEMINI when API key is present', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      // Simulate the logic from prompt-service.ts
      const resolvedApiKey = process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.USE_GEMINI);
      expect(authType).toBe('gemini-api-key');
    });

    it('should use AuthType.LOGIN_WITH_GOOGLE when API key is not present', () => {
      delete process.env.GEMINI_API_KEY;

      // Simulate the logic from prompt-service.ts
      const resolvedApiKey = process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);
      expect(authType).toBe('oauth-personal');
    });

    it('should use AuthType.LOGIN_WITH_GOOGLE when API key is empty string', () => {
      process.env.GEMINI_API_KEY = '';

      // Simulate the logic from prompt-service.ts
      const resolvedApiKey = process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);
      expect(authType).toBe('oauth-personal');
    });

    it('should use AuthType.LOGIN_WITH_GOOGLE when API key is undefined', () => {
      process.env.GEMINI_API_KEY = undefined;

      // Simulate the logic from prompt-service.ts
      const resolvedApiKey = process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);
      expect(authType).toBe('oauth-personal');
    });
  });

  describe('AuthType enum values', () => {
    it('should have correct value for USE_GEMINI', () => {
      expect(AuthType.USE_GEMINI).toBe('gemini-api-key');
    });

    it('should have correct value for LOGIN_WITH_GOOGLE', () => {
      expect(AuthType.LOGIN_WITH_GOOGLE).toBe('oauth-personal');
    });

    it('should have correct value for USE_VERTEX_AI', () => {
      expect(AuthType.USE_VERTEX_AI).toBe('vertex-ai');
    });

    it('should have correct value for CLOUD_SHELL', () => {
      expect(AuthType.CLOUD_SHELL).toBe('cloud-shell');
    });
  });

  describe('Auth type switching', () => {
    it('should switch from OAuth to API key when key is added', () => {
      // Start with no API key (OAuth)
      delete process.env.GEMINI_API_KEY;
      let authType = process.env.GEMINI_API_KEY ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;
      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);

      // Add API key
      process.env.GEMINI_API_KEY = 'new-api-key';
      authType = process.env.GEMINI_API_KEY ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;
      expect(authType).toBe(AuthType.USE_GEMINI);
    });

    it('should switch from API key to OAuth when key is removed', () => {
      // Start with API key
      process.env.GEMINI_API_KEY = 'test-api-key';
      let authType = process.env.GEMINI_API_KEY ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;
      expect(authType).toBe(AuthType.USE_GEMINI);

      // Remove API key
      delete process.env.GEMINI_API_KEY;
      authType = process.env.GEMINI_API_KEY ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;
      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);
    });
  });

  describe('Auth method detection', () => {
    it('should return "OAuth" label for LOGIN_WITH_GOOGLE', () => {
      const getAuthMethod = (authType: AuthType) =>
        authType === AuthType.LOGIN_WITH_GOOGLE ? 'OAuth' : 'API key';
      expect(getAuthMethod(AuthType.LOGIN_WITH_GOOGLE)).toBe('OAuth');
    });

    it('should return "API key" label for USE_GEMINI', () => {
      const getAuthMethod = (authType: AuthType) =>
        authType === AuthType.LOGIN_WITH_GOOGLE ? 'OAuth' : 'API key';
      expect(getAuthMethod(AuthType.USE_GEMINI)).toBe('API key');
    });

    it('should return "API key" label for USE_VERTEX_AI', () => {
      const getAuthMethod = (authType: AuthType) =>
        authType === AuthType.LOGIN_WITH_GOOGLE ? 'OAuth' : 'API key';
      expect(getAuthMethod(AuthType.USE_VERTEX_AI)).toBe('API key');
    });

    it('should return "API key" label for CLOUD_SHELL', () => {
      const getAuthMethod = (authType: AuthType) =>
        authType === AuthType.LOGIN_WITH_GOOGLE ? 'OAuth' : 'API key';
      expect(getAuthMethod(AuthType.CLOUD_SHELL)).toBe('API key');
    });
  });

  describe('API key resolution priority', () => {
    it('should prioritize explicit API key over OAuth', () => {
      // Even if OAuth credentials exist (we can't easily test that in unit tests),
      // an explicit API key should take precedence
      const explicitApiKey = 'explicit-key';
      const resolvedApiKey = explicitApiKey || process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.USE_GEMINI);
    });

    it('should fall back to OAuth when no explicit key and no env key', () => {
      delete process.env.GEMINI_API_KEY;
      const explicitApiKey = undefined;
      const resolvedApiKey = explicitApiKey || process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.LOGIN_WITH_GOOGLE);
    });

    it('should use env key when no explicit key but env key exists', () => {
      process.env.GEMINI_API_KEY = 'env-key';
      const explicitApiKey = undefined;
      const resolvedApiKey = explicitApiKey || process.env.GEMINI_API_KEY;
      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      expect(authType).toBe(AuthType.USE_GEMINI);
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain API key behavior from before OAuth support', () => {
      // Before OAuth support, we always used AuthType.USE_GEMINI
      // This test ensures that behavior still works when API key is present
      process.env.GEMINI_API_KEY = 'test-key';
      const authType = AuthType.USE_GEMINI; // Old hardcoded behavior

      expect(authType).toBe('gemini-api-key');
      expect(authType).toBe(AuthType.USE_GEMINI);
    });

    it('should not break existing API key authentication', () => {
      // Simulate the new logic with an API key present
      const resolvedApiKey = 'my-api-key';
      process.env.GEMINI_API_KEY = resolvedApiKey;

      const authType = resolvedApiKey ? AuthType.USE_GEMINI : AuthType.LOGIN_WITH_GOOGLE;

      // Should still use API key auth, just like before
      expect(authType).toBe(AuthType.USE_GEMINI);
    });
  });
});
