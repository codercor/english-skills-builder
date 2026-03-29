import { getServerSession } from "next-auth";
import { authOptions, isAuthConfigured } from "@/auth";
import type { Viewer } from "@/lib/types";

export async function getAuthenticatedUser() {
  if (!isAuthConfigured) {
    return null;
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return {
    id: session.user.id ?? session.user.email,
    name: session.user.name ?? "Learner",
    email: session.user.email,
  };
}

export async function getViewer(): Promise<Viewer> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      id: "",
      name: "Learner",
      email: "",
    };
  }

  return user;
}
