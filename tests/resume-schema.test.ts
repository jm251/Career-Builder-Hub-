import { describe, expect, it } from "vitest";

import { normalizeResumeData } from "@/lib/resume-schema";

describe("resume schema normalization", () => {
  it("fills missing ids and trims nested values", () => {
    const normalized = normalizeResumeData({
      basics: {
        fullName: "  Taylor Brooks  ",
        email: " taylor@example.com ",
        phone: "",
        location: "",
        website: "",
        summary: "",
      },
      profiles: [{ label: " GitHub ", url: " https://github.com/taylor " }],
      skills: [{ name: "Core", items: [" TypeScript ", "  ", " React "] }],
    });

    expect(normalized.basics.fullName).toBe("Taylor Brooks");
    expect(normalized.profiles[0]?.id).toMatch(/^profile-/);
    expect(normalized.skills[0]?.items).toEqual(["TypeScript", "React"]);
  });
});
