import { redirect } from "next/navigation";

import { auth, availableAuthProviders } from "@/auth";
import { signInWithGitHubAction, signInWithGoogleAction } from "@/app/actions/auth";
import { SiteHeader } from "@/components/site-header";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const { next } = await searchParams;
  const redirectTarget = next || "/app";

  if (session?.user) {
    redirect(redirectTarget);
  }

  return (
    <main className="login-page">
      <div>
        <SiteHeader />
        <section className="login-card">
          <p className="eyebrow">Sign in</p>
          <h1 className="page-title">Save your career assets and keep building.</h1>
          <p className="page-copy">
            Sign in to keep your resume drafts, GitHub README ideas, LinkedIn copy, and portfolio
            kits inside the workspace.
          </p>

          <div className="auth-buttons">
            {availableAuthProviders.google ? (
              <form action={signInWithGoogleAction}>
                <input name="redirectTo" type="hidden" value={redirectTarget} />
                <button className="primary-button" type="submit">
                  Continue with Google
                </button>
              </form>
            ) : null}

            {availableAuthProviders.github ? (
              <form action={signInWithGitHubAction}>
                <input name="redirectTo" type="hidden" value={redirectTarget} />
                <button className="secondary-button" type="submit">
                  Continue with GitHub
                </button>
              </form>
            ) : null}
          </div>

          {!availableAuthProviders.google && !availableAuthProviders.github ? (
            <div className="notice-card notice-card--danger">
              Configure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` or `GITHUB_ID` / `GITHUB_SECRET`
              to enable sign-in.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
