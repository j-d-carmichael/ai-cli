import chalk from 'chalk';
import inquirer from 'inquirer';
import { getPromptFromEditor } from './getPromptFromEditor.js';

export async function handleSetSystemPrompt(config) {
  try {
    const currentSystemPrompt = config.get('systemPrompt');

    if (currentSystemPrompt) {
      console.log(chalk.cyan('Current system prompt:'));
      console.log(chalk.yellow(currentSystemPrompt));
      console.log('');

      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: 'Do you want to update the system prompt?',
          default: false,
        },
      ]);

      if (!shouldUpdate) {
        console.log(chalk.green('Keeping current system prompt.'));
        return;
      }
    }

    console.log(chalk.cyan('Opening your default CLI text editor for system prompt input...'));
    const systemPrompt = await getPromptFromEditor(currentSystemPrompt || '');

    if (!systemPrompt) {
      console.log(chalk.yellow('No system prompt entered. Operation cancelled.'));
      return;
    }

    config.set('systemPrompt', systemPrompt);
    console.log(chalk.green('System prompt successfully saved!'));
  } catch (error) {
    console.error(chalk.red('Error setting system prompt:'), error.message);
  }
}
