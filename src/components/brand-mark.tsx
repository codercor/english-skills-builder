export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-[1.35rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] text-sm font-black uppercase tracking-[0.24em] text-white shadow-[0_20px_44px_rgba(25,28,29,0.1)]">
        EP
      </div>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
          English Practice
        </p>
        <p className="font-display text-base font-semibold text-[color:var(--color-ink)]">
          Digital Mentor
        </p>
      </div>
    </div>
  );
}
