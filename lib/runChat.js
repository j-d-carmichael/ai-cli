import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import chalk from 'chalk';
import readline from 'readline';
import { logger } from './logger.js';

import { SUPPORTED_SERVICES } from './availableResources.js';

import { streamOpenAIResponse } from './streamOpenAIResponse.js';
import { streamAnthropicResponse } from './streamAnthropicResponse.js';
import { streamGoogleResponse } from './streamGoogleResponse.js';
import { getConfiguration } from './getConfiguration.js';
import { getPromptFromEditor } from './getPromptFromEditor.js';
import { printVersionDiff } from './versionCheck.js';

const conversationHistory = [];

export async function runChat (config, initialPrompt = '') {
  // Prompt for configuration if not set, then retrieve it
  const configData = await getConfiguration(config, true);

  const { service, model, apiKey, systemPrompt } = configData; // model is now included

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
        logger.error(chalk.red(`Invalid service configured: ${service}. Use \`ais set\`.`));
        process.exit(1);
    }
  } catch (error) {
    logger.error(chalk.red(`Error initializing AI client for ${SUPPORTED_SERVICES[service]}:`), error.message);
    logger.error(chalk.yellow('Ensure your API key is correct (`ais set`) and you have network connectivity.'));
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
    printVersionDiff();
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
          response = await streamOpenAIResponse(aiClient, model, input, systemPrompt, conversationHistory);
          break;
        case 'anthropic':
          // Pass the configured model ID to the stream function
          response = await streamAnthropicResponse(aiClient, model, input, systemPrompt, conversationHistory);
          break;
        case 'google':
          response = await streamGoogleResponse(aiClient, model, input, systemPrompt, conversationHistory);
      }
    } catch (turnError) {
      logger.error(chalk.red('\nAn unexpected error occurred during processing:'), turnError.message);
      response = null;
    }

    if (response === null) {
      logger.log(chalk.red('Attempting to continue session. Enter your next prompt or Ctrl+C to exit.'));
    }

    // Add to the running thread
    conversationHistory.push({ role: 'user', content: input });
    if (response) {
      conversationHistory.push({ role: 'assistant', content: response });
    }

    // Prompt the user for the next message
    rl.prompt();
  }

  // --- Start the Chat ---
  if (initialPrompt) {
    logger.log(chalk.blue(`Using model: ${chalk.bold(model)}`)); // Inform user which model is active
    logger.log(chalk.yellow(`You: ${initialPrompt}`));
    await processTurn(initialPrompt);
  } else {
    logger.log(chalk.blue(`Starting interactive chat with ${SUPPORTED_SERVICES[service]} (Model: ${chalk.bold(model)}). Press Ctrl+C to exit.`));
    // Prompt the user for the 1st message
    rl.prompt();
  }

  rl.on('line', async (line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Empty line detected - launch editor
      let editorInput = '';
      try {
        // Pause readline to prevent interference with the editor's TTY
        rl.pause();
        editorInput = await getPromptFromEditor(); // Call the editor function
      } catch (error) {
        logger.error(chalk.red(`\nError during editor session: ${error.message}`));
        // Don't proceed, just re-prompt
        rl.resume(); // Ensure readline resumes even on error
        rl.prompt();
        return; // Stop further processing for this turn
      } finally {
        // Ensure readline is resumed AFTER the editor promise settles
        rl.resume();
      }

      if (editorInput) {
        // Display the multi-line input from the editor for clarity
        logger.log(chalk.blue('---'));
        logger.log(chalk.cyan('You (from editor):'));
        // Indent the multi-line input slightly for readability
        logger.log(editorInput.split('\n').map(l => `  ${l}`).join('\n'));
        logger.log(chalk.blue('---'));
        await processTurn(editorInput); // Process the input from the editor
      } else {
        // Editor was closed without input
        logger.log(chalk.yellow('No input received from editor.'));
        rl.prompt(); // Re-prompt the user
      }
    } else {
      // Non-empty line, process as usual
      await processTurn(trimmedLine);
    }
  });
}
