"use server";

import { signIn, signOut } from "@/auth";

function getRedirectTarget(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/app");
  return redirectTo || "/app";
}

export async function signInWithGoogleAction(formData?: FormData) {
  await signIn("google", { redirectTo: getRedirectTarget(formData) });
}

export async function signInWithGitHubAction(formData?: FormData) {
  await signIn("github", { redirectTo: getRedirectTarget(formData) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
