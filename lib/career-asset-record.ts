import type { CareerAsset } from "@prisma/client";

import {
  normalizeCareerAssetInputData,
  normalizeCareerAssetOutputData,
  type CareerAssetStatus,
  type CareerAssetType,
  type CareerAssetInputDataMap,
  type CareerAssetOutputDataMap,
} from "@/lib/career-assets";
import { createPublishedSnapshot, type PublishedSnapshot } from "@/lib/publish";
import { normalizeThemeSettings, type ThemeSettings } from "@/lib/resume-schema";

type CareerAssetWithJson = CareerAsset & {
  inputData: unknown;
  outputData: unknown;
  editorState: unknown;
  themeSettings: unknown;
  publishedSnapshot: unknown;
};

export type CareerAssetRecord<T extends CareerAssetType = CareerAssetType> = {
  id: string;
  ownerId: string;
  type: T;
  title: string;
  slug: string | null;
  template: string | null;
  themeSettings: ThemeSettings | null;
  inputData: CareerAssetInputDataMap[T];
  outputData: CareerAssetOutputDataMap[T];
  editorState: Record<string, unknown>;
  markdown: string | null;
  status: CareerAssetStatus;
  publishedSnapshot: PublishedSnapshot | null;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export function coerceCareerAssetRecord<T extends CareerAssetType>(
  record: CareerAssetWithJson & { type: T },
): CareerAssetRecord<T>;
export function coerceCareerAssetRecord(
  record: CareerAssetWithJson,
): CareerAssetRecord {
  const type = record.type as CareerAssetType;

  return {
    id: record.id,
    ownerId: record.ownerId,
    type,
    title: record.title,
    slug: record.slug,
    template: record.template,
    themeSettings: record.themeSettings ? normalizeThemeSettings(record.themeSettings) : null,
    inputData: normalizeCareerAssetInputData(type, record.inputData),
    outputData: normalizeCareerAssetOutputData(type, record.outputData),
    editorState: typeof record.editorState === "object" && record.editorState
      ? (record.editorState as Record<string, unknown>)
      : {},
    markdown: record.markdown,
    status: record.status as CareerAssetStatus,
    publishedSnapshot: record.publishedSnapshot
      ? createPublishedSnapshot(record.publishedSnapshot as PublishedSnapshot)
      : null,
    publishedAt: record.publishedAt?.toISOString() ?? null,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}
