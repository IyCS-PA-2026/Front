import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegistrarActualizarSuperLineaForm from "./registrar-actualizar-superlinea";
import SuperLineaService from "../services/superlinea-service";
import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

// CR-003 / US-003: alta y modificación de SuperLínea

vi.mock("../services/superlinea-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../utils/auth")>()),
  getUsuarioId: () => 7,
}));

const servicio = vi.mocked(SuperLineaService);

const superLineaExistente: SuperLinea = {
  id: 5,
  denominacion: "bebidas",
  observacion: null,
  sistema: 0,
  deletedAt: null,
};

const renderFormulario = (superLinea?: SuperLinea) => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(<RegistrarActualizarSuperLineaForm superLinea={superLinea} onClose={onClose} onSuccess={onSuccess} />);
  return { onSuccess, onClose };
};

describe("RegistrarActualizarSuperLineaForm (CR-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    servicio.nuevo.mockResolvedValue({ mensaje: "SuperLínea registrada" } as never);
    servicio.actualizar.mockResolvedValue({ mensaje: "SuperLínea actualizada" } as never);
  });

  it("no permite crear una SuperLínea sin nombre", async () => {
    const user = userEvent.setup();
    renderFormulario();

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("La denominación es obligatoria.")).toBeInTheDocument();
    expect(servicio.nuevo).not.toHaveBeenCalled();
  });

  it("crea una SuperLínea con un nombre válido", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderFormulario();

    await user.type(screen.getByLabelText("Denominación"), "Bebidas");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(servicio.nuevo).toHaveBeenCalledTimes(1));
    expect(servicio.nuevo.mock.calls[0][0]).toMatchObject({ denominacion: "bebidas", usuarioCreatedId: 7 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("SuperLínea registrada"));
  });

  it("modifica el nombre de una SuperLínea", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderFormulario(superLineaExistente);

    const input = screen.getByLabelText("Denominación");
    expect(input).toHaveValue("bebidas");
    await user.clear(input);
    await user.type(input, "Bebidas sin alcohol");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(servicio.actualizar).toHaveBeenCalledTimes(1));
    const [id, payload] = servicio.actualizar.mock.calls[0];
    expect(id).toBe(5);
    expect(payload).toMatchObject({ denominacion: "bebidas sin alcohol", usuarioUpdatedId: 7 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("SuperLínea actualizada"));
  });

  it("muestra el error devuelto por el backend", async () => {
    const user = userEvent.setup();
    servicio.nuevo.mockRejectedValue({ response: { data: { message: "Ya existe una SuperLínea con ese nombre" } } });
    const { onSuccess } = renderFormulario();

    await user.type(screen.getByLabelText("Denominación"), "Bebidas");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("Ya existe una SuperLínea con ese nombre")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
