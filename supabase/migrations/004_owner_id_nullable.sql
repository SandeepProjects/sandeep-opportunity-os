-- Migration 004: Make owner_id nullable for server/service-role background ingestion
ALTER TABLE public.opportunities ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.workflow_states ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.research_runs ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.organizations ALTER COLUMN owner_id DROP NOT NULL;
