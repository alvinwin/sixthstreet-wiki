import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateDAData } from '../src/validate-da.js';

const dataPath = fileURLToPath(new URL('../data/deadly-assault.json', import.meta.url));

try {
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  const errors = validateDAData(data, { now: new Date() });
  if (errors.length > 0) {
    console.error(`Deadly Assault data is invalid: ${dataPath}`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Deadly Assault data is valid: ${dataPath}`);
  }
} catch (error) {
  console.error(`Unable to validate Deadly Assault data: ${error.message}`);
  process.exitCode = 1;
}
