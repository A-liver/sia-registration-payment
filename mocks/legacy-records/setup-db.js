import { setupDatabase } from './db-setup.js';

const reset = process.argv.includes('--reset');

try {
  const name = await setupDatabase({ reset });
  console.log(`Legacy records database "${name}" is ready${reset ? ' (reset)' : ''}.`);
} catch (error) {
  console.error(`Could not set up the legacy records database: ${error.message}`);
  process.exitCode = 1;
}
