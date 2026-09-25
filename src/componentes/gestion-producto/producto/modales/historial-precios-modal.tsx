import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { Card } from "../../../ui/Card";
import ProductoService from "../services/producto-service";
import { HistorialPrecio } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";
import { formatFechaHora, formatPrice } from "../../../herramientas/formateo-de-campos/fucion-formateo";

interface Props {
  productoId: number;
  denominacion?: string;
  onClose: () => void;
}

// CR-007: solo lectura. Los registros los genera el backend en cada cambio de precio.
export default function HistorialPreciosModal({ productoId, denominacion, onClose }: Props) {
  const [historial, setHistorial] = useState<HistorialPrecio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    ProductoService.obtenerHistorialPrecios(productoId)
      .then((data) => vigente && setHistorial(data))
      .catch((err) => {
        if (vigente) {
          setError(err?.response?.data?.message ?? "No se pudo obtener el historial de precios.");
        }
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [productoId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <Card
        role="dialog"
        aria-labelledby="historial-precios-titulo"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            &times;
          </button>
          <div className="flex items-center gap-3 pr-12">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h2 id="historial-precios-titulo" className="text-xl font-semibold">
                Historial de precios
              </h2>
              {denominacion && <p className="text-slate-300 text-sm mt-1">{denominacion}</p>}
            </div>
          </div>
        </div>

        <div className="p-6">
          {cargando && <p className="text-sm text-slate-600">Cargando historial...</p>}

          {!cargando && error && (
            <p role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
              {error}
            </p>
          )}

          {!cargando && !error && historial.length === 0 && (
            <p className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-sm text-slate-600">
              Este producto no registra cambios de precio.
            </p>
          )}

          {!cargando && !error && historial.length > 0 && (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-right px-3 py-2">Precio anterior</th>
                    <th className="text-right px-3 py-2">Precio nuevo</th>
                    <th className="text-left px-3 py-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((registro) => (
                    <tr key={registro.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap">{formatFechaHora(registro.fecha)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {registro.precioAnterior === null ? "—" : formatPrice(registro.precioAnterior, "ARS")}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                        <span className="inline-flex items-center gap-1">
                          {registro.precioAnterior !== null && registro.precioNuevo > registro.precioAnterior && (
                            <ArrowUpRight size={14} className="text-emerald-600" aria-label="Aumento" />
                          )}
                          {registro.precioAnterior !== null && registro.precioNuevo < registro.precioAnterior && (
                            <ArrowDownRight size={14} className="text-red-600" aria-label="Baja" />
                          )}
                          {formatPrice(registro.precioNuevo, "ARS")}
                        </span>
                      </td>
                      <td className="px-3 py-2">{registro.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
