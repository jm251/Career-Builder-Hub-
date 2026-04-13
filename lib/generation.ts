import {
  createEmptyOutputData,
  githubReadmeInputSchema,
  linkedinProfileInputSchema,
  normalizeCareerAssetOutputData,
  portfolioKitInputSchema,
  resumeAssistantInputSchema,
  type CareerAssetOutputDataMap,
  type CareerAssetType,
  type GitHubReadmeInputData,
  type LinkedInProfileInputData,
  type PortfolioKitInputData,
  type ResumeAssistantInput,
  type ResumeAssistantOutput,
} from "@/lib/career-assets";
import { getAIClient, getAIModel } from "@/lib/ai";

type SupportedGenerationType = CareerAssetType;

function jsonSchemaForType(type: SupportedGenerationType) {
  switch (type) {
    case "RESUME":
      return {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          professionalSummary: { type: "string" },
          experienceBullets: { type: "array", items: { type: "string" } },
          suggestedSkills: { type: "array", items: { type: "string" } },
          notes: { type: "array", items: { type: "string" } },
          outputBlocks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                format: { type: "string", enum: ["markdown", "text"] },
                body: { type: "string" },
              },
              required: ["id", "title", "description", "format", "body"],
            },
          },
        },
        required: ["title", "professionalSummary", "experienceBullets", "suggestedSkills", "notes", "outputBlocks"],
      };
    case "GITHUB_README":
      return {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          markdown: { type: "string" },
          profileTagline: { type: "string" },
          suggestedBadges: { type: "array", items: { type: "string" } },
          outputBlocks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                format: { type: "string", enum: ["markdown", "text"] },
                body: { type: "string" },
              },
              required: ["id", "title", "description", "format", "body"],
            },
          },
        },
        required: ["title", "markdown", "profileTagline", "suggestedBadges", "outputBlocks"],
      };
    case "LINKEDIN_PROFILE":
      return {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          headline: { type: "string" },
          about: { type: "string" },
          experienceBullets: { type: "array", items: { type: "string" } },
          featuredSuggestions: { type: "array", items: { type: "string" } },
          skillsToFeature: { type: "array", items: { type: "string" } },
          outputBlocks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                format: { type: "string", enum: ["markdown", "text"] },
                body: { type: "string" },
              },
              required: ["id", "title", "description", "format", "body"],
            },
          },
        },
        required: ["title", "headline", "about", "experienceBullets", "featuredSuggestions", "skillsToFeature", "outputBlocks"],
      };
    case "PORTFOLIO_KIT":
      return {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          heroHeadline: { type: "string" },
          heroSubhead: { type: "string" },
          about: { type: "string" },
          projectSummaries: { type: "array", items: { type: "string" } },
          caseStudyOutline: { type: "array", items: { type: "string" } },
          callToAction: { type: "string" },
          outputBlocks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                format: { type: "string", enum: ["markdown", "text"] },
                body: { type: "string" },
              },
              required: ["id", "title", "description", "format", "body"],
            },
          },
        },
        required: ["title", "heroHeadline", "heroSubhead", "about", "projectSummaries", "caseStudyOutline", "callToAction", "outputBlocks"],
      };
  }
}

function systemPromptForType(type: SupportedGenerationType) {
  switch (type) {
    case "RESUME":
      return "You write concise, concrete resume content for professional candidates. Return only structured JSON. Avoid buzzwords, keep bullets measurable, and prefer specific outcomes over vague claims.";
    case "GITHUB_README":
      return "You write GitHub profile README copy for developers and technical professionals. Return only structured JSON. Keep markdown production-ready, readable, and authentic rather than generic.";
    case "LINKEDIN_PROFILE":
      return "You optimize LinkedIn profile copy for clarity, credibility, and recruiter readability. Return only structured JSON. Do not mention direct LinkedIn syncing or unsupported platform behaviors.";
    case "PORTFOLIO_KIT":
      return "You produce portfolio site copy kits for professionals. Return only structured JSON. Focus on clear positioning, strong project framing, and concise case-study language.";
  }
}

