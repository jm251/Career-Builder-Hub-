"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { parseResumeMarkdown, ResumeMarkdownError, serializeResumeToMarkdown } from "@/lib/markdown";
import { createPublishedSnapshot } from "@/lib/publish";
import { normalizeCareerAssetOutputData } from "@/lib/career-assets";
import {
  normalizeResumeData,
  normalizeThemeSettings,
  templateKeys,
  type ResumeData,
  type ResumeTemplateKey,
  type ThemeSettings,
} from "@/lib/resume-schema";
import { coerceResumeRecord } from "@/lib/resume-record";
import { createStarterResumeData } from "@/lib/sample-resume";
import { getUniqueSlug } from "@/lib/slug";

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function getOwnedResumeAsset(id: string, ownerId: string) {
  const asset = await db.careerAsset.findFirst({
    where: {
      id,
      ownerId,
      type: "RESUME",
    },
  });

  if (!asset) {
    throw new Error("Resume not found.");
  }

  return asset;
}

async function getUniqueResumeSlug(source: string) {
  return getUniqueSlug(source, async (candidate) => {
    const existing = await db.careerAsset.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });

    return Boolean(existing);
  });
}

function revalidateResumePaths(id: string, slug: string | null) {
  revalidatePath("/app");
  revalidatePath("/app/resumes");
  revalidatePath(`/app/assets/${id}`);
  revalidatePath(`/app/resumes/${id}/edit`);

  if (slug) {
    revalidatePath(`/r/${slug}`);
  }
}

export async function createResumeAction() {
  const user = await requireUser();
  const title = "New Resume";
  const resumeData = createStarterResumeData("Your Name");
  const markdown = serializeResumeToMarkdown(resumeData);
  const slug = await getUniqueResumeSlug(title);

  const asset = await db.careerAsset.create({
    data: {
      ownerId: user.id,
      type: "RESUME",
      title,
      slug,
      template: "professional",
      themeSettings: asJson(normalizeThemeSettings(undefined)),
      inputData: asJson(resumeData),
      outputData: asJson(normalizeCareerAssetOutputData("RESUME", undefined)),
      editorState: asJson({ source: "workspace" }),
      markdown,
    },
  });

  revalidateResumePaths(asset.id, asset.slug);
  redirect(`/app/resumes/${asset.id}/edit`);
}

export async function duplicateResumeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("resumeId") ?? "");
  const asset = await getOwnedResumeAsset(id, user.id);
  const baseTitle = `${asset.title} Copy`;
  const slug = await getUniqueResumeSlug(baseTitle);

  const duplicate = await db.careerAsset.create({
    data: {
      ownerId: user.id,
      type: "RESUME",
      title: baseTitle,
      slug,
      template: asset.template,
      themeSettings: asset.themeSettings === null ? Prisma.DbNull : asJson(asset.themeSettings),
      inputData: asJson(asset.inputData),
      outputData: asset.outputData === null ? Prisma.DbNull : asJson(asset.outputData),
      editorState: asset.editorState === null ? Prisma.DbNull : asJson(asset.editorState),
      markdown: asset.markdown,
    },
  });

  revalidateResumePaths(duplicate.id, duplicate.slug);
}

export async function archiveResumeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("resumeId") ?? "");
  const asset = await getOwnedResumeAsset(id, user.id);

  await db.careerAsset.update({
    where: { id: asset.id },
    data: {
      archivedAt: new Date(),
    },
  });

  revalidateResumePaths(asset.id, asset.slug);
}

export async function deleteResumeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("resumeId") ?? "");
  const asset = await getOwnedResumeAsset(id, user.id);

  await db.careerAsset.delete({
    where: { id: asset.id },
  });

  revalidateResumePaths(asset.id, asset.slug);
}

export async function updateResumeDraftAction(input: {
  id: string;
  title: string;
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  resumeData: ResumeData;
}) {
  const user = await requireUser();
  const asset = await getOwnedResumeAsset(input.id, user.id);
  const template = templateKeys.includes(input.template) ? input.template : (asset.template as ResumeTemplateKey);
  const resumeData = normalizeResumeData(input.resumeData);
  const themeSettings = normalizeThemeSettings(input.themeSettings);
  const markdown = serializeResumeToMarkdown(resumeData);

  const updated = await db.careerAsset.update({
    where: { id: asset.id },
    data: {
      title: input.title.trim() || resumeData.basics.fullName || asset.title,
      template,
      themeSettings: asJson(themeSettings),
      inputData: asJson(resumeData),
      markdown,
    },
  });

  revalidateResumePaths(updated.id, updated.slug);

  return {
    ok: true,
    markdown,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateResumeMarkdownAction(input: {
  id: string;
  title: string;
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  markdown: string;
}) {
  const user = await requireUser();
  const asset = await getOwnedResumeAsset(input.id, user.id);

  try {
    const parsed = parseResumeMarkdown(input.markdown);
    const updated = await db.careerAsset.update({
      where: { id: asset.id },
      data: {
        title: input.title.trim() || parsed.data.basics.fullName || asset.title,
        template: input.template,
        themeSettings: asJson(normalizeThemeSettings(input.themeSettings)),
        inputData: asJson(parsed.data),
        markdown: parsed.normalizedMarkdown,
      },
    });

    revalidateResumePaths(updated.id, updated.slug);

    return {
      ok: true,
      markdown: parsed.normalizedMarkdown,
      resumeData: parsed.data,
      warnings: parsed.warnings,
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof ResumeMarkdownError) {
      return {
        ok: false as const,
        message: error.message,
        warnings: error.warnings,
      };
    }

    throw error;
  }
}

export async function publishResumeAction(id: string) {
  const user = await requireUser();
  const asset = await getOwnedResumeAsset(id, user.id);
  const publishedAt = new Date();
  const snapshot = createPublishedSnapshot({
    title: asset.title,
    slug: asset.slug || (await getUniqueResumeSlug(asset.title)),
    template: asset.template || "professional",
    themeSettings: asset.themeSettings,
    resumeData: asset.inputData,
    markdown: asset.markdown || "",
    publishedAt,
  });

  const updated = await db.careerAsset.update({
    where: { id: asset.id },
    data: {
      slug: snapshot.slug,
      status: "PUBLISHED",
      publishedSnapshot: asJson(snapshot),
      publishedAt,
    },
  });

  revalidateResumePaths(updated.id, updated.slug);

  return {
    ok: true,
    publicPath: `/r/${updated.slug}`,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  };
}

export async function unpublishResumeAction(id: string) {
  const user = await requireUser();
  const asset = await getOwnedResumeAsset(id, user.id);
  const updated = await db.careerAsset.update({
    where: { id: asset.id },
    data: {
      status: "DRAFT",
      publishedSnapshot: Prisma.DbNull,
      publishedAt: null,
    },
  });

  revalidateResumePaths(updated.id, updated.slug);

  return {
    ok: true,
  };
}

export async function getOwnedResumeRecord(id: string) {
  const user = await requireUser();
  const asset = await getOwnedResumeAsset(id, user.id);

  return coerceResumeRecord(asset as typeof asset & { type: "RESUME" });
}
