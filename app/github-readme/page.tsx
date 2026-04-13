import { auth } from "@/auth";
import { PublicCareerBuilderShell } from "@/components/public-career-builder-shell";

export default async function GitHubReadmeBuilderPage() {
  const session = await auth();

  return (
    <PublicCareerBuilderShell
      assetType="GITHUB_README"
      description="Draft a GitHub profile README with production-ready markdown, stronger positioning, and project framing that reflects real work."
      heading="Build a GitHub profile README that reads like you."
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
