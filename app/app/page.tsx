import Link from "next/link";

import {
  archiveCareerAssetAction,
  createCareerAssetAction,
  deleteCareerAssetAction,
  duplicateCareerAssetAction,
} from "@/app/actions/career-assets";
import { signOutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth-guard";
import { coerceCareerAssetRecord } from "@/lib/career-asset-record";
import {
  careerAssetTypeKeys,
  getAssetTypeLabel,
  getPublicBuilderPath,
  getWorkspaceEditorPath,
  type CareerAssetType,
} from "@/lib/career-assets";
import { db } from "@/lib/db";
import { formatPublicDate } from "@/lib/utils";

const filterOptions: Array<{ label: string; value: CareerAssetType | "ALL" }> = [
  { label: "All assets", value: "ALL" },
  { label: "Resume", value: "RESUME" },
  { label: "GitHub README", value: "GITHUB_README" },
  { label: "LinkedIn", value: "LINKEDIN_PROFILE" },
  { label: "Portfolio Kit", value: "PORTFOLIO_KIT" },
];

function normalizeFilter(value?: string): CareerAssetType | "ALL" {
  if (!value) {
    return "ALL";
  }

  const upper = value.toUpperCase();
  return careerAssetTypeKeys.includes(upper as CareerAssetType)
    ? (upper as CareerAssetType)
    : "ALL";
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const { type } = await searchParams;
  const filter = normalizeFilter(type);
  const assets = (
    await db.careerAsset.findMany({
      where: {
        ownerId: user.id,
        archivedAt: null,
        ...(filter === "ALL" ? {} : { type: filter }),
      },
      orderBy: {
        updatedAt: "desc",
      },
    })
  ).map(coerceCareerAssetRecord);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Career hub</p>
          <h1 className="page-title">Build every part of your career presence.</h1>
          <p className="page-copy">
            Create, save, and improve your resume, GitHub profile README, LinkedIn copy, and
            portfolio content kit from one workspace.
          </p>
        </div>
        <div className="page-actions">
          <form action={signOutAction}>
            <button className="ghost-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="surface-card workspace-builder-strip">
        {careerAssetTypeKeys.map((assetType) => (
          <div className="workspace-builder-strip__item" key={assetType}>
            <div>
              <p className="eyebrow">{getAssetTypeLabel(assetType)}</p>
              <p className="muted-copy">Start in the workspace or use the public generator.</p>
            </div>
            <div className="page-actions">
              <form action={createCareerAssetAction}>
                <input name="assetType" type="hidden" value={assetType} />
                <button className="primary-button" type="submit">
                  New {getAssetTypeLabel(assetType)}
                </button>
              </form>
              <Link className="secondary-button" href={getPublicBuilderPath(assetType)}>
                Public Builder
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="filter-row">
        {filterOptions.map((option) => (
          <Link
            className={`ghost-button ${filter === option.value ? "is-active" : ""}`}
            href={option.value === "ALL" ? "/app" : `/app?type=${option.value}`}
            key={option.value}
          >
            {option.label}
          </Link>
        ))}
      </section>

      {assets.length ? (
        <section className="dashboard-grid">
          {assets.map((asset) => (
            <article className="resume-card" key={asset.id}>
              <div>
                <p className="eyebrow">{getAssetTypeLabel(asset.type)}</p>
                <h2 className="section-title">{asset.title}</h2>
                <p className="muted-copy">
                  Updated {formatPublicDate(asset.updatedAt)}
                  {asset.type === "RESUME" && asset.status === "PUBLISHED" && asset.slug
                    ? ` - Public at /r/${asset.slug}`
                    : ""}
                </p>
              </div>

              <div className="resume-card__footer">
                <div className="resume-card__actions">
                  <Link className="primary-button" href={getWorkspaceEditorPath(asset)}>
                    Open
                  </Link>
                  {asset.type === "RESUME" && asset.status === "PUBLISHED" && asset.slug ? (
                    <Link className="secondary-button" href={`/r/${asset.slug}`} target="_blank">
                      Public Page
                    </Link>
                  ) : null}
                </div>

                <div className="resume-card__actions">
                  <form action={duplicateCareerAssetAction}>
                    <input name="assetId" type="hidden" value={asset.id} />
                    <button className="ghost-button" type="submit">
                      Duplicate
                    </button>
                  </form>
                  <form action={archiveCareerAssetAction}>
                    <input name="assetId" type="hidden" value={asset.id} />
                    <button className="ghost-button" type="submit">
                      Archive
                    </button>
                  </form>
                  <form action={deleteCareerAssetAction}>
                    <input name="assetId" type="hidden" value={asset.id} />
                    <button className="ghost-button ghost-button--danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state surface-card">
          <p className="eyebrow">No saved assets</p>
          <h2 className="section-title">Start with any builder and save it here.</h2>
          <p className="page-copy">
            Guest builders work without login, but saved history and resume publishing live in this
            workspace.
          </p>
        </section>
      )}
    </main>
  );
}
