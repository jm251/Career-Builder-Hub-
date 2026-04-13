import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/import/markdown/route";

describe("import markdown route", () => {
  it("normalizes valid markdown", async () => {
    const response = await POST(
      new Request("http://localhost/api/import/markdown", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          markdown: "# Taylor Brooks\n\n- <taylor@example.com>\n\nBuilder of products.\n",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.data.basics.fullName).toBe("Taylor Brooks");
    expect(payload.normalizedMarkdown).toContain("taylor@example.com");
  });
});
