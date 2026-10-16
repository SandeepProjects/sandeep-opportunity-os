-- Sandeep Opportunity OS — Migration 008: AI Agent Registry, Data Sources & Opportunity Provenance
-- Extensible multi-agent framework supporting Sandy Muse, Haya Muse 1, Haya Muse 2, Vargo Spark, Katoo Spark
-- and seamless attachment of future Google Sheets / Drive trackers.

-- 1. Add agent provenance and primary discovering agent to opportunities
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS agent_provenance JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS discovered_by_agent TEXT;

-- 2. Create canonical agents registry table
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    source_type TEXT NOT NULL,
    assigned_pipelines JSONB NOT NULL DEFAULT '[]'::jsonb,
    connected_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Healthy',
    last_source_update TIMESTAMPTZ,
    last_cms_ingestion TIMESTAMPTZ,
    records_discovered INTEGER NOT NULL DEFAULT 0,
    records_accepted INTEGER NOT NULL DEFAULT 0,
    records_duplicated INTEGER NOT NULL DEFAULT 0,
    records_gated INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create canonical data_sources registry table
CREATE TABLE IF NOT EXISTS public.data_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    owning_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    pipeline TEXT NOT NULL,
    url TEXT,
    drive_id TEXT,
    spreadsheet_id TEXT,
    folder_id TEXT,
    verified_tabs JSONB DEFAULT '[]'::jsonb,
    connection_status TEXT NOT NULL DEFAULT 'Connected',
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_mode TEXT NOT NULL DEFAULT 'AUTOMATIC_5H',
    last_source_modified TIMESTAMPTZ,
    last_ingested_at TIMESTAMPTZ,
    record_count INTEGER DEFAULT 0,
    records_fetched INTEGER DEFAULT 0,
    records_parsed INTEGER DEFAULT 0,
    records_accepted INTEGER DEFAULT 0,
    records_duplicated INTEGER DEFAULT 0,
    records_gated INTEGER DEFAULT 0,
    canonical_records INTEGER DEFAULT 0,
    stale_warning TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS with public read policies
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read on agents" ON public.agents;
CREATE POLICY "Public read on agents" ON public.agents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read on data_sources" ON public.data_sources;
CREATE POLICY "Public read on data_sources" ON public.data_sources FOR SELECT USING (true);
