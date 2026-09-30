import { initDb } from './index';

async function runMigration() {
  try {
    await initDb();
    console.log('🎉 Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
