import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfidencePill } from "@/components/ui/confidence-pill";

describe("ConfidencePill", () => {
  it("muestra guion cuando confidence es null", () => {
    render(<ConfidencePill value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renderiza porcentaje redondeado", () => {
    render(<ConfidencePill value={0.941} />);
    expect(screen.getByText("94%")).toBeInTheDocument();
  });
});

