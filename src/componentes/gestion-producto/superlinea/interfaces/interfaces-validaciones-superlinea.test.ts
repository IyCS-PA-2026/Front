import { describe, expect, it } from "vitest";
import {
  construirPayloadAlta,
  construirPayloadModificacion,
  esSuperLineaSistema,
  schema,
  transformData,
} from "./interfaces-validaciones-superlinea";
import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

// CR-003 / US-003: validaciones y payloads de SuperLínea

const superLinea: SuperLinea = {
  id: 5,
  denominacion: "almacen",
  observacion: null,
  sistema: 0,
  deletedAt: null,
};

describe("schema de SuperLínea", () => {
  it("acepta un nombre válido", async () => {
    await expect(schema.validate({ denominacion: "Bebidas", observacion: null })).resolves.toBeTruthy();
  });

  it.each(["", "   ", undefined])("rechaza nombre vacío (%j)", async (denominacion) => {
    await expect(schema.validate({ denominacion })).rejects.toThrow("La denominación es obligatoria.");
  });

  it("rechaza más de 255 caracteres", async () => {
    await expect(schema.validate({ denominacion: "a".repeat(256) })).rejects.toThrow(
      "La denominación no puede superar los 255 caracteres.",
    );
  });
});

describe("payloads de SuperLínea", () => {
  it("alta envía usuarioCreatedId", () => {
    expect(construirPayloadAlta({ denominacion: "bebidas", observacion: "x" }, 7)).toEqual({
      denominacion: "bebidas",
      observacion: "x",
      usuarioCreatedId: 7,
    });
  });

  it("modificación envía usuarioUpdatedId", () => {
    expect(construirPayloadModificacion({ denominacion: "bebidas" }, 7)).toEqual({
      denominacion: "bebidas",
      observacion: null,
      usuarioUpdatedId: 7,
    });
  });

  it("transformData carga los valores actuales", () => {
    expect(transformData(superLinea)).toEqual({ denominacion: "almacen", observacion: null });
  });

  it("detecta SuperLíneas de sistema", () => {
    expect(esSuperLineaSistema({ sistema: 1 })).toBe(true);
    expect(esSuperLineaSistema({ sistema: 0 })).toBe(false);
  });
});
