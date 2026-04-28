export interface NewClientFormValues {
  name: string;
  industry: string;
  description: string;
  website: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  instagramHandle: string;
}

export type NewClientErrors = Partial<Record<keyof NewClientFormValues, string>>;

export function validateNewClient(values: NewClientFormValues): NewClientErrors {
  const errors: NewClientErrors = {};
  const instagramRaw = values.instagramHandle.trim();
  const instagramNormalized = instagramRaw.startsWith("@")
    ? instagramRaw.slice(1)
    : instagramRaw;

  if (!values.name.trim()) {
    errors.name = "El nombre del cliente es obligatorio.";
  }

  if (!values.industry.trim()) {
    errors.industry = "Selecciona un rubro.";
  }

  if (!values.description.trim()) {
    errors.description = "La descripcion es obligatoria.";
  }

  if (!instagramRaw) {
    errors.instagramHandle = "El usuario de Instagram es obligatorio.";
  } else if (!/^[a-zA-Z0-9._]{1,30}$/.test(instagramNormalized)) {
    errors.instagramHandle = "Ingresa un usuario valido de Instagram.";
  }

  if (values.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
    errors.contactEmail = "Ingresa un correo valido.";
  }

  return errors;
}
