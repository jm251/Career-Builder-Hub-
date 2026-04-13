import { z } from "zod";

import {
  createEmptyResumeData,
  defaultThemeSettings,
  normalizeResumeData,
  normalizeThemeSettings,
  type ResumeData,
  type ResumeTemplateKey,
  type ThemeSettings,
} from "@/lib/resume-schema";
import { makeId, titleCase } from "@/lib/utils";

export const careerAssetTypeKeys = [
  "RESUME",
  "GITHUB_README",
  "LINKEDIN_PROFILE",
  "PORTFOLIO_KIT",
] as const;
export type CareerAssetType = (typeof careerAssetTypeKeys)[number];

export const publishableCareerAssetTypes: CareerAssetType[] = ["RESUME"];

const shortText = z.string().max(200).default("");
const mediumText = z.string().max(2_000).default("");
const longText = z.string().max(12_000).default("");
const markdownText = z.string().max(20_000).default("");
const itemId = z.string().min(1).default("").catch("");

export const generatedOutputBlockSchema = z.object({
  id: itemId,
  title: shortText,
  description: shortText,
  format: z.enum(["markdown", "text"]).default("markdown"),
  body: markdownText,
});

export type GeneratedOutputBlock = z.infer<typeof generatedOutputBlockSchema>;

const featuredProjectSchema = z.object({
  id: itemId,
  title: shortText,
  summary: mediumText,
  stack: z.array(shortText).default([]),
  url: shortText,
});

const profileLinkSchema = z.object({
  id: itemId,
  label: shortText,
  url: shortText,
});

export const resumeAssistantInputSchema = z.object({
  fullName: shortText,
  targetRole: shortText,
  currentRole: shortText,
  currentCompany: shortText,
  experienceLevel: shortText,
  email: shortText,
  phone: shortText,
  location: shortText,
  website: shortText,
  skills: z.array(shortText).default([]),
  achievements: z.array(mediumText).default([]),
  goals: mediumText,
  extraContext: longText,
});

export const resumeAssistantOutputSchema = z.object({
  title: shortText,
  professionalSummary: mediumText,
  experienceBullets: z.array(mediumText).default([]),
  suggestedSkills: z.array(shortText).default([]),
  notes: z.array(shortText).default([]),
  outputBlocks: z.array(generatedOutputBlockSchema).default([]),
});

export const githubReadmeInputSchema = z.object({
  name: shortText,
  githubHandle: shortText,
  role: shortText,
  bio: mediumText,
  location: shortText,
  portfolioUrl: shortText,
  linkedinUrl: shortText,
  techStack: z.array(shortText).default([]),
  highlights: z.array(mediumText).default([]),
  featuredProjects: z.array(featuredProjectSchema).default([]),
  profileLinks: z.array(profileLinkSchema).default([]),
  callToAction: mediumText,
});

export const githubReadmeOutputSchema = z.object({
  title: shortText,
  markdown: markdownText,
  profileTagline: shortText,
  outputBlocks: z.array(generatedOutputBlockSchema).default([]),
  suggestedBadges: z.array(shortText).default([]),
});

export const linkedinProfileInputSchema = z.object({
  name: shortText,
  targetRole: shortText,
  location: shortText,
  yearsExperience: shortText,
  specialties: z.array(shortText).default([]),
  achievements: z.array(mediumText).default([]),
  currentRole: shortText,
  currentCompany: shortText,
  experienceNotes: longText,
  goals: mediumText,
});

export const linkedinProfileOutputSchema = z.object({
  title: shortText,
  headline: shortText,
  about: mediumText,
  experienceBullets: z.array(mediumText).default([]),
  featuredSuggestions: z.array(shortText).default([]),
  skillsToFeature: z.array(shortText).default([]),
  outputBlocks: z.array(generatedOutputBlockSchema).default([]),
});

