import chalk from 'chalk';
import { VerboseLogger } from './VerboseLogger.js';
import formatMarkdown from './markdownFormatter.js';
import { logger } from './logger.js';
import { createSpinner } from './createSpinner.js';

export async function streamOpenAIResponse (client, modelId, promptUser, promptSystem, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: promptUser },
    { role: 'system', content: promptSystem },
  ];

  const spin = createSpinner('Google');

  try {
    const createPayload = {
      model: modelId,
      messages: messages,
      stream: true,
    };
    VerboseLogger.log('streamOpenAIResponse.js', createPayload);

    const stream = await client.chat.completions.create(createPayload);

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
    }
    spin.stop();

    process.stdout.write(chalk.cyan('AI: '));
    process.stdout.write('\n');

    const formatted = formatMarkdown(fullResponse);
    process.stdout.write(chalk.cyan(formatted));
    process.stdout.write('\n');
    return fullResponse;
  } catch (error) {
    spin.stop();
    logger.error(chalk.red(`\nError calling OpenAI API (Model: ${modelId}):`), error.message);
    if (error.status === 401) {
      logger.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (error.status === 429) {
      logger.error(chalk.yellow('Rate limit exceeded. Please wait and try again or check your plan.'));
    } else if (error.status === 404) {
      logger.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    }
    return null;
  }
}
