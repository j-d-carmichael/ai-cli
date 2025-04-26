import chalk from 'chalk';
import inquirer from 'inquirer';
import { getPromptFromEditor } from './getPromptFromEditor.js';
import { logger } from './logger.js';

export async function handleSetSystemPrompt(config) {
  try {
    const currentSystemPrompt = config.get('systemPrompt');

    if (currentSystemPrompt) {
      logger.log(chalk.cyan('Current system prompt:'));
      logger.log(chalk.yellow(currentSystemPrompt));
      logger.log('');

      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: 'Do you want to update the system prompt?',
          default: false,
        },
      ]);

      if (!shouldUpdate) {
        logger.log(chalk.green('Keeping current system prompt.'));
        return;
      }
    }

    logger.log(chalk.cyan('Opening your default CLI text editor for system prompt input...'));
    const systemPrompt = await getPromptFromEditor(currentSystemPrompt || '');

    if (!systemPrompt) {
      logger.log(chalk.yellow('No system prompt entered. Operation cancelled.'));
      return;
    }

    config.set(
      'systemPrompt',
      `${systemPrompt}

The output should in markdown syntax where needed or requested.`
      );
    logger.log(chalk.green('System prompt successfully saved!'));
  } catch (error) {
    logger.error(chalk.red('Error setting system prompt:'), error.message);
  }
}
