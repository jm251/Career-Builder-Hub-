import { NextResponse } from "next/server";

import { parseResumeMarkdown, ResumeMarkdownError } from "@/lib/markdown";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let markdown = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const text = formData.get("markdown");

      if (typeof text === "string") {
        markdown = text;
      } else if (file instanceof File) {
        markdown = await file.text();
      }
    } else {
      const body = (await request.json()) as { markdown?: string };
      markdown = body.markdown ?? "";
    }

    const parsed = parseResumeMarkdown(markdown);

    return NextResponse.json({
      data: parsed.data,
      normalizedMarkdown: parsed.normalizedMarkdown,
      warnings: parsed.warnings,
    });
  } catch (error) {
    if (error instanceof ResumeMarkdownError) {
      return NextResponse.json(
        {
          message: error.message,
          warnings: error.warnings,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to import markdown.",
      },
      { status: 500 },
    );
  }
}
