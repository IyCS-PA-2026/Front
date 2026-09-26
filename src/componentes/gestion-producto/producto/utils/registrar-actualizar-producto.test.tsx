import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegistrarActualizarProductoForm from "./registrar-actualizar-producto";
import ProductoService from "../services/producto-service";
import { ConfiguracionSistemaProvider } from "../../../sistema/ConfiguracionSistemaContext";
import { Producto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";

// CR-002: el formulario de producto envía presentacion { cantidad, unidadMedida }

vi.mock("../services/producto-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
    obtenerTotales: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../utils/auth")>()),
  getUsuarioId: () => 7,
}));

const servicio = vi.mocked(ProductoService);

const productoExistente = {
  id: 10,
  denominacion: "yerba mate",
  observacion: null,
  codigoProveedor: "YM-1",
  codigoReferencia: "",
  codigoBarra: null,
  stock: 5,
  costo: 100,
  precio: 150,
  porcentaje: 50,
  alicuotaIva: 21,
  sistema: 0,
  linea: { id: 1, denominacion: "Almacén" },
  marca: { id: 2, denominacion: "Marca Test" },
  stockMinimo: 0,
  utilizaStockMinimo: false,
  presentacion: { cantidad: 0.5, unidadMedida: "Kg" },
} as Producto;

const renderFormulario = (producto?: Producto) => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfiguracionSistemaProvider>
      <RegistrarActualizarProductoForm producto={producto} onClose={onClose} onSuccess={onSuccess} />
    </ConfiguracionSistemaProvider>,
  );
  return { onSuccess, onClose };
};

const inputPorNombre = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

const grupoPresentacion = () => screen.getByRole("group", { name: "Presentación" });
const inputUnidadMedida = () => within(grupoPresentacion()).getByPlaceholderText("Ingresa la unidad");

// Tras el Enter en la búsqueda, el formulario mueve el foco al select con un setTimeout de 300 ms.
// Se espera ese foco antes de seguir para que el timer no interfiera con el siguiente tipeo.
const seleccionarOpcion = async (indiceCombo: number, texto: string) => {
  const combo = screen.getAllByRole("combobox")[indiceCombo];
  await waitFor(() => expect(combo).toHaveFocus(), { timeout: 2000 });
  fireEvent.focus(combo);
  fireEvent.keyDown(combo, { key: "ArrowDown" });
  fireEvent.click(await screen.findByText(texto));
};

