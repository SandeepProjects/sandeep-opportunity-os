import { getNeonClient } from '../src/server/neonBackendService.mjs';

async function main() {
  const sql = getNeonClient();

  const satnamOpps = await sql`
    SELECT 
      category,
      count(*)::int as count
    FROM public.opportunities
    WHERE discovered_by_agent = 'haya_satnam'
    GROUP BY category
    ORDER BY count DESC;
  `;
  console.log('Categories for discovered_by_agent = haya_satnam:');
  console.table(satnamOpps);

  // Check sources in opportunity_sources for haya_satnam
  const satnamSources = await sql`
    SELECT 
      s.source_id,
      s.source_tab,
      count(DISTINCT s.opportunity_id)::int as count
    FROM public.opportunity_sources s
    JOIN public.opportunities o ON s.opportunity_id = o.id
    WHERE o.discovered_by_agent = 'haya_satnam'
    GROUP BY s.source_id, s.source_tab
    ORDER BY count DESC;
  `;
  console.log('\nSources for discovered_by_agent = haya_satnam:');
  console.table(satnamSources);

  // Check if any genuine Muse_Satnam records exist
  const trueSatnam = await sql`
    SELECT count(*)::int as cnt
    FROM public.opportunity_sources
    WHERE source_id LIKE 'satnam_%';
  `;
  console.log('\nOpportunities with source_id LIKE "satnam_%":', trueSatnam[0].cnt);
}

main().catch(console.error);
