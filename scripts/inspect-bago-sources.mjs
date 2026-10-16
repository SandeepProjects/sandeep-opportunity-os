import { getNeonClient } from '../src/server/neonBackendService.mjs';

async function main() {
  const sql = getNeonClient();
  const sources = await sql`
    SELECT id, name, type, owning_agent_id, pipeline, classification, drive_id, spreadsheet_id, folder_id, sync_enabled, connection_status
    FROM public.data_sources
    ORDER BY id;
  `;
  console.log(`Total sources in Neon: ${sources.length}`);
  console.table(sources);
}

main().catch(console.error);
