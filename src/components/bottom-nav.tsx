"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, Flame, House, Medal, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: House },
  { href: "/review", label: "Review", icon: Flame },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/league", label: "League", icon: Medal },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[28px] border border-white/60 bg-[rgba(255,252,245,0.92)] px-2 py-2 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                  active
                    ? "bg-[color:var(--color-ink)] text-white"
                    : "text-[color:var(--color-muted)] hover:bg-white hover:text-[color:var(--color-ink)]",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
