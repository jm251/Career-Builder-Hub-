import {
  defaultThemeSettings,
  type ResumeData,
  type ResumeTemplateKey,
  type ThemeSettings,
} from "@/lib/resume-schema";
import { makeId } from "@/lib/utils";

export const marketingTemplateOrder: ResumeTemplateKey[] = [
  "simple",
  "professional",
  "modern",
  "creative",
];

export function createStarterResumeData(fullName = "Richard Hendricks"): ResumeData {
  return {
    basics: {
      fullName,
      email: "richard@piedpiper.dev",
      phone: "(912) 555-4321",
      location: "San Francisco, CA",
      website: "https://richardhendricks.example.com",
      summary:
        "Founder and product-minded engineer focused on elegant systems, practical automation, and shipping clear user experiences that scale.",
    },
    profiles: [
      {
        id: makeId("profile"),
        label: "LinkedIn",
        url: "https://linkedin.com/in/richardhendricks",
      },
      {
        id: makeId("profile"),
        label: "GitHub",
        url: "https://github.com/richardhendricks",
      },
    ],
    experience: [
      {
        id: makeId("experience"),
        role: "CEO / President",
        company: "Pied Piper",
        location: "Palo Alto, CA",
        startDate: "Dec 2013",
        endDate: "Present",
        summary:
          "Led product strategy and engineering for a compression platform built to make complex infrastructure feel lightweight and obvious.",
        highlights: [
          "Won TechCrunch Disrupt and launched the company from a prototype into a funded product.",
          "Built the original compression engine and scaled the platform across desktop and cloud deployments.",
          "Created a hiring process that balanced speed, technical bar, and team fit during early growth.",
        ],
      },
      {
        id: makeId("experience"),
        role: "Lead Mentor",
        company: "CoderDojo",
        location: "San Francisco, CA",
        startDate: "Jul 2012",
        endDate: "Nov 2013",
        summary:
          "Taught practical programming and product thinking to students through weekly workshops and project reviews.",
        highlights: ["Created beginner-friendly lesson plans for JavaScript, HTML, and Git."],
      },
    ],
    education: [
      {
        id: makeId("education"),
        institution: "University of Oklahoma",
        studyType: "B.A. Information Technology",
        location: "Norman, OK",
        startDate: "2010",
        endDate: "2014",
        summary: "Focused on distributed systems, databases, and interface design.",
        highlights: ["GPA 4.0", "Teaching assistant for introductory CS labs"],
      },
    ],
    projects: [
      {
        id: makeId("project"),
        name: "Miss Direction",
        url: "https://missdirection.example.com",
        startDate: "Aug 2016",
        endDate: "Oct 2016",
        summary:
          "Built a playful navigation engine that intentionally rerouted users as an experiment in map UX.",
        highlights: [
          "Won best concept at AI Hacks 2016.",
          "Shipped as a Chrome extension backed by a lightweight geospatial API.",
        ],
      },
    ],
    skills: [
      {
        id: makeId("skill"),
        name: "Product",
        items: ["Zero-to-one product strategy", "Founder-led sales", "Roadmapping"],
      },
      {
        id: makeId("skill"),
        name: "Engineering",
        items: ["TypeScript", "React", "Node.js", "PostgreSQL", "CSS systems"],
      },
    ],
    customSections: [
      {
        id: makeId("custom-section"),
        title: "Selected Writing",
        items: [
          {
            id: makeId("custom-item"),
            title: "The Compression Playbook",
            subtitle: "Essay series",
            startDate: "2025",
            endDate: "2026",
            summary:
              "A practical writing series on shipping focused infrastructure products with small teams.",
            highlights: ["Published eight essays with 20k+ total reads."],
          },
        ],
      },
    ],
  };
}

export const sampleThemeSettings: ThemeSettings = defaultThemeSettings;
