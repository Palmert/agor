/**
 * `agor config set <key> <value>` - Set configuration value
 */

import { type ContextKey, setContext } from '@agor/core/config';
import { Args, Command } from '@oclif/core';
import chalk from 'chalk';

export default class ConfigSet extends Command {
  static description = 'Set a configuration value';

  static examples = [
    '<%= config.bin %> <%= command.id %> board experiments',
    '<%= config.bin %> <%= command.id %> session 01933e4a',
    '<%= config.bin %> <%= command.id %> repo anthropics/agor:main',
    '<%= config.bin %> <%= command.id %> repo /Users/max/code/agor',
    '<%= config.bin %> <%= command.id %> agent claude-code',
  ];

  static args = {
    key: Args.string({
      description: 'Configuration key to set (board, session, repo, agent)',
      required: true,
      options: ['board', 'session', 'repo', 'agent'],
    }),
    value: Args.string({
      description: 'Value to set',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    const key = args.key as ContextKey;
    const value = args.value as string;

    try {
      await setContext(key, value);
      this.log(`${chalk.green('✓')} Set ${chalk.cyan(key)} = ${chalk.yellow(value)}`);
    } catch (error) {
      this.error(`Failed to set config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
