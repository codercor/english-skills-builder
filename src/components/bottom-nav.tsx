"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, Flame, House, UserRound } from "lucide-react";
import { motion } from "framer-motion";
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
    <nav className="glass-shell fixed inset-x-3 bottom-3 z-30 rounded-[2rem] px-2 py-2 shadow-[0_8px_32px_rgba(32,48,68,0.08)] lg:hidden">
      <ul className="grid grid-cols-4 gap-1 relative">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="relative z-10">
              <Link
                href={item.href}
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.04rem] transition-colors duration-300",
                  active
                    ? "text-white"
                    : "text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-on-surface)]",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 z-0 rounded-[1.2rem] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] shadow-[0_8px_16px_rgba(74,64,224,0.2)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("relative z-10 size-4", active ? "text-white" : "")} />
                <span className={cn("relative z-10", active ? "text-white" : "")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
