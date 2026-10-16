import fs from 'node:fs';
import path from 'node:path';
import { getGoogleAccessToken } from '../supabase/functions/_shared/canonicalSync.mjs';

async function main() {
  const saPath = path.resolve(process.cwd(), '.secrets/google-sa-key.json');
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

  const token = await getGoogleAccessToken({
    email: sa.client_email,
    privateKey: sa.private_key
  });
  const headers = { Authorization: `Bearer ${token}` };

  async function driveGet(url) {
    const res = await fetch(url, { headers });
    return res.json();
  }

  // Check with supportsAllDrives & includeItemsFromAllDrives
  const qUrl = new URL('https://www.googleapis.com/drive/v3/files');
  qUrl.searchParams.set('pageSize', '100');
  qUrl.searchParams.set('supportsAllDrives', 'true');
  qUrl.searchParams.set('includeItemsFromAllDrives', 'true');
  qUrl.searchParams.set('fields', 'files(id, name, mimeType, parents, owners, sharedWithMeTime, webViewLink)');
  
  const res = await driveGet(qUrl.toString());
  console.log('Total files found with supportsAllDrives:', res.files?.length);
  for (const f of res.files || []) {
    console.log(`- [${f.id}] "${f.name}" (${f.mimeType})`);
    console.log(`  Parents:`, f.parents);
    console.log(`  Owners:`, f.owners);
    console.log(`  Link:`, f.webViewLink);
  }

  // Check parents of 1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0 specifically
  const file1 = await driveGet('https://www.googleapis.com/drive/v3/files/1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0?supportsAllDrives=true&fields=id,name,parents,owners,spaces');
  console.log('\nFile 1 parents details:', file1);

  // Check parents of 1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1
  const file2 = await driveGet('https://www.googleapis.com/drive/v3/files/1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1?supportsAllDrives=true&fields=id,name,parents,owners,spaces');
  console.log('\nFile 2 parents details:', file2);

  // Check parents of 156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj
  const file3 = await driveGet('https://www.googleapis.com/drive/v3/files/156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj?supportsAllDrives=true&fields=id,name,parents,owners,spaces');
  console.log('\nFile 3 parents details:', file3);
}

main().catch(console.error);
