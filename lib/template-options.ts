import type { ResumeTemplateKey, ResumeToneKey } from "@/lib/resume-schema";

export const templateOptions: Array<{
  key: ResumeTemplateKey;
  name: string;
  blurb: string;
}> = [
  {
    key: "simple",
    name: "Simple",
    blurb: "Minimal typography and restrained spacing for conservative roles.",
  },
  {
    key: "professional",
    name: "Professional",
    blurb: "Balanced structure with clear hierarchy and a disciplined accent line.",
  },
  {
    key: "modern",
    name: "Modern",
    blurb: "Bold header treatment, tighter cards, and stronger contrast.",
  },
  {
    key: "creative",
    name: "Creative",
    blurb: "Magazine-inspired layout with expressive section framing.",
  },
];

export const toneOptions: Array<{
  key: ResumeToneKey;
  name: string;
}> = [
  { key: "paper", name: "Paper" },
  { key: "ivory", name: "Ivory" },
  { key: "mist", name: "Mist" },
];

export const accentOptions = [
  "#1F5EFF",
  "#B5542E",
  "#0C6E5E",
  "#6A3FD6",
];
