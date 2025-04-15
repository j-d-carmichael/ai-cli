import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import chalk from 'chalk';

/**
 * Launches the default editor to edit a temporary file.
 * Waits for the editor to close and returns the file content.
 * @returns {Promise<string>} The content entered by the user in the editor.
 * @throws {Error} If the editor fails to launch or exits with an error.
 */
export async function getPromptFromEditor (defaultValue = '') {
  const editor = process.env.EDITOR || 'nano'; // Default to nano if EDITOR is not set
  let tempFilePath = '';
  let tempDir = '';

  try {
    // Create a unique temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ais-prompt-'));
    tempFilePath = path.join(tempDir, 'prompt.txt');

    // Create an empty file to ensure it exists for the editor
    await fs.writeFile(tempFilePath, defaultValue);

    console.log(chalk.yellow(`Launching editor (${editor}) for prompt input...`));

    // Spawn the editor process
    const editorProcess = spawn(editor, [tempFilePath], {
      stdio: 'inherit', // Connect editor's stdin, stdout, stderr to the terminal
    });

    // Wait for the editor process to close
    await new Promise((resolve, reject) => {
      editorProcess.on('error', (err) => {
        reject(new Error(`Failed to start editor '${editor}': ${err.message}. Is it installed and in your PATH?`));
      });
      editorProcess.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('Editor closed. Reading content...'));
          resolve();
        } else {
          reject(new Error(`Editor '${editor}' exited with non-zero code: ${code}`));
        }
      });
    });

    // Read the content from the temporary file
    const content = await fs.readFile(tempFilePath, 'utf8');
    return content.trim();

  } finally {
    // Clean up the temporary file and directory
    try {
      if (tempFilePath) {
        await fs.unlink(tempFilePath);
      }
      if (tempDir) {
        await fs.rmdir(tempDir);
      }
    } catch (cleanupError) {
      // Log cleanup error but don't throw, as we might have the content already
      console.warn(chalk.yellow(`Warning: Failed to clean up temporary file/directory: ${cleanupError.message}`));
    }
  }
}
