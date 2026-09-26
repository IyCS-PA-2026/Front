import { describe, expect, it } from "vitest";
import { ValidationError } from "yup";
import { AlicuotaIva } from "../../../../interfaces/generales/interfaces-generales";
import { Producto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { FormValues, construirPayloadProducto, schema, transformData } from "./interfaces-validaciones-producto";

// CR-002: presentacion { cantidad, unidadMedida } reemplaza utilizaPack / cantidadPorPack

const formValido = (overrides: Partial<FormValues> = {}): FormValues => ({
  denominacion: "yerba mate",
  lineaId: 1,
  marcaId: 2,
  costo: 100,
  alicuotaIva: AlicuotaIva.ALICUOTA_21,
  presentacionCantidad: 1,
  presentacionUnidadMedida: "Kg",
  ...overrides,
});

const validar = (values: object) => schema(false, false).validate(values, { abortEarly: false });
const validarEdicion = (values: object) => schema(false, false, true).validate(values, { abortEarly: false });

const erroresDe = async (values: object) => {
  try {
    await validar(values);
    return [];
  } catch (error) {
    return (error as ValidationError).inner.map((e) => ({ path: e.path, message: e.message }));
  }
};

describe("schema de producto - presentación (CR-002)", () => {
  it.each([
    ["ausente", undefined],
    ["vacía", ""],
    ["solo espacios", "   "],
  ])("permite denominación %s durante el alta", async (_, denominacion) => {
    await expect(validar(formValido({ denominacion }))).resolves.toBeTruthy();
  });

  it.each([
    ["ausente", undefined],
    ["vacía", ""],
    ["solo espacios", "   "],
  ])("rechaza denominación %s durante la edición", async (_, denominacion) => {
    await expect(validarEdicion(formValido({ denominacion }))).rejects.toBeTruthy();
  });

  it.each([0.5, 0.75, 1.5, 1, 12.125])("acepta cantidad %s", async (cantidad) => {
    await expect(validar(formValido({ presentacionCantidad: cantidad }))).resolves.toBeTruthy();
  });

  it.each([
    ["cero", 0],
    ["negativa", -1],
  ])("rechaza cantidad %s", async (_, cantidad) => {
    const errores = await erroresDe(formValido({ presentacionCantidad: cantidad }));
    expect(errores).toContainEqual({
      path: "presentacionCantidad",
      message: "La cantidad de la presentación debe ser mayor a 0.",
    });
  });

  it("rechaza cantidad ausente", async () => {
    const { presentacionCantidad, ...sinCantidad } = formValido();
    const errores = await erroresDe(sinCantidad);
    expect(errores).toContainEqual({
      path: "presentacionCantidad",
      message: "La cantidad de la presentación es obligatoria.",
    });
  });

  it("rechaza cantidad con más de 3 decimales", async () => {
    const errores = await erroresDe(formValido({ presentacionCantidad: 1.2345 }));
    expect(errores).toContainEqual({
      path: "presentacionCantidad",
      message: "La cantidad de la presentación admite como máximo 3 decimales.",
    });
  });

  it("rechaza cantidad que excede decimal(12,3)", async () => {
    const errores = await erroresDe(formValido({ presentacionCantidad: 1_000_000_000 }));
    expect(errores.map((e) => e.path)).toContain("presentacionCantidad");
  });

  it.each([
    ["ausente", undefined],
    ["vacía", ""],
    ["solo espacios", "   "],
  ])("rechaza unidad de medida %s", async (_, unidadMedida) => {
    const errores = await erroresDe(formValido({ presentacionUnidadMedida: unidadMedida as string }));
    expect(errores).toContainEqual({
      path: "presentacionUnidadMedida",
      message: "La unidad de medida es obligatoria.",
    });
  });

  it("conserva la unidad de medida tal como se ingresó (sin trim ni cambio de mayúsculas)", async () => {
    const resultado = await validar(formValido({ presentacionUnidadMedida: " mL Botella " }));
    expect(resultado.presentacionUnidadMedida).toBe(" mL Botella ");
  });

  it("acepta unidades de medida largas (sin límite artificial)", async () => {
    const larga = "unidad ".repeat(100);
    await expect(validar(formValido({ presentacionUnidadMedida: larga }))).resolves.toBeTruthy();
  });

  it("ya no define campos del modelo de pack", () => {
    const campos = schema(false, false).fields;
    expect(campos).not.toHaveProperty("utilizaPack");
    expect(campos).not.toHaveProperty("cantidadPorPack");
  });
});

describe("transformData (CR-002)", () => {
  it("mapea producto.presentacion a los campos del formulario", () => {
    const producto = {
      id: 10,
      denominacion: "yerba mate",
      observacion: null,
      linea: { id: 1, denominacion: "Almacén" },
      marca: { id: 2, denominacion: "Marca" },
      alicuotaIva: 21,
      sistema: 0,
      stockMinimo: 0,
      utilizaStockMinimo: false,
      presentacion: { cantidad: 0.5, unidadMedida: "Kg" },
    } as Producto;

    const form = transformData(producto);

    expect(form.presentacionCantidad).toBe(0.5);
    expect(form.presentacionUnidadMedida).toBe("Kg");
    expect(form).not.toHaveProperty("utilizaPack");
    expect(form).not.toHaveProperty("cantidadPorPack");
  });
});

describe("construirPayloadProducto (CR-002)", () => {
  it("envía la presentación completa como objeto anidado", () => {
    const payload = construirPayloadProducto(
      formValido({ presentacionCantidad: 0.75, presentacionUnidadMedida: "L" }),
    );

    expect(payload.presentacion).toEqual({ cantidad: 0.75, unidadMedida: "L" });
    expect(payload).not.toHaveProperty("presentacionCantidad");
    expect(payload).not.toHaveProperty("presentacionUnidadMedida");
    expect(payload).not.toHaveProperty("utilizaPack");
    expect(payload).not.toHaveProperty("cantidadPorPack");
    expect(payload.denominacion).toBe("yerba mate");
  });

  it("permite enviar el alta sin denominación manual", () => {
    const payload = construirPayloadProducto(formValido({ denominacion: undefined }));

    expect(payload.denominacion).toBeUndefined();
    expect(payload.presentacion).toEqual({ cantidad: 1, unidadMedida: "Kg" });
  });
});
