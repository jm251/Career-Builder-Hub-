import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderPathToPdf } from "@/lib/pdf";
import { createPreviewToken } from "@/lib/preview-token";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const resume = await db.careerAsset.findFirst({
    where: {
      id,
      ownerId: session.user.id,
      type: "RESUME",
      archivedAt: null,
    },
  });

  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderPathToPdf(`/preview/${resume.id}?token=${createPreviewToken(resume.id)}`);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.slug}-draft.pdf"`,
    },
  });
}
