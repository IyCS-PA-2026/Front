import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import SuperLineaService from "../services/superlinea-service";
import {
  construirPayloadAlta,
  construirPayloadModificacion,
  FormValues,
  schema,
  transformData,
} from "../interfaces/interfaces-validaciones-superlinea";
import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { parseApiError } from "../../../../utils/errores";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";

export function useSuperLineaForm(
  superLinea: SuperLinea | undefined,
  onClose: () => void,
  onSuccess: (mensajeAlerta: string) => void,
) {
  const usuarioId = getUsuarioId();

  // ===================== FORM =====================
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: superLinea ? transformData(superLinea) : { denominacion: "", observacion: null },
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  // ===================== SUBMIT =====================
  const onSubmit = async (formData: FormValues) => {
    try {
      let response: ResponsePost;

      if (superLinea) {
        response = await SuperLineaService.actualizar(superLinea.id, construirPayloadModificacion(formData, usuarioId));
      } else {
        response = await SuperLineaService.nuevo(construirPayloadAlta(formData, usuarioId));
      }

      onClose();
      onSuccess(
        response?.mensaje ??
          (superLinea ? "SuperLínea actualizada correctamente." : "SuperLínea registrada correctamente."),
      );
    } catch (error) {
      setError("root", {
        type: "manual",
        message: parseApiError(error),
      });
    }
  };

  return {
    methods,
    handleSubmit,
    onSubmit,
    isSubmitting,
    errors,
  };
}
