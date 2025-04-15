import chalk from 'chalk';
import { AVAILABLE_MODELS, SUPPORTED_SERVICES } from './availableResources.js';

export async function handleListConfiguration () {
  console.log(chalk.blue('---- Available resources ---- '));
  console.log('');
  console.log(chalk.blue('Service providers:'));
  for (const key in SUPPORTED_SERVICES) {
    console.log(`  ${chalk.green(SUPPORTED_SERVICES[key])}`);
  }

  console.log(chalk.blue('\nModels:'));
  for (const key in AVAILABLE_MODELS) {
    for (let i = 0; i < AVAILABLE_MODELS[key].length; i++) {
      console.log(`  ${chalk.green(AVAILABLE_MODELS[key][i]['name'])}`);
    }
  }
  console.log('');
  console.log(chalk.blue.italic('(If there is a model for the service, please enter it as a custom model string)'));
  console.log('');
  console.log(chalk.blue('---- Available resources ---- '));
  process.exit();
}
