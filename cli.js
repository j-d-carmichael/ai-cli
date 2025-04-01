#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { handleSetConfiguration } from './lib/handleSetConfiguration.js';
import { handleConfigurationShow } from './lib/handleConfigurationShow.js';
import { handleListConfiguration } from './lib/handleListConfiguration.js';
import { runChat } from './lib/runChat.js';

import Conf from 'conf';
import { clearConfig } from './lib/clearConfig.js';
const config = new Conf({ projectName: 'ais-cli' });

// --- Commander Setup & Command Definitions ---
const program = new Command();
program
  .name('ais')
  .description('Interact with AI services via the command line.')
  .version('1.0.1') // Incremented version
  .usage('[options | command] ["Your prompt here..."]');

program
  .command('set')
  .description('Set/update the AI service, model, and API key')
  .action(() => handleSetConfiguration(config, true));

program
  .command('config')
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
  .argument('[prompt...]', 'The prompt to send to the AI (leave empty for interactive chat)')
  .action(async (promptArgs) => {
    const initialPrompt = promptArgs.join(' ').trim();
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
