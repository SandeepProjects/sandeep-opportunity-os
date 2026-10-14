# Sandeep Opportunity OS

Private **Opportunity Intelligence System & Personal Operating System** for **Sandeep Gautam** (https://www.sandeep-gautam.com/).

Continuously discovers, verifies, deduplicates, scores, and tracks high-value opportunities across four pipelines:
1. **Freelance Client Leads** (Cyprus & UK SMEs with deterministic website improvement opportunities)
2. **Full-Time Jobs With Visa / Relocation Potential** (0–3 yr Frontend, React, TypeScript, Angular, WordPress roles)
3. **Master's Programmes & Scholarships** (Official EU/UK/Cyprus postgraduate programmes and merit/alumni scholarships)
4. **Remote Jobs & Internships** (Remote roles with strict regional & timezone eligibility gating)

## Architecture Flow

`Research sources → discovery → verification → extraction → normalization → deduplication → scoring → PostgreSQL/Supabase DB → Google Sheets v4 sync → Dashboard UI → CRM action workflow`

- **Canonical Database**: PostgreSQL / Supabase (`supabase/migrations/001_opportunity_os_schema.sql`) with Row-Level Security (RLS)
- **Synchronized Human Control Layer**: 6-Tab Google Sheet (`Freelance_Leads`, `Visa_Relocation_Jobs`, `Masters_Scholarships`, `Remote_Jobs_Internships`, `Executive_Summary`, `Ops_And_Profile_Config`) keyed by persistent `Record ID` (`OPP-FL-001` .. `OPP-RM-006`)
- **Zero Daily Git Commits for Data**: GitHub stores application code only; daily research updates flow through the database and Google Sheets sync layer while preserving `[USER]` CRM columns (`status`, `priority`, `favorite`, `follow_up_date`, `personal_notes`).
