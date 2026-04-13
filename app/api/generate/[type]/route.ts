import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  githubReadmeInputSchema,
  linkedinProfileInputSchema,
  portfolioKitInputSchema,
  resumeAssistantInputSchema,
} from "@/lib/career-assets";
import {
  generateGithubReadmeContent,
  generateLinkedinProfileContent,
  generatePortfolioKitContent,
  generateResumeAssistantContent,
} from "@/lib/generation";
import { getRateLimitKey, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function routeTypeToAssetType(type: string) {
  switch (type) {
    case "resume":
      return "RESUME";
    case "github-readme":
      return "GITHUB_README";
    case "linkedin":
      return "LINKEDIN_PROFILE";
    case "portfolio-kit":
      return "PORTFOLIO_KIT";
    default:
      return null;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  const assetType = routeTypeToAssetType(type);

  if (!assetType) {
    return NextResponse.json({ message: "Unknown generator type." }, { status: 404 });
  }

  const rateLimitKey = getRateLimitKey(request, `generate:${assetType}`);
  if (isRateLimited({ key: rateLimitKey, limit: 10, windowMs: 10 * 60 * 1_000 })) {
    return NextResponse.json(
      { message: "Too many generation requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    switch (assetType) {
      case "RESUME": {
        const input = resumeAssistantInputSchema.parse(body.inputData);
        const output = await generateResumeAssistantContent(input);
        return NextResponse.json({ inputData: input, outputData: output });
      }
      case "GITHUB_README": {
        const input = githubReadmeInputSchema.parse(body.inputData);
        const output = await generateGithubReadmeContent(input);
        return NextResponse.json({ inputData: input, outputData: output });
      }
      case "LINKEDIN_PROFILE": {
        const input = linkedinProfileInputSchema.parse(body.inputData);
        const output = await generateLinkedinProfileContent(input);
        return NextResponse.json({ inputData: input, outputData: output });
      }
      case "PORTFOLIO_KIT": {
        const input = portfolioKitInputSchema.parse(body.inputData);
        const output = await generatePortfolioKitContent(input);
        return NextResponse.json({ inputData: input, outputData: output });
      }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Generation input is invalid.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Generation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
