import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

function normalizePrivateKey(key: string): string {
  if (!key) return "";
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  return clean.replace(/\\n/g, "\n");
}

async function getGoogleAccessToken(email: string, privateKey: string): Promise<string> {
  const cleanKey = normalizePrivateKey(privateKey);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    })
  ).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(cleanKey, "base64url");
  const assertion = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth2 error HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

function canonicalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    let clean = rawUrl.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    const parsed = new URL(clean);
    parsed.hash = "";
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const trackingPrefixes = ["utm_", "fbclid", "gclid", "msclkid", "ref", "source", "igsh"];
    const toDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (trackingPrefixes.some((p) => lower.startsWith(p))) {
        toDelete.push(key);
      }
    });
    toDelete.forEach((k) => parsed.searchParams.delete(k));
    let path = parsed.pathname.replace(/\/+$/, "");
    if (!path) path = "";
    parsed.pathname = path;
    const finalUrl = parsed.toString().replace(/\/$/, "");
    return finalUrl;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

function computeFingerprint(rec: Record<string, any>): string {
  const cat = (rec.category || "").toLowerCase().trim();
  const org = (rec.organization || rec.organization_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const title = (rec.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cat}::${org}::${title}`;
}

function generateDeterministicId(category: string, uniqueKey: string): string {
  const hash = crypto.createHash("sha256").update(uniqueKey).digest("hex").slice(0, 12);
  const prefix =
    category === "freelance_leads"
      ? "opp_free"
      : category === "visa_jobs"
      ? "opp_visa"
      : category === "masters_scholarships"
      ? "opp_mast"
      : "opp_rem";
  return `${prefix}_${hash}`;
}

function parseXlsxBuffer(buffer: Uint8Array): Record<string, any[]> {
  const nodeBuf = Buffer.from(buffer);
  const files: Record<string, Buffer> = {};
  let offset = 0;

  while (offset + 30 <= nodeBuf.length) {
    const sig = nodeBuf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compMethod = nodeBuf.readUInt16LE(offset + 8);
    const compSize = nodeBuf.readUInt32LE(offset + 18);
    const fnLen = nodeBuf.readUInt16LE(offset + 26);
    const extraLen = nodeBuf.readUInt16LE(offset + 28);
    const fn = nodeBuf.toString("utf8", offset + 30, offset + 30 + fnLen);
    const dataStart = offset + 30 + fnLen + extraLen;
    const compData = nodeBuf.subarray(dataStart, dataStart + compSize);

    if (compMethod === 8) {
      try {
        files[fn] = zlib.inflateRawSync(compData);
      } catch {
        // Continue
      }
    } else if (compMethod === 0) {
      files[fn] = compData;
    }
    offset = dataStart + compSize;
  }

  const sharedStrings: string[] = [];
  if (files["xl/sharedStrings.xml"]) {
    const ssXml = files["xl/sharedStrings.xml"].toString("utf8");
    const siRegex = /<si>([\s\S]*?)<\/si>/g;
    let match;
    while ((match = siRegex.exec(ssXml)) !== null) {
      const tMatch = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let textParts: string[] = [];
      let tm;
      while ((tm = tMatch.exec(match[1])) !== null) {
        textParts.push(tm[1]);
      }
      sharedStrings.push(textParts.join(""));
    }
  }

  const sheetEntries = Object.keys(files).filter(
    (k) => k.startsWith("xl/worksheets/sheet") && k.endsWith(".xml")
  );

  const result: Record<string, any[]> = {};

  for (const sheetPath of sheetEntries) {
    const xml = files[sheetPath].toString("utf8");
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    const rows: string[][] = [];
    let rMatch;
    while ((rMatch = rowRegex.exec(xml)) !== null) {
      const cellRegex = /<c\s+r="([A-Z]+)\d+"(?:[^>]*?t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g;
      const rowCells: Record<string, string> = {};
      let cMatch;
      while ((cMatch = cellRegex.exec(rMatch[1])) !== null) {
        const col = cMatch[1];
        const type = cMatch[2];
        const val = cMatch[3] !== undefined ? cMatch[3].trim() : "";
        let cellVal = val;
        if (type === "s") {
          const idx = parseInt(val, 10);
          cellVal = !Number.isNaN(idx) && sharedStrings[idx] ? sharedStrings[idx] : val;
        }
        rowCells[col] = cellVal;
      }
      const maxColIdx = Object.keys(rowCells).reduce((max, col) => {
        let n = 0;
        for (let i = 0; i < col.length; i++) {
          n = n * 26 + (col.charCodeAt(i) - 64);
        }
        return Math.max(max, n);
      }, 0);

      const rowArr: string[] = [];
      for (let i = 1; i <= maxColIdx; i++) {
        let colName = "";
        let temp = i;
        while (temp > 0) {
          const rem = (temp - 1) % 26;
          colName = String.fromCharCode(65 + rem) + colName;
          temp = Math.floor((temp - 1) / 26);
        }
        rowArr.push(rowCells[colName] || "");
      }
      rows.push(rowArr);
    }

    if (rows.length > 1) {
      const headers = rows[0].map((h) => h.trim());
      const records: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.every((c) => !c.trim())) continue;
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          if (h) obj[h] = r[idx] || "";
        });
        records.push(obj);
      }
      const cleanName = sheetPath.replace("xl/worksheets/", "").replace(".xml", "");
      result[cleanName] = records;
    }
  }

  return result;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date();
  const startTime = startedAt.getTime();
  const runId = `SYNC-${startedAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(startTime).slice(-4)}`;

  const googleSaEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const googleKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://wgormlhylsfssuapxyfb.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const sourceDiagnostics: any[] = [];
  const newlyIngestedRaw: any[] = [];

  let googleToken: string | null = null;
  let authError: string | null = null;
  if (!googleSaEmail || !googleKey) {
    authError = `Env missing: email=${Boolean(googleSaEmail)}, key=${Boolean(googleKey)}`;
  } else {
    try {
      googleToken = await getGoogleAccessToken(googleSaEmail, googleKey);
    } catch (err: any) {
      authError = `getGoogleAccessToken failed: ${err.message}`;
      console.warn("Google Auth Error:", err.message);
    }
  }

  // 1. Ingest MUSE Sheet (1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0)
  const socialSheetId = "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0";
  if (!googleToken) {
    sourceDiagnostics.push({
      id: "muse_social_job_hunter",
      name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
      status: "Permission required",
      statusCode: 401,
      message: authError || "Google Service Account credentials required.",
      recordsCount: 0
    });
  } else {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${socialSheetId}/values/${encodeURIComponent("ALL LEADS")}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${googleToken}` } });
      if (res.ok) {
        const data = await res.json();
        const rows = data.values || [];
        const count = rows.length > 1 ? rows.length - 1 : 0;
        sourceDiagnostics.push({
          id: "muse_social_job_hunter",
          name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
          status: "Connected",
          statusCode: 200,
          message: `Connected to native sheet. Retrieved ${count} raw rows from ALL LEADS.`,
          recordsCount: count
        });

        if (rows.length > 1) {
          const headers = rows[0].map((h: string) => String(h).trim());
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const obj: Record<string, string> = {};
            headers.forEach((h: string, idx: number) => {
              obj[h] = r[idx] ? String(r[idx]).trim() : "";
            });
            const canonUrl = canonicalizeUrl(obj["Contact / Link"] || obj["Post Link"] || obj["Link"]);
            const group = obj["Group/Page Name"] || obj["Group"] || "Social Community";
            const text = obj["Post Text / Lead Description"] || obj["Description"] || "Lead";
            let title = text.split(/[\r\n]+/)[0].trim();
            if (title.length > 90) title = title.slice(0, 87) + "...";
            const id = generateDeterministicId("freelance_leads", canonUrl || `${group}::${title}::${i}`);

            newlyIngestedRaw.push({
              id,
              category: "freelance_leads",
              title,
              organization: group,
              location: obj["Location"] || "Remote / Worldwide",
              country: "Global / Cyprus",
              source_url: canonUrl || "",
              canonical_source_url: canonUrl,
              provenance_urls: canonUrl ? [canonUrl] : [],
              last_verified_at: new Date().toISOString().slice(0, 10),
              deadline: null,
              is_active: true,
              confidence: "HIGH",
              score_total: 75,
              score_components: { fit: 25, evidence: 25, urgency: 15, contact: 10 },
              score_explanation: ["Discovered via native Muse social lead scan."],
              details: { platform: obj["Platform"] || "Social", budget: obj["Budget"] || "Open" },
              user_status: "New",
              priority: "Medium",
              favorite: false,
              follow_up_date: null,
              personal_notes: ""
            });
          }
        }
      } else {
        sourceDiagnostics.push({
          id: "muse_social_job_hunter",
          name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
          status: "Permission required",
          statusCode: res.status,
          message: `Google Sheets API returned HTTP ${res.status}`,
          recordsCount: 0
        });
      }
    } catch (e: any) {
      sourceDiagnostics.push({
        id: "muse_social_job_hunter",
        name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
        status: "Failed",
        statusCode: 0,
        message: e.message,
        recordsCount: 0
      });
    }
  }

  // 2. Ingest Master Job Tracker (1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1)
  const masterTrackerId = "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1";
  if (googleToken) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${masterTrackerId}?alt=media`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        const sheets = parseXlsxBuffer(buf);
        let total = 0;
        Object.values(sheets).forEach((arr) => (total += arr.length));
        sourceDiagnostics.push({
          id: "master_job_application_tracker",
          name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
          status: "Connected",
          statusCode: 200,
          message: `Connected to Drive XLSX. Retrieved ${total} records across tabs.`,
          recordsCount: total
        });
        Object.values(sheets).forEach((arr) => {
          arr.forEach((row, idx) => {
            const role = row["Role / Job Title"] || row["Role"] || "Software Engineer";
            const comp = row["Company"] || "Direct Employer";
            const canonUrl = canonicalizeUrl(row["URL / Job Link"] || row["URL"] || "");
            const id = generateDeterministicId("visa_jobs", canonUrl || `${comp}::${role}::${idx}`);
            const isSenior = /senior|lead|principal|staff|5\+/i.test(role);
            newlyIngestedRaw.push({
              id,
              category: "visa_jobs",
              title: role,
              organization: comp,
              location: row["Location"] || "Europe / Remote",
              country: "Europe",
              source_url: canonUrl || "",
              canonical_source_url: canonUrl,
              provenance_urls: canonUrl ? [canonUrl] : [],
              last_verified_at: new Date().toISOString().slice(0, 10),
              deadline: null,
              is_active: !isSenior,
              confidence: "HIGH",
              score_total: isSenior ? 35 : 82,
              score_components: { match: 30, feasibility: 25, evidence: 27 },
              score_explanation: ["Ingested from Master Job Application Tracker."],
              details: { salary: row["Salary / Rate"] || "Market" },
              user_status: "New",
              priority: "Medium",
              favorite: false,
              follow_up_date: null,
              personal_notes: ""
            });
          });
        });
      }
    } catch (e: any) {
      console.warn("Master Tracker error:", e.message);
    }
  }

  // 3. Ingest master-spreadsheet.xlsx (156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj)
  const mastersWorkbookId = "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj";
  if (googleToken) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${mastersWorkbookId}?alt=media`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        const sheets = parseXlsxBuffer(buf);
        let total = 0;
        Object.values(sheets).forEach((arr) => (total += arr.length));
        sourceDiagnostics.push({
          id: "masters_workbook",
          name: "master-spreadsheet.xlsx",
          status: "Connected",
          statusCode: 200,
          message: `Connected to Master's workbook. Found ${total} programmes & scholarships.`,
          recordsCount: total
        });
        Object.values(sheets).forEach((arr) => {
          arr.forEach((row, idx) => {
            const prog = row["Programme Name"] || row["Scholarship Name"] || "Master's Degree";
            const uni = row["University"] || row["Provider"] || "European University";
            const canonUrl = canonicalizeUrl(row["URL"] || "");
            const id = generateDeterministicId("masters_scholarships", canonUrl || `${uni}::${prog}::${idx}`);
            newlyIngestedRaw.push({
              id,
              category: "masters_scholarships",
              title: prog,
              organization: uni,
              location: row["Country"] || "Europe",
              country: row["Country"] || "Europe",
              source_url: canonUrl || "",
              canonical_source_url: canonUrl,
              provenance_urls: canonUrl ? [canonUrl] : [],
              last_verified_at: new Date().toISOString().slice(0, 10),
              deadline: row["Deadline"] || null,
              is_active: true,
              confidence: "HIGH",
              score_total: 88,
              score_components: { match: 35, funding: 28, reputation: 25 },
              score_explanation: ["Ingested from Master's Degree & Scholarship Workbook."],
              details: { tuition: row["Tuition"] || row["Coverage"] || "Funded" },
              user_status: "New",
              priority: "High",
              favorite: false,
              follow_up_date: null,
              personal_notes: ""
            });
          });
        });
      }
    } catch (e: any) {
      console.warn("Masters workbook error:", e.message);
    }
  }

  // 4. Fetch existing records from Supabase to preserve CRM fields
  let existingRecords: any[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=*,workflow_states(*)`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) existingRecords = data;
      }
    } catch (e: any) {
      console.warn("Supabase fetch notice:", e.message);
    }
  }

  // Deduplicate and merge preserving CRM fields
  const existingMap = new Map(existingRecords.map((r) => [r.id, r]));
  const seenIds = new Set<string>();
  const merged: any[] = [];

  for (const inc of newlyIngestedRaw) {
    if (seenIds.has(inc.id)) continue;
    seenIds.add(inc.id);

    const existing = existingMap.get(inc.id);
    if (existing) {
      const wf = Array.isArray(existing.workflow_states) && existing.workflow_states[0] ? existing.workflow_states[0] : {};
      merged.push({
        ...inc,
        user_status: wf.status || existing.user_status || inc.user_status,
        status: wf.status || existing.status || inc.user_status,
        priority: wf.priority || existing.priority || inc.priority,
        favorite: typeof wf.favorite === "boolean" ? wf.favorite : existing.favorite ?? inc.favorite,
        follow_up_date: wf.follow_up_date !== undefined ? wf.follow_up_date : existing.follow_up_date ?? inc.follow_up_date,
        personal_notes: wf.personal_notes !== undefined ? wf.personal_notes : existing.personal_notes ?? inc.personal_notes,
        contacted_date: wf.contacted_date !== undefined ? wf.contacted_date : existing.contacted_date ?? null,
        applied_date: wf.applied_date !== undefined ? wf.applied_date : existing.applied_date ?? null,
        workflow: {
          status: wf.status || existing.user_status || inc.user_status,
          priority: wf.priority || existing.priority || inc.priority,
          favorite: typeof wf.favorite === "boolean" ? wf.favorite : existing.favorite ?? inc.favorite,
          follow_up_date: wf.follow_up_date !== undefined ? wf.follow_up_date : existing.follow_up_date ?? inc.follow_up_date,
          personal_notes: wf.personal_notes !== undefined ? wf.personal_notes : existing.personal_notes ?? inc.personal_notes,
          contacted_date: wf.contacted_date !== undefined ? wf.contacted_date : existing.contacted_date ?? null,
          applied_date: wf.applied_date !== undefined ? wf.applied_date : existing.applied_date ?? null
        }
      });
      existingMap.delete(inc.id);
    } else {
      merged.push(inc);
    }
  }

  // Include any existing records not in incoming
  for (const rem of existingMap.values()) {
    const wf = Array.isArray(rem.workflow_states) && rem.workflow_states[0] ? rem.workflow_states[0] : {};
    merged.push({
      ...rem,
      user_status: wf.status || rem.user_status || "New",
      priority: wf.priority || rem.priority || "Medium",
      favorite: typeof wf.favorite === "boolean" ? wf.favorite : rem.favorite ?? false,
      follow_up_date: wf.follow_up_date !== undefined ? wf.follow_up_date : rem.follow_up_date ?? null,
      personal_notes: wf.personal_notes !== undefined ? wf.personal_notes : rem.personal_notes ?? "",
      workflow: {
        status: wf.status || rem.user_status || "New",
        priority: wf.priority || rem.priority || "Medium",
        favorite: typeof wf.favorite === "boolean" ? wf.favorite : rem.favorite ?? false,
        follow_up_date: wf.follow_up_date !== undefined ? wf.follow_up_date : rem.follow_up_date ?? null,
        personal_notes: wf.personal_notes !== undefined ? wf.personal_notes : rem.personal_notes ?? ""
      }
    });
  }

  // 5. Upsert to Supabase
  let supabaseSynced = false;
  let supabaseMessage = "Supabase not configured";
  if (supabaseUrl && supabaseKey && merged.length > 0) {
    try {
      const oppPayload = merged.map((o) => ({
        id: o.id,
        category: o.category,
        title: o.title,
        organization: o.organization,
        location: o.location,
        country: o.country || "Global / Cyprus",
        source_url: o.source_url,
        source_type: o.source_type || "INGESTION_SCAN",
        last_verified_at: o.last_verified_at,
        deadline: o.deadline || null,
        is_active: o.is_active,
        confidence: String(o.confidence || "MEDIUM").toUpperCase(),
        score_total: o.score_total,
        score_components: o.score_components,
        score_explanation: o.score_explanation || [],
        details: o.details,
        provenance_urls: o.provenance_urls || [o.source_url],
        fingerprint: o.fingerprint || null
      }));

      const upRes = await fetch(`${supabaseUrl}/rest/v1/opportunities`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(oppPayload)
      });

      if (upRes.ok) {
        supabaseSynced = true;
        supabaseMessage = `Successfully synced ${oppPayload.length} opportunities to Supabase.`;

        const wfPayload = merged.map((o) => ({
          opportunity_id: o.id,
          status: o.workflow?.status || o.user_status || "New",
          priority: o.workflow?.priority || o.priority || "P2",
          favorite: o.workflow?.favorite ?? o.favorite ?? false,
          follow_up_date: o.workflow?.follow_up_date || o.follow_up_date || null,
          personal_notes: o.workflow?.personal_notes || o.personal_notes || ""
        }));

        await fetch(`${supabaseUrl}/rest/v1/workflow_states`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify(wfPayload)
        }).catch(() => {});

        const overallStatus =
          sourceDiagnostics.every((s) => s.status === "Connected")
            ? "SUCCESS"
            : sourceDiagnostics.some((s) => s.status === "Connected")
            ? "PARTIAL"
            : "FAILED";

        await fetch(`${supabaseUrl}/rest/v1/research_runs`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            run_id: runId,
            run_timestamp: startedAt.toISOString(),
            sources_checked: sourceDiagnostics.length,
            discovered_count: newlyIngestedRaw.length,
            accepted_count: merged.length,
            deduplicated_count: newlyIngestedRaw.length - merged.length,
            filtered_count: merged.filter((x) => !x.is_active).length,
            sheets_sync_status: overallStatus,
            duration_sec: parseFloat(((Date.now() - startTime) / 1000).toFixed(2))
          })
        }).catch(() => {});
      }
    } catch (e: any) {
      supabaseMessage = `Supabase sync error: ${e.message}`;
    }
  }

  const completedAt = new Date();
  const telemetry = {
    runId,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startTime,
    status: sourceDiagnostics.every((s) => s.status === "Connected")
      ? "SUCCESS"
      : sourceDiagnostics.some((s) => s.status === "Connected")
      ? "PARTIAL"
      : "FAILED",
    sourcesAttempted: sourceDiagnostics.length,
    sourcesSucceeded: sourceDiagnostics.filter((s) => s.status === "Connected").length,
    sourcesFailed: sourceDiagnostics.filter((s) => s.status !== "Connected").length,
    recordsAdded: newlyIngestedRaw.length,
    recordsUpdated: existingRecords.length,
    recordsUnchanged: 0,
    recordsGated: merged.filter((x) => !x.is_active).length,
    userFieldsPreserved: existingRecords.length,
    totalRecords: merged.length,
    sourceDiagnostics,
    supabaseSynced,
    supabaseMessage,
    records: merged
  };

  return new Response(JSON.stringify(telemetry), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200
  });
});
