import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { SuperLineaModalTipo } from "../hooks/use-superlinea-modal";
import RegistrarActualizarSuperLineaForm from "../utils/registrar-actualizar-superlinea";

interface Props {
  open: boolean;
  tipo: SuperLineaModalTipo;
  superLinea?: SuperLinea | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function SuperLineaModal({ open, tipo, superLinea, onClose, onSuccess }: Props) {
  if (!open || !tipo) return null;

  return (
    <>
      {tipo === "alta" && <RegistrarActualizarSuperLineaForm onClose={onClose} onSuccess={onSuccess} />}

      {tipo === "edicion" && superLinea && (
        <RegistrarActualizarSuperLineaForm superLinea={superLinea} onClose={onClose} onSuccess={onSuccess} />
      )}
    </>
  );
}
