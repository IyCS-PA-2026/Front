import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import { SelectLinea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import { getUsuarioId } from "../../../../utils/auth";
import { parseApiError } from "../../../../utils/errores";
import ActualizacionMasivaPreciosService, {
  AlcanceActualizacion,
  ModalidadActualizacion,
} from "./actualizacion-masiva-precios-service";

type Resultado = { tipo: "exito"; productosActualizados: number } | { tipo: "error"; motivo: string };

/*
  CR-006 — Actualización masiva de precios.
  "porcentaje" reemplaza el margen y "monto" suma al costo; lo resuelve el backend.
  Esta pantalla no calcula margen ni precio: solo envía la solicitud y muestra la respuesta.
*/
export default function ActualizacionMasivaPrecios() {
  const [alcance, setAlcance] = useState<AlcanceActualizacion>("global");
  const [lineaId, setLineaId] = useState("");
  const [modalidad, setModalidad] = useState<ModalidadActualizacion>("porcentaje");
  const [valor, setValor] = useState("");
  const [lineas, setLineas] = useState<SelectLinea[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    ActualizacionMasivaPreciosService.obtenerLineas()
      .then(setLineas)
      .catch((error) => setResultado({ tipo: "error", motivo: parseApiError(error) }));
  }, []);

  const valorNumerico = Number(valor);
  const formularioCompleto =
    valor.trim() !== "" && Number.isFinite(valorNumerico) && (alcance === "global" || lineaId !== "");

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    if (!formularioCompleto || enviando) return;

    setEnviando(true);
    setResultado(null);
    try {
      const { productosActualizados } = await ActualizacionMasivaPreciosService.actualizar({
        alcance,
        ...(alcance === "linea" && { lineaId: Number(lineaId) }),
        modalidad,
        valor: valorNumerico,
        usuarioId: getUsuarioId(),
      });
      setResultado({ tipo: "exito", productosActualizados });
    } catch (error) {
      setResultado({ tipo: "error", motivo: parseApiError(error) });
    } finally {
      setEnviando(false);
    }
  };

  const radio = "flex items-center gap-2 text-sm cursor-pointer";

  return (
    <div className="p-4 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Actualización masiva de precios</CardTitle>
          <p className="text-sm text-muted-foreground">
            Por margen: el valor pasa a ser el margen de cada producto (margen 20 = 20 % de ganancia sobre el
            costo). Por monto fijo: el valor se suma al costo de cada producto y se conserva su margen. En ambos
            casos el precio lo recalcula el sistema. Si algún producto queda inválido, no se modifica ninguno.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={confirmar} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-1">Alcance</legend>
              <label className={radio}>
                <input
                  type="radio"
                  name="alcance"
                  value="linea"
                  checked={alcance === "linea"}
                  onChange={() => setAlcance("linea")}
                />
                Por línea
              </label>
              <label className={radio}>
                <input
                  type="radio"
                  name="alcance"
                  value="global"
                  checked={alcance === "global"}
                  onChange={() => setAlcance("global")}
                />
                Global (todos los productos)
              </label>
            </fieldset>

            {alcance === "linea" && (
              <div className="space-y-1">
                <label htmlFor="lineaId" className="text-sm font-medium">
                  Línea
                </label>
                <select
                  id="lineaId"
                  value={lineaId}
                  onChange={(e) => setLineaId(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccioná una línea</option>
                  {lineas.map((linea) => (
                    <option key={linea.id} value={linea.id}>
                      {linea.denominacion}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-1">Modalidad</legend>
              <label className={radio}>
                <input
                  type="radio"
                  name="modalidad"
                  value="porcentaje"
                  checked={modalidad === "porcentaje"}
                  onChange={() => setModalidad("porcentaje")}
                />
                Nuevo margen (%)
              </label>
              <label className={radio}>
                <input
                  type="radio"
                  name="modalidad"
                  value="monto"
                  checked={modalidad === "monto"}
                  onChange={() => setModalidad("monto")}
                />
                Monto fijo sobre el costo ($)
              </label>
            </fieldset>

            <div className="space-y-1">
              <label htmlFor="valor" className="text-sm font-medium">
                Valor
              </label>
              <input
                id="valor"
                type="number"
                step="any"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={modalidad === "porcentaje" ? "Ej: 20" : "Ej: 150 o -50"}
                className="w-full border border-gray-300 bg-white text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" disabled={!formularioCompleto || enviando}>
              {enviando ? "Aplicando..." : "Confirmar actualización"}
            </Button>
          </form>

          {resultado?.tipo === "exito" && (
            <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Se actualizaron {resultado.productosActualizados} productos.
            </div>
          )}
          {resultado?.tipo === "error" && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {resultado.motivo}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
