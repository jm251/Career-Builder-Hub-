import Link from "next/link";

import { auth } from "@/auth";
import { ResumeDocument } from "@/components/resume-document";
import { SiteHeader } from "@/components/site-header";
import { createStarterResumeData, sampleThemeSettings } from "@/lib/sample-resume";

const sample = createStarterResumeData("Avery Lane");

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="marketing-page">
      <SiteHeader
        actions={
          <Link className="primary-button" href={session?.user ? "/app" : "/login"}>
            {session?.user ? "Open Builder" : "Sign In"}
          </Link>
        }
      />

      <section className="hero-grid">
        <div className="hero-copy">
          <div>
            <p className="eyebrow">Career Builder Hub</p>
            <h1 className="hero-title">Build your resume, GitHub README, LinkedIn copy, and portfolio kit in one place.</h1>
          </div>
          <p className="page-copy">
            Career Builder Hub gives you public generators for every core asset, an internal
            workspace for saved drafts, and a full resume publishing flow with public pages and PDF
            export.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/resume">
              Start with resume
            </Link>
            <Link className="secondary-button" href={session?.user ? "/app" : "/login"}>
              Open workspace
            </Link>
          </div>
          <div className="stats-row">
            <div className="status-pill">4 builders</div>
            <div className="status-pill">Guest generation</div>
            <div className="status-pill">Resume publish + PDF</div>
          </div>
        </div>

        <div className="hero-card">
          <div className="resume-preview-frame">
            <div className="resume-preview-stage">
              <ResumeDocument
                className="resume-preview-document"
                resumeData={sample}
                template="professional"
                themeSettings={sampleThemeSettings}
                title="Avery Lane Resume"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <p className="eyebrow">Career assets</p>
          <h2 className="section-title">Build each channel separately instead of forcing one profile page.</h2>
          <p className="muted-copy">
            Create a GitHub README, LinkedIn copy, portfolio kit, and resume draft with flows tuned
            for each output rather than one generic template.
          </p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Guest first</p>
          <h2 className="section-title">Generate as a guest, then sign in only when you want persistence.</h2>
          <p className="muted-copy">
            Public builders work without an account. Signing in upgrades the experience into a saved
            workspace with history and reusable drafts.
          </p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Resume publishing</p>
          <h2 className="section-title">Keep the hosted resume flow where it matters most.</h2>
          <p className="muted-copy">
            Resume drafts still move into a full editor, public hosted page, and PDF export flow,
            while the other builders stay copy-and-download oriented.
          </p>
        </article>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <p className="eyebrow">Resume</p>
          <h2 className="section-title">Public draft builder plus hosted publish flow.</h2>
          <Link className="secondary-button" href="/resume">
            Open resume builder
          </Link>
        </article>
        <article className="feature-card">
          <p className="eyebrow">GitHub README</p>
          <h2 className="section-title">Generate `README.md` copy you can actually use.</h2>
          <Link className="secondary-button" href="/github-readme">
            Open GitHub builder
          </Link>
        </article>
        <article className="feature-card">
          <p className="eyebrow">LinkedIn</p>
          <h2 className="section-title">Rewrite your headline, about section, and experience bullets.</h2>
          <Link className="secondary-button" href="/linkedin">
            Open LinkedIn builder
          </Link>
        </article>
      </section>
    </main>
  );
}
