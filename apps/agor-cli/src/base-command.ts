/**
 * Base Command - Shared logic for all Agor CLI commands
 *
 * Reduces boilerplate by providing common functionality like daemon connection checking.
 */

import type { AgorClient } from '@agor/core/api';
import { createClient, isDaemonRunning } from '@agor/core/api';
import { getDaemonUrl } from '@agor/core/config';
import { Command } from '@oclif/core';
import chalk from 'chalk';

/**
 * Base command with daemon connection utilities
 */
export abstract class BaseCommand extends Command {
  protected daemonUrl: string | null = null;

  /**
   * Connect to daemon (checks if running first)
   *
   * @returns Feathers client instance
   */
  protected async connectToDaemon(): Promise<AgorClient> {
    // Get daemon URL from config
    this.daemonUrl = await getDaemonUrl();

    // Check if daemon is running
    const running = await isDaemonRunning(this.daemonUrl);

    if (!running) {
      this.error(
        `Daemon not running at ${this.daemonUrl}.\nStart it with: ${chalk.cyan('cd apps/agor-daemon && pnpm dev')}`
      );
    }

    // Create and return client
    return createClient(this.daemonUrl);
  }

  /**
   * Cleanup client connection
   *
   * Ensures socket is properly closed to prevent hanging processes
   */
  protected async cleanupClient(client: AgorClient): Promise<void> {
    await new Promise<void>(resolve => {
      client.io.on('disconnect', resolve);
      client.io.close();
      setTimeout(resolve, 1000);
    });
  }
}
