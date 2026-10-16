import { getNeonClient } from '../src/server/neonBackendService.mjs';
import { querySql } from '../.secrets/query_db.mjs';

async function main() {
  const sql = getNeonClient();

  console.log('Fetching all IDs from Supabase...');
  const supaRows = await querySql('SELECT id FROM opportunities;');
  const supaIds = new Set(supaRows.map(r => r.id));
  console.log(`Supabase total: ${supaIds.size}`);

  console.log('Fetching all IDs from Neon...');
  const neonRows = await sql`SELECT id FROM public.opportunities;`;
  const neonIds = new Set(neonRows.map(r => r.id));
  console.log(`Neon total: ${neonIds.size}`);

  // Find IDs in Neon but not in Supabase
  const neonOnlyIds = [];
  for (const id of neonIds) {
    if (!supaIds.has(id)) {
      neonOnlyIds.push(id);
    }
  }

  console.log(`\nFound ${neonOnlyIds.length} Neon-only opportunities (Expected: 39).`);

  // Fetch full details of these 39 opportunities from Neon
  const neonOnlyDetails = await sql`
    SELECT 
      o.*,
      s.source_id,
      s.source_tab,
      s.source_row_reference,
      s.original_url as s_original_url,
      s.canonical_url as s_canonical_url
    FROM public.opportunities o
    LEFT JOIN public.opportunity_sources s ON o.id = s.opportunity_id
    WHERE o.id = ANY(${neonOnlyIds})
    ORDER BY o.created_at DESC;
  `;

  console.log('\n--- 39 NEON-ONLY RECORDS AUDIT ---');
  for (let i = 0; i < neonOnlyDetails.length; i++) {
    const opp = neonOnlyDetails[i];
    console.log(`\n[#${i + 1}] ID: ${opp.id}`);
    console.log(`  Title: ${opp.title}`);
    console.log(`  Company/Org: ${opp.organization}`);
    console.log(`  Category: ${opp.category}`);
    console.log(`  Location/Country: ${opp.location} / ${opp.country}`);
    console.log(`  Discovered By Agent: ${opp.discovered_by_agent}`);
    console.log(`  Source ID: ${opp.source_id}`);
    console.log(`  Source Tab: ${opp.source_tab}`);
    console.log(`  Source Row Ref: ${opp.source_row_reference}`);
    console.log(`  Source URL: ${opp.source_url}`);
    console.log(`  Canonical URL: ${opp.canonical_url}`);
    console.log(`  First Seen: ${opp.first_seen_at}`);
    console.log(`  Last Verified: ${opp.last_verified_at}`);
    console.log(`  Fingerprint: ${opp.fingerprint}`);
    console.log(`  Score Total: ${opp.score_total}`);
    console.log(`  Details:`, JSON.stringify(opp.details).slice(0, 150));
  }
}

main().catch(console.error);
