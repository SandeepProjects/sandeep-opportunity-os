import { getNeonClient } from '../src/server/neonBackendService.mjs';

async function main() {
  const sql = getNeonClient();

  console.log('Updating master_job_application_tracker in Neon...');
  await sql`
    UPDATE public.data_sources
    SET 
      purpose = 'application/history pipeline source',
      classification = 'ACTIVE SUPPORTING',
      owning_agent_id = 'bago_muse',
      connection_status = 'Connected',
      sync_enabled = true,
      updated_at = NOW()
    WHERE id = 'master_job_application_tracker';
  `;

  console.log('Registering dedicated graduate_schemes_tracker in Neon...');
  await sql`
    INSERT INTO public.data_sources (
      id, name, type, owning_agent_id, pipeline, classification,
      url, drive_id, spreadsheet_id, folder_id, purpose,
      sync_enabled, sync_mode, connection_status,
      record_count, records_fetched, records_parsed, records_accepted,
      records_duplicated, records_gated, canonical_records, notes,
      created_at, updated_at
    ) VALUES (
      'graduate_schemes_tracker', 'GRADUATE SCHEMES - MASTER TRACKER', 'Native Google Sheet',
      'bago_muse', 'visa_jobs', 'ACTIVE CANONICAL',
      null, null, null, '1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_',
      'graduate research/discovery source',
      false, 'AUTOMATIC_5H', 'Permission required',
      0, 0, 0, 0, 0, 0, 0,
      'Dedicated graduate scheme research and discovery source for UK/EU graduate technology schemes and visa sponsorship. Awaiting Sandeep granting access or providing file ID.',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      purpose = EXCLUDED.purpose,
      classification = EXCLUDED.classification,
      owning_agent_id = EXCLUDED.owning_agent_id,
      connection_status = EXCLUDED.connection_status,
      updated_at = NOW();
  `;

  const rows = await sql`
    SELECT id, name, owning_agent_id, pipeline, classification, purpose, connection_status, sync_enabled
    FROM public.data_sources
    WHERE id IN ('graduate_schemes_tracker', 'master_job_application_tracker');
  `;

  console.log('\nUpdated Data Sources:');
  console.table(rows);
}

main().catch(console.error);
