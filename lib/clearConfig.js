import chalk from 'chalk';
import inquirer from 'inquirer';
import Conf from 'conf';
import { logger } from './logger.js';

/**
 * Utility to reset/remove all stored configuration for ais-cli
 */
export async function clearConfig () {
  const config = new Conf({ projectName: 'ais-cli' });

  // Check if there is any config to remove
  if (Object.keys(config.store).length === 0) {
    logger.log(chalk.yellow('No configuration found. Nothing to reset.'));
    process.exit();
  }

  // Show what will be deleted
  logger.log(chalk.yellow('Current configuration:'));
  const service = config.get('service');
  const model = config.get('model');
  const serviceKeys = config.get('serviceKeys') || {};

  if (service) logger.log(`  Service: ${chalk.bold(service)}`);
  if (model) logger.log(`  Model: ${chalk.bold(model)}`);

  if (Object.keys(serviceKeys).length > 0) {
    logger.log('  Stored API keys for:');
    Object.keys(serviceKeys).forEach(svc => {
      // Show masked version of the keys
      const maskedKey = serviceKeys[svc].substring(0, 5) + '*'.repeat(10);
      logger.log(`    - ${svc}: ${maskedKey}`);
    });
  }

  logger.log(chalk.yellow(`\nConfiguration file location: ${config.path}`));

  // Confirm deletion
  const { confirmReset } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmReset',
      message: 'Are you sure you want to remove all stored configuration including API keys?',
      default: false,
    }
  ]);

  if (confirmReset) {
    config.clear();
    logger.log(chalk.green('All configuration has been successfully removed.'));
  } else {
    logger.log(chalk.blue('Operation cancelled. Configuration remains unchanged.'));
  }
}
