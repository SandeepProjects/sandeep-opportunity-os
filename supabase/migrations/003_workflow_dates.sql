-- Migration 003: Add contacted_date and applied_date to workflow_states
ALTER TABLE public.workflow_states ADD COLUMN IF NOT EXISTS contacted_date DATE;
ALTER TABLE public.workflow_states ADD COLUMN IF NOT EXISTS applied_date DATE;
