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

async function applySchema() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/009_neon_multi_agent_crm_schema.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  console.log('[Neon Migration] Applying migration 009_neon_multi_agent_crm_schema.sql...');
  
  // Neon tagged template can execute raw statements or we can split clean statements
  // Split on semicolons outside quotes/functions or execute blocks
  const statements = sqlContent
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let applied = 0;
  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue;
    try {
      await sql.query(statement);
      applied++;
    } catch (err) {
      console.error('[Neon Migration Error on Statement]:', statement.slice(0, 100));
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log(`[Neon Migration] Successfully applied ${applied} statements!`);

  // Verify created tables in Neon
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  console.log('[Neon Migration] Current public tables in Neon:');
  for (const t of tables) {
    console.log(`- ${t.table_name}`);
  }
}

applySchema().catch(err => {
  console.error('[Neon Migration Fatal]', err);
  process.exit(1);
});
