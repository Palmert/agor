/**
 * `agor config get <key>` - Get specific config value
 */

import { type ContextKey, getContext } from '@agor/core/config';
import { Args, Command } from '@oclif/core';

export default class ConfigGet extends Command {
  static description = 'Get a configuration value';

  static examples = [
    '<%= config.bin %> <%= command.id %> board',
    '<%= config.bin %> <%= command.id %> session',
    '<%= config.bin %> <%= command.id %> repo',
    '<%= config.bin %> <%= command.id %> agent',
  ];

  static args = {
    key: Args.string({
      description: 'Configuration key to retrieve (board, session, repo, agent)',
      required: true,
      options: ['board', 'session', 'repo', 'agent'],
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const key = args.key as ContextKey;

    try {
      const value = await getContext(key);

      if (value !== undefined) {
        this.log(value);
      } else {
        // No value set - exit with code 1 (useful for scripting)
        process.exit(1);
      }
    } catch (error) {
      this.error(`Failed to get config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
