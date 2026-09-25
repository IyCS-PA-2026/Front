import { createCrudService } from "../../../../utils/crudFactory";
import { LineaPayload } from "../interfaces/interfaces-validaciones-linea";

const baseService = createCrudService<LineaPayload>("linea");

const LineaService = {
  ...baseService,
};

export default LineaService;
