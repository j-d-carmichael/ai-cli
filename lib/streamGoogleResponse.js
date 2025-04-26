import chalk from 'chalk';
import { VerboseLogger } from './VerboseLogger.js';
import formatMarkdown from './markdownFormatter.js';
import { logger } from './logger.js';
import { createSpinner } from './createSpinner.js';

export async function streamGoogleResponse (client, modelId, promptUser, promptSystem, history = []) {
  // 1. Format history
  const googleHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const contents = [
    ...googleHistory,
    { role: 'user', parts: [{ text: promptUser }] }
  ];

  const spin = createSpinner('Google');

  try {

    // 2. Create payload
    const createPayload = {
      model: modelId,
      contents: contents,
      ...(promptSystem && { systemInstruction: { parts: [{ text: promptSystem }] } })
    };
    VerboseLogger.log('streamGoogleResponse.js', 'Payload:', createPayload);

    // 3. Initiate the streaming request
    // According to the error log, this method returns the async iterator directly.
    const streamIterator = await client.models.generateContentStream(createPayload);
    VerboseLogger.log('streamGoogleResponse.js', 'Raw API Result: Async Iterator received.'); // Log confirmation

    // ***** START UPDATED CHECK *****
    // Verify that the result is a valid async iterator
    if (!streamIterator || typeof streamIterator[Symbol.asyncIterator] !== 'function') {
      logger.error(chalk.red(`\nError: Google API did not return a valid stream iterator (Model: ${modelId}).`));
      logger.error(chalk.grey('Received structure type:'), typeof streamIterator, streamIterator); // Log what was received
      // Check for potential blocking feedback if the iterator is missing/invalid but there's other info
      // Note: The SDK might throw before this if there's a blocking error, but this is a fallback.
      // if (streamIterator && streamIterator.promptFeedback) { // Adapt if the SDK wraps errors differently
      //      logger.warn(chalk.yellow('Prompt Feedback received instead of stream:'), streamIterator.promptFeedback);
      //      if (streamIterator.promptFeedback.blockReason) {
      //          logger.error(chalk.red(`Request potentially blocked due to: ${streamIterator.promptFeedback.blockReason}`));
      //      }
      // }
      return null; // Exit gracefully
    }
    // ***** END UPDATED CHECK *****

    let fullResponse = '';
    // 4. Iterate directly over the stream iterator
    //    CHANGE: Iterate over streamIterator, not result.stream
    for await (const chunk of streamIterator) {
      // Check if the chunk itself is valid and has the expected structure
      if (!chunk || !chunk.candidates || !Array.isArray(chunk.candidates) || chunk.candidates.length === 0) {
        VerboseLogger.log('streamGoogleResponse.js', 'Received empty or invalid chunk:', chunk);
        continue; // Skip this chunk
      }

      const response = chunk.candidates[0];
      if (response?.content?.parts) {
        const text = response.content.parts[0].text || '';
        fullResponse += text;
      } else if (response?.finishReason) {
        VerboseLogger.log('streamGoogleResponse.js', `Stream finished. Reason: ${response.finishReason}`);
        if (response.finishReason === 'SAFETY' && response.safetyRatings) {
          logger.warn(chalk.yellow('\nWarning: Response potentially blocked due to safety settings.'), response.safetyRatings);
        } else if (response.finishReason === 'RECITATION') {
          logger.warn(chalk.yellow('\nWarning: Response potentially blocked due to recitation policy.'), response.safetyRatings);
        } else if (response.finishReason === 'OTHER') {
          logger.warn(chalk.yellow('\nWarning: Stream finished for an "OTHER" reason. Check verbose logs.'), response);
        }
        // Note: 'STOP' and 'MAX_TOKENS' are normal finish reasons.
      } else {
        // Log unexpected chunk structure
        VerboseLogger.log('streamGoogleResponse.js', 'Received chunk with unexpected structure:', chunk);
      }
    }

    // 5. Format the accumulated response
    spin.stop();
    process.stdout.write('\n');
    process.stdout.write(chalk.green('AI: '));
    process.stdout.write('\n');
    const formatted = formatMarkdown(fullResponse);
    process.stdout.write(chalk.cyan(formatted));

    // 6. Return the formatted response
    return formatted;

  } catch (error) {
    spin.stop();

    // 7. Handle potential errors
    VerboseLogger.log('streamGoogleResponse.js', 'Caught Error:', error);

    const errorMessage = error?.message || 'Unknown error';
    // Check if the error object contains details about blocking, common in Google AI SDK errors
    let blockReason = null;
    if (error?.errorInfo?.reason) { // Structure might vary, check SDK docs or error object
      blockReason = error.errorInfo.reason;
    } else if (error?.message?.includes('SAFETY') || error?.message?.includes('blocked')) { // Fallback check
      blockReason = 'SAFETY/OTHER';
    }

    logger.error(chalk.red(`\nError during Google API call or processing (Model: ${modelId}):`), errorMessage);

    // Specific error checks
    if (errorMessage.includes('API key not valid') || errorMessage.includes('PERMISSION_DENIED')) {
      logger.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      logger.error(chalk.yellow('Rate limit or quota exceeded. Please wait and try again or check your Google Cloud/AI Studio plan.'));
    } else if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND') || errorMessage.includes(`Model '${modelId}' not found`)) {
      logger.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('INVALID_ARGUMENT')) {
      logger.error(chalk.yellow(`Invalid request parameter, potentially related to the model ${modelId} or prompt structure. Check API documentation or try 'ais set'.`));
    } else if (blockReason) {
      logger.error(chalk.yellow(`The request or response was blocked (Reason: ${blockReason}). This might be due to the prompt or the generated content.`));
      if (error?.errorInfo?.safetyRatings) {
        logger.warn(chalk.grey('Safety Ratings:'), error.errorInfo.safetyRatings);
      }
    } else if (error.response && error.response.data) {
      logger.error(chalk.grey('Detailed API Error Response:'), JSON.stringify(error.response.data, null, 2));
    }
    // The 'Symbol(Symbol.asyncIterator)' error shouldn't happen now with the corrected check/loop
    else {
      logger.error(chalk.yellow('An unexpected error occurred. Check verbose logs if enabled.'));
      console.error(error); // Log the full error stack trace
    }

    return null; // Return null on any error
  }
}
