import chalk from 'chalk';
import inquirer from 'inquirer';
import { AVAILABLE_MODELS, SUPPORTED_SERVICES } from './availableResources.js';

export async function handleSetConfiguration (config, exitAfter = false) {
  console.log(chalk.blue('Configuring AI Service:'));
  try {
    // --- 1. Ask for Service ---
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

    // --- 2. Ask for Model based on Service ---
    // Ensure there's a list (even if empty) for the service to avoid errors
    const knownModelsForService = AVAILABLE_MODELS[selectedService] || [];
    const otherOption = 'Other (not listed above, enter manually)';
    const modelChoices = [
      ...knownModelsForService,
      new inquirer.Separator(),
      otherOption,
    ];

    const modelAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `Which ${SUPPORTED_SERVICES[selectedService]} model?`,
        choices: modelChoices,
        // Default only if service hasn't changed and current model is in the list (or was 'Other')
        default: () => {
          const currentService = config.get('service');
          const currentModel = config.get('model');
          if (currentService === selectedService) {
            // If current model is one of the known ones or was 'Other', suggest it
            if (knownModelsForService.includes(currentModel) || currentModel === otherOption || !knownModelsForService.includes(currentModel)) {
              // Check if currentModel is actually a known model for *this* service,
              // if not, 'Other' might be a better implicit default, but let's try defaulting to the stored value.
              // If the stored value isn't in *this* list, inquirer might not select it, which is fine.
              return currentModel;
            }
            // If the current model isn't applicable here, don't suggest a default.
            return undefined;
          }
          return undefined; // No default if service changed
        },
        loop: false, // Prevent looping if default isn't in choices
      },
    ]);

    let finalSelectedModel = modelAnswer.model;

    // --- 2a. Prompt for Custom Model if "Other" was selected ---
    if (finalSelectedModel === otherOption) {
      const aiDocsLink = selectedService === 'anthropic' ?
        'https://docs.anthropic.com/en/docs/about-claude/models/all-models' :
        selectedService === 'google' ?
          'https://ai.google/get-started/our-models/' :
          'https://platform.openai.com/docs/models';

      const customModelAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'customModel',
          message: `Enter the name/ID for ${SUPPORTED_SERVICES[selectedService]} (${aiDocsLink}):`,
          // Try to suggest the previously entered custom model if applicable
          default: () => {
            const currentService = config.get('service');
            const currentModel = config.get('model');
            // If the service is the same and the current model wasn't one of the known ones, suggest it
            if (currentService === selectedService && !knownModelsForService.includes(currentModel)) {
              return currentModel;
            }
            return undefined;
          },
          validate: (input) => {
            const trimmedInput = input?.trim();
            if (!trimmedInput) {
              return 'Model name cannot be empty.';
            }
            if (trimmedInput.toLowerCase() === 'other') {
              return 'Please enter the actual model name, not "Other".';
            }
            return true;
          },
        },
      ]);
      // Use the validated and trimmed custom model name
      finalSelectedModel = customModelAnswer.customModel.trim();
    }

    // --- 3. API Key Management ---
    const serviceKeys = config.get('serviceKeys') || {};
    const existingKey = serviceKeys[selectedService];
    let apiKey;

    if (existingKey) {
      const maskedKey = existingKey.substring(0, 5) + '*'.repeat(Math.max(0, existingKey.length - 5)); // Safer masking
      const reuseKeyAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reuseKey',
          message: `Found existing API key (${maskedKey}) for ${SUPPORTED_SERVICES[selectedService]}. Use it?`,
          default: true,
        },
      ]);

      if (reuseKeyAnswer.reuseKey) {
        apiKey = existingKey;
        console.log(chalk.green('Using existing API key.'));
      } else {
        // Ask for a new key if not reusing
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
      // No existing key, ask for one
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

    // --- 4. Save Configuration ---
    config.set('service', selectedService);
    // Use the final model name (either predefined or custom)
    config.set('model', finalSelectedModel);
    config.set('apiKey', apiKey); // Set current active API key

    // Store/Update API key specifically for this service
    serviceKeys[selectedService] = apiKey;
    config.set('serviceKeys', serviceKeys);

    console.log(chalk.green('\nConfiguration saved successfully!'));
    console.log(`  Service: ${chalk.bold(SUPPORTED_SERVICES[selectedService])}`);
    // Display the final model name
    console.log(`  Model:   ${chalk.bold(finalSelectedModel)}`);
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
      // Check if it's an inquirer interrupt (Ctrl+C often results in undefined answers which might trigger later errors,
      // or inquirer itself might throw). A simple check:
      if (error.message.includes('canceled')) { // Or check specific error types if inquirer provides them
        console.log(chalk.yellow('\nConfiguration cancelled.'));
      } else {
        console.error(chalk.red('\nConfiguration failed:'), error.message);
        // console.error(error); // Optional: log the full error for debugging
      }
    }

    if (exitAfter) {
      process.exit(1);
    }
    return false; // Indicate failure
  }
}
