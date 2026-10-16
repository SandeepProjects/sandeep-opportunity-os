import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let dbUrl;
for (const line of content.split('\n')) {
  const match = line.match(/^DATABASE_URL=(.+)$/);
  if (match) { dbUrl = match[1].trim(); break; }
}
const sql = neon(dbUrl);

async function run() {
  await sql.query(`
    INSERT INTO public.agents (id, display_name, slug, role, status, is_active, source_type, description)
    VALUES 
      ('sandy_muse', 'Sandy Muse (Legacy Alias)', 'sandy-muse', 'Lead AI Scout (Legacy Alias for Bago Muse)', 'active', true, 'Alias', 'Legacy alias for bago_muse'),
      ('haya_muse_1', 'Haya Muse 1 (Legacy Alias)', 'haya-muse-1', 'Enterprise Careers (Legacy Alias for Haya Satnam)', 'active', true, 'Alias', 'Legacy alias for haya_satnam'),
      ('haya_muse_2', 'Haya Muse 2 (Legacy Alias)', 'haya-muse-2', 'Scholarship Scout (Legacy Alias for Haya Satnam)', 'active', true, 'Alias', 'Legacy alias for haya_satnam'),
      ('vargo_spark', 'Vargo Spark (Legacy Alias)', 'vargo-spark', 'Outreach Specialist (Legacy Alias for Kattu AI)', 'active', true, 'Alias', 'Legacy alias for kattu_ai'),
      ('katoo_spark', 'Katoo Spark (Legacy Alias)', 'katoo-spark', 'Remote Scout (Legacy Alias for Kattu AI)', 'active', true, 'Alias', 'Legacy alias for kattu_ai')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Legacy alias agents registered in Neon.');

  const agents = await sql.query('SELECT id, display_name, status FROM public.agents ORDER BY id');
  console.log('Total Agents in Neon:', agents.length);
  for (const a of agents) {
    console.log(`- ${a.id.padEnd(16)}: ${a.display_name} (${a.status})`);
  }
}

run().catch(console.error);
