/**
 * `agor config` - Show all configuration and active context
 */

import { getConfigPath, getEffectiveConfig, loadConfig } from '@agor/core/config';
import { Command } from '@oclif/core';
import chalk from 'chalk';

export default class ConfigIndex extends Command {
  static description = 'Show current configuration and active context';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    try {
      const config = await loadConfig();
      const effective = await getEffectiveConfig(config);

      this.log(chalk.bold('\nCurrent Configuration'));
      this.log(chalk.dim('─'.repeat(50)));

      // Active Context
      this.log(chalk.bold('\nActive Context:'));
      if (effective.board) {
        this.log(`  board:   ${chalk.cyan(effective.board)}`);
      }
      if (effective.session) {
        this.log(`  session: ${chalk.cyan(effective.session)}`);
      }
      if (effective.repo) {
        this.log(`  repo:    ${chalk.cyan(effective.repo)}`);
      }
      if (effective.agent) {
        this.log(`  agent:   ${chalk.cyan(effective.agent)}`);
      }

      if (!effective.board && !effective.session && !effective.repo && !effective.agent) {
        this.log(chalk.dim('  (no active context)'));
      }

      // Global Defaults
      this.log(chalk.bold('\nGlobal Defaults:'));
      if (config.defaults?.board) {
        this.log(`  default board: ${chalk.gray(config.defaults.board)}`);
      }
      if (config.defaults?.agent) {
        this.log(`  default agent: ${chalk.gray(config.defaults.agent)}`);
      }

      // Display Settings
      this.log(chalk.bold('\nDisplay Settings:'));
      if (config.display?.tableStyle) {
        this.log(`  table style:   ${chalk.gray(config.display.tableStyle)}`);
      }
      if (config.display?.colorOutput !== undefined) {
        this.log(
          `  color output:  ${chalk.gray(config.display.colorOutput ? 'enabled' : 'disabled')}`
        );
      }
      if (config.display?.shortIdLength) {
        this.log(`  short ID len:  ${chalk.gray(String(config.display.shortIdLength))}`);
      }

      // Config File Path
      this.log(chalk.bold('\nConfig File:'));
      this.log(`  ${chalk.dim(getConfigPath())}`);

      this.log('');
    } catch (error) {
      this.error(
        `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
