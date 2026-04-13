import { auth } from "@/auth";
import { PublicCareerBuilderShell } from "@/components/public-career-builder-shell";

export default async function LinkedInBuilderPage() {
  const session = await auth();

  return (
    <PublicCareerBuilderShell
      assetType="LINKEDIN_PROFILE"
      description="Generate a sharper LinkedIn headline, about section, and experience bullets without depending on direct LinkedIn syncing."
      heading="Rewrite your LinkedIn profile with clearer positioning."
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
