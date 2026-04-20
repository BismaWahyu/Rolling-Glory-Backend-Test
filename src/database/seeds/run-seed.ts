import dataSource from '../data-source';
import { seedAdmin } from './seed-admin';
import { seedGifts } from './seed-gifts';

async function run() {
  console.log('Initializing data source…');
  await dataSource.initialize();
  console.log('Running seeders:');
  try {
    await seedAdmin(dataSource);
    await seedGifts(dataSource);
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
