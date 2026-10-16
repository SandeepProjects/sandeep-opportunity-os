import assert from 'node:assert/strict';
import { getNeonClient } from '../src/server/neonBackendService.mjs';
import { runServerSync } from './sync-data.mjs';

async function main() {
  console.log('=== [PHASE 6: CONTROLLED CRM PRESERVATION TEST] ===\n');
  const sql = getNeonClient();

  const testId = 'opp_control_crm_guard_2026';
  const testDate = '2027-03-25';
  const testNote = 'QA TEST — Sandeep Controlled CRM Protection Verification';

  console.log(`[1] Creating safe test opportunity ${testId}...`);
  await sql`
    INSERT INTO public.opportunities (
      id, category, title, organization, location, country,
      source_url, canonical_url, fingerprint, source_type,
      discovered_by_agent, first_seen_at, last_seen_at, last_verified_at,
      confidence, is_active, score_total, created_at, updated_at
    ) VALUES (
      ${testId}, 'freelance_leads', 'QA Controlled Test Opportunity', 'SandBox QA Org', 'Larnaca, Cyprus', 'Cyprus',
      'https://example.com/qa-crm-control-test', 'https://example.com/qa-crm-control-test',
      'freelance_leads::sandboxqaorg::qacontrolledtestopportunity', 'QA_VERIFICATION',
      'bago_muse', NOW(), NOW(), NOW(),
      'HIGH', true, 95, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
  `;

  console.log(`[2] Setting manual Sandeep CRM state...`);
  await sql`
    INSERT INTO public.workflow_states (
      opportunity_id, status, priority, favorite, follow_up_date,
      personal_notes, contacted_date, applied_date, updated_at
    ) VALUES (
      ${testId}, 'Reviewing', 'P1', true, ${testDate}::date,
      ${testNote}, '2026-10-15'::date, '2026-10-16'::date, NOW()
    )
    ON CONFLICT (opportunity_id) DO UPDATE SET
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      favorite = EXCLUDED.favorite,
      follow_up_date = EXCLUDED.follow_up_date,
      personal_notes = EXCLUDED.personal_notes,
      contacted_date = EXCLUDED.contacted_date,
      applied_date = EXCLUDED.applied_date,
      updated_at = NOW();
  `;

  try {
    console.log(`[3] Running live canonical sync...`);
    const syncResult = await runServerSync();
    console.log(`✓ Sync completed with status: ${syncResult.status}`);

    console.log(`[4] Verifying CRM state in Neon after sync...`);
    const afterSync = await sql`
      SELECT 
        opportunity_id, status, priority, favorite,
        follow_up_date, follow_up_date::text AS follow_up_date_str,
        personal_notes, contacted_date, applied_date
      FROM public.workflow_states 
      WHERE opportunity_id = ${testId};
    `;

    assert.equal(afterSync.length, 1, 'Test opportunity workflow state must exist');
    const wf = afterSync[0];

    console.log('Stored workflow state after live sync:');
    console.log({
      opportunity_id: wf.opportunity_id,
      status: wf.status,
      priority: wf.priority,
      favorite: wf.favorite,
      follow_up_date: wf.follow_up_date_str || wf.follow_up_date,
      personal_notes: wf.personal_notes,
      contacted_date: wf.contacted_date,
      applied_date: wf.applied_date
    });

    assert.equal(wf.status, 'Reviewing', 'Status must remain Reviewing');
    assert.equal(wf.priority, 'P1', 'Priority must remain P1');
    assert.equal(wf.favorite, true, 'Favorite must remain true');
    assert.equal(wf.personal_notes, testNote, 'Personal notes must remain intact');
    assert.ok(
      wf.follow_up_date_str === '2027-03-25' || String(wf.follow_up_date).includes('2027-03-25') || String(wf.follow_up_date).includes('2027-03-24T21:00'),
      'Follow-up date must remain 2027-03-25'
    );

    console.log('\n🎉 PASS: ALL 5 USER CRM VALUES REMAINED 100% UNCHANGED THROUGH CANONICAL SYNC!');
  } finally {
    console.log(`[5] Cleaning up controlled test opportunity...`);
    await sql`DELETE FROM public.workflow_states WHERE opportunity_id = ${testId};`;
    await sql`DELETE FROM public.opportunity_sources WHERE opportunity_id = ${testId};`;
    await sql`DELETE FROM public.opportunity_agent_attribution WHERE opportunity_id = ${testId};`;
    await sql`DELETE FROM public.opportunities WHERE id = ${testId};`;
    console.log('✓ Cleanup complete. Zero impact on genuine Sandeep data.');
  }
}

main().catch(err => {
  console.error('[Controlled CRM Test Failed]:', err);
  process.exit(1);
});
