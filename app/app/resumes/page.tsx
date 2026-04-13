import { redirect } from "next/navigation";

export default function ResumesPage() {
  redirect("/app?type=RESUME");
}
