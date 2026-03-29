import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BottomNav } from "@/components/bottom-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import type { Viewer } from "@/lib/types";

export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-[28px] border border-white/70 bg-[rgba(255,252,245,0.84)] px-4 py-3 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/home" className="nav-link">
                Home
              </Link>
              <Link href="/review" className="nav-link">
                Review
              </Link>
              <Link href="/progress" className="nav-link">
                Progress
              </Link>
              <Link href="/league" className="nav-link">
                League
              </Link>
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="hidden gap-2 sm:inline-flex">
                <Sparkles className="size-3.5" />
                Live account
              </Badge>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {viewer.name}
                </p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {viewer.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 py-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
