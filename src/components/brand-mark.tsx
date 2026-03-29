export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-ink),var(--color-teal))] text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_44px_rgba(15,23,42,0.2)]">
        EP
      </div>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          English Practice
        </p>
        <p className="text-base font-semibold text-[color:var(--color-ink)]">
          Structure Gym
        </p>
      </div>
    </div>
  );
}
