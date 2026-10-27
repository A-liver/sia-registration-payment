import mysql from 'mysql2/promise';

// The legacy mock has its own database, separate from the main system's database.
export function legacyDbName(env = process.env) {
  return env.LEGACY_DB_NAME ?? 'sia_legacy';
}

export function dbConfig(env = process.env) {
  return {
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? 'root',
    password: env.DB_PASSWORD ?? '',
  };
}

export function createPool(env = process.env) {
  return mysql.createPool({
    ...dbConfig(env),
    database: legacyDbName(env),
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5000,
  });
}
