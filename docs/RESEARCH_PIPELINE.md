# Sandeep Opportunity OS — Staged Research Pipeline (`docs/RESEARCH_PIPELINE.md`)

## 1. Nine-Stage Idempotent Pipeline

1. **Discovery**: Queries official university portals, public ATS endpoints (`jobs.lever.co`, `jobs.ashbyhq.com`, `apply.workable.com`, `boards.greenhouse.io`, `ergodotisi.com`, `grsrecruitment.com`), and regional SME directories.
2. **Retrieval & Deterministic Inspection**: Fetches live HTML/DOM content. For freelance leads, inspects title/heading structure, form validation markup, counter consistency, and schema tags.
3. **Validation**: Rejects dead links (HTTP 4xx/5xx) and unverified aggregator scrapes when an original source exists.
4. **Extraction**: Parses structured fields (salary, ECTS, tuition, deadline, remote region restrictions, public contact details).
5. **Normalization**: Standardizes dates to ISO-8601, URLs via `canonicalize_url()`, and visa/eligibility enums to `CONFIRMED | LIKELY | UNKNOWN | NO`.
6. **Deduplication**: Computes canonical URL and `category::organization::normalized_title` fingerprints. Merges duplicate postings (such as twin Workable listings `A99E34437C` and `D943CC3739` for Lago's React/Shopify role) into a single canonical opportunity with multiple provenance URLs.
7. **Scoring & Gating**: Applies explainable category weights and hard gates (filtering out 5+ year Senior roles like XM Senior Angular Developer and penalizing region-excluded remote roles like HoloHire Africa-only and Ivanti US-only).
8. **Canonical Storage**: Upserts machine-owned columns into PostgreSQL/SQLite while preserving existing `workflow_states`.
9. **Google Sheets Synchronization**: Syncs records by persistent `Record ID` to `Sandeep Opportunity OS — Live Sync Sheet`.