export const portfolioKitInputSchema = z.object({
  name: shortText,
  professionalTitle: shortText,
  audience: shortText,
  bio: mediumText,
  location: shortText,
  contactEmail: shortText,
  portfolioGoal: mediumText,
  strengths: z.array(shortText).default([]),
  featuredProjects: z.array(featuredProjectSchema).default([]),
  callToAction: mediumText,
});

export const portfolioKitOutputSchema = z.object({
  title: shortText,
  heroHeadline: shortText,
  heroSubhead: mediumText,
  about: mediumText,
  projectSummaries: z.array(mediumText).default([]),
  caseStudyOutline: z.array(shortText).default([]),
  callToAction: mediumText,
  outputBlocks: z.array(generatedOutputBlockSchema).default([]),
});

export type ResumeAssistantInput = z.infer<typeof resumeAssistantInputSchema>;
export type ResumeAssistantOutput = z.infer<typeof resumeAssistantOutputSchema>;
export type GitHubReadmeInputData = z.infer<typeof githubReadmeInputSchema>;
export type GitHubReadmeOutputData = z.infer<typeof githubReadmeOutputSchema>;
export type LinkedInProfileInputData = z.infer<typeof linkedinProfileInputSchema>;
export type LinkedInProfileOutputData = z.infer<typeof linkedinProfileOutputSchema>;
export type PortfolioKitInputData = z.infer<typeof portfolioKitInputSchema>;
export type PortfolioKitOutputData = z.infer<typeof portfolioKitOutputSchema>;

export type CareerAssetInputDataMap = {
  RESUME: ResumeData;
  GITHUB_README: GitHubReadmeInputData;
  LINKEDIN_PROFILE: LinkedInProfileInputData;
  PORTFOLIO_KIT: PortfolioKitInputData;
};

export type CareerAssetOutputDataMap = {
  RESUME: ResumeAssistantOutput;
  GITHUB_README: GitHubReadmeOutputData;
  LINKEDIN_PROFILE: LinkedInProfileOutputData;
  PORTFOLIO_KIT: PortfolioKitOutputData;
};

export type CareerAssetStatus = "DRAFT" | "PUBLISHED";

function withId<T extends { id: string }>(item: T, prefix: string) {
  return {
    ...item,
    id: item.id || makeId(prefix),
  };
}

function normalizeFeaturedProjects(
  projects: Array<z.infer<typeof featuredProjectSchema>>,
) {
  return projects.map((project) => ({
    ...withId(project, "featured-project"),
    stack: project.stack.map((entry) => entry.trim()).filter(Boolean),
  }));
}

function normalizeOutputBlocks(blocks: GeneratedOutputBlock[]) {
  return blocks.map((block) => ({
    ...withId(block, "output-block"),
    title: block.title.trim(),
    description: block.description.trim(),
    body: block.body.trim(),
  }));
}

