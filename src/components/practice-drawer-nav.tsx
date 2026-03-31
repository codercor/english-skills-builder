"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";
import type { PracticeNavSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PracticeDrawerNavProps = {
  nav: PracticeNavSnapshot;
  isOpen: boolean;
  sessionCompleted: boolean;
  onToggleOpen: () => void;
  progressLabel: string;
  supportAvailable: boolean;
  supportRailOpen: boolean;
  onToggleHints: () => void;
  onNavigate: (href: string, label: string) => void;
};

function statusBadgeClass(status: PracticeNavSnapshot["recentTargets"][number]["status"]) {
  if (status === "review") {
    return "bg-[rgba(242,189,78,0.18)] text-[color:var(--color-hint-ink)]";
  }

  if (status === "continue") {
    return "bg-[rgba(15,76,92,0.08)] text-[color:var(--color-primary)]";
  }

  return "bg-[color:var(--color-soft)] text-[color:var(--color-muted)]";
}

function PrimaryRailButton({
  icon,
  label,
  onClick,
  open,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  open: boolean;
  tone?: "default" | "accent";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-3 rounded-[1.3rem] px-3 py-3 text-left text-sm font-semibold transition",
        tone === "accent"
          ? "bg-[rgba(15,76,92,0.08)] text-[color:var(--color-primary)] hover:bg-[rgba(15,76,92,0.12)]"
          : "bg-transparent text-[color:var(--color-muted)] hover:bg-[color:var(--color-soft)] hover:text-[color:var(--color-ink)]",
        !open && "justify-center px-0",
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[color:var(--color-panel)] shadow-[inset_0_0_0_1px_var(--color-line)]">
        {icon}
      </span>
      {open ? <span className="truncate">{label}</span> : null}
    </button>
  );
}

function ShortcutSection({
  title,
  shortcuts,
  onNavigate,
}: {
  title: string;
  shortcuts: PracticeNavSnapshot["recentTargets"];
  onNavigate: (href: string, label: string) => void;
}) {
  const visibleShortcuts = shortcuts.slice(0, 2);

  if (!visibleShortcuts.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {title}
      </p>
      <div className="space-y-1.5">
        {visibleShortcuts.map((shortcut) => (
          <button
            className="group flex w-full items-center justify-between gap-3 rounded-[1rem] bg-[color:var(--color-soft)] px-3 py-2.5 text-left transition hover:bg-[rgba(15,76,92,0.06)]"
            key={`${title}-${shortcut.href}`}
            onClick={() => onNavigate(shortcut.href, shortcut.title)}
            type="button"
          >
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-semibold text-[color:var(--color-ink)]">
                {shortcut.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={cn("shadow-none", statusBadgeClass(shortcut.status))}>
                  {shortcut.stateLabel}
                </Badge>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-primary)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DrawerContent({
  nav,
  open,
  sessionCompleted,
  progressLabel,
  supportAvailable,
  supportRailOpen,
  onToggleOpen,
  onToggleHints,
  onNavigate,
  mobile,
}: PracticeDrawerNavProps & { open: boolean; mobile?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-[2rem] border border-[rgba(192,200,203,0.15)] bg-[color:var(--color-panel)] p-3 shadow-[0_24px_52px_rgba(25,28,29,0.06)]",
      open ? "w-full" : "items-center",
      )}
    >
      <div className={cn("flex items-center gap-3", open ? "justify-between" : "justify-center")}>
        {open ? (
          <div className="min-w-0 px-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              {nav.currentBuilder}
            </p>
            <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
              {nav.currentTopic}
            </p>
          </div>
        ) : null}
        <button
          aria-label={open ? "Collapse practice menu" : "Expand practice menu"}
          className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-soft)] text-[color:var(--color-primary)] transition hover:bg-[rgba(15,76,92,0.08)]"
          onClick={onToggleOpen}
          type="button"
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="rounded-[1.15rem] bg-[color:var(--color-soft)] px-3.5 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Session
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-[color:var(--color-ink)]">{progressLabel}</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                {sessionCompleted ? "Completed session" : "Current progress"}
              </p>
            </div>
            <Badge className="bg-[rgba(15,76,92,0.08)] text-[color:var(--color-primary)] shadow-none">
              Practice
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-soft)] text-[color:var(--color-primary)]">
          <span className="text-xs font-semibold">{progressLabel.split("/")[0]?.trim()}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <PrimaryRailButton
          icon={<ArrowLeft className="size-4" />}
          label="Back"
          onClick={() => onNavigate(nav.backHref, "Back")}
          open={open}
        />
        <PrimaryRailButton
          icon={<Home className="size-4" />}
          label="Home"
          onClick={() => onNavigate(nav.homeHref, "Home")}
          open={open}
        />
        {supportAvailable ? (
          <PrimaryRailButton
            icon={<Lightbulb className="size-4" />}
            label={supportRailOpen ? "Hide hints" : "Show hints"}
            onClick={onToggleHints}
            open={open}
            tone={supportRailOpen ? "accent" : "default"}
          />
        ) : null}
      </div>

      {open ? (
        <div className="space-y-3 border-t border-[rgba(192,200,203,0.15)] pt-4">
          <ShortcutSection
            title="Recent practice"
            shortcuts={nav.recentTargets}
            onNavigate={onNavigate}
          />
          <ShortcutSection
            title="Recommended next"
            shortcuts={nav.recommendedTargets}
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-2">
          {nav.recentTargets.length ? (
            <span
              className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-soft)] text-[color:var(--color-primary)]"
              title="Recent practice"
            >
              <ArrowLeft className="size-4" />
            </span>
          ) : null}
          {nav.recommendedTargets.length ? (
            <span
              className="flex size-11 items-center justify-center rounded-full bg-[rgba(15,76,92,0.08)] text-[color:var(--color-primary)]"
              title="Recommended next"
            >
              <Sparkles className="size-4" />
            </span>
          ) : null}
        </div>
      )}

      {mobile && open ? (
        <Button className="mt-auto" onClick={onToggleOpen} size="lg" variant="secondary">
          <X className="mr-2 size-4" />
          Close menu
        </Button>
      ) : null}
    </div>
  );
}

export function PracticeDrawerNav(props: PracticeDrawerNavProps) {
  const { isOpen, onToggleOpen } = props;
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onToggleOpen();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, isOpen, onToggleOpen]);

  return (
    <>
      <aside
        className={cn(
          "sticky top-6 hidden h-[calc(100vh-3rem)] self-start lg:block",
          isOpen ? "w-60" : "w-[4.5rem]",
        )}
      >
        <DrawerContent {...props} open={isOpen} />
      </aside>

      {isMobile && isOpen ? (
        <div className="lg:hidden">
          <button
            aria-label="Close practice menu overlay"
            className="fixed inset-0 z-40 bg-[rgba(25,28,29,0.28)] backdrop-blur-[2px]"
            onClick={onToggleOpen}
            type="button"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(22rem,86vw)] p-3" ref={drawerRef}>
            <DrawerContent {...props} mobile open />
          </div>
        </div>
      ) : null}
    </>
  );
}
