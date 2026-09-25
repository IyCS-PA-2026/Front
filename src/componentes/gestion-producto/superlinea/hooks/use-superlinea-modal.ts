import { useState } from "react";
import { SuperLinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

export type SuperLineaModalTipo = "alta" | "edicion" | null;

export function useSuperLineaModal() {
  const [tipo, setTipo] = useState<SuperLineaModalTipo>(null);
  const [superLinea, setSuperLinea] = useState<SuperLinea | null>(null);

  const abrirAlta = () => {
    setSuperLinea(null);
    setTipo("alta");
  };

  const abrirEdicion = (superLinea: SuperLinea) => {
    setSuperLinea(superLinea);
    setTipo("edicion");
  };

  const cerrar = () => {
    setTipo(null);
    setSuperLinea(null);
  };

  return {
    tipo,
    superLinea,
    abrirAlta,
    abrirEdicion,
    cerrar,
  };
}
