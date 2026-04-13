"use client";

import Link from "next/link";
import { startTransition, useState, type ReactNode } from "react";
import { Copy, Download, Sparkles, Save, Plus, Trash2 } from "lucide-react";

import { updateCareerAssetAction } from "@/app/actions/career-assets";
import { type CareerAssetRecord } from "@/lib/career-asset-record";
import {
  getAssetTypeLabel,
  getPublicBuilderPath,
  type CareerAssetType,
  type GitHubReadmeInputData,
  type LinkedInProfileInputData,
  type PortfolioKitInputData,
} from "@/lib/career-assets";
import { cn } from "@/lib/utils";

type NonResumeAssetType = Exclude<CareerAssetType, "RESUME">;
type NonResumeAssetRecord = CareerAssetRecord<NonResumeAssetType>;
type MobilePane = "edit" | "output";

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(items: string[]) {
  return items.join("\n");
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

function downloadText(filename: string, value: string) {
  const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CareerAssetEditorShell({ asset }: { asset: NonResumeAssetRecord }) {
  const [title, setTitle] = useState(asset.title);
  const [inputData, setInputData] = useState(asset.inputData);
  const [outputData, setOutputData] = useState(asset.outputData);
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [busy, setBusy] = useState<"idle" | "saving" | "generating">("idle");
  const [statusMessage, setStatusMessage] = useState("Ready");

  async function handleGenerate() {
    setBusy("generating");
    setStatusMessage("Generating...");

    try {
      const response = await fetch(`/api/generate/${routeFragment(asset.type)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputData }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusMessage(payload.message ?? "Generation failed.");
        return;
      }

      setOutputData(payload.outputData);
      setMobilePane("output");
      setStatusMessage("Generated new content.");
    } finally {
      setBusy("idle");
    }
  }

  function handleSave() {
    startTransition(async () => {
      setBusy("saving");
      setStatusMessage("Saving...");

      const result = await updateCareerAssetAction({
        id: asset.id,
        title,
        inputData,
        outputData,
        editorState: { mode: "workspace-editor" },
      });

      setBusy("idle");
      setStatusMessage(result.ok ? "Saved to workspace." : result.message);
    });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{getAssetTypeLabel(asset.type)}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-copy">
            Edit the source details, generate stronger copy, and keep a saved version in your
            workspace.
          </p>
        </div>
        <div className="page-actions">
          <Link className="ghost-button" href="/app">
            Back to workspace
          </Link>
          <Link className="secondary-button" href={getPublicBuilderPath(asset.type)}>
            Public builder
          </Link>
        </div>
      </header>

      <section className="editor-toolbar surface-card">
        <div className="editor-toolbar__primary">
          <label className="field">
            <span className="field__label">Asset title</span>
            <input onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>

          <div className="editor-toolbar__actions">
            <button className="secondary-button" disabled={busy !== "idle"} onClick={handleGenerate} type="button">
              <Sparkles size={16} />
              Generate
            </button>
            <button className="primary-button" disabled={busy !== "idle"} onClick={handleSave} type="button">
              <Save size={16} />
              Save
            </button>
          </div>
        </div>

        <div className="status-pill">
          <Save size={14} />
          {statusMessage}
        </div>

        <div className="editor-toolbar__secondary mobile-only">
          <div className="segmented-control" role="tablist" aria-label="Asset panes">
            <button
              className={cn(mobilePane === "edit" && "is-active")}
              onClick={() => setMobilePane("edit")}
              role="tab"
              type="button"
            >
              Edit
            </button>
            <button
              className={cn(mobilePane === "output" && "is-active")}
              onClick={() => setMobilePane("output")}
              role="tab"
              type="button"
            >
              Output
            </button>
          </div>
        </div>
      </section>

      <div className="editor-main">
        <section className={cn("editor-panel surface-card", mobilePane !== "edit" && "mobile-hidden")}>
          {asset.type === "GITHUB_README" ? (
            <GitHubReadmeFields
              value={inputData as GitHubReadmeInputData}
              onChange={(next) => setInputData(next)}
            />
          ) : null}
          {asset.type === "LINKEDIN_PROFILE" ? (
            <LinkedInFields
              value={inputData as LinkedInProfileInputData}
              onChange={(next) => setInputData(next)}
            />
          ) : null}
          {asset.type === "PORTFOLIO_KIT" ? (
            <PortfolioFields
              value={inputData as PortfolioKitInputData}
              onChange={(next) => setInputData(next)}
            />
          ) : null}
        </section>

        <section className={cn("editor-preview surface-card", mobilePane !== "output" && "mobile-hidden")}>
          {asset.type === "GITHUB_README" ? (
            <GitHubReadmeOutput outputData={outputData as CareerAssetRecord<"GITHUB_README">["outputData"]} title={title} />
          ) : null}
          {asset.type === "LINKEDIN_PROFILE" ? (
            <LinkedInOutput outputData={outputData as CareerAssetRecord<"LINKEDIN_PROFILE">["outputData"]} title={title} />
          ) : null}
          {asset.type === "PORTFOLIO_KIT" ? (
            <PortfolioOutput outputData={outputData as CareerAssetRecord<"PORTFOLIO_KIT">["outputData"]} title={title} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function routeFragment(type: NonResumeAssetType) {
  switch (type) {
    case "GITHUB_README":
      return "github-readme";
    case "LINKEDIN_PROFILE":
      return "linkedin";
    case "PORTFOLIO_KIT":
      return "portfolio-kit";
  }
}

function ProjectEditor({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="subsection">
      <div className="subsection__header">
        <h3>{title}</h3>
        <button className="ghost-button" onClick={onAdd} type="button">
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="card-stack">{children}</div>
    </div>
  );
}

function ItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <article className="item-card">
      <div className="item-card__header">
        <h4>{title}</h4>
        <button className="ghost-button ghost-button--danger" onClick={onRemove} type="button">
          <Trash2 size={14} />
          Remove
        </button>
      </div>
      {children}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function GitHubReadmeFields({
  value,
  onChange,
}: {
  value: GitHubReadmeInputData;
  onChange: (next: GitHubReadmeInputData) => void;
}) {
  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Name" onChange={(next) => onChange({ ...value, name: next })} value={value.name} />
        <Field label="GitHub handle" onChange={(next) => onChange({ ...value, githubHandle: next })} value={value.githubHandle} />
        <Field label="Role" onChange={(next) => onChange({ ...value, role: next })} value={value.role} />
        <Field label="Location" onChange={(next) => onChange({ ...value, location: next })} value={value.location} />
        <Field label="Portfolio URL" onChange={(next) => onChange({ ...value, portfolioUrl: next })} value={value.portfolioUrl} />
        <Field label="LinkedIn URL" onChange={(next) => onChange({ ...value, linkedinUrl: next })} value={value.linkedinUrl} />
      </div>
      <TextareaField label="Bio" onChange={(next) => onChange({ ...value, bio: next })} value={value.bio} />
      <TextareaField label="Tech stack (one per line)" onChange={(next) => onChange({ ...value, techStack: textToList(next) })} value={listToText(value.techStack)} />
      <TextareaField label="Highlights (one per line)" onChange={(next) => onChange({ ...value, highlights: textToList(next) })} value={listToText(value.highlights)} />
      <TextareaField label="Call to action" onChange={(next) => onChange({ ...value, callToAction: next })} value={value.callToAction} />

      <ProjectEditor
        onAdd={() =>
          onChange({
            ...value,
            featuredProjects: [...value.featuredProjects, { id: crypto.randomUUID(), title: "", summary: "", stack: [], url: "" }],
          })
        }
        title="Featured projects"
      >
        {value.featuredProjects.map((project) => (
          <ItemCard key={project.id} onRemove={() => onChange({ ...value, featuredProjects: value.featuredProjects.filter((item) => item.id !== project.id) })} title={project.title || "Project"}>
            <div className="field-grid">
              <Field label="Title" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, title: next } : item) })} value={project.title} />
              <Field label="URL" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, url: next } : item) })} value={project.url} />
            </div>
            <TextareaField label="Summary" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, summary: next } : item) })} value={project.summary} />
            <TextareaField label="Stack (one per line)" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, stack: textToList(next) } : item) })} value={listToText(project.stack)} />
          </ItemCard>
        ))}
      </ProjectEditor>
    </div>
  );
}

function LinkedInFields({
  value,
  onChange,
}: {
  value: LinkedInProfileInputData;
  onChange: (next: LinkedInProfileInputData) => void;
}) {
  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Name" onChange={(next) => onChange({ ...value, name: next })} value={value.name} />
        <Field label="Target role" onChange={(next) => onChange({ ...value, targetRole: next })} value={value.targetRole} />
        <Field label="Current role" onChange={(next) => onChange({ ...value, currentRole: next })} value={value.currentRole} />
        <Field label="Current company" onChange={(next) => onChange({ ...value, currentCompany: next })} value={value.currentCompany} />
        <Field label="Location" onChange={(next) => onChange({ ...value, location: next })} value={value.location} />
        <Field label="Years of experience" onChange={(next) => onChange({ ...value, yearsExperience: next })} value={value.yearsExperience} />
      </div>
      <TextareaField label="Specialties (one per line)" onChange={(next) => onChange({ ...value, specialties: textToList(next) })} value={listToText(value.specialties)} />
      <TextareaField label="Achievements (one per line)" onChange={(next) => onChange({ ...value, achievements: textToList(next) })} value={listToText(value.achievements)} />
      <TextareaField label="Experience notes" onChange={(next) => onChange({ ...value, experienceNotes: next })} value={value.experienceNotes} />
      <TextareaField label="Career goals" onChange={(next) => onChange({ ...value, goals: next })} value={value.goals} />
    </div>
  );
}

function PortfolioFields({
  value,
  onChange,
}: {
  value: PortfolioKitInputData;
  onChange: (next: PortfolioKitInputData) => void;
}) {
  return (
    <div className="form-stack">
      <div className="field-grid">
        <Field label="Name" onChange={(next) => onChange({ ...value, name: next })} value={value.name} />
        <Field label="Professional title" onChange={(next) => onChange({ ...value, professionalTitle: next })} value={value.professionalTitle} />
        <Field label="Audience" onChange={(next) => onChange({ ...value, audience: next })} value={value.audience} />
        <Field label="Location" onChange={(next) => onChange({ ...value, location: next })} value={value.location} />
        <Field label="Contact email" onChange={(next) => onChange({ ...value, contactEmail: next })} value={value.contactEmail} />
      </div>
      <TextareaField label="Bio" onChange={(next) => onChange({ ...value, bio: next })} value={value.bio} />
      <TextareaField label="Portfolio goal" onChange={(next) => onChange({ ...value, portfolioGoal: next })} value={value.portfolioGoal} />
      <TextareaField label="Strengths (one per line)" onChange={(next) => onChange({ ...value, strengths: textToList(next) })} value={listToText(value.strengths)} />
      <TextareaField label="Call to action" onChange={(next) => onChange({ ...value, callToAction: next })} value={value.callToAction} />

      <ProjectEditor
        onAdd={() =>
          onChange({
            ...value,
            featuredProjects: [...value.featuredProjects, { id: crypto.randomUUID(), title: "", summary: "", stack: [], url: "" }],
          })
        }
        title="Featured projects"
      >
        {value.featuredProjects.map((project) => (
          <ItemCard key={project.id} onRemove={() => onChange({ ...value, featuredProjects: value.featuredProjects.filter((item) => item.id !== project.id) })} title={project.title || "Project"}>
            <div className="field-grid">
              <Field label="Title" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, title: next } : item) })} value={project.title} />
              <Field label="URL" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, url: next } : item) })} value={project.url} />
            </div>
            <TextareaField label="Summary" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, summary: next } : item) })} value={project.summary} />
            <TextareaField label="Stack (one per line)" onChange={(next) => onChange({ ...value, featuredProjects: value.featuredProjects.map((item) => item.id === project.id ? { ...item, stack: textToList(next) } : item) })} value={listToText(project.stack)} />
          </ItemCard>
        ))}
      </ProjectEditor>
    </div>
  );
}

function OutputSection({
  title,
  body,
  filename,
}: {
  title: string;
  body: string;
  filename?: string;
}) {
  return (
    <div className="notice-card">
      <div className="subsection__header">
        <strong>{title}</strong>
        <div className="page-actions">
          <button className="ghost-button" onClick={() => void copyText(body)} type="button">
            <Copy size={14} />
            Copy
          </button>
          {filename ? (
            <button className="ghost-button" onClick={() => downloadText(filename, body)} type="button">
              <Download size={14} />
              Download
            </button>
          ) : null}
        </div>
      </div>
      <pre className={cn("generated-output", filename === "README.md" && "generated-output--markdown")}>{body}</pre>
    </div>
  );
}

function GitHubReadmeOutput({
  outputData,
  title,
}: {
  outputData: NonResumeAssetRecord["outputData"];
  title: string;
}) {
  const data = outputData as CareerAssetRecord<"GITHUB_README">["outputData"];
  return (
    <div className="form-stack">
      <p className="eyebrow">Output</p>
      <h2 className="section-title">{data.title || title}</h2>
      <OutputSection body={data.markdown} filename="README.md" title="README.md" />
    </div>
  );
}

function LinkedInOutput({
  outputData,
  title,
}: {
  outputData: NonResumeAssetRecord["outputData"];
  title: string;
}) {
  const data = outputData as CareerAssetRecord<"LINKEDIN_PROFILE">["outputData"];
  return (
    <div className="form-stack">
      <p className="eyebrow">Output</p>
      <h2 className="section-title">{data.title || title}</h2>
      <OutputSection body={data.headline} title="Headline" />
      <OutputSection body={data.about} title="About" />
      <OutputSection body={data.experienceBullets.join("\n")} title="Experience Bullets" />
      <OutputSection body={data.featuredSuggestions.join("\n")} title="Featured Suggestions" />
    </div>
  );
}

function PortfolioOutput({
  outputData,
  title,
}: {
  outputData: NonResumeAssetRecord["outputData"];
  title: string;
}) {
  const data = outputData as CareerAssetRecord<"PORTFOLIO_KIT">["outputData"];
  return (
    <div className="form-stack">
      <p className="eyebrow">Output</p>
      <h2 className="section-title">{data.title || title}</h2>
      <OutputSection body={`${data.heroHeadline}\n\n${data.heroSubhead}`} title="Hero Copy" />
      <OutputSection body={data.about} title="About Section" />
      <OutputSection body={data.projectSummaries.join("\n\n")} title="Project Summaries" />
      <OutputSection body={data.caseStudyOutline.join("\n")} title="Case Study Outline" />
      <OutputSection body={data.callToAction} title="Call To Action" />
    </div>
  );
}
