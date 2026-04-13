import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand__mark">C</span>
        <span>Career Builder Hub</span>
      </Link>
      <div className="page-actions">
        <Link className="ghost-button" href="/resume">
          Resume
        </Link>
        <Link className="ghost-button" href="/github-readme">
          GitHub README
        </Link>
        <Link className="ghost-button" href="/linkedin">
          LinkedIn
        </Link>
        <Link className="ghost-button" href="/portfolio-kit">
          Portfolio Kit
        </Link>
        <Link className="ghost-button" href="/app">
          Workspace
        </Link>
        {actions}
      </div>
    </header>
  );
}
