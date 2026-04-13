import { describe, expect, it } from "vitest";

import { getUniqueSlug, slugify } from "@/lib/slug";

describe("slug helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("  Senior Product Resume! ")).toBe("senior-product-resume");
  });

  it("increments collisions", async () => {
    const existing = new Set(["senior-product-resume", "senior-product-resume-2"]);
    const slug = await getUniqueSlug("Senior Product Resume", async (candidate) =>
      existing.has(candidate),
    );

    expect(slug).toBe("senior-product-resume-3");
  });
});
