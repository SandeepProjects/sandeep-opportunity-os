import type {
  DataSourceResource,
  DataSourceType,
  DataSourceStatus,
  SyncMode,
  PipelineCategory
} from "./dataSources";

export const DATA_SOURCE_REGISTRY: ReadonlyArray<DataSourceResource>;
export function getDataSources(): ReadonlyArray<DataSourceResource>;
export function getDataSourceById(id: string): DataSourceResource | undefined;
export function getDataSourcesByCategory(category: "sheets" | "drive" | "local" | "supabase" | "legacy"): DataSourceResource[];
export function getNextScheduledSync(referenceTime?: Date): {
  iso: string;
  formattedUtc: string;
  minutesRemaining: number;
};
