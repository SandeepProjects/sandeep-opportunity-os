# Sandeep Opportunity OS

Private **Opportunity Intelligence System & Personal Operating System** for **Sandeep Gautam** ([sandeep-gautam.com](https://www.sandeep-gautam.com/)).

Continuously discovers, verifies, deduplicates, scores, and tracks high-value opportunities across four pipelines:
1. **Freelance Client Leads** (Cyprus & UK SMEs with deterministic website improvement opportunities)
2. **Full-Time Jobs With Visa / Relocation Potential** (0–3 yr Frontend, React, TypeScript, Angular, WordPress roles)
3. **Master's Programmes & Scholarships** (Official EU/UK/Cyprus postgraduate programmes and merit/alumni scholarships)
4. **Remote Jobs & Internships** (Remote roles with strict regional & timezone eligibility gating)

## Repository Structure

- `docs/` — Complete system documentation (`ARCHITECTURE.md`, `DATA_MODEL.md`, `RESEARCH_PIPELINE.md`, `SCORING.md`, `SHEETS_SYNC.md`, `SECURITY.md`, `DEPLOYMENT.md`)
- `supabase/migrations/001_opportunity_os_schema.sql` — PostgreSQL + RLS relational schema
- `src/types/opportunity.ts` — Strict TypeScript domain models
- `src/engine/scoring.ts` — Explainable multi-component scoring & gate engine
- `src/engine/deduplication.ts` — Canonical URL & fingerprint deduplicator
- `src/engine/sheetsSync.ts` — Idempotent Google Sheets v4 synchronization engine
- `tests/opportunity_os.test.mjs` — Zero-dependency Node.js automated test suite

## Quick Verification

```bash
node tests/opportunity_os.test.mjs
```
