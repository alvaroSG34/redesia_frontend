"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

import { ROUTES, clientRoute } from "@/lib/routes";
import { createClient } from "@/services/social-analytics";
import { validateNewClient, type NewClientFormValues } from "@/lib/validation";

const INITIAL_VALUES: NewClientFormValues = {
  name: "",
  industry: "",
  description: "",
  website: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  instagramHandle: "",
};

const INDUSTRIES = ["Tecnologia", "Gastronomia", "Retail", "Salud y bienestar", "Educacion"];

export function NewClientForm() {
  const router = useRouter();
  const [values, setValues] = useState<NewClientFormValues>(INITIAL_VALUES);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validateNewClient(values), [values]);

  const updateField = (field: keyof NewClientFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSubmit(true);
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const name = values.name.trim();
      const created = await createClient({
        name,
        shortName: toShortName(name),
        industry: values.industry.trim(),
        description: values.description.trim(),
        status: values.instagramHandle.trim() ? "Pendiente" : "Sin cuenta",
        connected: false,
        avatarColor: pickAvatarColor(name),
      });

      setValues(INITIAL_VALUES);
      setHasTriedSubmit(false);
      router.push(clientRoute(created.id));
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (field: keyof NewClientFormValues) => (hasTriedSubmit ? errors[field] : undefined);

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#d2dae7] bg-white p-8">
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold text-[#1e293b]">1. Informacion del cliente</h2>
        <p className="text-[16px] text-[#64748b]">Datos basicos de la marca o empresa.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nombre del cliente"
            error={showError("name")}
            input={
              <input
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. TechCorp Inc."
                className="field-input"
              />
            }
          />
          <Field
            label="Rubro o categoria"
            error={showError("industry")}
            input={
              <div className="relative">
                <select
                  value={values.industry}
                  onChange={(event) => updateField("industry", event.target.value)}
                  className="field-input appearance-none pr-10"
                >
                  <option value="">Seleccionar rubro</option>
                  {INDUSTRIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
              </div>
            }
          />
        </div>

        <Field
          label="Descripcion breve"
          error={showError("description")}
          input={
            <textarea
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="¿A que se dedica la empresa?"
              className="field-input min-h-20 resize-none py-3"
            />
          }
        />

        <Field
          label="Sitio web (Opcional)"
          input={
            <input
              value={values.website}
              onChange={(event) => updateField("website", event.target.value)}
              placeholder="https://"
              className="field-input"
            />
          }
        />
      </section>

      <hr className="my-8 border-slate-200" />

      <section className="space-y-4">
        <h2 className="text-[18px] font-bold text-[#1e293b]">2. Informacion de contacto</h2>
        <p className="text-[16px] text-[#64748b]">Persona de contacto principal para la cuenta.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nombre del responsable"
            input={
              <input
                value={values.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="Ej. Juan Perez"
                className="field-input"
              />
            }
          />
          <Field
            label="Correo electronico"
            error={showError("contactEmail")}
            input={
              <input
                value={values.contactEmail}
                onChange={(event) => updateField("contactEmail", event.target.value)}
                placeholder="juan@empresa.com"
                className="field-input"
              />
            }
          />
        </div>

        <div className="max-w-[300px]">
          <Field
            label="Telefono"
            input={
              <input
                value={values.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+1 234 567 8900"
                className="field-input"
              />
            }
          />
        </div>
      </section>

      <hr className="my-8 border-slate-200" />

      <section className="space-y-4">
        <h2 className="text-[18px] font-bold text-[#1e293b]">3. Redes sociales</h2>
        <p className="text-[16px] text-[#64748b]">Conecta la cuenta de Instagram Business a analizar.</p>

        <Field
          label="Usuario de Instagram"
          error={showError("instagramHandle")}
          input={
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
              <input
                value={values.instagramHandle}
                onChange={(event) => updateField("instagramHandle", event.target.value)}
                placeholder="empresa_oficial"
                className="field-input pl-9"
              />
            </div>
          }
        />

        <div className="flex flex-col gap-4 rounded-xl border border-[#d2dae7] bg-[#f9fbff] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-[#f59e0b]">◌</span>
            <div>
              <p className="text-[16px] font-semibold text-[#334155]">Estado de conexion</p>
              <p className="text-[14px] text-[#f59e0b]">No conectada</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-[#2563eb] px-4 text-[16px] font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            <span aria-hidden>◉</span>
            Conectar cuenta
          </button>
        </div>
      </section>

      <div className="mt-10 flex justify-end gap-3">
        <Link
          href={ROUTES.clients}
          className="inline-flex h-10 items-center rounded-lg border border-[#c6d2e3] bg-white px-6 text-[16px] font-semibold text-[#475569] hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center rounded-lg bg-[#2563eb] px-6 text-[16px] font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Guardando..." : "Guardar cliente"}
        </button>
      </div>

      {submitError ? (
        <p className="mt-4 text-right text-[13px] font-medium text-rose-600">{submitError}</p>
      ) : null}
    </form>
  );
}

function toShortName(name: string): string {
  const chunks = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);

  if (!chunks.length) {
    return "N/A";
  }

  const initials = chunks.map((chunk) => chunk[0] ?? "").join("").toUpperCase();
  return initials.slice(0, 10) || "N/A";
}

function pickAvatarColor(seed: string): string {
  const palette = ["#2563eb", "#0f766e", "#b45309", "#7c3aed", "#0369a1", "#be185d"];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? "#2563eb";
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo crear el cliente. Intenta nuevamente.";
}

interface FieldProps {
  label: string;
  input: ReactNode;
  error?: string;
}

function Field({ label, input, error }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-[14px] font-semibold text-[#334155]">{label}</span>
      {input}
      {error ? <span className="text-[12px] font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
