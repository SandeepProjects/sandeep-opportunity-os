import { getNeonClient } from '../src/server/neonBackendService.mjs';

async function main() {
  const sql = getNeonClient();
  const runs = await sql`
    SELECT run_id, trigger_type, status, started_at, completed_at, duration_sec, sources_succeeded, sources_failed, raw_count, accepted_count, user_fields_preserved
    FROM public.source_sync_runs
    ORDER BY started_at DESC
    LIMIT 5;
  `;
  console.table(runs);
}

main().catch(console.error);
