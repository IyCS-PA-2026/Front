// CR-003: contrato de GET /super-linea/search-by
export interface SuperLinea {
  id: number;
  denominacion: string;
  observacion: string | null;
  sistema: number;
  deletedAt: string | null;
}

export interface DtoConsultarSuperLinea {
  data: SuperLinea[];
  total: number;
}

// POST /super-linea
export interface CrearSuperLineaPayload {
  denominacion: string;
  observacion?: string | null;
  usuarioCreatedId: number;
}

// PUT /super-linea/:id
export interface ActualizarSuperLineaPayload {
  denominacion?: string;
  observacion?: string | null;
  usuarioCreatedId?: number;
  usuarioUpdatedId: number;
}

// Referencia embebida en la respuesta de Línea. Sin SuperLínea el backend devuelve { id: 0, denominacion: "" }.
export interface SelectSuperLinea {
  id: number;
  denominacion: string;
}