export function normalizeCareerAssetInputData<T extends CareerAssetType>(
  type: T,
  input: unknown,
): CareerAssetInputDataMap[T] {
  switch (type) {
    case "RESUME":
      return normalizeResumeData(input) as CareerAssetInputDataMap[T];
    case "GITHUB_README": {
      const parsed = githubReadmeInputSchema.parse(input ?? createEmptyInputData(type));
      return {
        ...parsed,
        featuredProjects: normalizeFeaturedProjects(parsed.featuredProjects),
        profileLinks: parsed.profileLinks.map((item) => withId(item, "profile-link")),
        techStack: parsed.techStack.map((item) => item.trim()).filter(Boolean),
        highlights: parsed.highlights.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetInputDataMap[T];
    }
    case "LINKEDIN_PROFILE": {
      const parsed = linkedinProfileInputSchema.parse(input ?? createEmptyInputData(type));
      return {
        ...parsed,
        specialties: parsed.specialties.map((item) => item.trim()).filter(Boolean),
        achievements: parsed.achievements.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetInputDataMap[T];
    }
    case "PORTFOLIO_KIT": {
      const parsed = portfolioKitInputSchema.parse(input ?? createEmptyInputData(type));
      return {
        ...parsed,
        strengths: parsed.strengths.map((item) => item.trim()).filter(Boolean),
        featuredProjects: normalizeFeaturedProjects(parsed.featuredProjects),
      } as CareerAssetInputDataMap[T];
    }
  }
}

export function normalizeCareerAssetOutputData<T extends CareerAssetType>(
  type: T,
  output: unknown,
): CareerAssetOutputDataMap[T] {
  switch (type) {
    case "RESUME": {
      const parsed = resumeAssistantOutputSchema.parse(output ?? createEmptyOutputData(type));
      return {
        ...parsed,
        outputBlocks: normalizeOutputBlocks(parsed.outputBlocks),
        experienceBullets: parsed.experienceBullets.map((item) => item.trim()).filter(Boolean),
        suggestedSkills: parsed.suggestedSkills.map((item) => item.trim()).filter(Boolean),
        notes: parsed.notes.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetOutputDataMap[T];
    }
    case "GITHUB_README": {
      const parsed = githubReadmeOutputSchema.parse(output ?? createEmptyOutputData(type));
      return {
        ...parsed,
        outputBlocks: normalizeOutputBlocks(parsed.outputBlocks),
        suggestedBadges: parsed.suggestedBadges.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetOutputDataMap[T];
    }
    case "LINKEDIN_PROFILE": {
      const parsed = linkedinProfileOutputSchema.parse(output ?? createEmptyOutputData(type));
      return {
        ...parsed,
        outputBlocks: normalizeOutputBlocks(parsed.outputBlocks),
        experienceBullets: parsed.experienceBullets.map((item) => item.trim()).filter(Boolean),
        featuredSuggestions: parsed.featuredSuggestions.map((item) => item.trim()).filter(Boolean),
        skillsToFeature: parsed.skillsToFeature.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetOutputDataMap[T];
    }
    case "PORTFOLIO_KIT": {
      const parsed = portfolioKitOutputSchema.parse(output ?? createEmptyOutputData(type));
      return {
        ...parsed,
        outputBlocks: normalizeOutputBlocks(parsed.outputBlocks),
        projectSummaries: parsed.projectSummaries.map((item) => item.trim()).filter(Boolean),
        caseStudyOutline: parsed.caseStudyOutline.map((item) => item.trim()).filter(Boolean),
      } as CareerAssetOutputDataMap[T];
    }
  }
}

export function createEmptyInputData<T extends CareerAssetType>(
  type: T,
): CareerAssetInputDataMap[T] {
  switch (type) {
    case "RESUME":
      return createEmptyResumeData() as CareerAssetInputDataMap[T];
    case "GITHUB_README":
      return {
        name: "",
        githubHandle: "",
        role: "",
        bio: "",
        location: "",
        portfolioUrl: "",
        linkedinUrl: "",
        techStack: [],
        highlights: [],
        featuredProjects: [],
        profileLinks: [],
        callToAction: "",
      } as unknown as CareerAssetInputDataMap[T];
    case "LINKEDIN_PROFILE":
      return {
        name: "",
        targetRole: "",
        location: "",
        yearsExperience: "",
        specialties: [],
        achievements: [],
        currentRole: "",
        currentCompany: "",
        experienceNotes: "",
        goals: "",
      } as unknown as CareerAssetInputDataMap[T];
    case "PORTFOLIO_KIT":
      return {
        name: "",
        professionalTitle: "",
        audience: "",
        bio: "",
        location: "",
        contactEmail: "",
        portfolioGoal: "",
        strengths: [],
        featuredProjects: [],
        callToAction: "",
      } as unknown as CareerAssetInputDataMap[T];
  }
}

export function createEmptyOutputData<T extends CareerAssetType>(
  type: T,
): CareerAssetOutputDataMap[T] {
  switch (type) {
    case "RESUME":
      return {
        title: "",
        professionalSummary: "",
        experienceBullets: [],
        suggestedSkills: [],
        notes: [],
        outputBlocks: [],
      } as unknown as CareerAssetOutputDataMap[T];
    case "GITHUB_README":
      return {
        title: "",
        markdown: "",
        profileTagline: "",
        outputBlocks: [],
        suggestedBadges: [],
      } as unknown as CareerAssetOutputDataMap[T];
    case "LINKEDIN_PROFILE":
      return {
        title: "",
        headline: "",
        about: "",
        experienceBullets: [],
        featuredSuggestions: [],
        skillsToFeature: [],
        outputBlocks: [],
      } as unknown as CareerAssetOutputDataMap[T];
    case "PORTFOLIO_KIT":
      return {
        title: "",
        heroHeadline: "",
        heroSubhead: "",
        about: "",
        projectSummaries: [],
        caseStudyOutline: [],
        callToAction: "",
        outputBlocks: [],
      } as unknown as CareerAssetOutputDataMap[T];
  }
}

export function getAssetTypeLabel(type: CareerAssetType) {
  return titleCase(type.replace(/_/g, " ").toLowerCase());
}

export function getPublicBuilderPath(type: CareerAssetType) {
  switch (type) {
    case "RESUME":
      return "/resume";
    case "GITHUB_README":
      return "/github-readme";
    case "LINKEDIN_PROFILE":
      return "/linkedin";
    case "PORTFOLIO_KIT":
      return "/portfolio-kit";
  }
}

export function getWorkspaceEditorPath(asset: { id: string; type: CareerAssetType }) {
  if (asset.type === "RESUME") {
    return `/app/resumes/${asset.id}/edit`;
  }

  return `/app/assets/${asset.id}`;
}

export function getDefaultAssetTitle(type: CareerAssetType) {
  switch (type) {
    case "RESUME":
      return "New Resume";
    case "GITHUB_README":
      return "GitHub Profile README";
    case "LINKEDIN_PROFILE":
      return "LinkedIn Profile Copy";
    case "PORTFOLIO_KIT":
      return "Portfolio Content Kit";
  }
}

export function createResumeAssetSeedFromAssistant(
  input: ResumeAssistantInput,
  output: ResumeAssistantOutput,
): {
  title: string;
  template: ResumeTemplateKey;
  themeSettings: ThemeSettings;
  resumeData: ResumeData;
} {
  const resumeData = normalizeResumeData({
    basics: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      website: input.website,
      summary: output.professionalSummary,
    },
    profiles: [],
    experience: input.currentRole || input.currentCompany
      ? [
          {
            id: makeId("experience"),
            role: input.currentRole || input.targetRole,
            company: input.currentCompany,
            location: input.location,
            startDate: "",
            endDate: "Present",
            summary: input.goals,
            highlights: output.experienceBullets,
          },
        ]
      : [],
    education: [],
    projects: [],
    skills: [
      {
        id: makeId("skill"),
        name: "Core Skills",
        items: output.suggestedSkills.length ? output.suggestedSkills : input.skills,
      },
    ],
    customSections: [
      {
        id: makeId("custom-section"),
        title: "Career Notes",
        items: output.notes.length
          ? [
              {
                id: makeId("custom-item"),
                title: "Focus Areas",
                subtitle: input.targetRole,
                startDate: "",
                endDate: "",
                summary: output.notes.join("\n"),
                highlights: [],
              },
            ]
          : [],
      },
    ],
  });

  return {
    title: output.title || `${input.fullName || "Candidate"} Resume`,
    template: "professional",
    themeSettings: defaultThemeSettings,
    resumeData,
  };
}

export function getDefaultGuestDraftKey(type: CareerAssetType) {
  return `career-builder-guest:${type.toLowerCase()}`;
}
