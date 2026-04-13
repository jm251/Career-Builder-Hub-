import {
  createEmptyResumeData,
  normalizeResumeData,
  type CustomSection,
  type ResumeData,
} from "@/lib/resume-schema";
import { formatDateRange, makeId } from "@/lib/utils";

export type MarkdownParseWarning = {
  message: string;
};

export type MarkdownParseResult = {
  data: ResumeData;
  warnings: MarkdownParseWarning[];
  normalizedMarkdown: string;
};

export class ResumeMarkdownError extends Error {
  warnings: MarkdownParseWarning[];

  constructor(message: string, warnings: MarkdownParseWarning[] = []) {
    super(message);
    this.name = "ResumeMarkdownError";
    this.warnings = warnings;
  }
}

function stripComments(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/\r\n?/g, "\n");
}

function splitDateRange(raw: string) {
  const value = raw.trim();

  if (!value) {
    return { startDate: "", endDate: "" };
  }

  const parts = value.split(/\s+(?:--|—|–|to)\s+/);

  if (parts.length === 1) {
    return { startDate: parts[0], endDate: "" };
  }

  return {
    startDate: parts[0] ?? "",
    endDate: parts.slice(1).join(" -- "),
  };
}

function parseSpanHeading(raw: string) {
  const match = raw.match(/<span>(.*?)<\/span>\s*<span>(.*?)<\/span>/i);

  if (match) {
    return {
      left: match[1].trim(),
      right: match[2].trim(),
    };
  }

  const fallback = raw.split(/\s+\|\s+/);

  if (fallback.length >= 2) {
    return {
      left: fallback[0].trim(),
      right: fallback.slice(1).join(" | ").trim(),
    };
  }

  return {
    left: raw.trim(),
    right: "",
  };
}

function finalizeParagraphs(lines: string[]) {
  const paragraphs: string[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (buffer.length) {
        paragraphs.push(buffer.join("\n").trim());
        buffer = [];
      }
      continue;
    }

    buffer.push(trimmed);
  }

  if (buffer.length) {
    paragraphs.push(buffer.join("\n").trim());
  }

  return paragraphs;
}

function parseItemBody(lines: string[]) {
  const highlights: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      highlights.push(line.replace(/^\s*-\s+/, "").trim());
      continue;
    }

    bodyLines.push(line);
  }

  return {
    highlights,
    paragraphs: finalizeParagraphs(bodyLines),
  };
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value: string) {
  return /[\d+()\-\s]{7,}/.test(value) && /\d/.test(value);
}

function looksLikeUrl(value: string) {
  return /^(https?:\/\/|www\.)/i.test(value);
}

function normalizeUrl(value: string) {
  if (!value.trim()) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value.trim();
  }

  return `https://${value.trim().replace(/^\/+/, "")}`;
}

function extractMarkdownLink(value: string) {
  const match = value.match(/^\[(.+?)\]\((.+?)\)$/);

  if (!match) {
    return null;
  }

  return {
    label: match[1].trim(),
    url: match[2].trim(),
  };
}

