import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatosCards } from "./datos-card";
import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

// CR-003: las SuperLíneas de sistema no se pueden editar ni eliminar

const superLinea = (sistema: number): SuperLinea => ({
  id: 5,
  denominacion: "bebidas",
  observacion: null,
  sistema,
  deletedAt: null,
});

describe("DatosCards de SuperLínea", () => {
  it("permite editar y eliminar una SuperLínea común", async () => {
    const user = userEvent.setup();
    const onEditar = vi.fn();
    const onDelete = vi.fn();
    render(<DatosCards superLinea={superLinea(0)} onEditar={onEditar} onDelete={onDelete} />);

    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Eliminar"));

    expect(onEditar).toHaveBeenCalledWith(superLinea(0));
    expect(onDelete).toHaveBeenCalledWith(superLinea(0));
  });

  it("deshabilita editar y eliminar en SuperLíneas de sistema", () => {
    render(<DatosCards superLinea={superLinea(1)} onEditar={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTitle("Las SuperLíneas de sistema no se pueden editar")).toBeDisabled();
    expect(screen.getByTitle("Las SuperLíneas de sistema no se pueden eliminar")).toBeDisabled();
  });
});
