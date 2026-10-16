import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually to get DATABASE_URL without leaking secrets
const envPath = path.resolve(process.cwd(), '.env.local');
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^DATABASE_URL=(.+)$/);
    if (match) {
      dbUrl = match[1].trim();
      break;
    }
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in environment or .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function testConnection() {
  try {
    const res = await sql`SELECT version(), current_database() as db_name, current_user as db_user;`;
    console.log('[Neon Check] Connection successful!');
    console.log('[Neon Check] Database:', res[0].db_name);
    console.log('[Neon Check] User:', res[0].db_user);
    console.log('[Neon Check] Engine Version:', res[0].version.split(' ')[0], res[0].version.split(' ')[1]);
  } catch (err) {
    console.error('[Neon Check] Connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
