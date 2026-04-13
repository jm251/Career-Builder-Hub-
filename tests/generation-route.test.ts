import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/generate/[type]/route";

const originalOpenAIKey = process.env.OPENAI_API_KEY;

function makeRequest(type: string, ip: string, inputData: unknown) {
  return POST(
    new Request(`http://localhost/api/generate/${type}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({ inputData }),
    }),
    { params: Promise.resolve({ type }) },
  );
}

describe("public generation route", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
      return;
    }

    process.env.OPENAI_API_KEY = originalOpenAIKey;
  });

  it("returns generated GitHub README content without requiring persistence", async () => {
    const response = await makeRequest("github-readme", "198.51.100.10", {
      name: "Taylor Brooks",
      githubHandle: "tbrooks",
      role: "Product Engineer",
      bio: "I build practical tools for career workflows.",
      location: "Remote",
      portfolioUrl: "https://example.com",
      linkedinUrl: "https://linkedin.com/in/tbrooks",
      techStack: ["TypeScript", "Next.js", "Prisma"],
      highlights: ["Built a shared content builder"],
      featuredProjects: [
        {
          id: "project-1",
          title: "Career Builder Hub",
          summary: "Unified career asset generation and editing.",
          stack: ["Next.js", "Prisma"],
          url: "https://example.com/hub",
        },
      ],
      profileLinks: [],
      callToAction: "Open to product-focused engineering roles.",
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.outputData.title).toBe("Taylor Brooks GitHub README");
    expect(payload.outputData.markdown).toContain("# Taylor Brooks");
    expect(payload.outputData.markdown).toContain("Career Builder Hub");
  });

  it("rate limits repeated generation requests from the same IP", async () => {
    const ip = `198.51.100.${Date.now() % 200}`;

    for (let index = 0; index < 10; index += 1) {
      const response = await makeRequest("linkedin", ip, {
        name: "Taylor Brooks",
        targetRole: "Senior Product Engineer",
        location: "Remote",
        yearsExperience: "7 years",
        specialties: ["TypeScript", "Next.js"],
        achievements: ["Built and shipped a shared workflow"],
        currentRole: "Frontend Engineer",
        currentCompany: "Northstar",
        experienceNotes: "Owns delivery and UX quality.",
        goals: "Move into product-facing platform work.",
      });

      expect(response.status).toBe(200);
    }

    const limitedResponse = await makeRequest("linkedin", ip, {
      name: "Taylor Brooks",
      targetRole: "Senior Product Engineer",
      location: "Remote",
      yearsExperience: "7 years",
      specialties: ["TypeScript", "Next.js"],
      achievements: ["Built and shipped a shared workflow"],
      currentRole: "Frontend Engineer",
      currentCompany: "Northstar",
      experienceNotes: "Owns delivery and UX quality.",
      goals: "Move into product-facing platform work.",
    });

    expect(limitedResponse.status).toBe(429);
  });
});
