import { notFound, redirect } from "next/navigation";

import { CareerAssetEditorShell } from "@/components/career-asset-editor-shell";
import { requireUser } from "@/lib/auth-guard";
import { coerceCareerAssetRecord } from "@/lib/career-asset-record";
import type { CareerAssetType } from "@/lib/career-assets";
import { db } from "@/lib/db";

export default async function CareerAssetEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const asset = await db.careerAsset.findFirst({
    where: {
      id,
      ownerId: user.id,
      archivedAt: null,
    },
  });

  if (!asset) {
    notFound();
  }

  if (asset.type === "RESUME") {
    redirect(`/app/resumes/${asset.id}/edit`);
  }

  return (
    <CareerAssetEditorShell
      asset={coerceCareerAssetRecord(
        asset as typeof asset & { type: Exclude<CareerAssetType, "RESUME"> },
      )}
    />
  );
}
