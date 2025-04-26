import https from 'https';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version, name } = JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8'));

let diff = false;

export function checkForUpdate () {
  const url = `https://registry.npmjs.org/${name}/latest`;

  https.get(url, (res) => {
    let data = '';

    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const latest = JSON.parse(data).version;
      if (latest !== version) {
        diff = `ai-shell - update available: ${version} → ${latest}`;
      }
    });
  }).on('error', () => {
    // fail silently
  });
}

export function printVersionDiff () {
  diff && console.log(diff);
}
