#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import Conf from 'conf';
import chalk from 'chalk';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import readline from 'readline';

import { streamGoogleResponse } from './lib/streamGoogleResponse.js';
import { streamOpenAIResponse } from './lib/streamOpenAIResponse.js';
import { streamAnthropicResponse } from './lib/streamAnthropicResponse.js';

// --- Configuration Setup ---
const config = new Conf({ projectName: 'ais-cli' });
const SUPPORTED_SERVICES = {
  anthropic: 'Anthropic (Claude)',
  google: 'Gemini (Google)',
  openai: 'GPT (OpenAI)',
};

// --- Model Definitions (Add more as needed) ---
const AVAILABLE_MODELS = {
  anthropic: [
    { name: 'Claude 3.5 Sonnet (Recommended, Latest)', value: 'claude-3-5-sonnet-20240620' },
    { name: 'Claude 3 Opus (Most Powerful)', value: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Haiku (Fastest)', value: 'claude-3-haiku-20240307' },
  ],
  google: [
    { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro-exp-03-25' },
    { name: 'Gemini 2.0 Flash', value: 'models/gemini-2.0-flash' },
  ],
  openai: [
    { name: 'GPT-4o Mini (Recommended, Cost-Effective)', value: 'gpt-4o-mini' },
    { name: 'GPT-4o (Latest, Advanced)', value: 'gpt-4o' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ]
};

const conversationHistory = [];

async function handleSetConfiguration (exitAfter = false) {
  console.log(chalk.blue('Configuring AI Service:'));
  try {
    // 1. Ask for Service
    const serviceAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'service',
        message: 'Which AI service do you want to use?',
        choices: Object.entries(SUPPORTED_SERVICES).map(([key, value]) => ({
          name: value,
          value: key,
        })),
        default: config.get('service'),
      },
    ]);
    const selectedService = serviceAnswer.service;

    // 2. Ask for Model based on Service
    const modelChoices = AVAILABLE_MODELS[selectedService];
    if (!modelChoices) {
      console.error(chalk.red(`No models defined for service: ${selectedService}`));
      if (exitAfter) process.exit(1);
      return false;
    }

    const modelAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `Which ${SUPPORTED_SERVICES[selectedService]} model?`,
        choices: modelChoices,
        default: config.get('service') === selectedService ? config.get('model') : undefined, // Default only if service hasn't changed
      },
    ]);
    const selectedModel = modelAnswer.model;

    // 3. Ask for API Key
    const keyAnswer = await inquirer.prompt([
      {
        type: 'password', // Use password type to mask input
        name: 'apiKey',
        message: `Enter your API key for ${SUPPORTED_SERVICES[selectedService]}:`,
        mask: '*',
        validate: (input) => !!input || 'API Key cannot be empty.',
        // No default for API Key for security
      },
    ]);
    const apiKey = keyAnswer.apiKey;

    // 4. Save Configuration
    config.set('service', selectedService);
    config.set('model', selectedModel);
    config.set('apiKey', apiKey); // Stored in plain text in config file

    console.log(chalk.green('\nConfiguration saved successfully!'));
    console.log(`  Service: ${chalk.bold(SUPPORTED_SERVICES[selectedService])}`);
    console.log(`  Model:   ${chalk.bold(selectedModel)}`);
    console.log(chalk.yellow(`\nNote: Your API key is stored locally. Location: ${config.path}`));

    if (exitAfter) {
      process.exit(0);
    }
    return true; // Indicate success

  } catch (error) {
    // Handle potential inquirer cancellation (e.g., Ctrl+C during prompt)
    if (error.isTtyError) {
      console.error(chalk.red('\nConfiguration prompt could not be rendered in this environment.'));
    } else {
      console.error(chalk.yellow('\nConfiguration cancelled or failed.'));
    }

    if (exitAfter) {
      process.exit(1);
    }
    return false; // Indicate failure
  }
}

async function getConfiguration (promptIfNotSet = false) {
  let service = config.get('service');
  let model = config.get('model');
  let apiKey = config.get('apiKey');

  const isConfigIncomplete = !service || !model || !apiKey;

  if (isConfigIncomplete) {
    if (promptIfNotSet) {
      console.log(
        chalk.yellow(
          'AI Service, Model, or API Key not fully configured. Let\'s set them up.'
        )
      );
      const success = await handleSetConfiguration(false); // Don't exit here
      if (success) {
        // Re-fetch after setting
        service = config.get('service');
        model = config.get('model');
        apiKey = config.get('apiKey');
        // Check again in case setup failed somehow (though handleSetConfiguration should handle errors)
        if (!service || !model || !apiKey) {
          console.error(chalk.red('Configuration still incomplete after setup attempt. Exiting.'));
          process.exit(1);
        }
      } else {
        console.error(chalk.red('Configuration is required to proceed. Exiting.'));
        process.exit(1);
      }
    } else {
      // If not prompting and config is missing, return null
      return null;
    }
  }

  return { service, model, apiKey };
}

