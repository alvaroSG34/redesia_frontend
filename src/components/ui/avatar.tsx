import { cn } from "@/lib/cn";

interface AvatarProps {
  initials: string;
  color?: string;
  className?: string;
}

export function Avatar({ initials, color, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white",
        className,
      )}
      style={{ backgroundColor: color ?? "#0f766e" }}
      aria-hidden
    >
      {initials}
    </span>
  );
}


