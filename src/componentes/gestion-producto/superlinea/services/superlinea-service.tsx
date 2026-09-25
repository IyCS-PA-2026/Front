import { createCrudService } from "../../../../utils/crudFactory";
import {
  ActualizarSuperLineaPayload,
  CrearSuperLineaPayload,
  DtoConsultarSuperLinea,
  SuperLinea,
} from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

const baseService = createCrudService<CrearSuperLineaPayload | ActualizarSuperLineaPayload>("super-linea");

const TAKE_SELECTOR = 100;

const SuperLineaService = {
  ...baseService,

  // Trae todas las SuperLíneas activas (sin eliminadas) recorriendo GET /super-linea/search-by por páginas.
  obtenerActivas: async (): Promise<SuperLinea[]> => {
    const superLineas: SuperLinea[] = [];
    let total = 0;

    do {
      const response: DtoConsultarSuperLinea = await baseService.obtener({
        denominacion: "",
        skip: superLineas.length,
        take: TAKE_SELECTOR,
      });
      if (!response?.data?.length) break;
      superLineas.push(...response.data);
      total = response.total;
    } while (superLineas.length < total);

    return superLineas.filter((s) => !s.deletedAt);
  },
};

export default SuperLineaService;
