/**
 * Daemon configuration for UI
 *
 * Reads daemon URL from environment variables or uses defaults
 */

/**
 * Get daemon URL for UI connections
 *
 * Reads from VITE_DAEMON_URL environment variable or falls back to default
 */
export function getDaemonUrl(): string {
  // Check environment variable first (can be set via .env.local)
  const envUrl = import.meta.env.VITE_DAEMON_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fall back to default
  const defaultPort = import.meta.env.VITE_DAEMON_PORT || '3030';
  const defaultHost = import.meta.env.VITE_DAEMON_HOST || 'localhost';

  return `http://${defaultHost}:${defaultPort}`;
}

/**
 * Default daemon URL (for backwards compatibility)
 */
export const DEFAULT_DAEMON_URL = getDaemonUrl();
