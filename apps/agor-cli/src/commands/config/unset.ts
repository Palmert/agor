/**
 * `agor config unset <key>` - Unset (clear) configuration value
 */

import { type ContextKey, unsetContext } from '@agor/core/config';
import { Args, Command } from '@oclif/core';
import chalk from 'chalk';

export default class ConfigUnset extends Command {
  static description = 'Unset (clear) a configuration value';

  static examples = [
    '<%= config.bin %> <%= command.id %> board',
    '<%= config.bin %> <%= command.id %> session',
    '<%= config.bin %> <%= command.id %> repo',
    '<%= config.bin %> <%= command.id %> agent',
  ];

  static args = {
    key: Args.string({
      description: 'Configuration key to unset (board, session, repo, agent)',
      required: true,
      options: ['board', 'session', 'repo', 'agent'],
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigUnset);
    const key = args.key as ContextKey;

    try {
      await unsetContext(key);
      this.log(`${chalk.green('✓')} Unset ${chalk.cyan(key)}`);
    } catch (error) {
      this.error(
        `Failed to unset config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
