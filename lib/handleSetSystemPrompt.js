import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';

/**
 * Handles setting or updating the system prompt configuration
 * @param {object} config - The configuration object
 */
export async function handleSetSystemPrompt(config) {
  try {
    // Check if there's an existing system prompt
    const currentSystemPrompt = config.get('systemPrompt');

    if (currentSystemPrompt) {
      console.log(chalk.cyan('Current system prompt:'));
      console.log(chalk.yellow(currentSystemPrompt));
      console.log('');

      // Ask if user wants to update it
      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: 'Do you want to update the system prompt?',
          default: false
        }
      ]);

      if (!shouldUpdate) {
        console.log(chalk.green('Keeping current system prompt.'));
        return;
      }
    }

    // Use a simple text input for multiline input
    console.log(chalk.cyan('Enter your system prompt below.'));
    console.log(chalk.yellow('Type your prompt and use Enter for new lines.'));
    console.log(chalk.yellow('When finished, type ":save" on a new line to save, or ":quit" to cancel.'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    const lines = [];
    let currentLine = 0;

    // If there's existing content, display it line by line
    if (lines.length > 0) {
      console.log(chalk.cyan('Current content (you can continue from here):'));
      lines.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
      currentLine = lines.length;
    }

    rl.prompt();

    await new Promise((resolve) => {
      rl.on('line', (line) => {
        if (line.trim() === ':save') {
          rl.close();
          resolve();
          return;
        }

        if (line.trim() === ':quit') {
          console.log(chalk.yellow('Operation cancelled.'));
          rl.close();
          process.exit(0);
        }

        // Add the line to our content
        lines.push(line);
        currentLine++;
        rl.prompt();
      });
    });

    const systemPrompt = lines.join('\n').trim();

    if (!systemPrompt) {
      console.log(chalk.yellow('No system prompt provided. Operation cancelled.'));
      return;
    }

    // Save the system prompt to config
    config.set('systemPrompt', systemPrompt);
    console.log(chalk.green('System prompt successfully saved!'));

  } catch (error) {
    console.error(chalk.red('Error setting system prompt:'), error.message);
  }
}
