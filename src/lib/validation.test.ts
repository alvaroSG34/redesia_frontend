import { describe, expect, it } from "vitest";

import { validateNewClient } from "@/lib/validation";

describe("validateNewClient", () => {
  it("retorna errores cuando faltan campos obligatorios", () => {
    const result = validateNewClient({
      name: "",
      industry: "",
      description: "",
      website: "",
      contactName: "",
      contactEmail: "",
      phone: "",
      instagramHandle: "",
    });

    expect(result.name).toBeDefined();
    expect(result.industry).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.instagramHandle).toBeDefined();
  });

  it("acepta valores completos y handle con @", () => {
    const result = validateNewClient({
      name: "TechCorp",
      industry: "Tecnologia",
      description: "Automatizacion comercial",
      website: "https://techcorp.com",
      contactName: "Juan Perez",
      contactEmail: "juan@techcorp.com",
      phone: "+1 555 0101",
      instagramHandle: "@techcorp",
    });

    expect(result).toEqual({});
  });

  it("acepta handle sin arroba porque el formulario ya la muestra visualmente", () => {
    const result = validateNewClient({
      name: "TechCorp",
      industry: "Tecnologia",
      description: "Automatizacion comercial",
      website: "https://techcorp.com",
      contactName: "Juan Perez",
      contactEmail: "juan@techcorp.com",
      phone: "+1 555 0101",
      instagramHandle: "techcorp",
    });

    expect(result).toEqual({});
  });

  it("rechaza handle con caracteres invalidos", () => {
    const result = validateNewClient({
      name: "TechCorp",
      industry: "Tecnologia",
      description: "Automatizacion comercial",
      website: "https://techcorp.com",
      contactName: "Juan Perez",
      contactEmail: "juan@techcorp.com",
      phone: "+1 555 0101",
      instagramHandle: "@tech corp",
    });

    expect(result.instagramHandle).toBe("Ingresa un usuario valido de Instagram.");
  });
});
