interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
}

export function SearchInput({ value, onChange, placeholder, ariaLabel }: SearchInputProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">{ariaLabel}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">?</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />
    </label>
  );
}


