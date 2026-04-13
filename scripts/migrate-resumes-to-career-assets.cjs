const { Prisma, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let skipped = 0;

  for (const resume of resumes) {
    const existing = await prisma.careerAsset.findFirst({
      where: {
        type: "RESUME",
        slug: resume.slug,
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.careerAsset.create({
      data: {
        ownerId: resume.ownerId,
        type: "RESUME",
        title: resume.title,
        slug: resume.slug,
        template: resume.template,
        themeSettings: resume.themeSettings,
        inputData: resume.resumeData,
        outputData: Prisma.DbNull,
        editorState: {
          source: "legacy-resume-migration",
          legacyResumeId: resume.id,
        },
        markdown: resume.markdown,
        status: resume.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        publishedSnapshot:
          resume.publishedSnapshot === null ? Prisma.DbNull : resume.publishedSnapshot,
        publishedAt: resume.publishedAt,
        archivedAt: resume.archivedAt,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });

    created += 1;
  }

  console.log(
    `Legacy resume migration complete. Created ${created} career assets, skipped ${skipped} existing rows.`,
  );
}

main()
  .catch((error) => {
    console.error("Legacy resume migration failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
