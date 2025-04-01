import chalk from 'chalk';
import inquirer from 'inquirer';
import { AVAILABLE_MODELS, SUPPORTED_SERVICES } from './availableResources.js';

export async function handleSetConfiguration(config, exitAfter = false) {
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

    // 3. API Key Management
    // Get stored API keys per service
    const serviceKeys = config.get('serviceKeys') || {};
    const existingKey = serviceKeys[selectedService];

    let apiKey;

    // If we have an existing key for this service, offer to reuse it
    if (existingKey) {
      // Mask the key, show only first 5 characters
      const maskedKey = existingKey.substring(0, 5) + '*'.repeat(10);

      const reuseKeyAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reuseKey',
          message: `Found existing API key (${maskedKey}) for ${SUPPORTED_SERVICES[selectedService]}. Do you want to use it?`,
          default: true,
        }
      ]);

      if (reuseKeyAnswer.reuseKey) {
        apiKey = existingKey;
        console.log(chalk.green('Using existing API key.'));
      } else {
        // If they don't want to reuse, ask for a new key
        const keyAnswer = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKey',
            message: `Enter your new API key for ${SUPPORTED_SERVICES[selectedService]}:`,
            mask: '*',
            validate: (input) => !!input || 'API Key cannot be empty.',
          },
        ]);
        apiKey = keyAnswer.apiKey;
      }
    } else {
      // No existing key, ask for a new one
      const keyAnswer = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `Enter your API key for ${SUPPORTED_SERVICES[selectedService]}:`,
          mask: '*',
          validate: (input) => !!input || 'API Key cannot be empty.',
        },
      ]);
      apiKey = keyAnswer.apiKey;
    }

    // 4. Save Configuration
    config.set('service', selectedService);
    config.set('model', selectedModel);
    config.set('apiKey', apiKey); // Set current active API key

    // Store API key by service
    serviceKeys[selectedService] = apiKey;
    config.set('serviceKeys', serviceKeys);

    console.log(chalk.green('\nConfiguration saved successfully!'));
    console.log(`  Service: ${chalk.bold(SUPPORTED_SERVICES[selectedService])}`);
    console.log(`  Model:   ${chalk.bold(selectedModel)}`);
    console.log(chalk.yellow(`\nNote: Your API keys are stored locally. Location: ${config.path}`));

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
      console.error(error);
    }

    if (exitAfter) {
      process.exit(1);
    }
    return false;
  }
}