function formatWebsiteLabel(url: string) {
  const clean = normalizeUrl(url);

  try {
    return new URL(clean).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function parseContactLine(data: ResumeData, line: string) {
  const content = line.replace(/^\s*-\s+/, "").trim().replace(/^<|>$/g, "");
  const link = extractMarkdownLink(content);

  if (!content) {
    return;
  }

  if (link) {
    if (!data.basics.website && !data.profiles.length) {
      data.basics.website = normalizeUrl(link.url);
      return;
    }

    data.profiles.push({
      id: makeId("profile"),
      label: link.label,
      url: normalizeUrl(link.url),
    });
    return;
  }

  if (!data.basics.email && looksLikeEmail(content)) {
    data.basics.email = content;
    return;
  }

  if (!data.basics.phone && looksLikePhone(content)) {
    data.basics.phone = content;
    return;
  }

  if (!data.basics.website && looksLikeUrl(content)) {
    data.basics.website = normalizeUrl(content);
    return;
  }

  if (!data.basics.location) {
    data.basics.location = content;
    return;
  }

  data.profiles.push({
    id: makeId("profile"),
    label: "Link",
    url: looksLikeUrl(content) ? normalizeUrl(content) : content,
  });
}

function splitSections(lines: string[]) {
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)$/);

    if (sectionMatch) {
      if (current) {
        sections.push(current);
      }

      current = { title: sectionMatch[1].trim(), lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}

function splitItems(lines: string[]) {
  const items: Array<{ heading: string; lines: string[] }> = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const itemMatch = line.match(/^###\s+(.+)$/);

    if (itemMatch) {
      if (current) {
        items.push(current);
      }

      current = { heading: itemMatch[1].trim(), lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) {
    items.push(current);
  }

  return items;
}

function serializeHighlights(highlights: string[]) {
  return highlights.filter(Boolean).map((item) => `- ${item.trim()}`);
}

function serializeParagraphs(...paragraphs: Array<string | undefined>) {
  return paragraphs.map((paragraph) => paragraph?.trim()).filter(Boolean) as string[];
}

function serializeExperience(data: ResumeData) {
  if (!data.experience.length) {
    return [];
  }

  return [
    "## Experience",
    ...data.experience.flatMap((item) => {
      const left = [item.role, item.company].filter(Boolean).join(", ");

      return [
        "",
        `### <span>${left || "Experience"}</span> <span>${formatDateRange(item.startDate, item.endDate)}</span>`,
        ...serializeParagraphs(item.location, item.summary),
        ...serializeHighlights(item.highlights),
      ];
    }),
  ];
}

function serializeEducation(data: ResumeData) {
  if (!data.education.length) {
    return [];
  }

  return [
    "## Education",
    ...data.education.flatMap((item) => {
      const left = [item.institution, item.studyType].filter(Boolean).join(", ");

      return [
        "",
        `### <span>${left || "Education"}</span> <span>${formatDateRange(item.startDate, item.endDate)}</span>`,
        ...serializeParagraphs(item.location, item.summary),
        ...serializeHighlights(item.highlights),
      ];
    }),
  ];
}

function serializeProjects(data: ResumeData) {
  if (!data.projects.length) {
    return [];
  }

  return [
    "## Projects",
    ...data.projects.flatMap((item) => [
      "",
      `### <span>${item.name || "Project"}</span> <span>${formatDateRange(item.startDate, item.endDate)}</span>`,
      ...serializeParagraphs(item.url ? `[Project link](${normalizeUrl(item.url)})` : "", item.summary),
      ...serializeHighlights(item.highlights),
    ]),
  ];
}

function serializeSkills(data: ResumeData) {
  if (!data.skills.length) {
    return [];
  }

  return [
    "## Skills",
    "",
    ...data.skills.map((group) => `- ${group.name || "Skills"}: ${group.items.join(", ")}`),
  ];
}

function serializeCustomSections(data: ResumeData) {
  return data.customSections.flatMap((section) => {
    if (!section.items.length) {
      return [];
    }

    return [
      `## ${section.title || "Custom Section"}`,
      ...section.items.flatMap((item) => [
        "",
        `### <span>${item.title || "Entry"}</span> <span>${formatDateRange(item.startDate, item.endDate)}</span>`,
        ...serializeParagraphs(item.subtitle, item.summary),
        ...serializeHighlights(item.highlights),
      ]),
    ];
  });
}

export function serializeResumeToMarkdown(input: ResumeData) {
  const data = normalizeResumeData(input);
  const lines: string[] = [`# ${data.basics.fullName || "Untitled Resume"}`];

  const contacts = [
    data.basics.email ? `<${data.basics.email}>` : "",
    data.basics.phone,
    data.basics.website
      ? `[${formatWebsiteLabel(data.basics.website)}](${normalizeUrl(data.basics.website)})`
      : "",
    data.basics.location,
    ...data.profiles.map((profile) => `[${profile.label || "Link"}](${normalizeUrl(profile.url)})`),
  ].filter(Boolean);

  if (contacts.length) {
    lines.push("", ...contacts.map((contact) => `- ${contact}`));
  }

  if (data.basics.summary.trim()) {
    lines.push("", data.basics.summary.trim());
  }

  const sections = [
    serializeExperience(data),
    serializeProjects(data),
    serializeEducation(data),
    serializeSkills(data),
    serializeCustomSections(data),
  ]
    .flat()
    .filter((line, index, arr) => !(line === "" && arr[index - 1] === ""));

  if (sections.length) {
    lines.push("", ...sections);
  }

  return `${lines.join("\n").trim()}\n`;
}

function parseExperienceSection(data: ResumeData, items: Array<{ heading: string; lines: string[] }>) {
  data.experience = items.map(({ heading, lines }) => {
    const { left, right } = parseSpanHeading(heading);
    const [role = "", company = ""] = left.split(/\s*,\s*/, 2);
    const { startDate, endDate } = splitDateRange(right);
    const { paragraphs, highlights } = parseItemBody(lines);
    let location = "";
    let summary = "";

    if (paragraphs.length > 1) {
      location = paragraphs[0];
      summary = paragraphs.slice(1).join("\n\n");
    } else {
      summary = paragraphs[0] ?? "";
    }

    return {
      id: makeId("experience"),
      role,
      company,
      location,
      startDate,
      endDate,
      summary,
      highlights,
    };
  });
}

function parseEducationSection(data: ResumeData, items: Array<{ heading: string; lines: string[] }>) {
  data.education = items.map(({ heading, lines }) => {
    const { left, right } = parseSpanHeading(heading);
    const [institution = "", studyType = ""] = left.split(/\s*,\s*/, 2);
    const { startDate, endDate } = splitDateRange(right);
    const { paragraphs, highlights } = parseItemBody(lines);
    let location = "";
    let summary = "";

    if (paragraphs.length > 1) {
      location = paragraphs[0];
      summary = paragraphs.slice(1).join("\n\n");
    } else {
      summary = paragraphs[0] ?? "";
    }

    return {
      id: makeId("education"),
      institution,
      studyType,
      location,
      startDate,
      endDate,
      summary,
      highlights,
    };
  });
}

function parseProjectsSection(data: ResumeData, items: Array<{ heading: string; lines: string[] }>) {
  data.projects = items.map(({ heading, lines }) => {
    const { left, right } = parseSpanHeading(heading);
    const { startDate, endDate } = splitDateRange(right);
    const { paragraphs, highlights } = parseItemBody(lines);
    let url = "";
    let summary = "";

    if (paragraphs.length) {
      const link = extractMarkdownLink(paragraphs[0]);

      if (link?.url) {
        url = normalizeUrl(link.url);
        summary = paragraphs.slice(1).join("\n\n");
      } else {
        summary = paragraphs.join("\n\n");
      }
    }

    return {
      id: makeId("project"),
      name: left,
      url,
      startDate,
      endDate,
      summary,
      highlights,
    };
  });
}

function parseSkillsSection(data: ResumeData, lines: string[]) {
  const bulletLines = lines.filter((line) => /^\s*-\s+/.test(line));

  data.skills = bulletLines.map((line) => {
    const content = line.replace(/^\s*-\s+/, "").trim();
    const [name, values] = content.includes(":")
      ? content.split(/\s*:\s*/, 2)
      : ["Skills", content];

    return {
      id: makeId("skill"),
      name,
      items: values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };
  });
}

function parseCustomSection(section: { title: string; lines: string[] }): CustomSection {
  const items = splitItems(section.lines).map(({ heading, lines }) => {
    const { left, right } = parseSpanHeading(heading);
    const { startDate, endDate } = splitDateRange(right);
    const { paragraphs, highlights } = parseItemBody(lines);
    let subtitle = "";
    let summary = "";

    if (paragraphs.length > 1) {
      subtitle = paragraphs[0];
      summary = paragraphs.slice(1).join("\n\n");
    } else {
      summary = paragraphs[0] ?? "";
    }

    return {
      id: makeId("custom-item"),
      title: left,
      subtitle,
      startDate,
      endDate,
      summary,
      highlights,
    };
  });

  return {
    id: makeId("custom-section"),
    title: section.title,
    items,
  };
}

export function parseResumeMarkdown(markdown: string): MarkdownParseResult {
  const cleaned = stripComments(markdown).trim();

  if (!cleaned) {
    const data = createEmptyResumeData();

    return {
      data,
      warnings: [{ message: "Markdown was empty. Loaded a blank draft." }],
      normalizedMarkdown: serializeResumeToMarkdown(data),
    };
  }

  const lines = cleaned.split("\n");
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line));

  if (h1Index === -1) {
    throw new ResumeMarkdownError("The document must start with a level-one heading for the candidate name.");
  }

  const data = createEmptyResumeData();
  const warnings: MarkdownParseWarning[] = [];

  data.basics.fullName = lines[h1Index].replace(/^#\s+/, "").trim();

  let index = h1Index + 1;

  while (index < lines.length && !/^##\s+/.test(lines[index])) {
    if (/^\s*-\s+/.test(lines[index])) {
      parseContactLine(data, lines[index]);
      index += 1;
      continue;
    }

    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    break;
  }

  const summaryLines: string[] = [];

  while (index < lines.length && !/^##\s+/.test(lines[index])) {
    summaryLines.push(lines[index]);
    index += 1;
  }

  data.basics.summary = finalizeParagraphs(summaryLines).join("\n\n");

  const sections = splitSections(lines.slice(index));

  for (const section of sections) {
    const items = splitItems(section.lines);

    switch (section.title.toLowerCase()) {
      case "experience":
        parseExperienceSection(data, items);
        break;
      case "education":
        parseEducationSection(data, items);
        break;
      case "projects":
        parseProjectsSection(data, items);
        break;
      case "skills":
        parseSkillsSection(data, section.lines);
        break;
      default:
        if (!items.length) {
          warnings.push({
            message: `Skipped section "${section.title}" because it does not contain any level-three entries.`,
          });
          break;
        }

        data.customSections.push(parseCustomSection(section));
    }
  }

  const normalized = normalizeResumeData(data);

  return {
    data: normalized,
    warnings,
    normalizedMarkdown: serializeResumeToMarkdown(normalized),
  };
}
