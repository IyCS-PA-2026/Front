import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HistorialPreciosModal from "./historial-precios-modal";
import ProductoService from "../services/producto-service";

// CR-007: el modal solo consulta y muestra; los registros los genera el backend

vi.mock("../services/producto-service", () => ({
  default: {
    obtenerHistorialPrecios: vi.fn(),
  },
}));

const service = vi.mocked(ProductoService);

describe("HistorialPreciosModal (CR-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta el historial del producto y muestra cada cambio con su motivo", async () => {
    service.obtenerHistorialPrecios.mockResolvedValue([
      {
        id: 2,
        productoId: 10,
        precioAnterior: 1200,
        precioNuevo: 1300,
        fecha: "2026-09-25T15:00:00.000Z",
        motivo: "Actualización masiva por porcentaje: margen 30% (global)",
      },
      {
        id: 1,
        productoId: 10,
        precioAnterior: null,
        precioNuevo: 1200,
        fecha: "2026-09-20T10:00:00.000Z",
        motivo: "Alta de producto",
      },
    ]);

    render(<HistorialPreciosModal productoId={10} denominacion="ACEITE GIRASOL" onClose={vi.fn()} />);

    expect(service.obtenerHistorialPrecios).toHaveBeenCalledWith(10);
    expect(screen.getByText("ACEITE GIRASOL")).toBeInTheDocument();

    const filas = await screen.findAllByRole("row");
    // encabezado + 2 registros, en el orden que responde el backend
    expect(filas).toHaveLength(3);

    const masiva = within(filas[1]);
    expect(masiva.getByText("$ 1.200,00")).toBeInTheDocument();
    expect(masiva.getByText("$ 1.300,00")).toBeInTheDocument();
    expect(masiva.getByLabelText("Aumento")).toBeInTheDocument();
    expect(masiva.getByText("Actualización masiva por porcentaje: margen 30% (global)")).toBeInTheDocument();

    // El alta no tiene precio anterior
    const alta = within(filas[2]);
    expect(alta.getByText("—")).toBeInTheDocument();
    expect(alta.getByText("Alta de producto")).toBeInTheDocument();
  });

  it("marca las bajas de precio", async () => {
    service.obtenerHistorialPrecios.mockResolvedValue([
      { id: 3, productoId: 10, precioAnterior: 500, precioNuevo: 450, fecha: "2026-09-25T15:00:00.000Z", motivo: "Edición de producto" },
    ]);

    render(<HistorialPreciosModal productoId={10} onClose={vi.fn()} />);

    expect(await screen.findByLabelText("Baja")).toBeInTheDocument();
    expect(screen.queryByLabelText("Aumento")).not.toBeInTheDocument();
  });

  it("sin cambios registrados muestra un mensaje en lugar de la tabla", async () => {
    service.obtenerHistorialPrecios.mockResolvedValue([]);

    render(<HistorialPreciosModal productoId={10} onClose={vi.fn()} />);

    expect(await screen.findByText("Este producto no registra cambios de precio.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("si el backend rechaza la consulta muestra su mensaje", async () => {
    service.obtenerHistorialPrecios.mockRejectedValue({
      response: { data: { message: "Entidad no encontrada., no existe o fue eliminada" } },
    });

    render(<HistorialPreciosModal productoId={999} onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Entidad no encontrada., no existe o fue eliminada");
  });

  it("cerrar invoca onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    service.obtenerHistorialPrecios.mockResolvedValue([]);

    render(<HistorialPreciosModal productoId={10} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
