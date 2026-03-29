import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
