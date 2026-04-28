import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClientList } from "@/components/business/client-list";

describe("ClientList integration", () => {
  it("muestra acceso al dashboard de cliente", () => {
    render(
      <ClientList
        clients={[
          {
            id: "techcorp",
            name: "TechCorp Inc.",
            shortName: "TC",
            industry: "Tecnología",
            description: "SaaS B2B",
            status: "Activo",
            connected: true,
            avatarColor: "#0f766e",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Ver cliente" })).toHaveAttribute("href", "/clients/techcorp");
  });
});
