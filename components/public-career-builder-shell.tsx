"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { Copy, Download, Save, Sparkles, Plus, Trash2 } from "lucide-react";

import { saveGeneratedCareerAssetAction } from "@/app/actions/career-assets";
import {
  createEmptyInputData,
  createEmptyOutputData,
  getAssetTypeLabel,
  getDefaultGuestDraftKey,
  type CareerAssetInputDataMap,
  type CareerAssetOutputDataMap,
  type CareerAssetType,
  type GitHubReadmeInputData,
  type LinkedInProfileInputData,
  type PortfolioKitInputData,
} from "@/lib/career-assets";
import { cn } from "@/lib/utils";

type PublicAssetType = Exclude<CareerAssetType, "RESUME">;
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

function routeFragment(type: PublicAssetType) {
  switch (type) {
    case "GITHUB_README":
      return "github-readme";
    case "LINKEDIN_PROFILE":
      return "linkedin";
    case "PORTFOLIO_KIT":
      return "portfolio-kit";
  }
}

export function PublicCareerBuilderShell<T extends PublicAssetType>({
  assetType,
  heading,
  description,
  isAuthenticated,
}: {
  assetType: T;
  heading: string;
  description: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const storageKey = getDefaultGuestDraftKey(assetType);
  const [inputData, setInputData] = useState<CareerAssetInputDataMap[T]>(createEmptyInputData(assetType));
  const [outputData, setOutputData] = useState<CareerAssetOutputDataMap[T]>(createEmptyOutputData(assetType));
  const [statusMessage, setStatusMessage] = useState("Guest drafts stay in this browser.");
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [busy, setBusy] = useState<"idle" | "saving" | "generating">("idle");

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        inputData: CareerAssetInputDataMap[T];
        outputData: CareerAssetOutputDataMap[T];
      };
      setInputData(parsed.inputData);
      setOutputData(parsed.outputData);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        inputData,
        outputData,
      }),
    );
  }, [inputData, outputData, storageKey]);

  async function handleGenerate() {
    setBusy("generating");
    setStatusMessage("Generating content...");

    try {
      const response = await fetch(`/api/generate/${routeFragment(assetType)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputData }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusMessage(payload.message ?? "Generation failed.");
        return;
      }

      setInputData(payload.inputData);
      setOutputData(payload.outputData);
      setMobilePane("output");
      setStatusMessage("Generated and saved in local draft storage.");
    } finally {
      setBusy("idle");
    }
  }

  function handleSaveToWorkspace() {
    startTransition(async () => {
      setBusy("saving");
      setStatusMessage("Saving to workspace...");

      const result = await saveGeneratedCareerAssetAction({
        type: assetType,
        title: outputTitle(assetType, outputData),
        inputData,
        outputData,
        sourcePath: publicPath(assetType),
      });

      setBusy("idle");

      if (!result.ok) {
        setStatusMessage("Sign in to save this asset.");
        window.location.href = result.redirectTo;
        return;
      }

      setStatusMessage("Saved to workspace.");
      router.push(result.editorPath);
    });
  }

  return (
    <main className="marketing-page">
      <section className="public-builder-hero">
        <div>
          <p className="eyebrow">{getAssetTypeLabel(assetType)}</p>
          <h1 className="page-title">{heading}</h1>
          <p className="page-copy">{description}</p>
        </div>
        <div className="page-actions">
          <Link className="ghost-button" href="/">
            Home
          </Link>
          <Link className="ghost-button" href="/app">
            Workspace
          </Link>
        </div>
      </section>

      <section className="editor-toolbar surface-card">
        <div className="editor-toolbar__actions">
          <button className="secondary-button" disabled={busy !== "idle"} onClick={handleGenerate} type="button">
            <Sparkles size={16} />
            Generate
          </button>
          <button className="primary-button" disabled={busy !== "idle"} onClick={handleSaveToWorkspace} type="button">
            <Save size={16} />
            {isAuthenticated ? "Save to workspace" : "Sign in to save"}
          </button>
        </div>
        <div className="status-pill">
          <Save size={14} />
          {statusMessage}
        </div>

        <div className="editor-toolbar__secondary mobile-only">
          <div className="segmented-control" role="tablist" aria-label="Builder panes">
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
          {assetType === "GITHUB_README" ? (
            <GitHubReadmeFields value={inputData as GitHubReadmeInputData} onChange={(next) => setInputData(next as CareerAssetInputDataMap[T])} />
          ) : null}
          {assetType === "LINKEDIN_PROFILE" ? (
            <LinkedInFields value={inputData as LinkedInProfileInputData} onChange={(next) => setInputData(next as CareerAssetInputDataMap[T])} />
          ) : null}
          {assetType === "PORTFOLIO_KIT" ? (
            <PortfolioFields value={inputData as PortfolioKitInputData} onChange={(next) => setInputData(next as CareerAssetInputDataMap[T])} />
          ) : null}
        </section>

        <section className={cn("editor-preview surface-card", mobilePane !== "output" && "mobile-hidden")}>
          {assetType === "GITHUB_README" ? <GitHubReadmeOutput outputData={outputData as CareerAssetOutputDataMap["GITHUB_README"]} /> : null}
          {assetType === "LINKEDIN_PROFILE" ? <LinkedInOutput outputData={outputData as CareerAssetOutputDataMap["LINKEDIN_PROFILE"]} /> : null}
          {assetType === "PORTFOLIO_KIT" ? <PortfolioOutput outputData={outputData as CareerAssetOutputDataMap["PORTFOLIO_KIT"]} /> : null}
        </section>
      </div>
    </main>
  );
}

function outputTitle(type: PublicAssetType, outputData: CareerAssetOutputDataMap[PublicAssetType]) {
  switch (type) {
    case "GITHUB_README":
      return (outputData as CareerAssetOutputDataMap["GITHUB_README"]).title;
    case "LINKEDIN_PROFILE":
      return (outputData as CareerAssetOutputDataMap["LINKEDIN_PROFILE"]).title;
    case "PORTFOLIO_KIT":
      return (outputData as CareerAssetOutputDataMap["PORTFOLIO_KIT"]).title;
  }
}

function publicPath(type: PublicAssetType) {
  switch (type) {
    case "GITHUB_README":
      return "/github-readme";
    case "LINKEDIN_PROFILE":
      return "/linkedin";
    case "PORTFOLIO_KIT":
      return "/portfolio-kit";
  }
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

function ItemCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
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

      <div className="subsection">
        <div className="subsection__header">
          <h3>Featured projects</h3>
          <button
            className="ghost-button"
            onClick={() =>
              onChange({
                ...value,
                featuredProjects: [...value.featuredProjects, { id: crypto.randomUUID(), title: "", summary: "", stack: [], url: "" }],
              })
            }
            type="button"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="card-stack">
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
        </div>
      </div>
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

      <div className="subsection">
        <div className="subsection__header">
          <h3>Featured projects</h3>
          <button
            className="ghost-button"
            onClick={() =>
              onChange({
                ...value,
                featuredProjects: [...value.featuredProjects, { id: crypto.randomUUID(), title: "", summary: "", stack: [], url: "" }],
              })
            }
            type="button"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="card-stack">
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
        </div>
      </div>
    </div>
  );
}

function OutputSection({
  title,
  value,
  filename,
}: {
  title: string;
  value: string;
  filename?: string;
}) {
  return (
    <div className="notice-card">
      <div className="subsection__header">
        <strong>{title}</strong>
        <div className="page-actions output-actions">
          <button className="ghost-button" onClick={() => void copyText(value)} type="button">
            <Copy size={14} />
            Copy
          </button>
          {filename ? (
            <button className="ghost-button" onClick={() => downloadText(filename, value)} type="button">
              <Download size={14} />
              Download
            </button>
          ) : null}
        </div>
      </div>
      <pre className="generated-output" data-testid="generated-output">{value}</pre>
    </div>
  );
}

function GitHubReadmeOutput({
  outputData,
}: {
  outputData: CareerAssetOutputDataMap["GITHUB_README"];
}) {
  return (
    <div className="form-stack">
      <p className="eyebrow">Generated README</p>
      <h2 className="section-title">{outputData.title || "GitHub Profile README"}</h2>
      <OutputSection filename="README.md" title="README.md" value={outputData.markdown} />
    </div>
  );
}

function LinkedInOutput({
  outputData,
}: {
  outputData: CareerAssetOutputDataMap["LINKEDIN_PROFILE"];
}) {
  return (
    <div className="form-stack">
      <p className="eyebrow">Generated LinkedIn Copy</p>
      <h2 className="section-title">{outputData.title || "LinkedIn Profile"}</h2>
      <OutputSection title="Headline" value={outputData.headline} />
      <OutputSection title="About" value={outputData.about} />
      <OutputSection title="Experience Bullets" value={outputData.experienceBullets.join("\n")} />
    </div>
  );
}

function PortfolioOutput({
  outputData,
}: {
  outputData: CareerAssetOutputDataMap["PORTFOLIO_KIT"];
}) {
  return (
    <div className="form-stack">
      <p className="eyebrow">Generated Portfolio Kit</p>
      <h2 className="section-title">{outputData.title || "Portfolio Content Kit"}</h2>
      <OutputSection title="Hero Copy" value={`${outputData.heroHeadline}\n\n${outputData.heroSubhead}`} />
      <OutputSection title="About" value={outputData.about} />
      <OutputSection title="Project Summaries" value={outputData.projectSummaries.join("\n\n")} />
      <OutputSection title="Case Study Outline" value={outputData.caseStudyOutline.join("\n")} />
    </div>
  );
}