describe("RegistrarActualizarProductoForm - presentación (CR-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    servicio.nuevo.mockResolvedValue({ mensaje: "Producto registrado" } as never);
    servicio.actualizar.mockResolvedValue({ mensaje: "Producto actualizado" } as never);
    servicio.obtenerTotales.mockImplementation(async (_filtros: unknown, entidades: string) =>
      entidades === "lineas"
        ? { data: [{ id: 1, denominacion: "Almacén" }] }
        : { data: [{ id: 2, denominacion: "Marca Test" }] },
    );
  });

  it("muestra los campos de presentación y ya no muestra los de pack", () => {
    renderFormulario();

    expect(grupoPresentacion()).toBeInTheDocument();
    expect(screen.getByText(/se generará al guardar/i)).toBeInTheDocument();
    expect(inputUnidadMedida()).toBeInTheDocument();
    expect(grupoPresentacion()).toContainElement(inputPorNombre("presentacionCantidad"));
    expect(screen.queryByText("Cantidad Pack")).not.toBeInTheDocument();
    expect(inputPorNombre("cantidadPorPack")).toBeNull();
  });

  it("en edición no muestra la ayuda de denominación automática", () => {
    renderFormulario(productoExistente);

    expect(screen.queryByText(/se generará al guardar/i)).not.toBeInTheDocument();
  });

  it("no registra si falta la presentación y muestra los errores", async () => {
    const user = userEvent.setup();
    renderFormulario();

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("La cantidad de la presentación es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("La unidad de medida es obligatoria.")).toBeInTheDocument();
    expect(servicio.nuevo).not.toHaveBeenCalled();
  });

  it("no acepta una unidad de medida con solo espacios", async () => {
    const user = userEvent.setup();
    renderFormulario();

    await user.type(inputUnidadMedida(), "   ");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("La unidad de medida es obligatoria.")).toBeInTheDocument();
    expect(servicio.nuevo).not.toHaveBeenCalled();
  });

  it("registra un producto enviando la presentación completa con cantidad decimal", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderFormulario();

    await user.type(screen.getByLabelText("Denominación"), "Yerba Mate");
    fireEvent.change(inputPorNombre("costo"), { target: { value: "100" } });
    fireEvent.change(inputPorNombre("presentacionCantidad"), { target: { value: "0,5" } });
    await user.type(inputUnidadMedida(), "Kg");

    const [denominacionLinea, denominacionMarca] = screen.getAllByPlaceholderText("Denominación");
    await user.type(denominacionLinea, "alm{Enter}");
    await waitFor(() => expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: "alm" }, "lineas"));
    await seleccionarOpcion(1, "Almacén");
    await user.type(denominacionMarca, "mar{Enter}");
    await waitFor(() => expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: "mar" }, "marcas"));
    await seleccionarOpcion(2, "Marca Test");

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(servicio.nuevo).toHaveBeenCalledTimes(1));
    const payload = servicio.nuevo.mock.calls[0][0];
    expect(payload).toMatchObject({
      lineaId: 1,
      marcaId: 2,
      usuarioCreatedId: 7,
      presentacion: { cantidad: 0.5, unidadMedida: "Kg" },
    });
    expect(payload).not.toHaveProperty("utilizaPack");
    expect(payload).not.toHaveProperty("cantidadPorPack");
    expect(payload).not.toHaveProperty("presentacionCantidad");
    expect(payload).not.toHaveProperty("presentacionUnidadMedida");
    // CR-006: el precio lo calcula el backend
    expect(payload).not.toHaveProperty("precio");
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("Producto registrado"));
  });

  it("al abrirse lista todas las líneas y marcas sin tener que buscar", async () => {
    renderFormulario();

    await waitFor(() => {
      expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: " " }, "lineas");
      expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: " " }, "marcas");
    });

    const [comboLinea, comboMarca] = screen.getAllByRole("combobox").slice(1, 3);
    fireEvent.keyDown(comboLinea, { key: "ArrowDown" });
    expect(await screen.findByText("Almacén")).toBeInTheDocument();
    fireEvent.keyDown(comboMarca, { key: "ArrowDown" });
    expect(await screen.findByText("Marca Test")).toBeInTheDocument();
  });

  it("el precio no se carga: en el alta se informa que se calcula y al editar se muestra el del backend", () => {
    const { unmount } = render(
      <ConfiguracionSistemaProvider>
        <RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />
      </ConfiguracionSistemaProvider>,
    );
    expect(inputPorNombre("precio")).toBeNull();
    expect(screen.getByLabelText("Precio calculado")).toHaveTextContent("Se calcula al guardar");
    unmount();

    renderFormulario(productoExistente);
    expect(screen.getByLabelText("Precio calculado")).toHaveTextContent("150");
  it("registra un producto sin denominación manual para que el backend la genere", async () => {
    const user = userEvent.setup();
    renderFormulario();

    fireEvent.change(inputPorNombre("costo"), { target: { value: "100" } });
    fireEvent.change(inputPorNombre("precio"), { target: { value: "150" } });
    fireEvent.change(inputPorNombre("presentacionCantidad"), { target: { value: "1" } });
    await user.type(inputUnidadMedida(), "pack x6");

    const [denominacionLinea, denominacionMarca] = screen.getAllByPlaceholderText("Denominación");
    await user.type(denominacionLinea, "alm{Enter}");
    await waitFor(() => expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: "alm" }, "lineas"));
    await seleccionarOpcion(1, "Almacén");
    await user.type(denominacionMarca, "mar{Enter}");
    await waitFor(() => expect(servicio.obtenerTotales).toHaveBeenCalledWith({ denominacion: "mar" }, "marcas"));
    await seleccionarOpcion(2, "Marca Test");

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(servicio.nuevo).toHaveBeenCalledTimes(1));
    const payload = servicio.nuevo.mock.calls[0][0];
    expect(payload.denominacion).toBeUndefined();
    expect(payload.presentacion).toEqual({ cantidad: 1, unidadMedida: "pack x6" });
  });

  it("al editar carga la presentación y la envía completa al actualizar", async () => {
    const user = userEvent.setup();
    renderFormulario(productoExistente);

    const unidad = inputUnidadMedida();
    expect(inputPorNombre("presentacionCantidad")).toHaveValue("0,5");
    expect(unidad).toHaveValue("Kg");

    fireEvent.change(inputPorNombre("presentacionCantidad"), { target: { value: "0,75" } });
    await user.clear(unidad);
    await user.type(unidad, "mL");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(servicio.actualizar).toHaveBeenCalledTimes(1));
    const [id, payload] = servicio.actualizar.mock.calls[0];
    expect(id).toBe(10);
    expect(payload).toMatchObject({
      usuarioUpdatedId: 7,
      presentacion: { cantidad: 0.75, unidadMedida: "mL" },
    });
    expect(payload).not.toHaveProperty("utilizaPack");
    expect(payload).not.toHaveProperty("cantidadPorPack");
  });
});
