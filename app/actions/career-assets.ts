"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { serializeResumeToMarkdown } from "@/lib/markdown";
import {
  createEmptyInputData,
  createEmptyOutputData,
  createResumeAssetSeedFromAssistant,
  getDefaultAssetTitle,
  getWorkspaceEditorPath,
  normalizeCareerAssetInputData,
  normalizeCareerAssetOutputData,
  type CareerAssetType,
  type ResumeAssistantInput,
  type ResumeAssistantOutput,
} from "@/lib/career-assets";
import { coerceCareerAssetRecord } from "@/lib/career-asset-record";
import { defaultThemeSettings } from "@/lib/resume-schema";
import { createStarterResumeData } from "@/lib/sample-resume";
import { getUniqueSlug } from "@/lib/slug";

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function getOwnedCareerAsset(id: string, ownerId: string) {
  const asset = await db.careerAsset.findFirst({
    where: {
      id,
      ownerId,
    },
  });

  if (!asset) {
    throw new Error("Career asset not found.");
  }

  return asset;
}

async function makeAssetSlug(type: CareerAssetType, title: string) {
  if (type !== "RESUME") {
    return null;
  }

  return getUniqueSlug(title, async (candidate) => {
    const existing = await db.careerAsset.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });

    return Boolean(existing);
  });
}

function revalidateCareerAssetPaths(asset: { id: string; slug: string | null; type: CareerAssetType }) {
  revalidatePath("/");
  revalidatePath("/app");
  revalidatePath("/app/resumes");
  revalidatePath(`/app/assets/${asset.id}`);
  revalidatePath(`/app/resumes/${asset.id}/edit`);
  revalidatePath(`/resume`);
  revalidatePath(`/github-readme`);
  revalidatePath(`/linkedin`);
  revalidatePath(`/portfolio-kit`);

  if (asset.slug && asset.type === "RESUME") {
    revalidatePath(`/r/${asset.slug}`);
  }
}

function createDefaultAssetSeed(type: CareerAssetType) {
  if (type === "RESUME") {
    const resumeData = createStarterResumeData("Your Name");
    return {
      title: getDefaultAssetTitle(type),
      slug: null,
      template: "professional",
      themeSettings: asJson(defaultThemeSettings),
      inputData: asJson(resumeData),
      outputData: asJson(createEmptyOutputData("RESUME")),
      editorState: asJson({ source: "workspace" }),
      markdown: serializeResumeToMarkdown(resumeData),
    };
  }

  return {
    title: getDefaultAssetTitle(type),
    slug: null,
    template: null,
    themeSettings: Prisma.DbNull,
    inputData: asJson(createEmptyInputData(type)),
    outputData: asJson(createEmptyOutputData(type)),
    editorState: asJson({ source: "workspace" }),
    markdown: null,
  };
}

export async function createCareerAssetAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const type = String(formData.get("assetType") ?? "RESUME") as CareerAssetType;
  const defaults = createDefaultAssetSeed(type);
  const slug = await makeAssetSlug(type, defaults.title);

  const asset = await db.careerAsset.create({
    data: {
      ownerId: session.user.id,
      type,
      title: defaults.title,
      slug,
      template: defaults.template,
      themeSettings: defaults.themeSettings,
      inputData: defaults.inputData,
      outputData: defaults.outputData,
      editorState: defaults.editorState,
      markdown: defaults.markdown,
    },
  });

  revalidateCareerAssetPaths(asset);
  redirect(getWorkspaceEditorPath({ id: asset.id, type }));
}

export async function duplicateCareerAssetAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const assetId = String(formData.get("assetId") ?? "");
  const asset = await getOwnedCareerAsset(assetId, session.user.id);
  const title = `${asset.title} Copy`;
  const slug = await makeAssetSlug(asset.type as CareerAssetType, title);

  const duplicate = await db.careerAsset.create({
    data: {
      ownerId: session.user.id,
      type: asset.type,
      title,
      slug,
      template: asset.template,
      themeSettings: asset.themeSettings === null ? Prisma.DbNull : asJson(asset.themeSettings),
      inputData: asJson(asset.inputData),
      outputData: asset.outputData === null ? Prisma.DbNull : asJson(asset.outputData),
      editorState: asset.editorState === null ? Prisma.DbNull : asJson(asset.editorState),
      markdown: asset.markdown,
    },
  });

  revalidateCareerAssetPaths(duplicate);
}

