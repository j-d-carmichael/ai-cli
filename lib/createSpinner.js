import readline from 'readline';

export function createSpinner () {
  let spinnerFrames = ['-', '\\', '|', '/'];
  let i = 0;
  let interval = setInterval(() => {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${spinnerFrames[i++ % spinnerFrames.length]}`);
  }, 100);

  return {
    stop: () => {
      clearInterval(interval);
      readline.cursorTo(process.stdout, 0);
      process.stdout.clearLine(0);
    }
  };
}

// Usage example
// const spinner = createSpinner('Processing');
// Later when ready
// spinner.stop('Done!');
