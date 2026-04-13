import { db } from "@/lib/db";
import { renderPathToPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const resume = await db.careerAsset.findFirst({
    where: {
      slug,
      type: "RESUME",
      status: "PUBLISHED",
      archivedAt: null,
    },
  });

  if (!resume?.publishedSnapshot) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderPathToPdf(`/r/${slug}?print=1`);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
    },
  });
}
