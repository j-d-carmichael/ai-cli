#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import Conf from 'conf';
import chalk from 'chalk';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import readline from 'readline';

// --- Configuration Setup ---
const config = new Conf({ projectName: 'ais-cli' });
const SUPPORTED_SERVICES = {
  openai: 'OpenAI (GPT)',
  anthropic: 'Anthropic (Claude)',
};

// --- Model Definitions (Add more as needed) ---
const AVAILABLE_MODELS = {
  openai: [
    { name: 'GPT-4o Mini (Recommended, Cost-Effective)', value: 'gpt-4o-mini' },
    { name: 'GPT-4o (Latest, Advanced)', value: 'gpt-4o' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ],
  anthropic: [
    { name: 'Claude 3.5 Sonnet (Recommended, Latest)', value: 'claude-3-5-sonnet-20240620' },
    { name: 'Claude 3 Opus (Most Powerful)', value: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Haiku (Fastest)', value: 'claude-3-haiku-20240307' },
  ],
};

// --- Commander Setup ---
const program = new Command();

program
  .name('ais')
  .description('Interact with AI services via the command line.')
  .version('1.0.1') // Incremented version
  .usage('[options | command] ["Your prompt here..."]');

// --- Helper Functions ---

async function handleSetConfiguration(exitAfter = false) {
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

async function getConfiguration(promptIfNotSet = false) {
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

async function handleListConfiguration() {
  const configData = await getConfiguration(false); // Don't prompt if not set

  if (configData) {
    const { service, model } = configData;
    console.log(chalk.blue('Current AI Configuration:'));
    console.log(`  Service Provider: ${chalk.green(SUPPORTED_SERVICES[service] || service)}`);
    console.log(`  Model:            ${chalk.green(model)}`);
    console.log(`  Config Location:  ${chalk.dim(config.path)}`);
    console.log(chalk.yellow('\nAPI Key is stored but not displayed. Use `ais set` to update it.'))
  } else {
    console.log(chalk.yellow('No configuration found.'));
    console.log(`Run ${chalk.cyan('ais set')} to configure the service, model, and API key.`);
  }
}


// Pass modelId to the streaming functions
async function streamOpenAIResponse(client, modelId, prompt, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: prompt },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: modelId, // Use the passed model ID
      messages: messages,
      stream: true,
    });

    let fullResponse = '';
    process.stdout.write(chalk.cyan('AI: '));
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(chalk.cyan(content));
      fullResponse += content;
    }
    process.stdout.write('\n');
    return fullResponse;
  } catch (error) {
    console.error(chalk.red(`\nError calling OpenAI API (Model: ${modelId}):`), error.message);
    if (error.status === 401) {
      console.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (error.status === 429) {
      console.error(chalk.yellow('Rate limit exceeded. Please wait and try again or check your plan.'));
    } else if (error.status === 404) {
      console.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    }
    return null;
  }
}

// Pass modelId to the streaming functions
async function streamAnthropicResponse(client, modelId, prompt, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: prompt },
  ];

  try {
    const stream = client.messages.stream({
      model: modelId, // Use the passed model ID
      max_tokens: 1024, // Consider making this configurable later
      messages: messages,
    });

    let fullResponse = '';
    process.stdout.write(chalk.magenta('AI: '));

    await new Promise((resolve, reject) => {
      stream.on('text', (text) => {
        process.stdout.write(chalk.magenta(text));
        fullResponse += text;
      });
      stream.on('end', () => {
        if (!fullResponse.endsWith('\n')) process.stdout.write('\n');
        resolve();
      });
      stream.on('error', (error) => {
        // Add newline if error occurs mid-stream for better formatting
        if (!fullResponse.endsWith('\n')) process.stdout.write('\n');
        reject(error)
      });
      // Handle specific Anthropic stop event for robustness
      stream.on('message_stop', () => {
        if (!fullResponse.endsWith('\n')) process.stdout.write('\n');
        resolve();
      });
    });
    return fullResponse;
  } catch (error) {
    console.error(chalk.red(`\nError calling Anthropic API (Model: ${modelId}):`), error.message);
    if (error.status === 401) {
      console.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (error.status === 429) {
      console.error(chalk.yellow('Rate limit exceeded. Please wait and try again or check your plan.'));
    } else if (error.status === 404) {
      console.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    } else if (error.message.includes('Invalid')) { // Catch other potential model/parameter issues
      console.error(chalk.yellow(`Invalid request parameter, potentially related to the model ${modelId}. Check API documentation or try 'ais set'.`));
    }
    return null;
  }
}

// --- Main Chat Logic Function ---
async function runChat(initialPrompt = '') {
  // Prompt for configuration if not set, then retrieve it
  const configData = await getConfiguration(true);
  const { service, model, apiKey } = configData; // model is now included

  let aiClient;
  try {
    if (service === 'openai') {
      aiClient = new OpenAI({ apiKey });
    } else if (service === 'anthropic') {
      aiClient = new Anthropic({ apiKey });
    } else {
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
  async function processTurn(input) {
    if (!input?.trim()) {
      rl.prompt();
      return;
    }

    let response = null;
    try {
      if (service === 'openai') {
        // Pass the configured model ID to the stream function
        response = await streamOpenAIResponse(aiClient, model, input /*, conversationHistory */);
      } else if (service === 'anthropic') {
        // Pass the configured model ID to the stream function
        response = await streamAnthropicResponse(aiClient, model, input /*, conversationHistory */);
      }
    } catch (turnError) {
      console.error(chalk.red("\nAn unexpected error occurred during processing:"), turnError.message);
      response = null;
    }

    if (response === null) {
      console.log(chalk.red("Attempting to continue session. Enter your next prompt or Ctrl+C to exit."))
    }

    // --- History Management (Placeholder) ---
    // let conversationHistory = [];
    // conversationHistory.push({ role: 'user', content: input });
    // if (response) { conversationHistory.push({ role: 'assistant', content: response }); }
    // ----------------------------------------------------

    rl.prompt(); // Show prompt for next input
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


// --- Commander Command Definitions ---

program
  .command('set')
  .description('Set/update the AI service, model, and API key')
  .action(() => handleSetConfiguration(true)); // Exit after setting

program
  .command('list')
  .alias('ls') // Add a shorter alias
  .description('List the current AI configuration (service and model)')
  .action(handleListConfiguration); // Call the new list handler

program
  // Make the prompt argument optional and capture any remaining args for the default action
  .argument('[prompt...]', 'The prompt to send to the AI (leave empty for interactive chat)')
  .action(async (promptArgs, options, command) => {
    // Check if a specific command ('set', 'list') was already handled
    // Commander's `.command()` handles this implicitly now,
    // so this action only runs if NO specific command was matched.
    const initialPrompt = promptArgs.join(' ').trim();
    await runChat(initialPrompt); // Run main chat logic
  });


// --- Parse Arguments and Run ---
(async () => {
  try {
    await program.parseAsync(process.argv);

    // If no arguments were provided (other than node executable and script path)
    // and no command was explicitly run (like 'set' or 'list'),
    // Commander should have executed the default action ('.argument().action()')
    // which calls `runChat('')` for interactive mode.
    // Explicit check might not be needed with modern Commander versions unless specific edge cases arise.

  } catch (error) {
    // Catch potential errors during command parsing or execution if not handled elsewhere
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
})();
