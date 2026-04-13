import { auth } from "@/auth";
import { PublicCareerBuilderShell } from "@/components/public-career-builder-shell";

export default async function PortfolioKitBuilderPage() {
  const session = await auth();

  return (
    <PublicCareerBuilderShell
      assetType="PORTFOLIO_KIT"
      description="Create a portfolio content kit with hero copy, about text, project summaries, and case-study framing you can reuse anywhere."
      heading="Shape a portfolio story before you build the site."
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
