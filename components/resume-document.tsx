import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  type CustomSection,
  type ResumeData,
  type ResumeTemplateKey,
  type ThemeSettings,
} from "@/lib/resume-schema";
import { cn, formatDateRange } from "@/lib/utils";

export const resumeDocumentStyles = `
  .resume-document {
    --resume-accent: #1f5eff;
    --resume-paper: #ffffff;
    --resume-ink: #131313;
    --resume-muted: #5f6470;
    --resume-line: rgba(19, 19, 19, 0.12);
    --resume-page-width: 210mm;
    background: var(--resume-paper);
    color: var(--resume-ink);
    width: min(100%, var(--resume-page-width));
    margin: 0 auto;
    font-size: 16px;
    line-height: 1.5;
    box-shadow: 0 18px 45px rgba(17, 24, 39, 0.12);
    border: 1px solid rgba(19, 19, 19, 0.08);
    overflow: hidden;
  }
  .resume-document[data-tone="ivory"] {
    --resume-paper: #f7f1e8;
  }
  .resume-document[data-tone="mist"] {
    --resume-paper: #eff3f6;
  }
  .resume-document__inner {
    padding: 48px;
  }
  .resume-document__header {
    display: grid;
    gap: 18px;
    margin-bottom: 30px;
  }
  .resume-document__name {
    margin: 0;
    font-size: clamp(2rem, 3vw + 1rem, 2.6rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }
  .resume-document__summary {
    color: var(--resume-muted);
    max-width: 65ch;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  .resume-document__summary p {
    margin: 0;
  }
  .resume-document__contacts {
    display: grid;
    gap: 6px;
    padding: 0;
    margin: 0;
    list-style: none;
    color: var(--resume-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .resume-document__contacts a {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }
  .resume-document__section {
    display: grid;
    gap: 18px;
    padding-top: 22px;
    border-top: 1px solid var(--resume-line);
  }
  .resume-document__body,
  .resume-document__stack {
    display: grid;
    gap: 18px;
  }
  .resume-document__section-title {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--resume-accent);
  }
  .resume-document__entry {
    display: grid;
    gap: 8px;
  }
  .resume-document__entry-row {
    display: grid;
    gap: 4px;
    justify-items: start;
  }
  .resume-document__entry-title {
    margin: 0;
    font-size: 1rem;
    line-height: 1.3;
  }
  .resume-document__entry-date {
    color: var(--resume-muted);
    font-size: 0.875rem;
    white-space: normal;
  }
  .resume-document__entry-meta {
    color: var(--resume-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .resume-document__rich {
    color: var(--resume-muted);
    font-size: 0.9375rem;
    line-height: 1.6;
  }
  .resume-document__rich p,
  .resume-document__rich ul {
    margin: 0;
  }
  .resume-document__highlights {
    padding-left: 18px;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .resume-document__skills {
    display: grid;
    gap: 12px;
  }
  .resume-document__skill-group {
    display: grid;
    gap: 4px;
  }
  .resume-document__skill-name {
    font-weight: 700;
  }
  .resume-document__skill-items {
    color: var(--resume-muted);
  }
  .resume-document--simple .resume-document__inner {
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  }
  .resume-document--professional .resume-document__inner {
    font-family: "Instrument Sans", "Segoe UI", sans-serif;
    border-left: 10px solid var(--resume-accent);
  }
  .resume-document--modern .resume-document__header {
    background: linear-gradient(135deg, var(--resume-accent), #0f172a);
    color: white;
    padding: 28px;
    border-radius: 28px;
  }
  .resume-document--modern .resume-document__summary,
  .resume-document--modern .resume-document__contacts,
  .resume-document--modern .resume-document__contacts a {
    color: rgba(255, 255, 255, 0.86);
    border-color: rgba(255, 255, 255, 0.3);
  }
  .resume-document--modern .resume-document__section-title {
    font-size: 0.75rem;
  }
  .resume-document--creative .resume-document__inner {
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
  }
  .resume-document--creative .resume-document__header {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .resume-document--creative .resume-document__section {
    border-top: 0;
    background: rgba(255, 255, 255, 0.52);
    border-radius: 22px;
    padding: 18px 18px 0;
    backdrop-filter: blur(10px);
  }
  .resume-document--creative .resume-document__section-title {
    letter-spacing: 0.08em;
  }
  @media (max-width: 860px) {
    .resume-document__inner {
      padding: 28px;
    }
  }
  @media (max-width: 540px) {
    .resume-document {
      border-radius: 18px;
    }
    .resume-document__inner {
      padding: 18px;
    }
    .resume-document__header {
      gap: 14px;
      margin-bottom: 22px;
    }
    .resume-document__section {
      gap: 14px;
      padding-top: 16px;
    }
    .resume-document__summary {
      max-width: none;
    }
    .resume-document__contacts {
      font-size: 0.8125rem;
    }
    .resume-document--modern .resume-document__header {
      padding: 20px;
      border-radius: 20px;
    }
    .resume-document--creative .resume-document__section {
      padding: 14px 14px 0;
      border-radius: 18px;
    }
  }
  @media print {
    body {
      margin: 0;
      background: white;
    }
    .resume-document {
      box-shadow: none;
      border: 0;
      width: 100%;
    }
    .resume-document__inner {
      padding: 24px 28px;
    }
  }
`;

