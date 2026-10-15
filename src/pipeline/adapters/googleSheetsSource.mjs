/**
 * Sandeep Opportunity OS — Google Sheets API v4 Ingestion Adapter
 *
 * Server-side only. Reads native Google Sheets using OAuth2 tokens.
 * Truthful status reporting: returns actual HTTP status codes (200, 401, 403, 404).
 * Never claims "Connected" without an HTTP 200 response from Google.
 */

/**
 * Fetches sheet values for a given range using Google Sheets API v4.
 *
 * @param {Object} params
 * @param {string} params.spreadsheetId
 * @param {string} params.range - e.g. "ALL LEADS!A1:Z500" or "'ALL LEADS'!A:Z"
 * @param {string} params.token - Google OAuth2 access token
 * @param {Function} [params.fetchFn]
 * @returns {Promise<{
 *   ok: boolean;
 *   status: "Connected" | "Permission required" | "Not Found" | "Failed";
 *   statusCode: number;
 *   values: any[][];
 *   error?: string;
 * }>}
 */
export async function fetchSheetValues({ spreadsheetId, range, token, fetchFn = globalThis.fetch }) {
  if (!spreadsheetId) {
    return {
      ok: false,
      status: "Failed",
      statusCode: 400,
      values: [],
      error: "Missing spreadsheetId"
    };
  }

  if (!token) {
    return {
      ok: false,
      status: "Permission required",
      statusCode: 401,
      values: [],
      error: "Missing Google OAuth2 token"
    };
  }

  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`;

  try {
    const res = await fetchFn(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      return {
        ok: true,
        status: "Connected",
        statusCode: 200,
        values: data.values || [],
        range: data.range
      };
    }

    if (res.status === 403) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        status: "Permission required",
        statusCode: 403,
        values: [],
        error: `Google Sheets API 403 Forbidden: Service account lacks read permission on spreadsheet ${spreadsheetId}. ${errText}`
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        status: "Not Found",
        statusCode: 404,
        values: [],
        error: `Google Sheets API 404: Spreadsheet ${spreadsheetId} not found.`
      };
    }

    const errBody = await res.text().catch(() => "");
    return {
      ok: false,
      status: "Failed",
      statusCode: res.status,
      values: [],
      error: `Google Sheets API error HTTP ${res.status}: ${errBody}`
    };
  } catch (err) {
    return {
      ok: false,
      status: "Failed",
      statusCode: 0,
      values: [],
      error: `Network/Fetch error reading sheet ${spreadsheetId}: ${err.message}`
    };
  }
}

/**
 * Fetches spreadsheet metadata (sheets/tabs list, properties).
 *
 * @param {Object} params
 * @param {string} params.spreadsheetId
 * @param {string} params.token
 * @param {Function} [params.fetchFn]
 * @returns {Promise<{
 *   ok: boolean;
 *   status: string;
 *   statusCode: number;
 *   sheets: Array<{ title: string; sheetId: number; rowCount?: number }>;
 *   error?: string;
 * }>}
 */
export async function fetchSpreadsheetMetadata({ spreadsheetId, token, fetchFn = globalThis.fetch }) {
  if (!spreadsheetId || !token) {
    return {
      ok: false,
      status: "Failed",
      statusCode: 400,
      sheets: [],
      error: "Missing spreadsheetId or token"
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;

  try {
    const res = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      const sheets = (data.sheets || []).map((s) => ({
        title: s.properties?.title || "",
        sheetId: s.properties?.sheetId,
        rowCount: s.properties?.gridProperties?.rowCount
      }));
      return {
        ok: true,
        status: "Connected",
        statusCode: 200,
        title: data.properties?.title,
        sheets
      };
    }

    if (res.status === 403) {
      return {
        ok: false,
        status: "Permission required",
        statusCode: 403,
        sheets: [],
        error: `Spreadsheet ${spreadsheetId} requires Service Account invitation.`
      };
    }

    return {
      ok: false,
      status: "Failed",
      statusCode: res.status,
      sheets: [],
      error: `HTTP ${res.status}`
    };
  } catch (err) {
    return {
      ok: false,
      status: "Failed",
      statusCode: 0,
      sheets: [],
      error: err.message
    };
  }
}

/**
 * Helper to convert 2D array [headers, ...rows] to array of objects keyed by header.
 *
 * @param {any[][]} values
 * @returns {Array<Record<string, string>>}
 */
export function valuesToObjects(values) {
  if (!Array.isArray(values) || values.length < 2) return [];
  const rawHeaders = values[0] || [];
  const headers = rawHeaders.map((h, i) => String(h || "").trim() || `column_${i + 1}`);

  const results = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row || row.length === 0) continue;
    // Skip completely empty rows
    const hasData = row.some((c) => c !== undefined && c !== null && String(c).trim() !== "");
    if (!hasData) continue;

    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    });
    obj._rowIndex = r + 1; // 1-indexed sheet row
    results.push(obj);
  }
  return results;
}

/**
 * High-level helper to fetch MUSE Facebook & Instagram Job Hunter leads.
 *
 * @param {Object} params
 * @param {string} [params.token]
 * @param {string} [params.spreadsheetId]
 * @param {string} [params.tabName] - Defaults to "ALL LEADS"
 * @param {Function} [params.fetchFn]
 * @returns {Promise<{
 *   ok: boolean;
 *   status: string;
 *   statusCode: number;
 *   records: Array<Record<string, string>>;
 *   rawCount: number;
 *   error?: string;
 * }>}
 */
export async function fetchMuseSocialLeads({
  token,
  spreadsheetId = "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0",
  tabName = "ALL LEADS",
  fetchFn = globalThis.fetch
}) {
  const range = `'${tabName}'!A1:Z1000`;
  const result = await fetchSheetValues({ spreadsheetId, range, token, fetchFn });

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      statusCode: result.statusCode,
      records: [],
      rawCount: 0,
      error: result.error
    };
  }

  const objects = valuesToObjects(result.values);
  return {
    ok: true,
    status: "Connected",
    statusCode: 200,
    records: objects,
    rawCount: objects.length
  };
}
