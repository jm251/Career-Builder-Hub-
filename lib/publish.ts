import {
  normalizeResumeData,
  normalizeThemeSettings,
  type ResumeData,
  type ResumeTemplateKey,
  type ThemeSettings,
} from "@/lib/resume-schema";

export type PublishedSnapshot = {
  title: string;
  slug: string;
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  resumeData: ResumeData;
  markdown: string;
  publishedAt: string;
};

export function createPublishedSnapshot(input: {
  title: string;
  slug: string;
  template: string;
  themeSettings: unknown;
  resumeData: unknown;
  markdown: string;
  publishedAt?: Date | string | null;
}): PublishedSnapshot {
  return structuredClone({
    title: input.title,
    slug: input.slug,
    template: input.template as ResumeTemplateKey,
    themeSettings: normalizeThemeSettings(input.themeSettings),
    resumeData: normalizeResumeData(input.resumeData),
    markdown: input.markdown,
    publishedAt: new Date(input.publishedAt ?? Date.now()).toISOString(),
  });
}
