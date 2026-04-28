"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  connectInstagramAction,
  disconnectAccountAction,
  syncAccountAction,
} from "./actions";

interface ConnectButtonProps {
  clientId: string;
  canConnect: boolean;
  canReconnect: boolean;
}

export function ConnectInstagramButton({
  clientId,
  canConnect,
  canReconnect,
}: ConnectButtonProps) {
  const [isPending, startTransition] = useTransition();

  const label = canConnect ? "Conectar con Instagram" : "Reconectar";
  const disabled = !canConnect && !canReconnect;

  function handleConnect() {
    startTransition(async () => {
      const result = await connectInstagramAction(clientId);
      if (result && "error" in result) {
        alert(`Error: ${result.error}\n\nVerifica credenciales de Meta en backend.`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending || disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition disabled:opacity-60 ${
        canConnect
          ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
          : "border border-[#c7bffe] bg-[#f7f5ff] text-[#6d44f5] hover:bg-[#f1edff]"
      }`}
    >
      {isPending ? (
        <>
          <SpinnerIcon />
          Procesando...
        </>
      ) : (
        <>
          <InstagramIcon />
          {label}
        </>
      )}
    </button>
  );
}

interface SyncButtonProps {
  clientId: string;
  accountId: string;
  canSync: boolean;
}

export function SyncAccountButton({ clientId, accountId, canSync }: SyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSync() {
    startTransition(async () => {
      const result = await syncAccountAction(clientId, accountId);
      if (!result.ok) {
        alert(`Error al sincronizar: ${result.error}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isPending || !canSync}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-5 text-[15px] font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
    >
      {isPending ? (
        <>
          <SpinnerIcon />
          Sincronizando...
        </>
      ) : (
        <>
          <SyncIcon />
          Sincronizar ahora
        </>
      )}
    </button>
  );
}

interface DisconnectButtonProps {
  clientId: string;
  accountId: string;
  canDisconnect: boolean;
}

export function DisconnectAccountButton({
  clientId,
  accountId,
  canDisconnect,
}: DisconnectButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDisconnect() {
    const accepted = window.confirm(
      "Esto limpiara tokens locales y marcara la cuenta como desconectada. Continuar?",
    );
    if (!accepted) {
      return;
    }

    startTransition(async () => {
      const result = await disconnectAccountAction(clientId, accountId);
      if (!result.ok) {
        alert(`Error al desconectar: ${result.error}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={isPending || !canDisconnect}
      className="inline-flex h-10 items-center rounded-lg border border-[#f4b2b2] bg-white px-5 text-[15px] font-semibold text-[#b91c1c] transition hover:bg-[#fff5f5] disabled:opacity-60"
    >
      {isPending ? "Desconectando..." : "Desconectar"}
    </button>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0 1 14.93-4H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12a8 8 0 0 1-14.93 4H8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
