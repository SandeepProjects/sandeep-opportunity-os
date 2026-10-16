import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNeonClient,
  getDatabaseHealth,
  fetchNeonOpportunities,
  updateNeonWorkflowState,
  authenticateAdmin,
  verifySessionToken,
  logoutSession
} from '../src/server/neonBackendService.mjs';

describe('Sandeep Opportunity OS — Neon PostgreSQL & Multi-Agent Integration Suite', () => {
  const sql = getNeonClient();

  it('1. Neon Connection & PostgreSQL Version: connects to Lakebase Postgres 18.x on AWS Frankfurt', async () => {
    assert.ok(sql, 'Neon SQL client must be initialized');
    const health = await getDatabaseHealth();
    assert.equal(health.connected, true);
    assert.equal(health.branch, 'production');
    assert.ok(health.engineVersion.includes('PostgreSQL 18'), `Expected PostgreSQL 18, got ${health.engineVersion}`);
    assert.ok(health.canonicalOpportunitiesCount >= 2800, `Expected >= 2800 opportunities, got ${health.canonicalOpportunitiesCount}`);
  });

  it('2. Schema & Tables: all 18 enterprise tables exist in public schema', async () => {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableNames = tables.map(t => t.table_name);
    const required = [
      'activity_events',
      'agent_runs',
      'agents',
      'applications',
      'candidate_profile',
      'data_sources',
      'documents',
      'follow_ups',
      'opportunities',
      'opportunity_agent_attribution',
      'opportunity_sources',
      'organizations',
      'profiles',
      'research_runs',
      'source_sync_results',
      'source_sync_runs',
      'source_tabs',
      'workflow_states'
    ];

    for (const req of required) {
      assert.ok(tableNames.includes(req), `Missing required table: ${req}`);
    }
  });

  it('3. 5-Agent Fleet Registry: Sandy Muse, Haya Muse 1 & 2, Vargo & Katoo Spark registered', async () => {
    const agents = await sql`SELECT id, display_name, role, is_active FROM public.agents ORDER BY id;`;
    const agentIds = agents.map(a => a.id);
    assert.ok(agentIds.includes('sandy_muse'), 'Sandy Muse must be registered');
    assert.ok(agentIds.includes('haya_muse_1'), 'Haya Muse 1 must be registered');
    assert.ok(agentIds.includes('haya_muse_2'), 'Haya Muse 2 must be registered');
    assert.ok(agentIds.includes('vargo_spark'), 'Vargo Spark must be registered');
    assert.ok(agentIds.includes('katoo_spark'), 'Katoo Spark must be registered');
    assert.ok(agentIds.includes('system') || agentIds.includes('system_engine'), 'System engine must be registered');
  });

  it('4. Data Sources Registry: 21 data sources classified with correct owner bindings', async () => {
    const sources = await sql`SELECT count(*) FROM public.data_sources;`;
    const count = parseInt(sources[0].count, 10);
    assert.ok(count >= 21, `Expected at least 21 data sources, found ${count}`);

    const canonicals = await sql`
      SELECT id, name, classification FROM public.data_sources 
      WHERE classification = 'ACTIVE CANONICAL';
    `;
    assert.ok(canonicals.length >= 3, `Expected at least 3 ACTIVE CANONICAL sources, got ${canonicals.length}`);
  });

  it('5. Opportunity Repository & Normalization: fetchNeonOpportunities returns normalized records', async () => {
    const res = await fetchNeonOpportunities();
    assert.equal(res.mode, 'NEON_LIVE');
    assert.ok(res.count >= 2890, `Expected >= 2890 opportunities, got ${res.count}`);
    assert.ok(Array.isArray(res.opportunities));

    const sample = res.opportunities[0];
    assert.ok(sample.id);
    assert.ok(sample.category);
    assert.ok(sample.title);
    assert.ok(sample.workflow);
    assert.ok(sample.workflow.status);
    assert.ok(sample.workflow.priority);
  });

  it('6. Strict 7-Field CRM Preservation in Neon: user notes and Interviewing status preserved', async () => {
    const target = await sql`
      SELECT o.id, w.status, w.priority, w.personal_notes
      FROM public.opportunities o
      JOIN public.workflow_states w ON o.id = w.opportunity_id
      WHERE o.id = 'opp_visa_221d6a8f45de';
    `;
    assert.equal(target.length, 1, 'Target CRM test opportunity must exist in Neon');
    assert.equal(target[0].status, 'Interviewing', 'CRM status Interviewing must be preserved');
    assert.equal(target[0].priority, 'P1', 'CRM priority P1 must be preserved');
    assert.ok(
      target[0].personal_notes.includes('First-round technical screen') || target[0].personal_notes.length > 10,
      'Personal notes must be preserved'
    );
  });

  it('7. Real-Time Workflow Mutation in Neon: updateNeonWorkflowState updates record and activity log', async () => {
    // Select an opportunity to test mutation
    const opps = await sql`SELECT id FROM public.opportunities LIMIT 1;`;
    const testId = opps[0].id;

    const originalWf = await sql`SELECT * FROM public.workflow_states WHERE opportunity_id = ${testId};`;
    const origStatus = originalWf[0]?.status || 'New';
    const origNotes = originalWf[0]?.personal_notes || '';

    // Update with test note
    const testNote = `Integration test note ${Date.now()}`;
    const result = await updateNeonWorkflowState(testId, {
      personal_notes: testNote,
      priority: 'P0'
    });

    assert.equal(result.opportunityId, testId);
    assert.equal(result.personal_notes, testNote);
    assert.equal(result.priority, 'P0');

    // Verify in database
    const verified = await sql`SELECT * FROM public.workflow_states WHERE opportunity_id = ${testId};`;
    assert.equal(verified[0].personal_notes, testNote);
    assert.equal(verified[0].priority, 'P0');

    // Restore original state
    await updateNeonWorkflowState(testId, {
      status: origStatus,
      personal_notes: origNotes,
      priority: originalWf[0]?.priority || 'P2'
    });
  });

  it('8. Neon Auth: authenticateAdmin, verifySessionToken, and logoutSession work against neon_auth schema', async () => {
    // Authenticate
    const authRes = await authenticateAdmin('sandeep.gautam@opportunity-os.local', 'sandeep2026!');
    assert.equal(authRes.success, true);
    assert.ok(authRes.token.startsWith('sess_'));
    assert.equal(authRes.user.name, 'Sandeep Gautam');

    // Verify session
    const sessionRes = await verifySessionToken(authRes.token);
    assert.equal(sessionRes.valid, true);
    assert.equal(sessionRes.user.email, 'sandeep.gautam@opportunity-os.local');

    // Logout
    await logoutSession(authRes.token);
    const afterLogout = await verifySessionToken(authRes.token);
    assert.equal(afterLogout.valid, false);
  });

  it('9. Ingestion Telemetry: source_sync_runs records real Google ingestion counts', async () => {
    const runs = await sql`
      SELECT * FROM public.source_sync_runs 
      ORDER BY started_at DESC LIMIT 1;
    `;
    assert.ok(runs.length > 0, 'At least one sync run must be recorded');
    const r = runs[0];
    assert.equal(r.status, 'SUCCESS');
    assert.equal(r.sources_succeeded, 3);
    assert.ok(r.raw_count >= 2900, `Expected raw_count >= 2900, got ${r.raw_count}`);
    assert.ok(r.accepted_count >= 2880, `Expected accepted_count >= 2880, got ${r.accepted_count}`);
    assert.ok(r.user_fields_preserved >= 2880, `Expected preserved >= 2880, got ${r.user_fields_preserved}`);
  });
});