function MarkdownBlock({ children }: { children: string }) {
  if (!children.trim()) {
    return null;
  }

  return (
    <div className="resume-document__rich">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

function ContactItem({ children, href }: { children: ReactNode; href?: string }) {
  return <li>{href ? <a href={href}>{children}</a> : children}</li>;
}

type ResumeDocumentProps = {
  title?: string;
  resumeData: ResumeData;
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  className?: string;
};

function Entry({
  heading,
  meta,
  date,
  summary,
  highlights,
}: {
  heading: string;
  meta?: string;
  date?: string;
  summary?: string;
  highlights?: string[];
}) {
  return (
    <article className="resume-document__entry">
      <div className="resume-document__entry-row">
        <h3 className="resume-document__entry-title">{heading}</h3>
        {date ? <div className="resume-document__entry-date">{date}</div> : null}
      </div>
      {meta ? <div className="resume-document__entry-meta">{meta}</div> : null}
      {summary ? <MarkdownBlock>{summary}</MarkdownBlock> : null}
      {highlights?.length ? (
        <ul className="resume-document__highlights">
          {highlights.map((item, index) => (
            <li key={`${heading}-${index}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item}</ReactMarkdown>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="resume-document__section">
      <h2 className="resume-document__section-title">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function CustomSectionBlock({ section }: { section: CustomSection }) {
  if (!section.items.length) {
    return null;
  }

  return (
    <Section title={section.title}>
      <div className="resume-document__stack">
        {section.items.map((item) => (
          <Entry
            key={item.id}
            heading={item.title}
            meta={item.subtitle}
            date={formatDateRange(item.startDate, item.endDate)}
            summary={item.summary}
            highlights={item.highlights}
          />
        ))}
      </div>
    </Section>
  );
}

export function ResumeDocumentStyles() {
  return <style>{resumeDocumentStyles}</style>;
}

export function ResumeDocument({
  title,
  resumeData,
  template,
  themeSettings,
  className,
}: ResumeDocumentProps) {
  const contacts = [
    resumeData.basics.email ? (
      <ContactItem key="email" href={`mailto:${resumeData.basics.email}`}>
        {resumeData.basics.email}
      </ContactItem>
    ) : null,
    resumeData.basics.phone ? <ContactItem key="phone">{resumeData.basics.phone}</ContactItem> : null,
    resumeData.basics.website ? (
      <ContactItem key="website" href={resumeData.basics.website}>
        {resumeData.basics.website.replace(/^https?:\/\//, "")}
      </ContactItem>
    ) : null,
    resumeData.basics.location ? <ContactItem key="location">{resumeData.basics.location}</ContactItem> : null,
    ...resumeData.profiles.map((profile) => (
      <ContactItem key={profile.id} href={profile.url}>
        {profile.label}
      </ContactItem>
    )),
  ].filter(Boolean);

  return (
    <article
      className={cn("resume-document", `resume-document--${template}`, className)}
      data-tone={themeSettings.tone}
      style={
        {
          "--resume-accent": themeSettings.accent,
        } as CSSProperties
      }
      aria-label={title ?? resumeData.basics.fullName}
    >
      <ResumeDocumentStyles />
      <div className="resume-document__inner">
        <header className="resume-document__header">
          <div>
            <h1 className="resume-document__name">{resumeData.basics.fullName || title || "Untitled Resume"}</h1>
            {resumeData.basics.summary ? (
              <div className="resume-document__summary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resumeData.basics.summary}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
          {contacts.length ? <ul className="resume-document__contacts">{contacts}</ul> : null}
        </header>

        <div className="resume-document__body">
          {resumeData.experience.length ? (
            <Section title="Experience">
              <div className="resume-document__stack">
                {resumeData.experience.map((item) => (
                  <Entry
                    key={item.id}
                    heading={[item.role, item.company].filter(Boolean).join(", ")}
                    meta={item.location}
                    date={formatDateRange(item.startDate, item.endDate)}
                    summary={item.summary}
                    highlights={item.highlights}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {resumeData.projects.length ? (
            <Section title="Projects">
              <div className="resume-document__stack">
                {resumeData.projects.map((item) => (
                  <Entry
                    key={item.id}
                    heading={item.name}
                    meta={item.url.replace(/^https?:\/\//, "")}
                    date={formatDateRange(item.startDate, item.endDate)}
                    summary={item.summary}
                    highlights={item.highlights}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {resumeData.education.length ? (
            <Section title="Education">
              <div className="resume-document__stack">
                {resumeData.education.map((item) => (
                  <Entry
                    key={item.id}
                    heading={[item.institution, item.studyType].filter(Boolean).join(", ")}
                    meta={item.location}
                    date={formatDateRange(item.startDate, item.endDate)}
                    summary={item.summary}
                    highlights={item.highlights}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {resumeData.skills.length ? (
            <Section title="Skills">
              <div className="resume-document__skills">
                {resumeData.skills.map((group) => (
                  <div className="resume-document__skill-group" key={group.id}>
                    <div className="resume-document__skill-name">{group.name}</div>
                    <div className="resume-document__skill-items">{group.items.join(" • ")}</div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {resumeData.customSections.map((section) => (
            <CustomSectionBlock key={section.id} section={section} />
          ))}
        </div>
      </div>
    </article>
  );
}
