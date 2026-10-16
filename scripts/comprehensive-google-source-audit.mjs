import fs from 'node:fs';
import { getGoogleAccessToken } from '../supabase/functions/_shared/canonicalSync.mjs';

const SOURCES_TO_CHECK = [
  // Bago Muse
  { key: 'FB_INSTA', id: '1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0', name: 'FB - INSTA APPLICATIONS', type: 'sheet' },
  { key: 'GRADUATE_SCHEMES_TRACKER', id: '1zGcyFrXBXQKOrmgJngXGYfIlYm1n1s_AV_DlHJ9tgtQ', name: 'GRADUATE SCHEMES - MASTER TRACKER', type: 'sheet' },
  { key: 'MASTER_JOB_APP_TRACKER', id: '1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1', name: 'MASTER_JOB_APPLICATION_TRACKER.xlsx', type: 'drive_file' },
  { key: 'MASTERS_WB', id: '156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj', name: 'master-spreadsheet.xlsx', type: 'drive_file' },

  // Bago Folders
  { key: 'BAGO_01_SOCIAL', id: '1yw6C0jjEpMr2_SbAYYsUgAJQoi_eHHVg', name: '01_SOCIAL_JOB_HUNTER', type: 'folder' },
  { key: 'BAGO_02_EU', id: '1uInVx_s6JLT4XeyCo1ekTerc-dsHQnAT', name: '02_EU_JOB_HELP', type: 'folder' },
  { key: 'BAGO_03_WEB', id: '1e8WRQ3fYeLLIsSRyouwjrpbSjWWP3QHt', name: '03_WEB_CLIENT', type: 'folder' },
  { key: 'BAGO_04_MASTERS', id: '1mqnKd0aFS0ieBPpHbtiiqAzV9wHzif12', name: '04_MASTERS_HELP', type: 'folder' },
  { key: 'BAGO_05_RECRUITMENT', id: '1Byscmy4m9bLPekXoX3GnjEimvaxIsG-g', name: '05_RECRUITMENT_AGENCIES', type: 'folder' },
  { key: 'BAGO_06_SHARED', id: '1n4_RN54PTo_QOMvCKsKVALHf8pZ6NbSs', name: '06_SHARED_RESOURCES', type: 'folder' },
  { key: 'BAGO_90_LEGACY', id: '1ZMtKRrTof3S5CVoSt0jwq3aE9K41_7Wg', name: '90_LEGACY_REVIEW', type: 'folder' },
  { key: 'BAGO_99_DOCS', id: '19VJXe4AZ6vMD0EkCZ2aW9vkXaIbyNTjH', name: '99_DOCUMENTATION', type: 'folder' },
  { key: 'BAGO_SUB_JOBBER', id: '1sqf8aziR829PO2vHporaBO0YFQ_YOEZu', name: '01_SOCIAL_MEDIA_JOBBER', type: 'folder' },
  { key: 'BAGO_SUB_GRAD', id: '1oKi55K_QUY1-61vDoCuRgkgSvyKhNeBI', name: '02_GRADUATE_SCHEMES', type: 'folder' },

  // Haya Satnam / Muse_Satnam
  { key: 'SATNAM_ROOT', id: '1sLbCzLwWZzRcihxM5LlyrZokxtmw_Dj-', name: 'Muse_Satnam Root Folder', type: 'folder' },
  { key: 'SATNAM_APP_PIPELINE', id: '1t5qkojwzDT7Eugz0q3PrXCPHOVonOkyYHzXLzzRYytE', name: 'GLOBAL APPLICATION PIPELINE', type: 'sheet' },
  { key: 'SATNAM_PORTAL_DIR', id: '1zkIKQrIw3ZazPiRyfJ9UC5eJoDdjXQ4KRYV_dHnZ0YM', name: 'GLOBAL PORTAL DIRECTORY', type: 'sheet' },
  { key: 'SATNAM_HPV', id: '1qir3bHP-M4vrB-XNLn7tRcfQPbXJxDZI0-z62GG0FBE', name: 'HPV - CLIENT PROSPECTING MASTER', type: 'sheet' },
  { key: 'SATNAM_BUSINESS_LENDING', id: '1Tt-qxWsjDApZopQUBLXzrf2N_8eaR3eV10bSyV4Sxew', name: 'BUSINESS LENDING UK - SOCIAL MEDIA COMMAND CENTER', type: 'sheet' },
  { key: 'SATNAM_SYSTEM_REGISTRY', id: '1mCJWN5ybA1LqC7OJNfeeyL9WGeaQpNHGXZAGLfeV-8s', name: 'MUSESATNAM - SYSTEM REGISTRY', type: 'sheet' },

  // Kattu AI Regional Sheets
  { key: 'KATTU_INDIA', id: '15hOKXuvZDIrytvqRLQNvLQx4w7wTdFS-DSnvT1XIkOw', name: 'Projects KattuAI — India Regional Job Research', type: 'sheet' },
  { key: 'KATTU_EU', id: '1wi4i3qpDLOzfNXa5_AR6Bvhb4w40xTr4QQmM9qGAzj4', name: 'Projects KattuAI — EU Regional Job Research', type: 'sheet' },
  { key: 'KATTU_UK', id: '1ECo6MFxrDXpOQlTyCRGor5XUgE8e4t2zL-LXWJRFN5A', name: 'Projects KattuAI — UK Regional Job Research', type: 'sheet' },
  { key: 'KATTU_USA', id: '1tIi0TiQ0L1fNUcqTWTsRVJhV-69g3pbrHGGkhmGGvyo', name: 'Projects KattuAI — USA Regional Job Research', type: 'sheet' }
];

