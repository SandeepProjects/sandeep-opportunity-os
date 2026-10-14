# Sandeep Opportunity OS - Architecture Overview

## Overview
Sandeep Opportunity OS is a platform for aggregating, scoring, filtering, and managing opportunities across job markets, freelance gigs, research master's programs, and remote work.

## System Components
1. **Frontend**: Built with React, TypeScript, and Vite.
2. 2. **Database & Backend**: Supabase (PostgreSQL with Row Level Security, tables, and migrations).
   3. 3. **Google Sheets 6-Tab Sync Pipeline**:
      4.    - Bi-directional/automated sync pipeline managing 6 dedicated tabs:
            -      1. Today
            -       2. Freelance
            -        3. Jobs
            -         4. Masters
            -          5. Remote
            -           6. Saved / Operations
            -          - Core processing engine handles:
            -           - URL canonicalization
            -            - Deduplication
            -             - Seniority & regional gates
            -              - UNKNOWN fallback defaults
            -               - Preservation of Google Sheets user-edited fields
