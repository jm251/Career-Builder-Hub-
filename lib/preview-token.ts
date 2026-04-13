import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  return process.env.AUTH_SECRET || "resume-preview-secret";
}

export function createPreviewToken(resumeId: string) {
  return createHmac("sha256", getSecret()).update(resumeId).digest("hex");
}

export function verifyPreviewToken(resumeId: string, token: string) {
  const expected = createPreviewToken(resumeId);

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
