# Sandeep Opportunity OS — Relational Data Model (`docs/DATA_MODEL.md`)

## 1. Entity Overview

1. `profiles`: Stores Sandeep's verified academic/technical profile, explicit legal/eligibility fields (`UNKNOWN` until configured), and category scoring weights.
2. `organizations`: Normalized companies, law firms, contractors, and universities keyed by canonical domain.
3. `opportunities`: Canonical opportunity records (`OPP-FL-*`, `OPP-VJ-*`, `OPP-MS-*`, `OPP-RM-*`) with `is_active`, `confidence`, `score_total`, `score_components_json`, `score_explanation_json`, and `details_json`.
4. `opportunity_sources`: One-to-many provenance links storing primary and secondary verification URLs per opportunity.
5. `workflow_states` & `workflow_history`: User-owned CRM state (`status`, `priority`, `favorite`, `follow_up_date`, `personal_notes`). **Protected from machine overwrites during daily research refreshes.**
6. `research_runs`: Immutable audit log of every scheduled discovery and synchronization run.

## 2. Field Ownership Contract

| Field Group | Columns | Owner | Sync Behavior |
| :--- | :--- | :--- | :--- |
| **Identity** | `id` (`Record ID`), `category`, `organization_id` | System Immutable | Primary key used to match database records to Google Sheet rows |
| **Research & Scoring** | `title`, `source_url`, `last_verified_at`, `confidence`, `score_total`, `score_components`, `details` | Machine-Owned | Updated on every research verification pass |
| **Personal CRM Workflow** | `status`, `priority`, `favorite`, `follow_up_date`, `personal_notes` | **User-Owned (`[USER]`)** | **Never overwritten** by automated research or database-to-Sheet sync |
