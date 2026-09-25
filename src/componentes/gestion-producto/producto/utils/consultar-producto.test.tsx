import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultarProductos from "./consultar-producto";
import ProductoService from "../services/producto-service";
import { SidebarFiltros } from "../../../sidebarFiltros";
import { FiltrosProvider } from "../../../../context/filtros-contesxt";
import { CatalogosProvider } from "../../../../context/catalogos-context";
import { ConfiguracionSistemaProvider } from "../../../sistema/ConfiguracionSistemaContext";

// CR-004 / US-005: un único campo de búsqueda envía denominacion a GET /producto/search-by;
// el backend lo busca por producto, línea o superlínea.

vi.mock("../services/producto-service", () => ({
  default: {
    obtener: vi.fn(),
    obtenerRapido: vi.fn(),
    obtenerTotales: vi.fn(),
  },
}));

const servicio = vi.mocked(ProductoService);

const producto = (id: number, denominacion: string) => ({
  id,
  denominacion,
  codigoProveedor: `P-${id}`,
  codigoReferencia: "",
  stock: 1,
  precio: 100,
  precioOferta: 0,
  poseeAlternativos: false,
  esAlternativo: false,
  sistema: 0,
  precioConIva: 121,
  observacion: "",
  proveedor: "",
  precioOcasionalConIva: 0,
  precioMayoristaConIva: 0,
  precioClienteConIva: 0,
  precioOfertaConIva: 0,
});

const renderPantalla = () =>
  render(
    <ConfiguracionSistemaProvider>
      <CatalogosProvider>
        <FiltrosProvider>
          <SidebarFiltros isOpen onClose={vi.fn()} onOpen={vi.fn()} />
          <ConsultarProductos />
        </FiltrosProvider>
      </CatalogosProvider>
    </ConfiguracionSistemaProvider>,
  );

const campoBusqueda = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Denominación/ }));
  return screen.findByPlaceholderText("Buscar por producto, línea o superlínea...");
};

const ultimaConsulta = () => servicio.obtener.mock.calls[servicio.obtener.mock.calls.length - 1][0];

describe("ConsultarProductos - búsqueda (CR-004)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    servicio.obtener.mockResolvedValue({ data: [producto(1, "leche entera")], total: 1 } as never);
  });

  // ag-grid anima las filas con un window.setTimeout de 400 ms que después encadena otro:
  // se deja terminar antes de que Vitest cierre jsdom (si no, falla de forma intermitente
  // con "window is not defined")
  afterAll(() => new Promise((resolve) => setTimeout(resolve, 600)));

  it("usa un único campo de búsqueda con el placeholder de producto, línea o superlínea", async () => {
    renderPantalla();

    expect(await campoBusqueda()).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/superl[ií]nea/i)).toHaveAttribute("name", "denominacion");
  });

  it("envía el texto como denominacion, sin parámetros de línea ni superlínea", async () => {
    const user = userEvent.setup();
    renderPantalla();
    await waitFor(() => expect(servicio.obtener).toHaveBeenCalled());

    await user.type(await campoBusqueda(), "lec");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ denominacion: "lec", skip: 0 }));
    const consulta = ultimaConsulta();
    expect(consulta).not.toHaveProperty("linea");
    expect(consulta).not.toHaveProperty("superLinea");
    expect(consulta).not.toHaveProperty("superLineaId");
    expect(await screen.findAllByText("leche entera")).not.toHaveLength(0);
  });

  it("conserva los filtros existentes en la consulta", async () => {
    const user = userEvent.setup();
    renderPantalla();
    await waitFor(() => expect(servicio.obtener).toHaveBeenCalled());

    await user.type(await campoBusqueda(), "alim");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ denominacion: "alim" }));
    expect(Object.keys(ultimaConsulta())).toEqual(
      expect.arrayContaining([
        "codigoProveedor",
        "codigoReferencia",
        "codProveedorExacto",
        "codReferenciaExacto",
        "lineaId",
        "marcaId",
        "proveedorId",
        "conStock",
        "take",
      ]),
    );
  });

  it("una búsqueda nueva desde otra página arranca en la primera página", async () => {
    const user = userEvent.setup();
    servicio.obtener.mockResolvedValue({ data: [producto(1, "leche entera")], total: 50 } as never);
    renderPantalla();

    await user.click(await screen.findByRole("button", { name: "3" }));
    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ skip: 20 }));

    await user.type(await campoBusqueda(), "lec");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ denominacion: "lec" }));
    const consultasLec = servicio.obtener.mock.calls.map(([f]) => f).filter((f) => f.denominacion === "lec");
    expect(consultasLec.every((f) => f.skip === 0)).toBe(true);
  });

  it("sin coincidencias muestra el listado vacío", async () => {
    const user = userEvent.setup();
    renderPantalla();
    await waitFor(() => expect(servicio.obtener).toHaveBeenCalled());
    servicio.obtener.mockResolvedValue({ data: [], total: 0 } as never);

    await user.type(await campoBusqueda(), "zzz");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ denominacion: "zzz" }));
    await waitFor(() => expect(screen.queryByText("leche entera")).not.toBeInTheDocument());
  });
});
