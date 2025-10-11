/**
 * `agor config get <key>` - Get specific config value
 */

import { type ContextKey, getConfigValue, getContext } from '@agor/core/config';
import { Args, Command } from '@oclif/core';

export default class ConfigGet extends Command {
  static description = 'Get a configuration value';

  static examples = [
    '<%= config.bin %> <%= command.id %> board',
    '<%= config.bin %> <%= command.id %> session',
    '<%= config.bin %> <%= command.id %> credentials.ANTHROPIC_API_KEY',
    '<%= config.bin %> <%= command.id %> daemon.port',
  ];

  static args = {
    key: Args.string({
      description: 'Configuration key (e.g., board, daemon.port, credentials.ANTHROPIC_API_KEY)',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const key = args.key;

    try {
      let value: string | boolean | number | undefined;

      // Check if it's a simple context key (board, session, repo, agent)
      const contextKeys = ['board', 'session', 'repo', 'agent'];
      if (contextKeys.includes(key)) {
        value = await getContext(key as ContextKey);
      } else {
        // Use getConfigValue for nested keys (e.g., daemon.port, credentials.ANTHROPIC_API_KEY)
        value = await getConfigValue(key);
      }

      if (value !== undefined) {
        this.log(String(value));
      } else {
        // No value set - exit with code 1 (useful for scripting)
        process.exit(1);
      }
    } catch (error) {
      this.error(`Failed to get config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
