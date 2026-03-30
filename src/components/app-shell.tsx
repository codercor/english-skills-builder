"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, Flame, House, Medal, Sparkles, UserRound } from "lucide-react";
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
  const pathname = usePathname();
  const practiceMode = pathname.startsWith("/practice/");

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div
        className={`mx-auto flex min-h-screen w-full max-w-7xl flex-col ${
          practiceMode
            ? "px-3 pb-6 pt-3 sm:px-4 lg:px-6"
            : "px-4 pb-28 pt-4 sm:px-6 lg:px-8"
        }`}
      >
        {!practiceMode ? (
          <header className="glass-shell sticky top-4 z-20 rounded-[2rem] px-4 py-3 shadow-[0_24px_64px_rgba(25,28,29,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <BrandMark />
              <div className="hidden items-center gap-2 lg:flex">
                <Link href="/home" className="nav-link">
                  <House className="size-3.5" />
                  Home
                </Link>
                <Link href="/builders" className="nav-link">
                  <Blocks className="size-3.5" />
                  Builders
                </Link>
                <Link href="/review" className="nav-link">
                  <Flame className="size-3.5" />
                  Review
                </Link>
                <Link href="/profile" className="nav-link">
                  <UserRound className="size-3.5" />
                  Profile
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-1 xl:flex">
                  <Link href="/league" className="nav-link text-[0.72rem]">
                    <Medal className="size-3.5" />
                    League
                  </Link>
                </div>
                <Badge className="hidden gap-2 bg-[color:var(--color-panel)] text-[color:var(--color-primary)] sm:inline-flex">
                  <Sparkles className="size-3.5" />
                  Live account
                </Badge>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-sm font-semibold text-[color:var(--color-ink)]">
                    {viewer.name}
                  </p>
                  <p className="text-[0.7rem] uppercase tracking-[0.05rem] text-[color:var(--color-muted)]">
                    {viewer.email}
                  </p>
                </div>
                <SignOutButton />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto xl:hidden">
              <Link href="/league" className="nav-link whitespace-nowrap text-[0.68rem]">
                <Medal className="size-3.5" />
                League
              </Link>
            </div>
          </header>
        ) : null}
        <main className={`flex-1 ${practiceMode ? "py-2 sm:py-4" : "py-6 sm:py-8"}`}>
          {children}
        </main>
      </div>
      {!practiceMode ? <BottomNav /> : null}
    </div>
  );
}
