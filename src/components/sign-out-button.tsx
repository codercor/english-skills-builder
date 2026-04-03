"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      className="px-2 sm:px-4"
      onClick={() =>
        startTransition(async () => {
          await signOut({ callbackUrl: "/" });
        })
      }
    >
      <span className="hidden sm:inline">Sign out</span>
      <LogOut className="size-4 sm:hidden" />
    </Button>
  );
}
