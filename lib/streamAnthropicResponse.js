import chalk from 'chalk';
import { VerboseLogger } from './VerboseLogger.js';

export async function streamAnthropicResponse (client, modelId, promptUser, promptSystem, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: promptUser },
  ];

  try {
    const createPayload = {
      model: modelId,
      max_tokens: 1024,
      messages: messages,
      system: promptSystem
    };
    VerboseLogger.log('streamAnthropicResponse.js', createPayload);

    const stream = client.messages.stream(createPayload);

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
        reject(error);
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
