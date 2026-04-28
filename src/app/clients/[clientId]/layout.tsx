import { type ReactNode } from "react";

import { ClientContextNav } from "@/components/layout/client-context-nav";

interface ClientLayoutProps {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}

export default async function ClientLayout({ children, params }: ClientLayoutProps) {
  const { clientId } = await params;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-[#f3f4f6]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <ClientContextNav clientId={clientId} />
      </div>
      {children}
    </div>
  );
}
