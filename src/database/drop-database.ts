import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv();

async function dropDatabase(): Promise<void> {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const targetDb = process.env.DB_NAME;

  if (!host || !user || !targetDb) {
    throw new Error('DB_HOST, DB_USERNAME, and DB_NAME must be set in .env');
  }

  const client = new Client({ host, port, user, password, database: 'postgres' });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);

    if (!result.rowCount) {
      console.log(`  • Database "${targetDb}" does not exist, nothing to drop.`);
      return;
    }

    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [targetDb],
    );
    await client.query(`DROP DATABASE "${targetDb}"`);
    console.log(`  • Database "${targetDb}" dropped.`);
  } finally {
    await client.end();
  }
}

dropDatabase()
  .then(() => {
    console.log('Database drop complete.');
  })
  .catch((err) => {
    console.error('Database drop failed:', err.message);
    process.exit(1);
  });
