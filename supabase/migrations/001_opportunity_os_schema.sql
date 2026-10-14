-- Sandeep Opportunity OS — Canonical PostgreSQL / Supabase Schema with RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    full_name TEXT NOT NULL,
    base_location TEXT NOT NULL,
    portfolio_url TEXT NOT NULL,
    citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    eu_citizenship TEXT NOT NULL DEFAULT 'UNKNOWN',
    cyprus_work_rights TEXT NOT NULL DEFAULT 'UNKNOWN',
    profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT NOT NULL CHECK (category IN ('freelance_leads', 'visa_jobs', 'masters_scholarships', 'remote_jobs')),
    title TEXT NOT NULL,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_type TEXT NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL,
    last_verified_at TIMESTAMPTZ NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    score_total INTEGER NOT NULL CHECK (score_total >= 0 AND score_total <= 100),
    score_components JSONB NOT NULL,
    score_explanation JSONB NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_category_score ON public.opportunities(category, is_active, score_total DESC);

CREATE TABLE IF NOT EXISTS public.workflow_states (
    opportunity_id TEXT PRIMARY KEY REFERENCES public.opportunities(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN (
      'New',
      'Reviewing',
      'High Priority',
      'Saved',
      'Contacted',
      'Preparing',
      'Applied',
      'Interview',
      'Follow-up',
      'Won',
      'Offer',
      'Rejected',
      'Not Suitable',
      'Expired',
      'Archived'
    )),
    priority TEXT NOT NULL DEFAULT 'P2',
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    contacted_date DATE,
    applied_date DATE,
    contacted_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    personal_notes TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_runs (
    run_id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL DEFAULT auth.uid(),
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sources_checked INTEGER NOT NULL,
    discovered_count INTEGER NOT NULL,
    accepted_count INTEGER NOT NULL,
    deduplicated_count INTEGER NOT NULL,
    filtered_count INTEGER NOT NULL,
    sheets_sync_status TEXT NOT NULL,
    duration_sec NUMERIC(8,2) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on profiles" ON public.profiles FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owner full access on organizations" ON public.organizations FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owner full access on opportunities" ON public.opportunities FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owner full access on workflow_states" ON public.workflow_states FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owner full access on research_runs" ON public.research_runs FOR ALL USING (auth.uid() = owner_id);
