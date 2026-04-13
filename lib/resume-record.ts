import type { CareerAsset } from "@prisma/client";

import { coerceCareerAssetRecord, type CareerAssetRecord } from "@/lib/career-asset-record";
import { defaultThemeSettings, type ResumeData, type ResumeTemplateKey, type ThemeSettings } from "@/lib/resume-schema";

type ResumeCareerAsset = CareerAsset & {
  inputData: unknown;
  outputData: unknown;
  editorState: unknown;
  themeSettings: unknown;
  publishedSnapshot: unknown;
  type: "RESUME";
};

export type ResumeRecord = Omit<
  CareerAssetRecord<"RESUME">,
  "template" | "themeSettings" | "inputData" | "markdown"
> & {
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  resumeData: ResumeData;
  markdown: string;
};

export function coerceResumeRecord(record: ResumeCareerAsset): ResumeRecord {
  const asset = coerceCareerAssetRecord(record);

  return {
    ...asset,
    type: "RESUME",
    template: (asset.template || "professional") as ResumeTemplateKey,
    themeSettings: asset.themeSettings || defaultThemeSettings,
    resumeData: asset.inputData,
    markdown: asset.markdown || "",
  };
}