function mockGeneratedOutput(type: SupportedGenerationType, input: unknown) {
  switch (type) {
    case "RESUME": {
      const parsed = resumeAssistantInputSchema.parse(input);
      return normalizeCareerAssetOutputData("RESUME", {
        title: `${parsed.fullName || "Candidate"} Resume`,
        professionalSummary: `${parsed.targetRole || "Professional"} with ${parsed.experienceLevel || "hands-on"} experience building practical, user-facing work across ${parsed.skills.slice(0, 3).join(", ") || "product, engineering, and delivery"}.`,
        experienceBullets: parsed.achievements.length
          ? parsed.achievements.map((item) => `Improved and clarified: ${item}`)
          : ["Led delivery on cross-functional work with clear ownership and measurable progress."],
        suggestedSkills: parsed.skills.length ? parsed.skills : ["Communication", "Execution", "Problem Solving"],
        notes: [
          "Keep each bullet outcome-first.",
          "Prefer metrics, scope, and business impact over tool lists.",
        ],
        outputBlocks: [
          {
            id: "resume-summary",
            title: "Professional Summary",
            description: "Use this near the top of the resume.",
            format: "markdown",
            body: `${parsed.targetRole || "Professional"} focused on shipping clear, credible work with measurable outcomes.`,
          },
        ],
      });
    }
    case "GITHUB_README": {
      const parsed = githubReadmeInputSchema.parse(input);
      const markdown = `# ${parsed.name || "Your Name"}\n\n## ${parsed.role || "Builder"}\n\n${parsed.bio || "I build practical projects and document them clearly."}\n\n## Tech Stack\n\n${(parsed.techStack.length ? parsed.techStack : ["TypeScript", "React", "Node.js"]).map((item) => `- ${item}`).join("\n")}\n\n## Featured Work\n\n${(parsed.featuredProjects.length ? parsed.featuredProjects : [{ title: "Project", summary: "Describe your work here.", stack: [], url: "" }]).map((project) => `### ${project.title}\n${project.summary}${project.url ? `\n[View project](${project.url})` : ""}`).join("\n\n")}\n\n## Connect\n\n${parsed.callToAction || "Open to collaboration, product work, and thoughtful engineering conversations."}\n`;
      return normalizeCareerAssetOutputData("GITHUB_README", {
        title: `${parsed.name || "Developer"} GitHub README`,
        markdown,
        profileTagline: parsed.role || "Shipping practical software",
        suggestedBadges: parsed.techStack.slice(0, 4),
        outputBlocks: [
          {
            id: "github-readme",
            title: "README",
            description: "Main GitHub profile markdown.",
            format: "markdown",
            body: markdown,
          },
        ],
      });
    }
    case "LINKEDIN_PROFILE": {
      const parsed = linkedinProfileInputSchema.parse(input);
      return normalizeCareerAssetOutputData("LINKEDIN_PROFILE", {
        title: `${parsed.name || "Professional"} LinkedIn Profile`,
        headline: `${parsed.targetRole || "Professional"} | ${parsed.specialties.slice(0, 3).join(" | ") || "Execution | Strategy | Delivery"}`,
        about: `${parsed.name || "I"} bring ${parsed.yearsExperience || "hands-on"} experience translating goals into shipped work. I focus on ${parsed.specialties.join(", ") || "product delivery, communication, and problem solving"} and prefer clear outcomes over inflated claims.`,
        experienceBullets: parsed.achievements.length
          ? parsed.achievements.map((item) => `Delivered: ${item}`)
          : ["Built and improved workstreams with measurable business value and strong stakeholder alignment."],
        featuredSuggestions: ["Pin your strongest shipped project.", "Lead with outcome-driven work examples."],
        skillsToFeature: parsed.specialties.length ? parsed.specialties : ["Leadership", "Execution", "Communication"],
        outputBlocks: [
          {
            id: "linkedin-about",
            title: "About Section",
            description: "Paste into LinkedIn About.",
            format: "text",
            body: `${parsed.name || "I"} build clear, practical work and communicate it in a way that hiring teams can trust.`,
          },
        ],
      });
    }
    case "PORTFOLIO_KIT": {
      const parsed = portfolioKitInputSchema.parse(input);
      return normalizeCareerAssetOutputData("PORTFOLIO_KIT", {
        title: `${parsed.name || "Professional"} Portfolio Kit`,
        heroHeadline: parsed.professionalTitle || "Builder of thoughtful digital work",
        heroSubhead: parsed.portfolioGoal || "Present your best work with clarity and substance.",
        about: parsed.bio || "Write a concise introduction that explains what you do and how you work.",
        projectSummaries: (parsed.featuredProjects.length ? parsed.featuredProjects : [{ id: "project", title: "Featured Project", summary: "Project summary", stack: [], url: "" }]).map(
          (project) => `${project.title}: ${project.summary}`,
        ),
        caseStudyOutline: [
          "Problem and context",
          "Constraints and tradeoffs",
          "Approach and key decisions",
          "Outcome and measurable impact",
        ],
        callToAction: parsed.callToAction || "Invite readers to reach out for collaborations, roles, or project work.",
        outputBlocks: [
          {
            id: "portfolio-hero",
            title: "Hero Copy",
            description: "Use at the top of the portfolio.",
            format: "markdown",
            body: `# ${parsed.name || "Your Name"}\n\n${parsed.professionalTitle || "Professional Title"}\n\n${parsed.portfolioGoal || "Show your best work with clarity."}`,
          },
        ],
      });
    }
  }
}

async function generateStructuredOutput<T extends SupportedGenerationType>(
  type: T,
  input: unknown,
): Promise<CareerAssetOutputDataMap[T]> {
  const client = getAIClient();

  if (!client) {
    return mockGeneratedOutput(type, input) as CareerAssetOutputDataMap[T];
  }

  const response = await client.responses.create({
    model: getAIModel(),
    store: false,
    input: [
      {
        role: "system",
        content: systemPromptForType(type),
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: `${type.toLowerCase()}_output`,
        strict: true,
        schema: jsonSchemaForType(type),
      },
    },
  });

  const text = response.output_text || "";
  return normalizeCareerAssetOutputData(type, JSON.parse(text)) as CareerAssetOutputDataMap[T];
}

export async function generateResumeAssistantContent(input: ResumeAssistantInput) {
  const normalized = resumeAssistantInputSchema.parse(input);
  return generateStructuredOutput("RESUME", normalized) as Promise<ResumeAssistantOutput>;
}

export async function generateGithubReadmeContent(input: GitHubReadmeInputData) {
  const normalized = githubReadmeInputSchema.parse(input);
  return generateStructuredOutput("GITHUB_README", normalized);
}

export async function generateLinkedinProfileContent(input: LinkedInProfileInputData) {
  const normalized = linkedinProfileInputSchema.parse(input);
  return generateStructuredOutput("LINKEDIN_PROFILE", normalized);
}

export async function generatePortfolioKitContent(input: PortfolioKitInputData) {
  const normalized = portfolioKitInputSchema.parse(input);
  return generateStructuredOutput("PORTFOLIO_KIT", normalized);
}

export function getEmptyOutputForAssetType(type: SupportedGenerationType) {
  return createEmptyOutputData(type);
}
