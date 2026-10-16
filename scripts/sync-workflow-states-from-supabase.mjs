import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { querySql } from '../.secrets/query_db.mjs';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let dbUrl;
for (const line of content.split('\n')) {
  const match = line.match(/^DATABASE_URL=(.+)$/);
  if (match) { dbUrl = match[1].trim(); break; }
}
const sql = neon(dbUrl);

async function main() {
  console.log('[Syncing Workflow States from Supabase to Neon]...');
  const countRes = await querySql('SELECT count(*) as total FROM workflow_states;');
  const totalWfs = parseInt(countRes[0].total, 10);
  console.log(`Found ${totalWfs} workflow states in Supabase.`);

  const batchSize = 500;
  let offset = 0;

  while (offset < totalWfs) {
    const wfBatch = await querySql(
      `SELECT * FROM workflow_states ORDER BY opportunity_id LIMIT ${batchSize} OFFSET ${offset};`
    );

    const wfRows = wfBatch.map(wf => ({
      opportunity_id: wf.opportunity_id,
      owner_id: wf.owner_id || null,
      status: wf.status || 'New',
      priority: wf.priority || 'P2',
      favorite: Boolean(wf.favorite),
      follow_up_date: wf.follow_up_date || null,
      personal_notes: wf.personal_notes || '',
      contacted_date: wf.contacted_date || null,
      applied_date: wf.applied_date || null,
      updated_at: wf.updated_at || new Date().toISOString()
    }));

    await sql.query(`
      INSERT INTO public.workflow_states (
        opportunity_id, owner_id, status, priority, favorite,
        follow_up_date, personal_notes, contacted_date, applied_date, updated_at
      )
      SELECT
        opportunity_id, owner_id, status, priority, favorite,
        follow_up_date, personal_notes, contacted_date, applied_date, updated_at
      FROM jsonb_to_recordset($1::jsonb) AS (
        opportunity_id text, owner_id uuid, status text, priority text, favorite boolean,
        follow_up_date date, personal_notes text, contacted_date date, applied_date date, updated_at timestamptz
      )
      ON CONFLICT (opportunity_id) DO UPDATE SET
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        favorite = EXCLUDED.favorite,
        follow_up_date = EXCLUDED.follow_up_date,
        personal_notes = EXCLUDED.personal_notes,
        contacted_date = EXCLUDED.contacted_date,
        applied_date = EXCLUDED.applied_date,
        updated_at = EXCLUDED.updated_at;
    `, [JSON.stringify(wfRows)]);

    offset += batchSize;
    console.log(`  ✓ Synced batch: ${Math.min(offset, totalWfs)} / ${totalWfs} workflow states`);
  }

  // Verify target opportunity in Neon
  const target = await sql`
    SELECT o.id, w.status, w.priority, w.personal_notes
    FROM public.opportunities o
    JOIN public.workflow_states w ON o.id = w.opportunity_id
    WHERE o.id = 'opp_visa_221d6a8f45de';
  `;
  console.log('\nVerified target in Neon:', target[0]);
}

main().catch(console.error);