async function main() {
  const sa = JSON.parse(fs.readFileSync('.secrets/google-sa-key.json', 'utf8'));
  console.log(`Auditing with Service Account: ${sa.client_email}`);

  const token = await getGoogleAccessToken({
    email: sa.client_email,
    privateKey: sa.private_key
  });
  const headers = { Authorization: `Bearer ${token}` };

  const results = [];

  for (const src of SOURCES_TO_CHECK) {
    const item = {
      key: src.key,
      name: src.name,
      id: src.id,
      type: src.type,
      accessible: false,
      status: 'Unknown',
      details: ''
    };

    try {
      // 1. Try Drive API metadata first
      const dRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${src.id}?supportsAllDrives=true&fields=id,name,mimeType,parents,webViewLink,trashed`,
        { headers }
      );

      if (dRes.status === 200) {
        const meta = await dRes.json();
        item.accessible = true;
        item.status = 'Accessible (Drive)';
        item.driveName = meta.name;
        item.mimeType = meta.mimeType;
        item.parents = meta.parents;

        // If it's a spreadsheet, check Sheets API for tabs
        if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
          const sRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${src.id}?fields=sheets.properties(sheetId,title,gridProperties)`,
            { headers }
          );
          if (sRes.status === 200) {
            const sMeta = await sRes.json();
            item.status = 'Accessible (Sheets API)';
            item.tabs = sMeta.sheets.map((s) => s.properties.title);
            item.details = `Tabs: ${item.tabs.join(', ')}`;
          } else {
            item.details = `Sheets API error HTTP ${sRes.status}`;
          }
        } else {
          item.details = `Mime: ${meta.mimeType}`;
        }
      } else if (dRes.status === 404) {
        item.status = 'Not Found / Unshared';
        item.details = 'HTTP 404: File not found or not shared with service account';
      } else if (dRes.status === 403) {
        item.status = 'Permission Required';
        item.details = 'HTTP 403: Forbidden - service account lacks read permission';
      } else {
        item.status = `HTTP ${dRes.status}`;
        item.details = await dRes.text();
      }
    } catch (err) {
      item.status = 'Error';
      item.details = err.message;
    }

    results.push(item);
  }

  console.log('\n=== COMPLETE GOOGLE DRIVE SOURCE ACCESSIBILITY AUDIT ===\n');
  console.table(
    results.map((r) => ({
      Key: r.key,
      Name: r.name.slice(0, 32),
      ID: r.id.slice(0, 16) + '...',
      Accessible: r.accessible ? '✓ YES' : '✗ NO',
      Status: r.status,
      Details: (r.details || '').slice(0, 45)
    }))
  );

  fs.writeFileSync('scripts/google-audit-results.json', JSON.stringify(results, null, 2));
  console.log('\nWrote audit to scripts/google-audit-results.json');
}

main().catch(console.error);
