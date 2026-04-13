import { notFound } from "next/navigation";

import { ResumeEditorShell } from "@/components/resume-editor-shell";
import { requireUser } from "@/lib/auth-guard";
import type { CareerAssetType } from "@/lib/career-assets";
import { db } from "@/lib/db";
import { coerceResumeRecord } from "@/lib/resume-record";

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await db.careerAsset.findFirst({
    where: {
      id,
      ownerId: user.id,
      type: "RESUME",
      archivedAt: null,
    },
  });

  if (!resume) {
    notFound();
  }

  return (
    <ResumeEditorShell
      resume={coerceResumeRecord(resume as typeof resume & { type: Extract<CareerAssetType, "RESUME"> })}
    />
  );
}
