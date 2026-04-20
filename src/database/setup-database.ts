import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv();

async function ensureDatabase(): Promise<void> {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const targetDb = process.env.DB_NAME;

  if (!host || !user || !targetDb) {
    throw new Error('DB_HOST, DB_USERNAME, and DB_NAME must be set in .env');
  }

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);

    if (result.rowCount && result.rowCount > 0) {
      console.log(`  • Database "${targetDb}" already exists, skipping.`);
      return;
    }

    await client.query(`CREATE DATABASE "${targetDb}"`);
    console.log(`  • Database "${targetDb}" created.`);
  } finally {
    await client.end();
  }
}

ensureDatabase()
  .then(() => {
    console.log('Database setup complete.');
  })
  .catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  });
