import chalk from 'chalk';
import { SUPPORTED_SERVICES } from './availableResources.js';
import { getConfiguration } from './getConfiguration.js';
import { logger } from './logger.js';

export async function handleConfigurationShow (config) {

  const configData = await getConfiguration(config, false); // Don't prompt if not set

  if (configData) {
    const { service, model, serviceKeys, systemPrompt } = configData;
    logger.log(chalk.blue('Current AI Configuration:'));
    logger.log(`  System Prompt: ${chalk.green(systemPrompt)}`);
    logger.log(`  Service Provider: ${chalk.green(SUPPORTED_SERVICES[service] || service)}`);
    logger.log(`  Model:            ${chalk.green(model)}`);
    logger.log(`  API Keys saved:   ${chalk.green(Object.keys(serviceKeys).join(', '))}`);
    logger.log(`  Config Location:  ${chalk.green(config.path)}`);
    logger.log('');
    logger.log(chalk.yellow('  API Keys are stored but not displayed. Use `ais set` to update them or view the config file.'));

  } else {
    logger.log(chalk.yellow('No configuration found.'));
    logger.log(`Run ${chalk.cyan('ais set')} to configure the service, model, and API key.`);
  }

  process.exit();
}
