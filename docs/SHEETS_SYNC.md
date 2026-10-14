# Sandeep Opportunity OS — Google Sheets Synchronization (`docs/SHEETS_SYNC.md`)

## 1. Master Sheet Architecture

- **Live Google Sheet**: `Sandeep Opportunity OS — Live Sync Sheet`
- **Tabs**:
  1. `Executive_Summary` (KPI rollup formulas + embedded pipeline chart)
  2. `Freelance_Leads` (`OPP-FL-001` .. `OPP-FL-006`)
  3. `Visa_Relocation_Jobs` (`OPP-VJ-001` .. `OPP-VJ-006`)
  4. `Masters_Scholarships` (`OPP-MS-001` .. `OPP-MS-006`)
  5. `Remote_Jobs_Internships` (`OPP-RM-001` .. `OPP-RM-006`)
  6. `Ops_And_Profile_Config` (Candidate profile parameters + `Research_Runs` log)

## 2. Idempotent Upsert & Conflict Resolution

- Column `A` (`Record ID`) is the immutable primary key across all opportunity tabs.
- Machine-owned columns (`A` through `M`/`N`) are updated in place when a record is re-verified.
- User-owned columns (`User Status [USER]`, `Priority [USER]`, `Follow-Up Date [USER]`, `Personal Notes [USER]`) are strictly preserved on re-sync.
