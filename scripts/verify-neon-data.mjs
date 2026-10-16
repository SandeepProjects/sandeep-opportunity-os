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

async function verify() {
  const oppCount = await sql.query('SELECT count(*)::int as cnt FROM public.opportunities');
  console.log('Total Opportunities in Neon:', oppCount[0].cnt);

  const agentBreakdown = await sql.query('SELECT discovered_by_agent, count(*)::int as count FROM public.opportunities GROUP BY discovered_by_agent ORDER BY count DESC');
  console.log('Opportunities by Agent in Neon:', agentBreakdown);

  const crmSaved = await sql.query('SELECT status, count(*)::int as count FROM public.workflow_states GROUP BY status ORDER BY count DESC');
  console.log('Workflow States in Neon:', crmSaved);

  const sourcesCount = await sql.query('SELECT count(*)::int as cnt FROM public.opportunity_sources');
  console.log('Opportunity Sources Provenance Rows in Neon:', sourcesCount[0].cnt);

  const attrCount = await sql.query('SELECT agent_id, count(*)::int as count FROM public.opportunity_agent_attribution GROUP BY agent_id ORDER BY count DESC');
  console.log('Opportunity Agent Attribution in Neon:', attrCount);

  const userNotes = await sql.query("SELECT count(*)::int as cnt FROM public.workflow_states WHERE personal_notes IS NOT NULL AND personal_notes != ''");
  console.log('Sandeep Personal Notes preserved in Neon:', userNotes[0].cnt);

  const favorites = await sql.query("SELECT count(*)::int as cnt FROM public.workflow_states WHERE favorite = true");
  console.log('Favorites preserved in Neon:', favorites[0].cnt);

  const followUps = await sql.query("SELECT count(*)::int as cnt FROM public.workflow_states WHERE follow_up_date IS NOT NULL");
  console.log('Follow-up Dates preserved in Neon:', followUps[0].cnt);
}

verify().catch(console.error);
