# Sandeep Opportunity OS — Deployment & Operations Guide (`docs/DEPLOYMENT.md`)

## 1. Deploying Code to Hostinger via GitHub (`SandeepProjects`)

1. Create a private or public repository under `https://github.com/SandeepProjects/sandeep-opportunity-os`.
2. Push this repository (`git init && git add . && git commit -m "feat: initial Sandeep Opportunity OS release" && git push`).
3. In **Hostinger hPanel → Websites → Connect to GitHub**, select `SandeepProjects/sandeep-opportunity-os` (Build command: `npm run build`, Output directory: `dist`).
4. Set public read-only environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_SHEET_ID`) in hPanel.

## 2. How Live Data Updates Work Without Git Commits

- Daily scheduled runs update **Supabase / Google Sheets** directly.
- The frontend reads live data via the configured Google Sheet CSV/JSON endpoint or Supabase REST client on load and when clicking **Sync Live Sheet**, so new opportunities appear immediately with zero code redeployments.
