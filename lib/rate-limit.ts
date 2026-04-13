const windowStore = new Map<string, number[]>();

export function isRateLimited(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = windowStore.get(input.key) ?? [];
  const valid = existing.filter((timestamp) => now - timestamp < input.windowMs);

  if (valid.length >= input.limit) {
    windowStore.set(input.key, valid);
    return true;
  }

  valid.push(now);
  windowStore.set(input.key, valid);
  return false;
}

export function getRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
