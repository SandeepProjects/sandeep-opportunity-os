import fs from 'node:fs';
import path from 'node:path';
import { getGoogleAccessToken } from '../src/pipeline/canonicalSyncEngine.mjs';

const saPath = path.resolve('.secrets/google-sa-key.json');
if (!fs.existsSync(saPath)) {
  console.error('Service account key file not found');
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

async function verifySources() {
  console.log('[Source Check] Requesting Google OAuth2 access token...');
  let token;
  try {
    token = await getGoogleAccessToken({
      email: sa.client_email,
      privateKey: sa.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    console.log('[Source Check] OAuth2 Token obtained successfully!');
  } catch (err) {
    console.error('[Source Check] Token exchange failed:', err.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Check JOB_CMS_AGENTS folder
  const folderId = '1HNfO3cJ56CPOgiMXiokwigS7hkbsUy5V';
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,parents`, { headers });
    console.log(`\n1. JOB_CMS_AGENTS Folder (${folderId}): HTTP ${res.status}`);
    if (res.ok) {
      const folder = await res.json();
      console.log(`   Name: ${folder.name} | MimeType: ${folder.mimeType}`);
      // List children in this folder
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,modifiedTime)`, { headers });
      if (listRes.ok) {
        const listData = await listRes.json();
        console.log(`   Items in JOB_CMS_AGENTS folder (${listData.files?.length || 0}):`);
        for (const file of listData.files || []) {
          console.log(`   - [${file.mimeType}] ${file.name} (ID: ${file.id}) Modified: ${file.modifiedTime}`);
        }
      }
    } else {
      console.log(`   Error: ${await res.text()}`);
    }
  } catch (err) {
    console.log(`   Exception checking folder: ${err.message}`);
  }

  // 2. Check MUSE Google Sheet
  const museSheetId = '1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0';
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${museSheetId}?fields=sheets(properties(title,gridProperties))`, { headers });
    console.log(`\n2. MUSE Sheet (${museSheetId}): HTTP ${metaRes.status}`);
    if (metaRes.ok) {
      const meta = await metaRes.json();
      console.log('   Available Tabs:');
      for (const s of meta.sheets || []) {
        console.log(`   - Tab "${s.properties?.title}" (Rows: ${s.properties?.gridProperties?.rowCount}, Cols: ${s.properties?.gridProperties?.columnCount})`);
      }
      // Test fetching ALL LEADS range
      const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${museSheetId}/values/'ALL LEADS'!A:AG?valueRenderOption=FORMATTED_VALUE`, { headers });
      console.log(`   'ALL LEADS'!A:AG Range fetch: HTTP ${valuesRes.status}`);
      if (valuesRes.ok) {
        const valData = await valuesRes.json();
        const rowCount = valData.values ? valData.values.length : 0;
        const colCount = rowCount > 0 ? valData.values[0].length : 0;
        console.log(`   Fetched rows: ${rowCount}, header columns: ${colCount}`);
        if (rowCount > 0) {
          console.log(`   Headers: ${valData.values[0].slice(0, 10).join(', ')} ...`);
        }
      }
    } else {
      console.log(`   Error: ${await metaRes.text()}`);
    }
  } catch (err) {
    console.log(`   Exception checking MUSE sheet: ${err.message}`);
  }

  // 3. Check MASTER_JOB_APPLICATION_TRACKER.xlsx
  const masterTrackerId = '1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1';
  try {
    const trackerRes = await fetch(`https://www.googleapis.com/drive/v3/files/${masterTrackerId}?fields=id,name,mimeType,size,modifiedTime`, { headers });
    console.log(`\n3. MASTER_JOB_APPLICATION_TRACKER.xlsx (${masterTrackerId}): HTTP ${trackerRes.status}`);
    if (trackerRes.ok) {
      const fileData = await trackerRes.json();
      console.log(`   Name: ${fileData.name} | Size: ${fileData.size} bytes | Modified: ${fileData.modifiedTime}`);
    } else {
      console.log(`   Error: ${await trackerRes.text()}`);
    }
  } catch (err) {
    console.log(`   Exception checking Master Tracker: ${err.message}`);
  }

  // 4. Check master-spreadsheet.xlsx
  const mastersWbId = '156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj';
  try {
    const mastersRes = await fetch(`https://www.googleapis.com/drive/v3/files/${mastersWbId}?fields=id,name,mimeType,size,modifiedTime`, { headers });
    console.log(`\n4. master-spreadsheet.xlsx (${mastersWbId}): HTTP ${mastersRes.status}`);
    if (mastersRes.ok) {
      const fileData = await mastersRes.json();
      console.log(`   Name: ${fileData.name} | Size: ${fileData.size} bytes | Modified: ${fileData.modifiedTime}`);
    } else {
      console.log(`   Error: ${await mastersRes.text()}`);
    }
  } catch (err) {
    console.log(`   Exception checking Masters Workbook: ${err.message}`);
  }
}

verifySources();
