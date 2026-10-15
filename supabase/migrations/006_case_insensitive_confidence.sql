-- Migration 006: Case-insensitive confidence check
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_confidence_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_confidence_check CHECK (UPPER(confidence) IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'));