export async function archiveCareerAssetAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const assetId = String(formData.get("assetId") ?? "");
  const asset = await getOwnedCareerAsset(assetId, session.user.id);

  await db.careerAsset.update({
    where: { id: asset.id },
    data: { archivedAt: new Date() },
  });

  revalidateCareerAssetPaths(asset);
}

export async function deleteCareerAssetAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const assetId = String(formData.get("assetId") ?? "");
  const asset = await getOwnedCareerAsset(assetId, session.user.id);

  await db.careerAsset.delete({
    where: { id: asset.id },
  });

  revalidateCareerAssetPaths(asset);
}

export async function updateCareerAssetAction(input: {
  id: string;
  title: string;
  inputData: unknown;
  outputData: unknown;
  editorState?: Record<string, unknown>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false as const, message: "Please sign in to save this asset." };
  }

  const asset = await getOwnedCareerAsset(input.id, session.user.id);
  const normalizedInput = normalizeCareerAssetInputData(asset.type as CareerAssetType, input.inputData);
  const normalizedOutput = normalizeCareerAssetOutputData(asset.type as CareerAssetType, input.outputData);

  const updated = await db.careerAsset.update({
    where: { id: asset.id },
    data: {
      title: input.title.trim() || asset.title,
      inputData: asJson(normalizedInput),
      outputData: asJson(normalizedOutput),
      editorState: asJson(input.editorState ?? {}),
    },
  });

  revalidateCareerAssetPaths(updated);

  return {
    ok: true as const,
    asset: coerceCareerAssetRecord(updated),
  };
}

export async function saveGeneratedCareerAssetAction(input: {
  type: Exclude<CareerAssetType, "RESUME">;
  title: string;
  inputData: unknown;
  outputData: unknown;
  sourcePath?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      needsAuth: true,
      redirectTo: `/login?next=${encodeURIComponent(input.sourcePath || "/")}`,
    };
  }

  const normalizedInput = normalizeCareerAssetInputData(input.type, input.inputData);
  const normalizedOutput = normalizeCareerAssetOutputData(input.type, input.outputData);
  const asset = await db.careerAsset.create({
    data: {
      ownerId: session.user.id,
      type: input.type,
      title: input.title.trim() || getDefaultAssetTitle(input.type),
      inputData: asJson(normalizedInput),
      outputData: asJson(normalizedOutput),
      editorState: asJson({ source: "public-builder" }),
    },
  });

  revalidateCareerAssetPaths(asset);

  return {
    ok: true as const,
    editorPath: getWorkspaceEditorPath({ id: asset.id, type: input.type }),
  };
}

export async function saveGeneratedResumeDraftAction(input: {
  assistantInput: ResumeAssistantInput;
  assistantOutput: ResumeAssistantOutput;
  sourcePath?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      needsAuth: true,
      redirectTo: `/login?next=${encodeURIComponent(input.sourcePath || "/resume")}`,
    };
  }

  const seed = createResumeAssetSeedFromAssistant(input.assistantInput, input.assistantOutput);
  const slug = await makeAssetSlug("RESUME", seed.title);
  const asset = await db.careerAsset.create({
    data: {
      ownerId: session.user.id,
      type: "RESUME",
      title: seed.title,
      slug,
      template: seed.template,
      themeSettings: asJson(seed.themeSettings),
      inputData: asJson(seed.resumeData),
      outputData: asJson(input.assistantOutput),
      editorState: asJson({
        source: "public-builder",
        assistantInput: input.assistantInput,
      }),
      markdown: serializeResumeToMarkdown(seed.resumeData),
    },
  });

  revalidateCareerAssetPaths(asset);

  return {
    ok: true as const,
    editorPath: `/app/resumes/${asset.id}/edit`,
  };
}
