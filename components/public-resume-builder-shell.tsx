"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Save, Sparkles, Copy } from "lucide-react";

import { saveGeneratedResumeDraftAction } from "@/app/actions/career-assets";
import { ResumeDocument } from "@/components/resume-document";
import {
  createResumeAssetSeedFromAssistant,
  getDefaultGuestDraftKey,
  resumeAssistantInputSchema,
  type ResumeAssistantInput,
  type ResumeAssistantOutput,
} from "@/lib/career-assets";
import { createEmptyOutputData } from "@/lib/career-assets";
import { cn } from "@/lib/utils";

type MobilePane = "edit" | "output" | "preview";

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(items: string[]) {
  return items.join("\n");
}

export function PublicResumeBuilderShell({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const storageKey = getDefaultGuestDraftKey("RESUME");
  const [inputData, setInputData] = useState<ResumeAssistantInput>({
    fullName: "",
    targetRole: "",
    currentRole: "",
    currentCompany: "",
    experienceLevel: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    skills: [],
    achievements: [],
    goals: "",
    extraContext: "",
  });
  const [outputData, setOutputData] = useState<ResumeAssistantOutput>(createEmptyOutputData("RESUME"));
  const [busy, setBusy] = useState<"idle" | "generating" | "saving">("idle");
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [statusMessage, setStatusMessage] = useState("Guest resume drafts stay in this browser.");

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        inputData: ResumeAssistantInput;
        outputData: ResumeAssistantOutput;
      };
      setInputData(resumeAssistantInputSchema.parse(parsed.inputData));
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
    setStatusMessage("Generating resume guidance...");

    try {
      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputData }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusMessage(payload.message ?? "Resume generation failed.");
        return;
      }

      setInputData(payload.inputData);
      setOutputData(payload.outputData);
      setMobilePane("output");
      setStatusMessage("Generated summary and bullet suggestions.");
    } finally {
      setBusy("idle");
    }
  }

  function handleSaveToWorkspace() {
    startTransition(async () => {
      setBusy("saving");
      setStatusMessage("Saving resume draft...");

      const result = await saveGeneratedResumeDraftAction({
        assistantInput: inputData,
        assistantOutput: outputData,
        sourcePath: "/resume",
      });

      setBusy("idle");

      if (!result.ok) {
        setStatusMessage("Sign in to save this resume.");
        window.location.href = result.redirectTo;
        return;
      }

      setStatusMessage("Saved to workspace.");
      router.push(result.editorPath);
    });
  }

  const previewResume = useMemo(() => createResumeAssetSeedFromAssistant(inputData, outputData), [inputData, outputData]);

  return (
    <main className="marketing-page">
      <section className="public-builder-hero">
        <div>
          <p className="eyebrow">Resume Builder</p>
          <h1 className="page-title">Generate a stronger resume draft before you save it.</h1>
          <p className="page-copy">
            Use the public generator to shape your summary and bullets, then save the result into
            the full workspace editor when you are ready to publish and export PDF.
          </p>
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
          <div className="segmented-control" role="tablist" aria-label="Resume builder panes">
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
            <button
              className={cn(mobilePane === "preview" && "is-active")}
              onClick={() => setMobilePane("preview")}
              role="tab"
              type="button"
            >
              Preview
            </button>
          </div>
        </div>
      </section>

      <div className="editor-main">
        <section className={cn("editor-panel surface-card", mobilePane !== "edit" && "mobile-hidden")}>
          <div className="form-stack">
            <div className="field-grid">
              <Field label="Full name" onChange={(next) => setInputData({ ...inputData, fullName: next })} value={inputData.fullName} />
              <Field label="Target role" onChange={(next) => setInputData({ ...inputData, targetRole: next })} value={inputData.targetRole} />
              <Field label="Current role" onChange={(next) => setInputData({ ...inputData, currentRole: next })} value={inputData.currentRole} />
              <Field label="Current company" onChange={(next) => setInputData({ ...inputData, currentCompany: next })} value={inputData.currentCompany} />
              <Field label="Experience level" onChange={(next) => setInputData({ ...inputData, experienceLevel: next })} value={inputData.experienceLevel} />
              <Field label="Location" onChange={(next) => setInputData({ ...inputData, location: next })} value={inputData.location} />
              <Field label="Email" onChange={(next) => setInputData({ ...inputData, email: next })} value={inputData.email} />
              <Field label="Phone" onChange={(next) => setInputData({ ...inputData, phone: next })} value={inputData.phone} />
              <Field label="Website" onChange={(next) => setInputData({ ...inputData, website: next })} value={inputData.website} />
            </div>
            <TextareaField label="Skills (one per line)" onChange={(next) => setInputData({ ...inputData, skills: textToList(next) })} value={listToText(inputData.skills)} />
            <TextareaField label="Achievements (one per line)" onChange={(next) => setInputData({ ...inputData, achievements: textToList(next) })} value={listToText(inputData.achievements)} />
            <TextareaField label="Career goals" onChange={(next) => setInputData({ ...inputData, goals: next })} value={inputData.goals} />
            <TextareaField label="Extra context" onChange={(next) => setInputData({ ...inputData, extraContext: next })} value={inputData.extraContext} />

            <div className="desktop-only">
              <ResumeAssistantOutputCard outputData={outputData} />
            </div>
          </div>
        </section>

        <section
          className={cn(
            "editor-panel surface-card mobile-only",
            mobilePane !== "output" && "mobile-hidden",
          )}
        >
          <ResumeAssistantOutputCard outputData={outputData} />
        </section>

        <section className={cn("editor-preview surface-card", mobilePane !== "preview" && "mobile-hidden")}>
          <div className="form-stack">
            <p className="eyebrow">Draft preview</p>
            <h2 className="section-title">{previewResume.title}</h2>
            <ResumeDocument
              resumeData={previewResume.resumeData}
              template={previewResume.template}
              themeSettings={previewResume.themeSettings}
              title={previewResume.title}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function ResumeAssistantOutputCard({ outputData }: { outputData: ResumeAssistantOutput }) {
  return (
    <div className="notice-card">
      <div className="subsection__header">
        <strong>Generated copy</strong>
        <button
          className="ghost-button"
          onClick={() =>
            void navigator.clipboard.writeText(
              `${outputData.professionalSummary}\n\n${outputData.experienceBullets.join("\n")}`,
            )
          }
          type="button"
        >
          <Copy size={14} />
          Copy
        </button>
      </div>
      <p className="muted-copy">{outputData.professionalSummary}</p>
      <ul className="generated-list">
        {outputData.experienceBullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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
