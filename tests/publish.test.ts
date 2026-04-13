import { describe, expect, it } from "vitest";

import { createPublishedSnapshot } from "@/lib/publish";
import { createStarterResumeData, sampleThemeSettings } from "@/lib/sample-resume";

describe("published snapshot", () => {
  it("isolates the published copy from later draft edits", () => {
    const draft = createStarterResumeData("Taylor Brooks");
    const snapshot = createPublishedSnapshot({
      title: "Taylor Resume",
      slug: "taylor-resume",
      template: "professional",
      themeSettings: sampleThemeSettings,
      resumeData: draft,
      markdown: "# Taylor Brooks",
    });

    draft.basics.fullName = "Changed Name";
    draft.experience[0]!.role = "Changed";

    expect(snapshot.resumeData.basics.fullName).toBe("Taylor Brooks");
    expect(snapshot.resumeData.experience[0]?.role).not.toBe("Changed");
  });
});