async function handleConfigurationShow () {
  const configData = await getConfiguration(false); // Don't prompt if not set

  if (configData) {
    const { service, model } = configData;
    console.log(chalk.blue('Current AI Configuration:'));
    console.log(`  Service Provider: ${chalk.green(SUPPORTED_SERVICES[service] || service)}`);
    console.log(`  Model:            ${chalk.green(model)}`);
    console.log(`  Config Location:  ${chalk.dim(config.path)}`);
    console.log(chalk.yellow('  API Key is stored but not displayed. Use `ais set` to update it.'));

  } else {
    console.log(chalk.yellow('No configuration found.'));
    console.log(`Run ${chalk.cyan('ais set')} to configure the service, model, and API key.`);
  }

  process.exit();
}

async function handleListConfiguration () {
  console.log(chalk.blue('---- Available resources ---- '));
  console.log('');
  console.log(chalk.blue('Service providers:'));
  for (const key in SUPPORTED_SERVICES) {
    console.log(`  ${chalk.green(SUPPORTED_SERVICES[key])}`);
  }

  console.log(chalk.blue('\nModels:'));
  for (const key in AVAILABLE_MODELS) {
    for (let i = 0; i < AVAILABLE_MODELS[key].length; i++) {
      console.log(`  ${chalk.green(AVAILABLE_MODELS[key][i]['name'])}`);
    }
  }
  console.log('');
  console.log(chalk.blue.italic('(Please create an issue on GitHub to update this list of services or models)'));
  console.log('');
  console.log(chalk.blue('---- Available resources ---- '));
  process.exit();
}

// --- Main Chat Logic Function ---
async function runChat (initialPrompt = '') {
  // Prompt for configuration if not set, then retrieve it
  const configData = await getConfiguration(true);
  const { service, model, apiKey } = configData; // model is now included

  let aiClient;
  try {
    switch (service) {
      case 'openai':
        aiClient = new OpenAI({ apiKey });
        break;
      case 'anthropic':
        aiClient = new Anthropic({ apiKey });
        break;
      case 'google':
        aiClient = new GoogleGenAI({ apiKey });
        break;
      default:
        console.error(chalk.red(`Invalid service configured: ${service}. Use \`ais set\`.`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error initializing AI client for ${SUPPORTED_SERVICES[service]}:`), error.message);
    console.error(chalk.yellow('Ensure your API key is correct (`ais set`) and you have network connectivity.'));
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.yellow('You: '),
  });

  rl.on('SIGINT', () => {
    console.log(chalk.yellow('\nExiting chat. Goodbye!'));
    rl.close();
    process.exit(0);
  });

  // Function to process a single turn
  async function processTurn (input) {
    if (!input?.trim()) {
      rl.prompt();
      return;
    }

    let response = null;
    try {
      switch (service) {
        case 'openai':
          // Pass the configured model ID to the stream function
          response = await streamOpenAIResponse(aiClient, model, input, conversationHistory);
          break;
        case 'anthropic':
          // Pass the configured model ID to the stream function
          response = await streamAnthropicResponse(aiClient, model, input, conversationHistory);
          break;
        case 'google':
          response = await streamGoogleResponse(aiClient, model, input, conversationHistory);
      }
    } catch (turnError) {
      console.error(chalk.red('\nAn unexpected error occurred during processing:'), turnError.message);
      response = null;
    }

    if (response === null) {
      console.log(chalk.red('Attempting to continue session. Enter your next prompt or Ctrl+C to exit.'));
    }

    // Add to the running thread
    conversationHistory.push({ role: 'user', content: input });
    if (response) {
      conversationHistory.push({ role: 'assistant', content: response });
    }

    // Show prompt for next input
    rl.prompt();
  }

  // --- Start the Chat ---
  if (initialPrompt) {
    console.log(chalk.blue(`Using model: ${chalk.bold(model)}`)); // Inform user which model is active
    console.log(chalk.yellow(`You: ${initialPrompt}`));
    await processTurn(initialPrompt);
  } else {
    console.log(chalk.blue(`Starting interactive chat with ${SUPPORTED_SERVICES[service]} (Model: ${chalk.bold(model)}). Press Ctrl+C to exit.`));
    rl.prompt();
  }

  rl.on('line', async (line) => {
    await processTurn(line);
  });
}

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
  .action(() => handleSetConfiguration(true));
program
  .command('config')
  .description('List the current AI configuration (service and model)')
  .action(handleConfigurationShow);
program
  .command('list')
  .alias('ls')
  .description('List all available AI configurations (service and model)')
  .action(handleListConfiguration);
program
  // Make the prompt argument optional and capture any remaining args for the default action
  .argument('[prompt...]', 'The prompt to send to the AI (leave empty for interactive chat)')
  .action(async (promptArgs) => {
    const initialPrompt = promptArgs.join(' ').trim();
    await runChat(initialPrompt);
  });

// Starting engines
(async () => {
  try {
    await program.parseAsync(process.argv);

    // If no arguments were provided (other than node executable and script path)
    // and no command was explicitly run (like 'set' or 'list'),
    // Commander should have executed the default action ('.argument().action()')
    // which calls `runChat('')` for interactive mode.
    // Explicit check might not be needed with modern Commander versions unless specific edge cases arise.

  } catch (error) {
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
})();
