import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { dbConfig, legacyDbName } from './db.js';

const NAME_PATTERN = /^[A-Za-z0-9_]+$/;

// Creates the database if needed, applies schema.sql and seed.sql.
// With reset: true the database is dropped first (all legacy mock data is lost).
export async function setupDatabase({ reset = false, env = process.env } = {}) {
  const name = legacyDbName(env);
  if (!NAME_PATTERN.test(name)) {
    throw new Error('LEGACY_DB_NAME may only contain letters, digits and underscores.');
  }

  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const seed = await readFile(new URL('./seed.sql', import.meta.url), 'utf8');

  const connection = await mysql.createConnection({
    ...dbConfig(env),
    multipleStatements: true,
  });
  try {
    if (reset) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
    await connection.query(`USE \`${name}\``);
    await connection.query(schema);
    await connection.query(seed);
  } finally {
    await connection.end();
  }
  return name;
}
