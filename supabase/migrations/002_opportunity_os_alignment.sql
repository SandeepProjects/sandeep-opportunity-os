-- Migration 002: Opportunity OS Schema Alignment & Public Read Policy
ALTER TABLE public.opportunities ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS provenance_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS fingerprint TEXT;

ALTER TABLE public.opportunities ALTER COLUMN country DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN country SET DEFAULT 'Global / Cyprus';

ALTER TABLE public.opportunities ALTER COLUMN source_type DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN source_type SET DEFAULT 'INGESTION_SCAN';

ALTER TABLE public.opportunities ALTER COLUMN retrieved_at DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN retrieved_at SET DEFAULT NOW();

ALTER TABLE public.opportunities ALTER COLUMN score_components DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN score_components SET DEFAULT '{}'::jsonb;

ALTER TABLE public.opportunities ALTER COLUMN score_explanation DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN score_explanation SET DEFAULT '[]'::jsonb;

ALTER TABLE public.opportunities ALTER COLUMN details DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN details SET DEFAULT '{}'::jsonb;

-- Allow read access for public / anon dashboard view
DROP POLICY IF EXISTS "Public read on opportunities" ON public.opportunities;
CREATE POLICY "Public read on opportunities" ON public.opportunities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read on workflow_states" ON public.workflow_states;
CREATE POLICY "Public read on workflow_states" ON public.workflow_states FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read on research_runs" ON public.research_runs;
CREATE POLICY "Public read on research_runs" ON public.research_runs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert on workflow_states" ON public.workflow_states;
CREATE POLICY "Public upsert on workflow_states" ON public.workflow_states FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update on workflow_states" ON public.workflow_states;
CREATE POLICY "Public update on workflow_states" ON public.workflow_states FOR UPDATE USING (true);
