import { Pencil, Trash } from "lucide-react";
import { TablaAGGrid, type Column } from "../../../herramientas/tablas/tabla-flexible-ag-grid";
import {
  denominacionNotScrollColumnProps,
  observacionesColumnProps,
} from "../../../herramientas/tablas/formateo-columnas-documentos";
import type { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import { esSuperLineaSistema } from "../interfaces/interfaces-validaciones-superlinea";

interface Props {
  superLineas: SuperLinea[];
  onEditar: (superLinea: SuperLinea) => void;
  onDelete: (superLinea: SuperLinea) => void;
}

export function DatosTabla({ superLineas, onEditar, onDelete }: Props) {
  const columns: Column<SuperLinea>[] = [
    {
      header: "Denominación",
      accessor: "denominacion",
      ...denominacionNotScrollColumnProps,
      formatFunction: ({ value, row }) => (
        <div className="flex flex-col">
          <span>{value}</span>
          {row.deletedAt && (
            <span className="text-xs text-red-500 font-medium">Eliminada el {formatFechaHora(row.deletedAt)}</span>
          )}
        </div>
      ),
    },
    {
      header: "Observación",
      accessor: "observacion",
      ...observacionesColumnProps,
    },
  ];

  return (
    <TablaAGGrid
      columns={columns}
      data={superLineas}
      getRowClass={(params: any) =>
        params.data?.deletedAt ? "opacity-50 bg-gray-100 dark:bg-slate-800 pointer-events-none" : ""
      }
      actions={(row: SuperLinea) => {
        if (row.deletedAt) return <div className="w-full" />;

        const sistema = esSuperLineaSistema(row);

        return (
          <div className="flex justify-end gap-1">
            <ActionButton
              variant="edit"
              title={sistema ? "Las SuperLíneas de sistema no se pueden editar" : "Editar"}
              disabled={sistema}
              onClick={() => onEditar(row)}
            >
              <Pencil size={16} />
            </ActionButton>
            <ActionButton
              variant="delete"
              title={sistema ? "Las SuperLíneas de sistema no se pueden eliminar" : "Eliminar"}
              disabled={sistema}
              onClick={() => onDelete(row)}
            >
              <Trash size={16} />
            </ActionButton>
          </div>
        );
      }}
      actionsFlex={0.5}
      rowHeight={60}
    />
  );
}
