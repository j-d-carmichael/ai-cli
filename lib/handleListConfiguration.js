import chalk from 'chalk';
import { AVAILABLE_MODELS, SUPPORTED_SERVICES } from './availableResources.js';
import { logger } from './logger.js';

export async function handleListConfiguration () {
  logger.log(chalk.blue('---- Available resources ---- '));
  logger.log('');
  logger.log(chalk.blue('Service providers:'));
  for (const key in SUPPORTED_SERVICES) {
    logger.log(`  ${chalk.green(SUPPORTED_SERVICES[key])}`);
  }

  logger.log(chalk.blue('\nModels:'));
  for (const key in AVAILABLE_MODELS) {
    for (let i = 0; i < AVAILABLE_MODELS[key].length; i++) {
      logger.log(`  ${chalk.green(AVAILABLE_MODELS[key][i]['name'])}`);
    }
  }
  logger.log('');
  logger.log(chalk.blue.italic('(If there is a model for the service, please enter it as a custom model string)'));
  logger.log('');
  logger.log(chalk.blue('---- Available resources ---- '));
  process.exit();
}
