export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-[1.1rem] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[0.8rem] font-black uppercase tracking-[0.15em] text-white shadow-[0_8px_16px_rgba(74,64,224,0.2)] pl-[0.15em]">
        EP
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[color:var(--color-on-surface-variant)]">
          English Practice
        </p>
        <p className="font-display text-[0.95rem] font-semibold leading-none text-[color:var(--color-on-surface)] mt-1">
          Digital Mentor
        </p>
      </div>
    </div>
  );
}
