import Link from "next/link";

import { ResumeDocument } from "@/components/resume-document";
import { SiteHeader } from "@/components/site-header";
import { createStarterResumeData, marketingTemplateOrder, sampleThemeSettings } from "@/lib/sample-resume";
import { templateOptions } from "@/lib/template-options";

const sample = createStarterResumeData("Avery Lane");

export default function TemplatesPage() {
  return (
    <main className="templates-page">
      <SiteHeader actions={<Link className="primary-button" href="/login">Open Builder</Link>} />

      <section className="templates-page__hero">
        <p className="eyebrow">Templates</p>
        <h1 className="page-title">Launch with four distinct looks, not one recycled layout.</h1>
        <p className="page-copy">
          Each template uses the same resume schema and print system, so users can swap styles
          without rewriting content.
        </p>
      </section>

      <section className="template-gallery">
        {marketingTemplateOrder.map((templateKey) => {
          const meta = templateOptions.find((item) => item.key === templateKey);

          return (
            <article className="template-card" key={templateKey}>
              <p className="eyebrow">{meta?.name}</p>
              <h2 className="section-title">{meta?.blurb}</h2>
              <div className="resume-preview-frame">
                <ResumeDocument
                  resumeData={sample}
                  template={templateKey}
                  themeSettings={sampleThemeSettings}
                  title={`${meta?.name} preview`}
                />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
