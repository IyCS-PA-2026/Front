import ApiService from "../../../../utils/apiService";
import { SelectLinea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";

export type AlcanceActualizacion = "linea" | "global";
export type ModalidadActualizacion = "porcentaje" | "monto";

export interface ActualizacionMasivaPreciosPayload {
  alcance: AlcanceActualizacion;
  lineaId?: number;
  modalidad: ModalidadActualizacion;
  valor: number;
  usuarioId: number;
}

export interface ActualizacionMasivaPreciosResultado {
  productosActualizados: number;
}

// CR-006: el margen y el precio los calcula el backend; acá solo se envía la solicitud
const ActualizacionMasivaPreciosService = {
  actualizar: (payload: ActualizacionMasivaPreciosPayload): Promise<ActualizacionMasivaPreciosResultado> =>
    ApiService.post("/productos/actualizacion-masiva-precios", payload),

  obtenerLineas: async (): Promise<SelectLinea[]> => {
    const { data } = await ApiService.get("/producto/find-all-for-lineas/select", { denominacion: "" });
    return data;
  },
};

export default ActualizacionMasivaPreciosService;
