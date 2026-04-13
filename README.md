# Career Builder Hub

Career Builder Hub is a browser-first career asset builder designed for Vercel deployment.
It turns the original `resume-markdown` idea into a hosted product with:

- Public builders for resume drafts, GitHub profile READMEs, LinkedIn profile copy, and portfolio content kits
- Guest generation in the browser, with sign-in required only for saved workspace history and resume publishing
- OAuth sign-in with Google and GitHub
- A shared workspace for saved career assets
- Resume publishing with public resume URLs and PDF export
- Resume form editing plus a full-document Markdown tab
- Markdown import and canonical normalization for resume drafts
- FastRouter-backed generation via its OpenAI-compatible Responses API, with OpenAI fallback and local mock outputs when no provider key is set

The legacy Python package remains in `src/resume_markdown/` as migration/reference material. It is not part of the Next.js runtime.

## Stack

- Next.js 16 App Router
- React 19
- Prisma + PostgreSQL
- Auth.js + Prisma adapter
- FastRouter or OpenAI Responses API
- Puppeteer + `@sparticuz/chromium` for PDF generation
- Vitest + Playwright

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Set at least:

   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `GITHUB_ID` / `GITHUB_SECRET`
   - `FASTROUTER_API_KEY` or `OPENAI_API_KEY`

   Optional:

   - `FASTROUTER_BASE_URL`
   - `FASTROUTER_MODEL`
   - `OPENAI_MODEL`

4. Generate and apply your Prisma schema:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

   If you are upgrading from the earlier resume-only app and already have rows in the legacy
   `Resume` table, run:

   ```bash
   pnpm db:migrate:resumes
   ```

5. Start the app:

   ```bash
   pnpm dev
   ```

## Verification

```bash
pnpm test
pnpm test:e2e
pnpm build
```

## Vercel deployment

1. Create a PostgreSQL database, preferably Neon.
2. Add the environment variables from `.env.example` in Vercel.
3. Configure Google and GitHub OAuth callback URLs to point at:

   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/github`

4. Deploy the repo as a standard Next.js project on Vercel.
5. If you want live AI generation in production, set `FASTROUTER_API_KEY` and optionally
   `FASTROUTER_MODEL`. The app prefers FastRouter automatically when that key is present.
   `OPENAI_API_KEY` remains supported as a fallback provider.

## Legacy reference

The original CLI implementation still lives under `src/resume_markdown/`. Keep it only for migration/reference work unless you explicitly want to maintain the Python package separately.

# Career-Builder-Hub-
