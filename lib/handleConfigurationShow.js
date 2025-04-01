import chalk from 'chalk';
import { SUPPORTED_SERVICES } from './availableResources.js';
import { getConfiguration } from './getConfiguration.js';

export async function handleConfigurationShow (config) {

  const configData = await getConfiguration(config, false); // Don't prompt if not set

  if (configData) {
    const { service, model, serviceKeys } = configData;
    console.log(chalk.blue('Current AI Configuration:'));
    console.log(`  Service Provider: ${chalk.green(SUPPORTED_SERVICES[service] || service)}`);
    console.log(`  Model:            ${chalk.green(model)}`);
    console.log(`  API Keys saved:   ${chalk.green(Object.keys(serviceKeys).join(', '))}`);
    console.log(`  Config Location:  ${chalk.green(config.path)}`);
    console.log('');
    console.log(chalk.yellow('  API Keys are stored but not displayed. Use `ais set` to update them or view the config file.'));

  } else {
    console.log(chalk.yellow('No configuration found.'));
    console.log(`Run ${chalk.cyan('ais set')} to configure the service, model, and API key.`);
  }

  process.exit();
}
