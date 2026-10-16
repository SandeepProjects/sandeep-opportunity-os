import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { supabaseClient } from '../src/lib/supabase/client.ts';

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

async function inspect() {
  console.log('=== NEON POSTGRESQL TABLE COUNTS ===');
  const tables = [
    'agents', 'data_sources', 'source_tabs', 'source_sync_runs', 'research_runs',
    'source_sync_results', 'opportunities', 'opportunity_sources',
    'opportunity_agent_attribution', 'workflow_states', 'applications',
    'follow_ups', 'activity_events', 'documents', 'agent_runs',
    'candidate_profile', 'organizations', 'profiles'
  ];

  for (const t of tables) {
    try {
      const res = await sql.query(`SELECT count(*)::int as cnt FROM public.${t}`);
      console.log(`Neon ${t.padEnd(30)} : ${res[0].cnt}`);
    } catch (e) {
      console.log(`Neon ${t.padEnd(30)} : ERROR (${e.message})`);
    }
  }

  console.log('\n=== SUPABASE TABLE COUNTS ===');
  const supabaseTables = [
    'opportunities', 'workflow_states', 'research_runs', 'candidate_profile',
    'applications', 'documents', 'organizations', 'profiles'
  ];

  for (const t of supabaseTables) {
    try {
      const { count, error } = await supabaseClient.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Supabase ${t.padEnd(26)} : ERROR (${error.message})`);
      } else {
        console.log(`Supabase ${t.padEnd(26)} : ${count}`);
      }
    } catch (e) {
      console.log(`Supabase ${t.padEnd(26)} : EXCEPTION (${e.message})`);
    }
  }
}

inspect().catch(console.error);
