import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostGrid } from "@/components/business/post-grid";

describe("PostGrid flow links", () => {
  it("expone navegación a detalle y comentarios", () => {
    render(
      <PostGrid
        clientId="elbuen-sabor"
        posts={[
          {
            id: "post-rbs-01",
            clientId: "elbuen-sabor",
            caption: "Menú de verano",
            publishedAt: "12 de abril",
            imageHint: "Imagen",
            likes: 5,
            commentsCount: 3,
            analyzedComments: 2,
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute(
      "href",
      "/clients/elbuen-sabor/posts/post-rbs-01",
    );
    expect(screen.getByRole("link", { name: "Comentarios" })).toHaveAttribute(
      "href",
      "/clients/elbuen-sabor/posts/post-rbs-01/comments",
    );
  });
});

