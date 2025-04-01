import chalk from 'chalk';
import { handleSetConfiguration } from './handleSetConfiguration.js';

export async function getConfiguration (config, promptIfNotSet = false) {
  let service = config.get('service');
  let model = config.get('model');
  let apiKey = config.get('apiKey');
  let serviceKeys = config.get('serviceKeys');
  let systemPrompt = config.get('systemPrompt');
  if (!systemPrompt) {
    systemPrompt = 'You should be concise and as accurate as possible in your output. As few a niceties as possible. This is a developer you are talking to, they want rapid fast answers and on point. If needed, ask the user to make their question more accurate and less obtuse to enable you to provide a very on point answer.';
    config.set('systemPrompt', systemPrompt);
  }
  const isConfigIncomplete = !service || !model || !apiKey;

  if (isConfigIncomplete) {
    if (promptIfNotSet) {
      console.log(
        chalk.yellow(
          'AI Service, Model, or API Key not fully configured. Let\'s set them up.'
        )
      );
      const success = await handleSetConfiguration(config, false); // Don't exit here
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

  return { service, model, apiKey, serviceKeys, systemPrompt };
}
