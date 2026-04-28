import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-[var(--color-border)] bg-white/90 p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.55)] backdrop-blur",
        className,
      )}
    >
      {children}
    </article>
  );
}


