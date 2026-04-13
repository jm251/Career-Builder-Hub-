export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function makeId(prefix = "item") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function compact<T>(values: T[]) {
  return values.filter(Boolean);
}

export function formatDateRange(startDate: string, endDate: string) {
  const start = startDate.trim();
  const end = endDate.trim();

  if (!start && !end) {
    return "";
  }

  if (!end) {
    return start;
  }

  if (!start) {
    return end;
  }

  return `${start} -- ${end}`;
}

export function formatPublicDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Draft";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, getBaseUrl()).toString();
}
