import chalk from 'chalk';

export async function streamGoogleResponse (client, modelId, prompt, history = []) {
  // 1. Format history and prompt for Google's `generateContentStream`
  // Google expects roles 'user' and 'model'. Map 'assistant' -> 'model'.
  // The 'contents' array should represent the conversation turn-by-turn.
  const googleHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // The final message in the 'contents' array must be the current user prompt
  const contents = [
    ...googleHistory,
    { role: 'user', parts: [{ text: prompt }] }
  ];

  try {
    // 2. Initiate the streaming request
    const result = await client.models.generateContentStream({
      model: modelId,
      contents
    });

    let fullResponse = '';
    process.stdout.write(chalk.green('AI: ')); // Using green for Google

    // 4. Iterate over the stream chunks
    for await (const chunk of result) {
      // https://ai.google.dev/api/generate-content#text_gen_text_only_prompt_streaming-JAVASCRIPT
      process.stdout.write(chalk.green(chunk.text));
    }

    process.stdout.write('\n'); // Ensure a newline after the response
    return fullResponse;

  } catch (error) {
    // 5. Handle potential errors
    console.error(chalk.red(`\nError calling Google API (Model: ${modelId}):`), error.message);

    // Try to provide more specific feedback based on common Google API errors
    // Error messages/codes might vary, this is based on common patterns.
    if (error.message.includes('API key not valid') || error.message.includes('PERMISSION_DENIED')) {
      console.error(chalk.yellow('Authentication error. Check your API key using `ais set`.'));
    } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error(chalk.yellow('Rate limit or quota exceeded. Please wait and try again or check your Google Cloud/AI Studio plan.'));
    } else if (error.message.includes('not found') || error.message.includes('NOT_FOUND') || error.message.includes(`Model '${modelId}' not found`)) {
      console.error(chalk.yellow(`Model not found: ${modelId}. Check the model name or your access permissions. Use 'ais set' to choose a different model.`));
    } else if (error.message.includes('Invalid') || error.message.includes('INVALID_ARGUMENT')) {
      console.error(chalk.yellow(`Invalid request parameter, potentially related to the model ${modelId} or prompt structure (e.g., history format). Check API documentation or try 'ais set'.`));
      // TODO: Add specific handling for safety blocks if needed (error might indicate this, or it might be in the response stream)
    } else if (error.message.includes('SAFETY')) {
      console.error(chalk.yellow('The response was blocked due to safety settings. This might be due to the prompt or the generated content.'));
    }

    return null;
  }
}
