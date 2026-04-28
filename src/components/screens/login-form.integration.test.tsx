import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/screens/login-form";

const push = vi.fn();
const refresh = vi.fn();
const fetchMock = vi.fn<typeof fetch>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.stubGlobal("fetch", fetchMock);

describe("LoginForm integration", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "u1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("redirige a dashboard cuando el formulario es válido", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Correo electrónico"), "demo@ia.networks");
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(push).toHaveBeenCalledWith("/dashboard");
    expect(refresh).toHaveBeenCalled();
  });
});
