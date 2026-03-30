import { redirect } from "next/navigation";

export default async function ProgressPage() {
  redirect("/profile?tab=progress");
}
