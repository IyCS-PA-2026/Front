import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActualizacionMasivaPrecios from "./actualizacion-masiva-precios";
import ActualizacionMasivaPreciosService from "./actualizacion-masiva-precios-service";

// CR-006: la pantalla solo envía la solicitud y muestra la respuesta del backend

vi.mock("./actualizacion-masiva-precios-service", () => ({
  default: {
    actualizar: vi.fn(),
    obtenerLineas: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../utils/auth")>()),
  getUsuarioId: () => 7,
}));

const service = vi.mocked(ActualizacionMasivaPreciosService);

describe("ActualizacionMasivaPrecios (CR-006)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.obtenerLineas.mockResolvedValue([
      { id: 1, denominacion: "ACEITES" },
      { id: 2, denominacion: "HARINAS" },
    ]);
  });

  it("el selector de línea solo aparece con alcance por línea", async () => {
    const user = userEvent.setup();
    render(<ActualizacionMasivaPrecios />);

    expect(screen.queryByLabelText("Línea")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Por línea"));
    expect(await screen.findByRole("option", { name: "ACEITES" })).toBeInTheDocument();
  });

  it("global por porcentaje: envía la solicitud y muestra la cantidad actualizada", async () => {
    const user = userEvent.setup();
    service.actualizar.mockResolvedValue({ productosActualizados: 12 });
    render(<ActualizacionMasivaPrecios />);

    await user.type(screen.getByLabelText("Valor"), "10");
    await user.click(screen.getByRole("button", { name: "Confirmar actualización" }));

    expect(service.actualizar).toHaveBeenCalledWith({
      alcance: "global",
      modalidad: "porcentaje",
      valor: 10,
      usuarioId: 7,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Se actualizaron 12 productos.");
  });

  it("por línea y monto: envía la línea elegida", async () => {
    const user = userEvent.setup();
    service.actualizar.mockResolvedValue({ productosActualizados: 3 });
    render(<ActualizacionMasivaPrecios />);

    await user.click(screen.getByLabelText("Por línea"));
    const boton = screen.getByRole("button", { name: "Confirmar actualización" });
    await user.type(screen.getByLabelText("Valor"), "-5");
    expect(boton).toBeDisabled();

    await screen.findByRole("option", { name: "HARINAS" });
    await user.selectOptions(screen.getByLabelText("Línea"), "2");
    await user.click(screen.getByLabelText("Monto fijo sobre el costo ($)"));
    await user.click(boton);

    expect(service.actualizar).toHaveBeenCalledWith({
      alcance: "linea",
      lineaId: 2,
      modalidad: "monto",
      valor: -5,
      usuarioId: 7,
    });
  });

  it("rechazo del backend: muestra el motivo devuelto", async () => {
    const user = userEvent.setup();
    service.actualizar.mockRejectedValue({
      response: { data: { message: "Actualización cancelada, no se modificó ningún producto." } },
    });
    render(<ActualizacionMasivaPrecios />);

    await user.type(screen.getByLabelText("Valor"), "-50");
    await user.click(screen.getByRole("button", { name: "Confirmar actualización" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Actualización cancelada, no se modificó ningún producto.",
      ),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
