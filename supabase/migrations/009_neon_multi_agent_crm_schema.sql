-- Sandeep Opportunity OS — Migration 009: Neon Enterprise Multi-Agent Opportunity Intelligence CRM Schema
-- Complete relational architecture supporting:
-- 1. Five AI Research Agents (Sandy Muse, Haya Muse 1, Haya Muse 2, Vargo Spark, Katoo Spark)
-- 2. Multi-Agent Source Provenance & Ingestion Telemetry
-- 3. Strict 7-Field CRM Preservation across all syncs
-- 4. Cross-Agent Deduplication with Multi-Row Tracking
-- 5. Applications, Follow-ups, Activity Events, and Health Telemetry

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Canonical AI Agents Registry
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    assigned_pipelines JSONB NOT NULL DEFAULT '[]'::jsonb,
    connected_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    schedule_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'Healthy',
    last_source_update TIMESTAMPTZ,
    last_cms_ingestion TIMESTAMPTZ,
    records_discovered INTEGER NOT NULL DEFAULT 0,
    records_accepted INTEGER NOT NULL DEFAULT 0,
    records_deduplicated INTEGER NOT NULL DEFAULT 0,
    records_gated INTEGER NOT NULL DEFAULT 0,
    records_failed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Canonical Data Sources Registry
CREATE TABLE IF NOT EXISTS public.data_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    owning_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    pipeline TEXT NOT NULL,
    classification TEXT NOT NULL DEFAULT 'ACTIVE CANONICAL',
    url TEXT,
    drive_id TEXT,
    spreadsheet_id TEXT,
    folder_id TEXT,
    purpose TEXT,
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_mode TEXT NOT NULL DEFAULT 'AUTOMATIC_5H',
    connection_status TEXT NOT NULL DEFAULT 'Connected',
    last_source_modified TIMESTAMPTZ,
    last_ingested_at TIMESTAMPTZ,
    record_count INTEGER NOT NULL DEFAULT 0,
    records_fetched INTEGER NOT NULL DEFAULT 0,
    records_parsed INTEGER NOT NULL DEFAULT 0,
    records_accepted INTEGER NOT NULL DEFAULT 0,
    records_duplicated INTEGER NOT NULL DEFAULT 0,
    records_gated INTEGER NOT NULL DEFAULT 0,
    canonical_records INTEGER NOT NULL DEFAULT 0,
    stale_warning TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Source Tabs Registry
