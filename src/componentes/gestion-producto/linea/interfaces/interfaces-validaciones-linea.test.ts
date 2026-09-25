import { describe, expect, it } from "vitest";
import {
  construirPayloadLinea,
  denominacionSuperLinea,
  obtenerSuperLineaId,
  transformData,
} from "./interfaces-validaciones-linea";
import { Linea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";

// CR-003 / US-004: SuperLínea en Línea

const linea = (superLinea: Linea["superLinea"]) =>
  ({
    id: 1,
    denominacion: "gaseosas",
    observacion: null,
    stockMinimo: 0,
    utilizaStockMinimo: false,
    sistema: 0,
    superLinea,
  }) as Linea;

describe("SuperLínea de una Línea", () => {
  it("id 0 del backend significa sin SuperLínea", () => {
    expect(obtenerSuperLineaId(linea({ id: 0, denominacion: "" }))).toBeNull();
    expect(denominacionSuperLinea(linea({ id: 0, denominacion: "" }))).toBe("—");
  });

  it("tolera superLinea ausente", () => {
    expect(obtenerSuperLineaId(linea(undefined))).toBeNull();
    expect(denominacionSuperLinea(linea(null))).toBe("—");
  });

  it("muestra la SuperLínea asociada", () => {
    expect(obtenerSuperLineaId(linea({ id: 5, denominacion: "bebidas" }))).toBe(5);
    expect(denominacionSuperLinea(linea({ id: 5, denominacion: "bebidas" }))).toBe("bebidas");
  });

  it("transformData precarga superLineaId", () => {
    expect(transformData(linea({ id: 5, denominacion: "bebidas" })).superLineaId).toBe(5);
    expect(transformData(linea({ id: 0, denominacion: "" })).superLineaId).toBeNull();
  });
});

describe("construirPayloadLinea", () => {
  const form = { denominacion: "gaseosas", observacion: null, stockMinimo: 0, utilizaStockMinimo: false };

  it("asigna la SuperLínea en el alta", () => {
    expect(construirPayloadLinea({ ...form, superLineaId: 5 }, 7, false)).toEqual({
      ...form,
      superLineaId: 5,
      usuarioCreatedId: 7,
    });
  });

  it("envía superLineaId null para desasociar en la modificación", () => {
    expect(construirPayloadLinea({ ...form, superLineaId: null }, 7, true)).toEqual({
      ...form,
      superLineaId: null,
      usuarioUpdatedId: 7,
    });
  });

  it("envía null si no se eligió SuperLínea", () => {
    expect(construirPayloadLinea(form, 7, false).superLineaId).toBeNull();
  });
});
