import type { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { Pencil, Trash } from "lucide-react";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import { esSuperLineaSistema } from "../interfaces/interfaces-validaciones-superlinea";

interface Props {
  superLinea: SuperLinea;
  onEditar: (superLinea: SuperLinea) => void;
  onDelete: (superLinea: SuperLinea) => void;
}

export function DatosCards({ superLinea, onEditar, onDelete }: Props) {
  const eliminada = !!superLinea.deletedAt;
  const sistema = esSuperLineaSistema(superLinea);

  return (
    <div
      className={`border rounded-md px-3 py-3 ${
        eliminada ? "border-gray-200 bg-gray-100 dark:bg-slate-800 opacity-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-2">
        <p className="text-xs text-gray-500">Denominación</p>
        <p className="text-sm font-medium text-gray-800 line-clamp-2">{superLinea.denominacion}</p>
        {eliminada && (
          <p className="text-xs text-red-500 font-medium mt-0.5">
            Eliminada el {formatFechaHora(superLinea.deletedAt)}
          </p>
        )}
      </div>

      {superLinea.observacion && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Observación</p>
          <p className="text-sm text-gray-700 line-clamp-2">{superLinea.observacion}</p>
        </div>
      )}

      {!eliminada && (
        <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
          <ActionButton
            variant="edit"
            onClick={() => onEditar(superLinea)}
            disabled={sistema}
            title={sistema ? "Las SuperLíneas de sistema no se pueden editar" : "Editar"}
          >
            <Pencil size={16} />
          </ActionButton>
          <ActionButton
            variant="delete"
            onClick={() => onDelete(superLinea)}
            disabled={sistema}
            title={sistema ? "Las SuperLíneas de sistema no se pueden eliminar" : "Eliminar"}
          >
            <Trash size={16} />
          </ActionButton>
        </div>
      )}
    </div>
  );
}
