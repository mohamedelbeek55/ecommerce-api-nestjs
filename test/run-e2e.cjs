const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Pool } = require('pg');

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
  const line = envFile
    .split(/\r?\n/)
    .find((value) => value.trim().startsWith('DATABASE_URL='));

  if (!line) {
    throw new Error('DATABASE_URL is required to run e2e tests');
  }

  return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

async function ensureTestDatabase(testDatabaseUrl) {
  const testUrl = new URL(testDatabaseUrl);
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = '/postgres';

  const pool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const databaseName = testUrl.pathname.slice(1);
    const result = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (result.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await pool.end();
  }
}

async function main() {
  const developmentUrl = readDatabaseUrl();
  const testUrl = new URL(developmentUrl);
  testUrl.pathname = '/ecommerce_test';
  const environment = {
    ...process.env,
    DATABASE_URL: testUrl.toString(),
    NODE_ENV: 'test',
    STRIPE_SECRET_KEY: 'sk_test_e2e_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_e2e_secret',
    NODE_OPTIONS: [
      process.env.NODE_OPTIONS,
      '--experimental-vm-modules',
    ].filter(Boolean).join(' '),
  };

  await ensureTestDatabase(testUrl.toString());

  const migrate = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'migrate', 'deploy'],
    { env: environment, stdio: 'inherit', shell: process.platform === 'win32' },
  );

  if (migrate.status !== 0) {
    if (migrate.error) {
      console.error(migrate.error);
    }
    process.exit(migrate.status ?? 1);
  }

  const jest = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['jest', '--config', './test/jest-e2e.json', '--runInBand', '--forceExit', ...process.argv.slice(2)],
    { env: environment, stdio: 'inherit', shell: process.platform === 'win32' },
  );

  process.exit(jest.status ?? 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
