import { redirect } from "next/navigation";

export default async function LearningMapPage() {
  redirect("/profile?tab=map");
}
