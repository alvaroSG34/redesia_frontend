"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { clientAccountsRoute, clientPostsRoute, clientRoute } from "@/lib/routes";

interface ClientContextNavProps {
  clientId: string;
  active?: "dashboard" | "accounts" | "posts";
}

export function ClientContextNav({ clientId, active }: ClientContextNavProps) {
  const pathname = usePathname();
  const resolvedActive = active ?? resolveActiveTab(pathname, clientId);

  const links = [
    { key: "dashboard", href: clientRoute(clientId), label: "Resumen" },
    { key: "accounts", href: clientAccountsRoute(clientId), label: "Cuentas" },
    { key: "posts", href: clientPostsRoute(clientId), label: "Publicaciones" },
  ] as const;

  return (
    <nav className="flex flex-nowrap gap-2 overflow-x-auto pb-1" aria-label="Navegación de cliente">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
            resolvedActive === link.key
              ? "bg-[#2563eb] text-white shadow-sm hover:bg-[#1d4ed8]"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function resolveActiveTab(pathname: string, clientId: string): "dashboard" | "accounts" | "posts" {
  const base = `/clients/${clientId}`;

  if (pathname.startsWith(`${base}/accounts`)) {
    return "accounts";
  }

  if (pathname.startsWith(`${base}/posts`)) {
    return "posts";
  }

  return "dashboard";
}
