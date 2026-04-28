"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: DashboardIcon },
  { href: ROUTES.clients, label: "Clientes", icon: ClientsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="p-4">
        <div className="flex h-14 items-center gap-3">
          <LogoIcon />
          <span className="whitespace-nowrap text-4xl font-bold tracking-tight text-[#111827]">IA Networks</span>
        </div>

        <nav className="mt-4 space-y-2" aria-label="Navegacion principal">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-lg font-medium transition ${
                  active ? "bg-[#eaf0fb] text-[#2563eb]" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#2563eb]" fill="none" aria-hidden>
      <path
        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 4V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6.2" cy="18.2" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19C4.3 15.7 6.2 14 9 14C11.8 14 13.7 15.7 14.5 19" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.2 19C15.8 16.7 17.1 15.5 19.2 15.1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
