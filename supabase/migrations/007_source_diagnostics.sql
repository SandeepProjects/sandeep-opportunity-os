-- Sandeep Opportunity OS — Migration 007: Persist Real Source Diagnostics Telemetry
-- Adds source_diagnostics JSONB column to public.research_runs so real API responses
-- (HTTP status, exact record counts, error messages) are persisted directly to database.

ALTER TABLE public.research_runs
ADD COLUMN IF NOT EXISTS source_diagnostics JSONB DEFAULT '[]'::jsonb;
