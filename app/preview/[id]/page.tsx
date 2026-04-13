import { notFound } from "next/navigation";

import { ResumeDocument } from "@/components/resume-document";
import { db } from "@/lib/db";
import { verifyPreviewToken } from "@/lib/preview-token";
import { normalizeResumeData, normalizeThemeSettings, type ResumeTemplateKey } from "@/lib/resume-schema";

export default async function ResumePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token || !verifyPreviewToken(id, token)) {
    notFound();
  }

  const resume = await db.careerAsset.findFirst({
    where: {
      id,
      type: "RESUME",
      archivedAt: null,
    },
  });

  if (!resume) {
    notFound();
  }

  return (
    <main className="public-resume-page">
      <section className="public-resume-page__canvas">
        <ResumeDocument
          resumeData={normalizeResumeData(resume.inputData)}
          template={resume.template as ResumeTemplateKey}
          themeSettings={normalizeThemeSettings(resume.themeSettings)}
          title={resume.title}
        />
      </section>
    </main>
  );
}
