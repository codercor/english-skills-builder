"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthCta({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <Button
        className="w-full"
        size="lg"
        disabled={!enabled || isPending}
        onClick={() =>
          startTransition(async () => {
            await signIn("google", { callbackUrl: "/home" });
          })
        }
      >
        Continue with Google
      </Button>
    </div>
  );
}
