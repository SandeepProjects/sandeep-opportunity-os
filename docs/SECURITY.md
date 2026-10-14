# Sandeep Opportunity OS — Security & Secret Hygiene (`docs/SECURITY.md`)

1. **Zero Client Secret Exposure**: All API keys (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GEMINI_API_KEY`) reside strictly in backend environment variables (`.env.local` / Edge Function secrets) and are excluded via `.gitignore`.
2. **Supabase Row-Level Security (RLS)**: Every table in `001_opportunity_os_schema.sql` enables RLS and restricts `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to authenticated owner `auth.uid() = owner_id`.
3. **XSS & JSON-LD Serialization**: All external URLs are validated against `https:` / `mailto:` protocols, and all external links enforce `rel="noopener noreferrer"`.
4. **HTTP Response Headers (`public/_headers`)**: Enforces 2-year HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a strict `Content-Security-Policy`.
