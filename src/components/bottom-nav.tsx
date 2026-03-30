"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, Flame, House, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: House },
  { href: "/builders", label: "Builders", icon: Blocks },
  { href: "/review", label: "Review", icon: Flame },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-shell fixed inset-x-3 bottom-3 z-30 rounded-[2rem] px-2 py-2 shadow-[0_24px_80px_rgba(25,28,29,0.12)] lg:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[1.2rem] px-2 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.04rem] transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                  active
                    ? "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] text-white shadow-[0_18px_36px_rgba(25,28,29,0.08)]"
                    : "text-[color:var(--color-muted)] hover:bg-[rgba(255,255,255,0.7)] hover:text-[color:var(--color-ink)]",
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
