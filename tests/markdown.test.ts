import { describe, expect, it } from "vitest";

import { parseResumeMarkdown, serializeResumeToMarkdown } from "@/lib/markdown";
import { createStarterResumeData } from "@/lib/sample-resume";

describe("resume markdown", () => {
  it("round-trips canonical resume markdown", () => {
    const data = createStarterResumeData("Taylor Brooks");
    const markdown = serializeResumeToMarkdown(data);
    const parsed = parseResumeMarkdown(markdown);

    expect(parsed.data.basics.fullName).toBe("Taylor Brooks");
    expect(parsed.data.experience[0]?.role).toBe(data.experience[0]?.role);
    expect(parsed.normalizedMarkdown).toContain("# Taylor Brooks");
    expect(parsed.normalizedMarkdown).toContain("## Experience");
  });
});
