import chalk from 'chalk';
import { VerboseLogger } from './VerboseLogger.js';
import formatMarkdown from './markdownFormatter.js';
import { logger } from './logger.js';
import { createSpinner } from './createSpinner.js';

export async function streamAnthropicResponse (client, modelId, promptUser, promptSystem, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: promptUser },
  ];

  const spin = createSpinner('Google');

  try {
    const createPayload = {
      model: modelId,
      messages: messages,
      system: promptSystem
    };
    VerboseLogger.log('streamAnthropicResponse.js', createPayload);

    const stream = client.messages.stream(createPayload);

    let fullResponse = '';
    await new Promise((resolve, reject) => {
      stream.on('text', (text) => {
        fullResponse += text;
      });
      stream.on('end', () => resolve());
      stream.on('error', (error) => reject(error));
      stream.on('message_stop', () => resolve());
    });

    spin.stop();
    process.stdout.write(chalk.magenta('AI: '));
    const formatted = formatMarkdown(fullResponse);
    process.stdout.write(chalk.magenta(formatted));

    if (!formatted.endsWith('\n')) {
      process.stdout.write('\n');
    }

    return fullResponse;
  } catch (error) {
    spin.stop();
    logger.error(chalk.red(`\nError calling Anthropic API (Model: ${modelId}):`), error.message);
    if (error.status === 401) {
      logger.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (error.status === 429) {
      logger.error(chalk.yellow('Rate limit exceeded. Please wait and try again or check your plan.'));
    } else if (error.status === 404) {
      logger.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    } else if (error.message.includes('Invalid')) {
      logger.error(chalk.yellow(`Invalid request parameter, potentially related to the model ${modelId}. Check API documentation or try 'ais set'.`));
    }
    return null;
  }
}
