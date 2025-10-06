/**
 * `agor config clear` - Clear all active context
 */

import { clearContext } from '@agor/core/config';
import { Command } from '@oclif/core';
import chalk from 'chalk';

export default class ConfigClear extends Command {
  static description = 'Clear all active context';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    try {
      await clearContext();
      this.log(`${chalk.green('✓')} Cleared all active context`);
    } catch (error) {
      this.error(
        `Failed to clear config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
