import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegistrarActualizarLineaForm from "./registrar-actualizar-linea";
import LineaService from "../services/linea-service";
import SuperLineaService from "../../superlinea/services/superlinea-service";
import { Linea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";

// CR-003 / US-004: asignar, cambiar y quitar la SuperLínea de una Línea

vi.mock("../services/linea-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../superlinea/services/superlinea-service", () => ({
  default: {
    obtenerActivas: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../utils/auth")>()),
  getUsuarioId: () => 7,
}));

const lineaService = vi.mocked(LineaService);
const superLineaService = vi.mocked(SuperLineaService);

const lineaExistente = (superLinea: Linea["superLinea"]) =>
  ({
    id: 10,
    denominacion: "gaseosas",
    observacion: null,
    stockMinimo: 0,
    utilizaStockMinimo: false,
    sistema: 0,
    superLinea,
  }) as Linea;

const renderFormulario = (linea?: Linea) => {
  const onSuccess = vi.fn();
  render(<RegistrarActualizarLineaForm linea={linea} onClose={vi.fn()} onSuccess={onSuccess} />);
  return { onSuccess };
};

const selectorSuperLinea = () => screen.getByLabelText("SuperLínea");

const elegirSuperLinea = async (texto: string) => {
  const combo = selectorSuperLinea();
  fireEvent.focus(combo);
  fireEvent.keyDown(combo, { key: "ArrowDown" });
  fireEvent.click(await screen.findByText(texto));
};

describe("RegistrarActualizarLineaForm - SuperLínea (CR-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    lineaService.nuevo.mockResolvedValue({ mensaje: "Línea registrada" } as never);
    lineaService.actualizar.mockResolvedValue({ mensaje: "Línea actualizada" } as never);
    superLineaService.obtenerActivas.mockResolvedValue([
      { id: 5, denominacion: "bebidas", observacion: null, sistema: 0, deletedAt: null },
      { id: 6, denominacion: "almacen", observacion: null, sistema: 0, deletedAt: null },
    ]);
  });

  it("carga las SuperLíneas activas y ofrece 'Sin SuperLínea'", async () => {
    renderFormulario();

    await waitFor(() => expect(superLineaService.obtenerActivas).toHaveBeenCalled());
    expect(screen.getByText("Sin SuperLínea")).toBeInTheDocument();
  });

  it("asigna una SuperLínea al registrar una Línea", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderFormulario();

    await user.type(screen.getByLabelText("Denominación"), "Gaseosas");
    await elegirSuperLinea("bebidas");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(lineaService.nuevo).toHaveBeenCalledTimes(1));
    expect(lineaService.nuevo.mock.calls[0][0]).toMatchObject({ superLineaId: 5, usuarioCreatedId: 7 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("Línea registrada"));
  });

  it("registra una Línea sin SuperLínea enviando null", async () => {
    const user = userEvent.setup();
    renderFormulario();

    await user.type(screen.getByLabelText("Denominación"), "Gaseosas");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(lineaService.nuevo).toHaveBeenCalledTimes(1));
    expect(lineaService.nuevo.mock.calls[0][0]).toMatchObject({ superLineaId: null });
  });

  it("al editar muestra la SuperLínea actual y permite cambiarla", async () => {
    const user = userEvent.setup();
    renderFormulario(lineaExistente({ id: 5, denominacion: "bebidas" }));

    expect(await screen.findByText("bebidas")).toBeInTheDocument();
    await elegirSuperLinea("almacen");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(lineaService.actualizar).toHaveBeenCalledTimes(1));
    const [id, payload] = lineaService.actualizar.mock.calls[0];
    expect(id).toBe(10);
    expect(payload).toMatchObject({ superLineaId: 6, usuarioUpdatedId: 7 });
  });

  it("al editar permite quitar la SuperLínea enviando null", async () => {
    const user = userEvent.setup();
    renderFormulario(lineaExistente({ id: 5, denominacion: "bebidas" }));

    expect(await screen.findByText("bebidas")).toBeInTheDocument();
    await elegirSuperLinea("Sin SuperLínea");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(lineaService.actualizar).toHaveBeenCalledTimes(1));
    expect(lineaService.actualizar.mock.calls[0][1]).toMatchObject({ superLineaId: null });
  });

  it("una Línea sin SuperLínea (id 0) se edita con 'Sin SuperLínea' seleccionado", async () => {
    renderFormulario(lineaExistente({ id: 0, denominacion: "" }));

    await waitFor(() => expect(superLineaService.obtenerActivas).toHaveBeenCalled());
    expect(screen.getByText("Sin SuperLínea")).toBeInTheDocument();
  });
});