CREATE TABLE IF NOT EXISTS public.source_tabs (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
    tab_name TEXT NOT NULL,
    is_active_ingestion BOOLEAN NOT NULL DEFAULT FALSE,
    row_count INTEGER DEFAULT 0,
    col_count INTEGER DEFAULT 0,
    header_columns JSONB DEFAULT '[]'::jsonb,
    last_ingested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Source Sync Runs (Ingestion Telemetry)
CREATE TABLE IF NOT EXISTS public.source_sync_runs (
    run_id TEXT PRIMARY KEY,
    trigger_type TEXT NOT NULL DEFAULT 'MANUAL',
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_sec NUMERIC(8,2) NOT NULL DEFAULT 0,
    sources_checked INTEGER NOT NULL DEFAULT 0,
    sources_succeeded INTEGER NOT NULL DEFAULT 0,
    sources_failed INTEGER NOT NULL DEFAULT 0,
    raw_count INTEGER NOT NULL DEFAULT 0,
    parsed_count INTEGER NOT NULL DEFAULT 0,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    deduplicated_count INTEGER NOT NULL DEFAULT 0,
    gated_count INTEGER NOT NULL DEFAULT 0,
    inserted_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    unchanged_count INTEGER NOT NULL DEFAULT 0,
    user_fields_preserved INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    telemetry JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Compatibility alias for research_runs
CREATE TABLE IF NOT EXISTS public.research_runs (
    run_id TEXT PRIMARY KEY,
    owner_id UUID,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sources_checked INTEGER NOT NULL DEFAULT 0,
    discovered_count INTEGER NOT NULL DEFAULT 0,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    deduplicated_count INTEGER NOT NULL DEFAULT 0,
    filtered_count INTEGER NOT NULL DEFAULT 0,
    sheets_sync_status TEXT NOT NULL DEFAULT 'OK',
    duration_sec NUMERIC(8,2) NOT NULL DEFAULT 0,
    source_diagnostics JSONB DEFAULT '{}'::jsonb
);

-- 5. Source Sync Results per Source
CREATE TABLE IF NOT EXISTS public.source_sync_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL REFERENCES public.source_sync_runs(run_id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
    owning_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    http_status INTEGER,
    raw_count INTEGER NOT NULL DEFAULT 0,
    parsed_count INTEGER NOT NULL DEFAULT 0,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    duplicate_count INTEGER NOT NULL DEFAULT 0,
    gated_count INTEGER NOT NULL DEFAULT 0,
    inserted_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Canonical Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY,
    owner_id UUID,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    organization_id TEXT,
    location TEXT NOT NULL,
    country TEXT,
    source_url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    source_type TEXT,
    discovered_by_agent TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT NOT NULL DEFAULT 'UNKNOWN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    score_total INTEGER NOT NULL DEFAULT 0,
    score_components JSONB NOT NULL DEFAULT '{}'::jsonb,
    score_explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    deadline TEXT,
    provenance_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    agent_provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_source_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_category_score ON public.opportunities(category, is_active, score_total DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_fingerprint ON public.opportunities(fingerprint);
CREATE INDEX IF NOT EXISTS idx_opportunities_canonical_url ON public.opportunities(canonical_url);
CREATE INDEX IF NOT EXISTS idx_opportunities_agent ON public.opportunities(discovered_by_agent);

-- 7. Multi-Source Provenance Tracking (Many sources -> One canonical opportunity)
CREATE TABLE IF NOT EXISTS public.opportunity_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
    source_tab TEXT,
    source_row_index INTEGER,
    source_row_reference TEXT,
    original_url TEXT NOT NULL,
    canonical_url TEXT,
    discovering_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    ingestion_run_id TEXT REFERENCES public.source_sync_runs(run_id) ON DELETE SET NULL,
    raw_payload JSONB,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_opp_source_ref UNIQUE (opportunity_id, source_id, source_tab, source_row_reference)
);
CREATE INDEX IF NOT EXISTS idx_opp_sources_opp_id ON public.opportunity_sources(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_sources_source_id ON public.opportunity_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_opp_sources_agent ON public.opportunity_sources(discovering_agent_id);

-- 8. Multi-Agent Attribution
CREATE TABLE IF NOT EXISTS public.opportunity_agent_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    attribution_type TEXT NOT NULL DEFAULT 'DISCOVERER',
    first_attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attribution_metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_opp_agent UNIQUE (opportunity_id, agent_id, attribution_type)
);
CREATE INDEX IF NOT EXISTS idx_opp_agent_attr_agent ON public.opportunity_agent_attribution(agent_id);

-- 9. Workflow States (Sandeep's 7 User-Owned CRM Fields)
CREATE TABLE IF NOT EXISTS public.workflow_states (
    opportunity_id TEXT PRIMARY KEY REFERENCES public.opportunities(id) ON DELETE CASCADE,
    owner_id UUID,
    status TEXT NOT NULL DEFAULT 'New',
    priority TEXT NOT NULL DEFAULT 'P2',
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    personal_notes TEXT NOT NULL DEFAULT '',
    contacted_date DATE,
    applied_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON public.workflow_states(status);
CREATE INDEX IF NOT EXISTS idx_workflow_priority ON public.workflow_states(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_follow_up ON public.workflow_states(follow_up_date);

-- 10. Applications Management
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    candidate_id TEXT DEFAULT 'sandeep_gautam',
    status TEXT NOT NULL DEFAULT 'Draft',
    submitted_at TIMESTAMPTZ,
    applied_via TEXT DEFAULT 'Direct',
    cv_document_id TEXT,
    cover_letter_document_id TEXT,
    application_folder_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Follow-ups Queue
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    bucket TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Activity Events Log
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
    actor_id TEXT,
    previous_state JSONB,
    new_state JSONB,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_events_opp ON public.activity_events(opportunity_id, created_at DESC);

-- 13. Documents Registry
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT REFERENCES public.opportunities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_path TEXT,
    drive_file_id TEXT,
    drive_url TEXT,
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Candidate Profile
CREATE TABLE IF NOT EXISTS public.candidate_profile (
    id TEXT PRIMARY KEY DEFAULT 'sandeep_gautam',
    owner_id UUID,
    full_name TEXT NOT NULL DEFAULT 'Sandeep Gautam',
    base_location TEXT NOT NULL DEFAULT 'Larnaca, Cyprus',
    portfolio_url TEXT NOT NULL DEFAULT 'https://sandeepgautam.com',
    citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    eu_citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    cyprus_work_rights TEXT NOT NULL DEFAULT 'UNKNOWN',
    profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility alias for profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT 'sandeep_gautam',
    owner_id UUID,
    full_name TEXT NOT NULL DEFAULT 'Sandeep Gautam',
    base_location TEXT NOT NULL DEFAULT 'Larnaca, Cyprus',
    portfolio_url TEXT NOT NULL DEFAULT 'https://sandeepgautam.com',
    citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    eu_citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    cyprus_work_rights TEXT NOT NULL DEFAULT 'UNKNOWN',
    profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    owner_id UUID,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    country TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Agent Runs Telemetry
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES public.source_sync_runs(run_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    items_scanned INTEGER NOT NULL DEFAULT 0,
    items_extracted INTEGER NOT NULL DEFAULT 0,
    duplicates_found INTEGER NOT NULL DEFAULT 0,
    errors TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
