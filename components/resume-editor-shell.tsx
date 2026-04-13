"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Download,
  Eye,
  FileUp,
  Globe,
  LayoutTemplate,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  publishResumeAction,
  unpublishResumeAction,
  updateResumeDraftAction,
  updateResumeMarkdownAction,
} from "@/app/actions/resumes";
import { ResumeDocument } from "@/components/resume-document";
import {
  parseResumeMarkdown,
  ResumeMarkdownError,
  serializeResumeToMarkdown,
  type MarkdownParseWarning,
} from "@/lib/markdown";
import { type ResumeRecord } from "@/lib/resume-record";
import {
  type CustomItem,
  type CustomSection,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type Profile,
  type ResumeData,
  type ResumeTemplateKey,
  type SkillGroup,
  type ThemeSettings,
} from "@/lib/resume-schema";
import { accentOptions, templateOptions, toneOptions } from "@/lib/template-options";
import { cn, formatPublicDate, makeId } from "@/lib/utils";

type EditorMode = "form" | "markdown";
type MobilePane = "edit" | "preview";

const editorSections = [
  { id: "overview", label: "Overview" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "custom", label: "Custom" },
];

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEmptyProfile(): Profile {
  return { id: makeId("profile"), label: "", url: "" };
}

function createEmptyExperience(): ExperienceItem {
  return {
    id: makeId("experience"),
    role: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
  };
}

function createEmptyEducation(): EducationItem {
  return {
    id: makeId("education"),
    institution: "",
    studyType: "",
    location: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
  };
}

function createEmptyProject(): ProjectItem {
  return {
    id: makeId("project"),
    name: "",
    url: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
  };
}

function createEmptySkillGroup(): SkillGroup {
  return {
    id: makeId("skill"),
    name: "",
    items: [],
  };
}

function createEmptyCustomItem(): CustomItem {
  return {
    id: makeId("custom-item"),
    title: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
  };
}

function createEmptyCustomSection(): CustomSection {
  return {
    id: makeId("custom-section"),
    title: "Custom Section",
    items: [createEmptyCustomItem()],
  };
}

