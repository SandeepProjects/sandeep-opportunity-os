/**
 * TypeScript definitions for Sandeep Opportunity OS Ingestion Adapters
 */
import type { OpportunityRecord, CandidateProfile } from "../../types/opportunity";

export function normalizePrivateKey(key: string): string;

export function getGoogleAccessToken(options?: {
  email?: string;
  privateKey?: string;
  scopes?: string[];
  fetchFn?: typeof globalThis.fetch;
  forceRefresh?: boolean;
}): Promise<string>;

export function clearTokenCache(): void;

export function fetchSheetValues(params: {
  spreadsheetId: string;
  range: string;
  token: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: "Connected" | "Permission required" | "Not Found" | "Failed";
  statusCode: number;
  values: any[][];
  range?: string;
  error?: string;
}>;

export function fetchSpreadsheetMetadata(params: {
  spreadsheetId: string;
  token: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: string;
  statusCode: number;
  title?: string;
  sheets: Array<{ title: string; sheetId?: number; rowCount?: number }>;
  error?: string;
}>;

export function valuesToObjects(values: any[][]): Array<Record<string, string>>;

export function fetchMuseSocialLeads(params?: {
  token?: string;
  spreadsheetId?: string;
  tabName?: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: string;
  statusCode: number;
  records: Array<Record<string, string>>;
  rawCount: number;
  error?: string;
}>;

export function downloadDriveFile(params: {
  fileId: string;
  token: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: "Connected" | "Permission required" | "Not Found" | "Failed";
  statusCode: number;
  buffer?: Buffer;
  error?: string;
}>;

export function parseXlsxBuffer(
  buffer: Buffer,
  targetSheetNames?: string[]
): {
  sheetNames: string[];
  sheets: Record<string, Array<Record<string, string>>>;
  rawRows: Record<string, string[][]>;
};

export function fetchMasterJobTracker(params: {
  fileId?: string;
  token: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: string;
  statusCode: number;
  sheetNames: string[];
  records: Array<Record<string, string>>;
  allSheets?: Record<string, Array<Record<string, string>>>;
  error?: string;
}>;

export function fetchMastersWorkbook(params: {
  fileId?: string;
  token: string;
  fetchFn?: typeof globalThis.fetch;
}): Promise<{
  ok: boolean;
  status: string;
  statusCode: number;
  sheetNames?: string[];
  programmes: Array<Record<string, string>>;
  scholarships: Array<Record<string, string>>;
  error?: string;
}>;

export function generateDeterministicId(category: string, uniqueKey: string): string;

export function normalizeMuseSocialLead(row: Record<string, any>, index?: number): OpportunityRecord;

export function normalizeMasterJobTrackerRow(row: Record<string, any>, index?: number): OpportunityRecord;

export function normalizeMasterProgrammeRow(row: Record<string, any>, index?: number): OpportunityRecord;

export function normalizeScholarshipRow(row: Record<string, any>, index?: number): OpportunityRecord;

export function preserveUserCrmFields(
  existing: OpportunityRecord,
  incoming: OpportunityRecord
): OpportunityRecord;

export function normalizeAndMergeRecords(
  incomingRaw: any[],
  existingRecords?: OpportunityRecord[],
  profile?: Partial<CandidateProfile>
): {
  merged: OpportunityRecord[];
  addedCount: number;
  updatedCount: number;
  preservedCount: number;
  gatedCount: number;
};
