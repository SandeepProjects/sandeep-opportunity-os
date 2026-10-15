-- Migration 005: Flexible category check
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_category_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_category_check CHECK (category IN ('freelance_leads', 'visa_jobs', 'masters_scholarships', 'remote_jobs', 'social_jobs'));
