import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

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
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/010_agent_fleet_architecture_and_sources.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  // Strip whole-line comments first, then split on semicolons
  const cleanedSql = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let count = 0;
  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue;
    try {
      await sql.query(statement);
      count++;
      console.log(`[Statement ${count} OK]:`, statement.slice(0, 60).replace(/\n/g, ' '));
    } catch (err) {
      console.error(`[Error on Statement ${count + 1}]:`, statement.slice(0, 100));
      console.error(err);
      process.exit(1);
    }
  }

  console.log(`\n✓ Migration 010 successfully applied (${count} statements)!`);

  // Verify agents in Neon
  const agents = await sql.query('SELECT id, display_name, status, is_active, workspace_type, drive_root_id FROM public.agents ORDER BY id');
  console.log('\n[Neon Agents Table]:', agents);

  // Verify sources count
  const sources = await sql.query('SELECT count(*)::int as cnt FROM public.data_sources');
  console.log('[Neon Data Sources Count]:', sources[0].cnt);
}

run().catch(console.error);
