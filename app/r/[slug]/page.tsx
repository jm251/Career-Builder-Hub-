import Link from "next/link";
import { notFound } from "next/navigation";

import { ResumeDocument } from "@/components/resume-document";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { createPublishedSnapshot } from "@/lib/publish";
import { formatPublicDate } from "@/lib/utils";

export default async function PublicResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { slug } = await params;
  const { print } = await searchParams;
  const resume = await db.careerAsset.findFirst({
    where: {
      slug,
      type: "RESUME",
      status: "PUBLISHED",
      archivedAt: null,
    },
  });

  if (!resume?.publishedSnapshot) {
    notFound();
  }

  const snapshot = createPublishedSnapshot(resume.publishedSnapshot as any);

  if (print === "1") {
    return (
      <main className="public-resume-page">
        <section className="public-resume-page__canvas">
          <ResumeDocument
            resumeData={snapshot.resumeData}
            template={snapshot.template}
            themeSettings={snapshot.themeSettings}
            title={snapshot.title}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="public-resume-page">
      <SiteHeader
        actions={
          <a className="primary-button" href={`/r/${slug}/pdf`} target="_blank">
            Download PDF
          </a>
        }
      />

      <section className="public-resume-page__hero">
        <p className="eyebrow">Published resume</p>
        <div className="public-resume-page__meta">
          <div>
            <h1 className="page-title">{snapshot.title}</h1>
            <p className="page-copy">Published {formatPublicDate(snapshot.publishedAt)}</p>
          </div>
          <Link className="secondary-button" href="/">
            Create your own
          </Link>
        </div>
      </section>

      <section className="public-resume-page__canvas">
        <ResumeDocument
          resumeData={snapshot.resumeData}
          template={snapshot.template}
          themeSettings={snapshot.themeSettings}
          title={snapshot.title}
        />
      </section>
    </main>
  );
}
