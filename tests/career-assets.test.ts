import { describe, expect, it } from "vitest";

import {
  createResumeAssetSeedFromAssistant,
  getDefaultGuestDraftKey,
  normalizeCareerAssetInputData,
} from "@/lib/career-assets";

describe("career asset helpers", () => {
  it("normalizes GitHub README input data", () => {
    const normalized = normalizeCareerAssetInputData("GITHUB_README", {
      name: "Taylor Brooks",
      githubHandle: "tbrooks",
      role: "Product Engineer",
      bio: " Builds end-to-end tools. ",
      location: "Remote",
      portfolioUrl: "https://example.com",
      linkedinUrl: "https://linkedin.com/in/tbrooks",
      techStack: [" TypeScript ", "React", ""],
      highlights: [" Shipped a career builder hub ", ""],
      featuredProjects: [
        {
          id: "",
          title: "Career Builder Hub",
          summary: " Unified resume and profile tooling ",
          stack: [" Next.js ", "Prisma", ""],
          url: "https://example.com/hub",
        },
      ],
      profileLinks: [
        {
          id: "",
          label: "GitHub",
          url: "https://github.com/tbrooks",
        },
      ],
      callToAction: "Reach out",
    });

    expect(normalized.techStack).toEqual(["TypeScript", "React"]);
    expect(normalized.highlights).toEqual(["Shipped a career builder hub"]);
    expect(normalized.featuredProjects[0]?.id).toBeTruthy();
    expect(normalized.featuredProjects[0]?.stack).toEqual(["Next.js", "Prisma"]);
    expect(normalized.profileLinks[0]?.id).toBeTruthy();
  });

  it("creates a resume seed from assistant output", () => {
    const seed = createResumeAssetSeedFromAssistant(
      {
        fullName: "Taylor Brooks",
        targetRole: "Senior Product Engineer",
        currentRole: "Frontend Engineer",
        currentCompany: "Northstar",
        experienceLevel: "7 years",
        email: "taylor@example.com",
        phone: "555-0100",
        location: "Remote",
        website: "https://example.com",
        skills: ["TypeScript", "React"],
        achievements: ["Shipped a new portfolio workflow"],
        goals: "Lead product-facing platform work.",
        extraContext: "",
      },
      {
        title: "Taylor Brooks Resume",
        professionalSummary:
          "Product engineer with strong execution across candidate-facing workflows.",
        experienceBullets: [
          "Built a shared workflow for resume, LinkedIn, and GitHub profile content.",
        ],
        suggestedSkills: ["TypeScript", "React", "Next.js"],
        notes: ["Lead with measurable outcomes."],
        outputBlocks: [],
      },
    );

    expect(seed.title).toBe("Taylor Brooks Resume");
    expect(seed.resumeData.basics.fullName).toBe("Taylor Brooks");
    expect(seed.resumeData.basics.summary).toContain("candidate-facing workflows");
    expect(seed.resumeData.experience[0]?.company).toBe("Northstar");
    expect(seed.resumeData.experience[0]?.highlights).toEqual([
      "Built a shared workflow for resume, LinkedIn, and GitHub profile content.",
    ]);
    expect(seed.resumeData.skills[0]?.items).toEqual(["TypeScript", "React", "Next.js"]);
  });

  it("builds guest draft keys by asset type", () => {
    expect(getDefaultGuestDraftKey("PORTFOLIO_KIT")).toBe("career-builder-guest:portfolio_kit");
  });
});
