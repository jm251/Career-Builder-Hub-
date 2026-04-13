import { auth } from "@/auth";
import { PublicResumeBuilderShell } from "@/components/public-resume-builder-shell";

export default async function ResumeBuilderPage() {
  const session = await auth();

  return <PublicResumeBuilderShell isAuthenticated={Boolean(session?.user?.id)} />;
}
