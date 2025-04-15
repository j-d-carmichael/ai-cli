#!/usr/bin/env node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { Command } from 'commander';
import Conf from 'conf';

import { handleSetConfiguration } from './lib/handleSetConfiguration.js';
import { handleConfigurationShow } from './lib/handleConfigurationShow.js';
import { handleListConfiguration } from './lib/handleListConfiguration.js';
import { runChat } from './lib/runChat.js';
import { clearConfig } from './lib/clearConfig.js';
import { handleSetSystemPrompt } from './lib/handleSetSystemPrompt.js';
import { getPromptFromEditor } from './lib/getPromptFromEditor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const config = new Conf({ projectName: 'ais-cli' });

// --- Commander Setup & Command Definitions ---
const program = new Command();
program
  .name('ais')
  .description('Interact with AI services via the command line.')
  .version(packageJson.version)
  .usage('[options | command] ["Your prompt here..."]');

program
  .command('set')
  .description('Set/update the AI service, model, and API key')
  .action(() => handleSetConfiguration(config, true));

program
  .command('set-system-prompt')
  .alias('sp')
  .description('Set or update the system prompt for AI interactions')
  .action(() => handleSetSystemPrompt(config));

program
  .command('config')
  .alias('c')
  .description('List the current AI configuration (service and model)')
  .action(() => handleConfigurationShow(config));

program
  .command('config-clear')
  .description('Removes all cached config data and stored API keys')
  .action(clearConfig);

program
  .command('list')
  .alias('ls')
  .description('List all available AI configurations (service and model)')
  .action(() => handleListConfiguration(config));

program
  .argument(
    '[prompt...]',
    'The prompt to send to the AI (leave empty for interactive chat, it will open your default cli text editor)'
  )
  .action(async (promptArgs) => {
    let initialPrompt = promptArgs.join(' ').trim();

    // If no prompt was provided via command line arguments...
    if (!initialPrompt) {
      try {
        initialPrompt = await getPromptFromEditor();

        if (!initialPrompt) {
          console.log(chalk.yellow('No prompt entered in the editor. Exiting.'));
          process.exit(0);
        }
        // Add a little visual separator
        console.log(chalk.blue('---'));

      } catch (error) {
        // Editor error
        console.error(chalk.red(`Error during editor session: ${error.message}`));

        // Fall back to interactive mode without an initial prompt:
        console.warn(chalk.yellow('Falling back to interactive mode without an initial prompt.'));
        initialPrompt = '';
      }
    }

    await runChat(config, initialPrompt);
  });

// Start your engines
(async () => {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
})();