export function ResumeEditorShell({ resume }: { resume: ResumeRecord }) {
  const [title, setTitle] = useState(resume.title);
  const [template, setTemplate] = useState<ResumeTemplateKey>(resume.template);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(resume.themeSettings);
  const [resumeData, setResumeData] = useState<ResumeData>(resume.resumeData);
  const [markdownValue, setMarkdownValue] = useState(resume.markdown);
  const [mode, setMode] = useState<EditorMode>("form");
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("All changes saved");
  const [warnings, setWarnings] = useState<MarkdownParseWarning[]>([]);
  const [parseError, setParseError] = useState("");
  const [status, setStatus] = useState(resume.status);
  const [publishedAt, setPublishedAt] = useState(resume.publishedAt);
  const [publishing, setPublishing] = useState(false);

  const deferredPreviewData = useDeferredValue(resumeData);
  const formSaveSignature = useRef("");
  const markdownSaveSignature = useRef("");
  const syncMarkdownFromForm = useRef(true);

  const saveFormDraft = useEffectEvent((payload: {
    id: string;
    title: string;
    template: ResumeTemplateKey;
    themeSettings: ThemeSettings;
    resumeData: ResumeData;
  }) => {
    startTransition(async () => {
      setSaveState("saving");
      setSaveMessage("Saving draft...");

      try {
        const result = await updateResumeDraftAction(payload);
        setSaveState("saved");
        setSaveMessage(`Saved ${formatPublicDate(result.updatedAt)}`);
        formSaveSignature.current = JSON.stringify(payload);
        if (syncMarkdownFromForm.current) {
          setMarkdownValue(result.markdown);
        }
      } catch {
        setSaveState("error");
        setSaveMessage("Could not save the draft.");
      }
    });
  });

  const saveMarkdownDraft = useEffectEvent((payload: {
    id: string;
    title: string;
    template: ResumeTemplateKey;
    themeSettings: ThemeSettings;
    markdown: string;
  }) => {
    startTransition(async () => {
      setSaveState("saving");
      setSaveMessage("Saving markdown...");

      const result = await updateResumeMarkdownAction(payload);
      if (!result.ok) {
        setSaveState("error");
        setSaveMessage(result.message ?? "Could not save markdown.");
        return;
      }

      setResumeData(result.resumeData);
      setMarkdownValue(result.markdown);
      setWarnings(result.warnings);
      setParseError("");
      setSaveState("saved");
      setSaveMessage(`Saved ${formatPublicDate(result.updatedAt)}`);
      markdownSaveSignature.current = JSON.stringify(payload);
    });
  });

  useEffect(() => {
    if (mode !== "form") {
      return;
    }

    syncMarkdownFromForm.current = true;
    const payload = {
      id: resume.id,
      title,
      template,
      themeSettings,
      resumeData,
    };
    const signature = JSON.stringify(payload);

    if (signature === formSaveSignature.current) {
      return;
    }

    const timer = window.setTimeout(() => saveFormDraft(payload), 650);
    return () => window.clearTimeout(timer);
  }, [mode, resume.id, title, template, themeSettings, resumeData, saveFormDraft]);

  useEffect(() => {
    if (mode !== "form") {
      return;
    }

    const next = serializeResumeToMarkdown(resumeData);
    setMarkdownValue((current) => (current === next ? current : next));
  }, [mode, resumeData]);

  useEffect(() => {
    if (mode !== "markdown" || parseError) {
      return;
    }

    syncMarkdownFromForm.current = false;
    const payload = {
      id: resume.id,
      title,
      template,
      themeSettings,
      markdown: markdownValue,
    };
    const signature = JSON.stringify(payload);

    if (signature === markdownSaveSignature.current) {
      return;
    }

    const timer = window.setTimeout(() => saveMarkdownDraft(payload), 650);
    return () => window.clearTimeout(timer);
  }, [mode, parseError, markdownValue, resume.id, title, template, themeSettings, saveMarkdownDraft]);

  function updateBasics(field: keyof ResumeData["basics"], value: string) {
    setResumeData((current) => ({
      ...current,
      basics: {
        ...current.basics,
        [field]: value,
      },
    }));
  }

  function updateProfiles(next: Profile[]) {
    setResumeData((current) => ({ ...current, profiles: next }));
  }

  function updateExperience(next: ExperienceItem[]) {
    setResumeData((current) => ({ ...current, experience: next }));
  }

  function updateEducation(next: EducationItem[]) {
    setResumeData((current) => ({ ...current, education: next }));
  }

  function updateProjects(next: ProjectItem[]) {
    setResumeData((current) => ({ ...current, projects: next }));
  }

  function updateSkills(next: SkillGroup[]) {
    setResumeData((current) => ({ ...current, skills: next }));
  }

  function updateCustomSections(next: CustomSection[]) {
    setResumeData((current) => ({ ...current, customSections: next }));
  }

  function handleMarkdownChange(next: string) {
    setMarkdownValue(next);
    setWarnings([]);

    try {
      const parsed = parseResumeMarkdown(next);
      setResumeData(parsed.data);
      setWarnings(parsed.warnings);
      setParseError("");
    } catch (error) {
      if (error instanceof ResumeMarkdownError) {
        setParseError(error.message);
        return;
      }

      setParseError("The markdown draft could not be parsed.");
    }
  }

  async function handleImportFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    setSaveMessage("Importing markdown...");
    setSaveState("saving");

    const response = await fetch("/api/import/markdown", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setSaveState("error");
      setSaveMessage(payload.message ?? "Import failed.");
      return;
    }

    formSaveSignature.current = "";
    markdownSaveSignature.current = "";
    syncMarkdownFromForm.current = true;
    setResumeData(payload.data);
    setMarkdownValue(payload.normalizedMarkdown);
    setWarnings(payload.warnings ?? []);
    setParseError("");
    setMode("form");
    setSaveState("saved");
    setSaveMessage("Imported markdown and normalized the draft.");
  }

  async function handlePublish() {
    setPublishing(true);

    try {
      const result = await publishResumeAction(resume.id);
      if (result.ok) {
        setStatus("PUBLISHED");
        setPublishedAt(result.publishedAt);
        setSaveMessage("Published to the public URL.");
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);

    try {
      const result = await unpublishResumeAction(resume.id);
      if (result.ok) {
        setStatus("DRAFT");
        setPublishedAt(null);
        setSaveMessage("Public access removed.");
      }
    } finally {
      setPublishing(false);
    }
  }

  const publicPath = `/r/${resume.slug}`;

  return (
    <div className="editor-shell">
      <aside className="editor-nav surface-card">
        <div>
          <p className="eyebrow">Builder</p>
          <h2 className="section-title">Resume Studio</h2>
          <p className="muted-copy">
            Edit with structured fields or switch to the full-document markdown tab when you need
            direct control.
          </p>
        </div>

        <nav aria-label="Resume sections" className="editor-nav__links">
          {editorSections.map((section) => (
            <button
              className="ghost-button"
              key={section.id}
              onClick={() =>
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="editor-nav__status">
          <div className={cn("status-pill", saveState === "error" && "status-pill--danger")}>
            <Save size={14} />
            {saveMessage}
          </div>
          <div className="status-pill">
            <Globe size={14} />
            {status === "PUBLISHED" ? `Published ${formatPublicDate(publishedAt)}` : "Draft only"}
          </div>
        </div>
      </aside>

      <div className="editor-workspace">
        <header className="editor-toolbar surface-card">
          <div className="editor-toolbar__primary">
            <label className="field">
              <span className="field__label">Dashboard title</span>
              <input onChange={(event) => setTitle(event.target.value)} value={title} />
            </label>

            <div className="editor-toolbar__actions">
              <a className="secondary-button" href={`/api/resumes/${resume.id}/pdf`} target="_blank">
                <Download size={16} />
                Draft PDF
              </a>

              {status === "PUBLISHED" ? (
                <>
                  <Link className="secondary-button" href={publicPath} target="_blank">
                    <Eye size={16} />
                    View public page
                  </Link>
                  <a className="secondary-button" href={`${publicPath}/pdf`} target="_blank">
                    <Download size={16} />
                    Public PDF
                  </a>
                  <button className="primary-button" disabled={publishing} onClick={handleUnpublish} type="button">
                    Unpublish
                  </button>
                </>
              ) : (
                <button className="primary-button" disabled={publishing} onClick={handlePublish} type="button">
                  Publish
                </button>
              )}
            </div>
          </div>

          <div className="editor-toolbar__secondary">
            <div className="segmented-control">
              <button className={cn(mode === "form" && "is-active")} onClick={() => setMode("form")} type="button">
                Form
              </button>
              <button
                className={cn(mode === "markdown" && "is-active")}
                onClick={() => setMode("markdown")}
                type="button"
              >
                Markdown
              </button>
            </div>

            <div className="segmented-control mobile-only">
              <button
                className={cn(mobilePane === "edit" && "is-active")}
                onClick={() => setMobilePane("edit")}
                type="button"
              >
                Edit
              </button>
              <button
                className={cn(mobilePane === "preview" && "is-active")}
                onClick={() => setMobilePane("preview")}
                type="button"
              >
                Preview
              </button>
            </div>
          </div>
        </header>

        <div className="editor-main">
          <section className={cn("editor-panel surface-card", mobilePane !== "edit" && "mobile-hidden")}>
            <div className="editor-panel__heading">
              <div>
                <p className="eyebrow">Theme</p>
                <h2 className="section-title">Template and style</h2>
              </div>
              <label className="file-button">
                <FileUp size={16} />
                Import markdown
                <input
                  accept=".md,text/markdown"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImportFile(file);
                    }
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>

            <div className="template-grid">
              {templateOptions.map((option) => (
                <button
                  className={cn("template-chip", template === option.key && "is-active")}
                  key={option.key}
                  onClick={() => setTemplate(option.key)}
                  type="button"
                >
                  <LayoutTemplate size={16} />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>

            <div className="swatch-grid">
              {accentOptions.map((accent) => (
                <button
                  aria-label={`Accent ${accent}`}
                  className={cn("color-swatch", themeSettings.accent === accent && "is-active")}
                  key={accent}
                  onClick={() => setThemeSettings((current) => ({ ...current, accent }))}
                  style={{ backgroundColor: accent }}
                  type="button"
                />
              ))}
            </div>

            <div className="tone-row">
              {toneOptions.map((tone) => (
                <button
                  className={cn("ghost-button", themeSettings.tone === tone.key && "is-active")}
                  key={tone.key}
                  onClick={() => setThemeSettings((current) => ({ ...current, tone: tone.key }))}
                  type="button"
                >
                  {tone.name}
                </button>
              ))}
            </div>

            {warnings.length ? (
              <div className="notice-card">
                <strong>Import warnings</strong>
                <ul>
                  {warnings.map((warning, index) => (
                    <li key={`${warning.message}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {mode === "form" ? (
              <div className="form-stack">
                <section className="editor-section" id="overview">
                  <div className="editor-section__header">
                    <h3>Overview</h3>
                  </div>
                  <div className="field-grid">
                    <Field label="Full name" onChange={(value) => updateBasics("fullName", value)} value={resumeData.basics.fullName} />
                    <Field label="Email" onChange={(value) => updateBasics("email", value)} value={resumeData.basics.email} />
                    <Field label="Phone" onChange={(value) => updateBasics("phone", value)} value={resumeData.basics.phone} />
                    <Field label="Location" onChange={(value) => updateBasics("location", value)} value={resumeData.basics.location} />
                    <Field label="Website" onChange={(value) => updateBasics("website", value)} value={resumeData.basics.website} />
                  </div>
                  <TextareaField label="Summary" onChange={(value) => updateBasics("summary", value)} value={resumeData.basics.summary} />

                  <div className="subsection">
                    <div className="subsection__header">
                      <h4>Extra links</h4>
                      <button className="ghost-button" onClick={() => updateProfiles([...resumeData.profiles, createEmptyProfile()])} type="button">
                        <Plus size={14} />
                        Add link
                      </button>
                    </div>
                    <div className="card-stack">
                      {resumeData.profiles.map((profile) => (
                        <ItemCard
                          key={profile.id}
                          onRemove={() => updateProfiles(resumeData.profiles.filter((item) => item.id !== profile.id))}
                          title={profile.label || "New link"}
                        >
                          <div className="field-grid">
                            <Field
                              label="Label"
                              onChange={(value) =>
                                updateProfiles(resumeData.profiles.map((item) => (item.id === profile.id ? { ...item, label: value } : item)))
                              }
                              value={profile.label}
                            />
                            <Field
                              label="URL"
                              onChange={(value) =>
                                updateProfiles(resumeData.profiles.map((item) => (item.id === profile.id ? { ...item, url: value } : item)))
                              }
                              value={profile.url}
                            />
                          </div>
                        </ItemCard>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="editor-section" id="experience">
                  <SectionHeader onAdd={() => updateExperience([...resumeData.experience, createEmptyExperience()])} title="Experience" />
                  <div className="card-stack">
                    {resumeData.experience.map((item) => (
                      <ItemCard
                        key={item.id}
                        onRemove={() => updateExperience(resumeData.experience.filter((entry) => entry.id !== item.id))}
                        title={item.role || "Experience item"}
                      >
                        <div className="field-grid">
                          <Field label="Role" onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, role: value } : entry)))} value={item.role} />
                          <Field label="Company" onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, company: value } : entry)))} value={item.company} />
                          <Field label="Location" onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, location: value } : entry)))} value={item.location} />
                          <Field label="Start" onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, startDate: value } : entry)))} value={item.startDate} />
                          <Field label="End" onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, endDate: value } : entry)))} value={item.endDate} />
                        </div>
                        <TextareaField
                          label="Summary"
                          onChange={(value) => updateExperience(resumeData.experience.map((entry) => (entry.id === item.id ? { ...entry, summary: value } : entry)))}
                          value={item.summary}
                        />
                        <TextareaField
                          label="Highlights (one per line)"
                          onChange={(value) =>
                            updateExperience(
                              resumeData.experience.map((entry) =>
                                entry.id === item.id ? { ...entry, highlights: textToList(value) } : entry,
                              ),
                            )
                          }
                          value={listToText(item.highlights)}
                        />
                      </ItemCard>
                    ))}
                  </div>
                </section>

                <section className="editor-section" id="projects">
                  <SectionHeader onAdd={() => updateProjects([...resumeData.projects, createEmptyProject()])} title="Projects" />
                  <div className="card-stack">
                    {resumeData.projects.map((item) => (
                      <ItemCard
                        key={item.id}
                        onRemove={() => updateProjects(resumeData.projects.filter((entry) => entry.id !== item.id))}
                        title={item.name || "Project"}
                      >
                        <div className="field-grid">
                          <Field label="Project name" onChange={(value) => updateProjects(resumeData.projects.map((entry) => (entry.id === item.id ? { ...entry, name: value } : entry)))} value={item.name} />
                          <Field label="URL" onChange={(value) => updateProjects(resumeData.projects.map((entry) => (entry.id === item.id ? { ...entry, url: value } : entry)))} value={item.url} />
                          <Field label="Start" onChange={(value) => updateProjects(resumeData.projects.map((entry) => (entry.id === item.id ? { ...entry, startDate: value } : entry)))} value={item.startDate} />
                          <Field label="End" onChange={(value) => updateProjects(resumeData.projects.map((entry) => (entry.id === item.id ? { ...entry, endDate: value } : entry)))} value={item.endDate} />
                        </div>
                        <TextareaField
                          label="Summary"
                          onChange={(value) => updateProjects(resumeData.projects.map((entry) => (entry.id === item.id ? { ...entry, summary: value } : entry)))}
                          value={item.summary}
                        />
                        <TextareaField
                          label="Highlights (one per line)"
                          onChange={(value) =>
                            updateProjects(
                              resumeData.projects.map((entry) =>
                                entry.id === item.id ? { ...entry, highlights: textToList(value) } : entry,
                              ),
                            )
                          }
                          value={listToText(item.highlights)}
                        />
                      </ItemCard>
                    ))}
                  </div>
                </section>

                <section className="editor-section" id="education">
                  <SectionHeader onAdd={() => updateEducation([...resumeData.education, createEmptyEducation()])} title="Education" />
                  <div className="card-stack">
                    {resumeData.education.map((item) => (
                      <ItemCard
                        key={item.id}
                        onRemove={() => updateEducation(resumeData.education.filter((entry) => entry.id !== item.id))}
                        title={item.institution || "Education"}
                      >
                        <div className="field-grid">
                          <Field label="Institution" onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, institution: value } : entry)))} value={item.institution} />
                          <Field label="Study type" onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, studyType: value } : entry)))} value={item.studyType} />
                          <Field label="Location" onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, location: value } : entry)))} value={item.location} />
                          <Field label="Start" onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, startDate: value } : entry)))} value={item.startDate} />
                          <Field label="End" onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, endDate: value } : entry)))} value={item.endDate} />
                        </div>
                        <TextareaField
                          label="Summary"
                          onChange={(value) => updateEducation(resumeData.education.map((entry) => (entry.id === item.id ? { ...entry, summary: value } : entry)))}
                          value={item.summary}
                        />
                        <TextareaField
                          label="Highlights (one per line)"
                          onChange={(value) =>
                            updateEducation(
                              resumeData.education.map((entry) =>
                                entry.id === item.id ? { ...entry, highlights: textToList(value) } : entry,
                              ),
                            )
                          }
                          value={listToText(item.highlights)}
                        />
                      </ItemCard>
                    ))}
                  </div>
                </section>

                <section className="editor-section" id="skills">
                  <SectionHeader onAdd={() => updateSkills([...resumeData.skills, createEmptySkillGroup()])} title="Skills" />
                  <div className="card-stack">
                    {resumeData.skills.map((group) => (
                      <ItemCard
                        key={group.id}
                        onRemove={() => updateSkills(resumeData.skills.filter((item) => item.id !== group.id))}
                        title={group.name || "Skill group"}
                      >
                        <Field
                          label="Group name"
                          onChange={(value) => updateSkills(resumeData.skills.map((item) => (item.id === group.id ? { ...item, name: value } : item)))}
                          value={group.name}
                        />
                        <TextareaField
                          label="Items (one per line)"
                          onChange={(value) =>
                            updateSkills(
                              resumeData.skills.map((item) =>
                                item.id === group.id ? { ...item, items: textToList(value) } : item,
                              ),
                            )
                          }
                          value={listToText(group.items)}
                        />
                      </ItemCard>
                    ))}
                  </div>
                </section>

                <section className="editor-section" id="custom">
                  <SectionHeader
                    onAdd={() => updateCustomSections([...resumeData.customSections, createEmptyCustomSection()])}
                    title="Custom sections"
                  />
                  <div className="card-stack">
                    {resumeData.customSections.map((section) => (
                      <ItemCard
                        key={section.id}
                        onRemove={() => updateCustomSections(resumeData.customSections.filter((item) => item.id !== section.id))}
                        title={section.title || "Custom section"}
                      >
                        <Field
                          label="Section title"
                          onChange={(value) =>
                            updateCustomSections(
                              resumeData.customSections.map((item) =>
                                item.id === section.id ? { ...item, title: value } : item,
                              ),
                            )
                          }
                          value={section.title}
                        />

                        <div className="subsection">
                          <div className="subsection__header">
                            <h4>Entries</h4>
                            <button
                              className="ghost-button"
                              onClick={() =>
                                updateCustomSections(
                                  resumeData.customSections.map((item) =>
                                    item.id === section.id
                                      ? { ...item, items: [...item.items, createEmptyCustomItem()] }
                                      : item,
                                  ),
                                )
                              }
                              type="button"
                            >
                              <Plus size={14} />
                              Add entry
                            </button>
                          </div>
                          <div className="card-stack">
                            {section.items.map((item) => (
                              <ItemCard
                                key={item.id}
                                onRemove={() =>
                                  updateCustomSections(
                                    resumeData.customSections.map((group) =>
                                      group.id === section.id
                                        ? { ...group, items: group.items.filter((entry) => entry.id !== item.id) }
                                        : group,
                                    ),
                                  )
                                }
                                title={item.title || "Entry"}
                              >
                                <div className="field-grid">
                                  <Field
                                    label="Title"
                                    onChange={(value) =>
                                      updateCustomSections(
                                        resumeData.customSections.map((group) =>
                                          group.id === section.id
                                            ? {
                                                ...group,
                                                items: group.items.map((entry) =>
                                                  entry.id === item.id ? { ...entry, title: value } : entry,
                                                ),
                                              }
                                            : group,
                                        ),
                                      )
                                    }
                                    value={item.title}
                                  />
                                  <Field
                                    label="Subtitle"
                                    onChange={(value) =>
                                      updateCustomSections(
                                        resumeData.customSections.map((group) =>
                                          group.id === section.id
                                            ? {
                                                ...group,
                                                items: group.items.map((entry) =>
                                                  entry.id === item.id ? { ...entry, subtitle: value } : entry,
                                                ),
                                              }
                                            : group,
                                        ),
                                      )
                                    }
                                    value={item.subtitle}
                                  />
                                  <Field
                                    label="Start"
                                    onChange={(value) =>
                                      updateCustomSections(
                                        resumeData.customSections.map((group) =>
                                          group.id === section.id
                                            ? {
                                                ...group,
                                                items: group.items.map((entry) =>
                                                  entry.id === item.id ? { ...entry, startDate: value } : entry,
                                                ),
                                              }
                                            : group,
                                        ),
                                      )
                                    }
                                    value={item.startDate}
                                  />
                                  <Field
                                    label="End"
                                    onChange={(value) =>
                                      updateCustomSections(
                                        resumeData.customSections.map((group) =>
                                          group.id === section.id
                                            ? {
                                                ...group,
                                                items: group.items.map((entry) =>
                                                  entry.id === item.id ? { ...entry, endDate: value } : entry,
                                                ),
                                              }
                                            : group,
                                        ),
                                      )
                                    }
                                    value={item.endDate}
                                  />
                                </div>
                                <TextareaField
                                  label="Summary"
                                  onChange={(value) =>
                                    updateCustomSections(
                                      resumeData.customSections.map((group) =>
                                        group.id === section.id
                                          ? {
                                              ...group,
                                              items: group.items.map((entry) =>
                                                entry.id === item.id ? { ...entry, summary: value } : entry,
                                              ),
                                            }
                                          : group,
                                      ),
                                    )
                                  }
                                  value={item.summary}
                                />
                                <TextareaField
                                  label="Highlights (one per line)"
                                  onChange={(value) =>
                                    updateCustomSections(
                                      resumeData.customSections.map((group) =>
                                        group.id === section.id
                                          ? {
                                              ...group,
                                              items: group.items.map((entry) =>
                                                entry.id === item.id
                                                  ? { ...entry, highlights: textToList(value) }
                                                  : entry,
                                              ),
                                            }
                                          : group,
                                      ),
                                    )
                                  }
                                  value={listToText(item.highlights)}
                                />
                              </ItemCard>
                            ))}
                          </div>
                        </div>
                      </ItemCard>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="markdown-panel">
                <div className="notice-card">
                  <strong>Markdown mode</strong>
                  <p>
                    The app round-trips its own canonical format. Imported markdown is normalized
                    before it becomes the saved draft.
                  </p>
                </div>
                <label className="field">
                  <span className="field__label">Full document markdown</span>
                  <textarea
                    className="markdown-textarea"
                    onChange={(event) => handleMarkdownChange(event.target.value)}
                    value={markdownValue}
                  />
                </label>
                {parseError ? <div className="notice-card notice-card--danger">{parseError}</div> : null}
              </div>
            )}
          </section>

          <aside className={cn("editor-preview surface-card", mobilePane !== "preview" && "mobile-hidden")}>
            <div className="editor-preview__header">
              <div>
                <p className="eyebrow">Live preview</p>
                <h2 className="section-title">{templateOptions.find((item) => item.key === template)?.name}</h2>
              </div>
              {status === "PUBLISHED" ? (
                <Link className="ghost-button is-active" href={publicPath} target="_blank">
                  Open public page
                </Link>
              ) : null}
            </div>
            <div className="editor-preview__canvas">
              <ResumeDocument
                resumeData={deferredPreviewData}
                template={template}
                themeSettings={themeSettings}
                title={title}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="editor-section__header">
      <h3>{title}</h3>
      <button className="ghost-button" onClick={onAdd} type="button">
        <Plus size={14} />
        Add item
      </button>
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
