# Sandeep Opportunity OS — Google Service Account Setup Guide & Resource Permissions

> **CRITICAL SECURITY LAW:**
> Never change Google Drive files or Sheets to *"Anyone with the link can view/edit"*.
> Keep all sheets, workbooks, and application folders **strictly private**.
> Grant targeted access **only** to the dedicated Google Service Account email.

---

## 1. Overview
Opportunity OS connects securely to the outputs of Sandeep's scheduled Muse workflows (Facebook & Instagram Job Hunter, Master Job Application Tracker, Master's research workbook, and Job Apply folders).

To enable automated server-side ingestion every 6 hours without human intervention, invite your Google Cloud Service Account to each resource with the exact minimum privilege required.

---

## 2. Service Account Credentials (Server-Side Only)

Configure these secrets in your repository (**GitHub Repository Settings → Secrets and variables → Actions**):

| Secret Name | Required Value | Notes |
| :--- | :--- | :--- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | e.g. `sandeep-opportunity-os-sync@<project-id>.iam.gserviceaccount.com` | Google Cloud IAM service account email |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | The RSA private key from your service account JSON key file |
| `VITE_GOOGLE_SHEET_ID` | `1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0` | Native Muse Social Job Hunter Sheet ID |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Canonical Opportunity OS database |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret | Used for server-side upsert & sync telemetry |

> **SECURITY NOTE:** Never expose `GOOGLE_PRIVATE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client-side React bundle. Ingestion runs server-side via Node CLI / GitHub Actions.

---

## 3. Resource Sharing Matrix

Invite your `GOOGLE_SERVICE_ACCOUNT_EMAIL` to the following private Google resources:

### A. Google Sheets
| Resource Name | ID / Link | Required Role | Purpose |
| :--- | :--- | :--- | :--- |
| **MUSE \| FACEBOOK & INSTAGRAM JOB HUNTER** | `1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0` | **Viewer** (or Editor if logging sync status) | Ingests `ALL LEADS`, `DAILY RESULTS`, `GROUP DIRECTORY`, `OUTREACH TRACKER`, `SEARCH LOG` |
| *Old Opportunity OS Sheet* | `17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q` | *None (Do not share)* | **LEGACY / DISCONNECTED** — Retained only as historical marker |

### B. Google Drive Trackers & Workbooks
| Resource Name | Drive ID / Link | Required Role | Purpose |
| :--- | :--- | :--- | :--- |
| **MASTER_JOB_APPLICATION_TRACKER.xlsx** | `1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1` | **Viewer** | Ingests employment applications, graduate scheme sweeps, and pipeline review |
| **master-spreadsheet.xlsx** | `156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj` | **Viewer** | Ingests `MASTER_PROGRAMMES` and `SCHOLARSHIPS` tabs for Master's admissions |
| *Old 6-Tab Master Workbook* | `19igEOYpemKTRojy4b94QPbCE78gT7n2O` | *None (Do not share)* | **LEGACY / DISCONNECTED** — Superseded by MASTER_JOB_APPLICATION_TRACKER.xlsx |

### C. Google Drive Folders (Application Packs & Stage Folders)
| Folder Name | Drive Folder ID | Required Role | Purpose |
| :--- | :--- | :--- | :--- |
| **Job Apply (Root)** | `1g0XUzrlsOr9ze6Peaw6SMhcDLDYZSuE0` | **Viewer** | Root folder containing application packs |
| **Job Apply — Pending** | `1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l` | **Viewer** | In-progress draft application packs |
| **Job Apply — Ready for Approval** | `17dpw5xNHDm3yPy1KiBnDt_xfkyBrF3wy` | **Viewer** | Prepared packs awaiting Sandeep's approval |
| **Job Apply — Applied** | `1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM` | **Viewer** | Submitted and archived application packs |
| **Job Apply — Failed** | `101_-5fPC16bivgpNVkP7uueF49MpjHgq` | **Viewer** | Applications blocked by errors or portal issues |
| **Job Apply — Rejected** | `1y4UyghfocbkmyoGnUpD5oHSVQb4HuBk1` | **Viewer** | Formal rejection records |
| **Job Apply — Trackers** | `1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_` | **Viewer** | Host folder for MASTER_JOB_APPLICATION_TRACKER.xlsx |
| **Master's Admissions** | `1S_FYU8b1xeP6S098SkYaADWYIkH5a_Nf` | **Viewer** | Master's research workbook & admissions files |
| **Reports** | `1yqpyzPa2FmuNNrzqM56J4qBAVm2bbBix` | *None (Optional)* | Currently `Unused / available` |

---

## 4. Local-Only Resources (Workstation Staging)
The following resources run locally on Sandeep's workstation and are **not** mirrored to Google Drive:
- `lead-tracker.xlsx`
- `job-tracker-YYYY-MM-DD.xlsx` series
- `agency_outreach_log.csv`
- `agencies_final.csv`
- `outreach-drafts-YYYY-MM-DD.md`
- `social-hunter local XLSX / JSON`

These are registered in Opportunity OS as **`LOCAL_ONLY`** (*"Not available to production sync"*).
Local Windows filesystem paths are never exposed publicly.
