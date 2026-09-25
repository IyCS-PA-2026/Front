import * as yup from "yup";
import {
  ActualizarSuperLineaPayload,
  CrearSuperLineaPayload,
  SuperLinea,
} from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

//===================== schema de validacion ============================================//

export const schema = yup.object().shape({
  denominacion: yup
    .string()
    .trim()
    .lowercase()
    .required("La denominación es obligatoria.")
    .max(255, "La denominación no puede superar los 255 caracteres.")
    .matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/, "Solo se permiten letras, números y espacios."),

  observacion: yup.string().nullable().optional(),
});

export type FormValues = yup.InferType<typeof schema>;

//===================== transform data ============================================//

export const transformData = (superLinea: SuperLinea): FormValues => {
  return {
    denominacion: superLinea.denominacion,
    observacion: superLinea.observacion ?? null,
  };
};

//===================== payloads ============================================//

export const construirPayloadAlta = (formData: FormValues, usuarioId: number): CrearSuperLineaPayload => ({
  denominacion: formData.denominacion,
  observacion: formData.observacion ?? null,
  usuarioCreatedId: usuarioId,
});

export const construirPayloadModificacion = (
  formData: FormValues,
  usuarioId: number,
): ActualizarSuperLineaPayload => ({
  denominacion: formData.denominacion,
  observacion: formData.observacion ?? null,
  usuarioUpdatedId: usuarioId,
});

// El backend no permite editar ni eliminar las SuperLíneas de sistema.
export const esSuperLineaSistema = (superLinea: Pick<SuperLinea, "sistema">) => superLinea.sistema === 1;
