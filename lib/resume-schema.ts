import { z } from "zod";

import { makeId } from "@/lib/utils";

export const templateKeys = ["simple", "professional", "modern", "creative"] as const;
export type ResumeTemplateKey = (typeof templateKeys)[number];

export const toneKeys = ["paper", "ivory", "mist"] as const;
export type ResumeToneKey = (typeof toneKeys)[number];

const markdownText = z.string().max(8_000).default("");
const shortText = z.string().max(200).default("");
const longText = z.string().max(10_000).default("");
const idField = z.string().min(1).default("").catch("");

export const profileSchema = z.object({
  id: idField,
  label: shortText,
  url: shortText,
});

export const experienceItemSchema = z.object({
  id: idField,
  role: shortText,
  company: shortText,
  location: shortText,
  startDate: shortText,
  endDate: shortText,
  summary: markdownText,
  highlights: z.array(markdownText).default([]),
});

export const educationItemSchema = z.object({
  id: idField,
  institution: shortText,
  studyType: shortText,
  location: shortText,
  startDate: shortText,
  endDate: shortText,
  summary: markdownText,
  highlights: z.array(markdownText).default([]),
});

export const projectItemSchema = z.object({
  id: idField,
  name: shortText,
  url: shortText,
  startDate: shortText,
  endDate: shortText,
  summary: markdownText,
  highlights: z.array(markdownText).default([]),
});

export const skillGroupSchema = z.object({
  id: idField,
  name: shortText,
  items: z.array(shortText).default([]),
});

export const customItemSchema = z.object({
  id: idField,
  title: shortText,
  subtitle: shortText,
  startDate: shortText,
  endDate: shortText,
  summary: markdownText,
  highlights: z.array(markdownText).default([]),
});

export const customSectionSchema = z.object({
  id: idField,
  title: shortText,
  items: z.array(customItemSchema).default([]),
});

export const themeSettingsSchema = z.object({
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#1F5EFF"),
  tone: z.enum(toneKeys).default("paper"),
});

export const resumeDataSchema = z.object({
  basics: z.object({
    fullName: shortText,
    email: shortText,
    phone: shortText,
    location: shortText,
    website: shortText,
    summary: longText,
  }),
  profiles: z.array(profileSchema).default([]),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  customSections: z.array(customSectionSchema).default([]),
});

export type Profile = z.infer<typeof profileSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type CustomItem = z.infer<typeof customItemSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;

export const defaultThemeSettings: ThemeSettings = {
  accent: "#1F5EFF",
  tone: "paper",
};

export function createEmptyResumeData(): ResumeData {
  return {
    basics: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
    },
    profiles: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    customSections: [],
  };
}

function withId<T extends { id: string }>(item: T, prefix: string) {
  return {
    ...item,
    id: item.id || makeId(prefix),
  };
}

export function normalizeResumeData(input: unknown): ResumeData {
  const parsed = resumeDataSchema.parse(input ?? createEmptyResumeData());

  return {
    ...parsed,
    basics: {
      ...parsed.basics,
      fullName: parsed.basics.fullName.trim(),
      email: parsed.basics.email.trim(),
      phone: parsed.basics.phone.trim(),
      location: parsed.basics.location.trim(),
      website: parsed.basics.website.trim(),
      summary: parsed.basics.summary.trim(),
    },
    profiles: parsed.profiles
      .map((profile) => withId(profile, "profile"))
      .filter((profile) => profile.label.trim() || profile.url.trim()),
    experience: parsed.experience.map((item) => withId(item, "experience")),
    education: parsed.education.map((item) => withId(item, "education")),
    projects: parsed.projects.map((item) => withId(item, "project")),
    skills: parsed.skills
      .map((item) => withId(item, "skill"))
      .map((item) => ({
        ...item,
        items: item.items.map((value) => value.trim()).filter(Boolean),
      })),
    customSections: parsed.customSections.map((section) => ({
      ...withId(section, "custom-section"),
      items: section.items.map((item) => withId(item, "custom-item")),
    })),
  };
}

export function normalizeThemeSettings(input: unknown): ThemeSettings {
  return themeSettingsSchema.parse(input ?? defaultThemeSettings);
}
