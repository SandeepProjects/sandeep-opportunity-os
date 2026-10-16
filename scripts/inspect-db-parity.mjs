import { getNeonClient } from '../src/server/neonBackendService.mjs';
import { querySql } from '../.secrets/query_db.mjs';

async function main() {
  console.log('=== [1] NEON DATABASE INSPECTION ===');
  const sql = getNeonClient();

  // All 18 tables in public schema
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log(`Total public tables in Neon: ${tables.length}`);
  console.log(tables.map(t => t.table_name).join(', '));

  const neonOpps = await sql`SELECT count(*)::int as count FROM public.opportunities;`;
  const neonWf = await sql`SELECT count(*)::int as count FROM public.workflow_states;`;
  const neonAttr = await sql`SELECT count(*)::int as count FROM public.opportunity_agent_attribution;`;
  const neonSources = await sql`SELECT count(*)::int as count FROM public.opportunity_sources;`;
  const neonDataSources = await sql`SELECT count(*)::int as count FROM public.data_sources;`;
  const neonSyncRuns = await sql`SELECT count(*)::int as count FROM public.source_sync_runs;`;

  console.log('\nNeon Row Counts:');
  console.log({
    opportunities: neonOpps[0].count,
    workflow_states: neonWf[0].count,
    opportunity_agent_attribution: neonAttr[0].count,
    opportunity_sources: neonSources[0].count,
    data_sources: neonDataSources[0].count,
    source_sync_runs: neonSyncRuns[0].count
  });

  console.log('\n=== [2] SUPABASE BASELINE INSPECTION ===');
  const supaTables = await querySql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`Total public tables in Supabase: ${supaTables.length}`);
  console.log(supaTables.map(t => t.table_name).join(', '));

  const supaOpps = await querySql(`SELECT count(*)::int as count FROM opportunities;`);
  console.log('Supabase opportunities count:', supaOpps[0].count);

  console.log('\n=== [3] NEON AGENT ATTRIBUTION BREAKDOWN ===');
  const agentAttr = await sql`
    SELECT agent_id, count(*)::int as count 
    FROM public.opportunity_agent_attribution 
    GROUP BY agent_id 
    ORDER BY count DESC;
  `;
  console.table(agentAttr);

  console.log('\n=== [4] NEON WORKFLOW STATES BREAKDOWN ===');
  const wfStates = await sql`
    SELECT status, priority, favorite, count(*)::int as count 
    FROM public.workflow_states 
    GROUP BY status, priority, favorite 
    ORDER BY count DESC 
    LIMIT 10;
  `;
  console.table(wfStates);

  console.log('\n=== [5] LATEST SYNC RUN IN NEON ===');
  const latestRun = await sql`
    SELECT run_id, trigger_type, status, started_at, completed_at, duration_sec, sources_succeeded, sources_failed, raw_count, accepted_count, user_fields_preserved
    FROM public.source_sync_runs
    ORDER BY started_at DESC
    LIMIT 1;
  `;
  console.table(latestRun);
}

main().catch(console.error);
