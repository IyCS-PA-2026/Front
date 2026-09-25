import { useEffect, useState } from "react";
import SuperLineaService from "../services/superlinea-service";
import type {
  DtoConsultarSuperLinea,
  SuperLinea,
} from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import Paginacion from "../../../herramientas/reutilizables/paginacion";
import { Card, CardContent, CardHeader } from "../../../ui/Card";
import { useFiltrosContext } from "../../../../context/filtros-contesxt";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { useSuperLineaModal } from "../hooks/use-superlinea-modal";
import { SuperLineaModal } from "../modales/superlinea-modal";
import { DatosTabla } from "../componentes/datos-tabla";
import { DatosCards } from "../componentes/datos-card";
import { Header } from "../componentes/header";
import { HeaderLg } from "../componentes/header-lg";
import { FiltrosSuperLinea, FiltrosSuperLineaValues } from "../componentes/filtros-superlinea";
import { esSuperLineaSistema } from "../interfaces/interfaces-validaciones-superlinea";
import { getUsuarioId } from "../../../../utils/auth";
import { parseApiError } from "../../../../utils/errores";

const NOMBRE_COMPONENTE = "consultar-superlinea";

export default function ConsultarSuperLineas() {
  // ===========================
  // ESTADOS PRINCIPALES
  // ===========================
  const [superLineas, setSuperLineas] = useState<SuperLinea[]>([]);
  const [loading, setLoading] = useState(false);

  const { alerts, addAlert, removeAlert } = useAlerts();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const modal = useSuperLineaModal();
  const usuarioId = getUsuarioId();

  // ===========================
  // FILTROS LOCALES
  // ===========================
  const [filtrosSuperLinea, setFiltrosSuperLinea] = useState<FiltrosSuperLineaValues>({ denominacion: "" });

  // ===========================
  // PAGINACIÓN
  // ===========================
  const [paginaActual, setPaginaActual] = useState(1);
  const [entidadesTotales, setEntidadesTotales] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);

  // ===========================
  // FILTROS CONTEXTO
  // ===========================
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const { setFiltrosNecesarios, limpiarFiltros, buscar, setBuscar } = useFiltrosContext();

  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: NOMBRE_COMPONENTE });
    setFiltrosNecesarios({ denominacion: true });
    setFiltrosInicializados(true);
  }, []);

  useEffect(() => {
    if (buscar.cont > 0 && buscar.componente === NOMBRE_COMPONENTE) {
      handleBuscarSuperLineas(true);
    }
  }, [buscar]);

  // ===========================
  // CRUD / ACCIONES
  // ===========================
  const handleAltaSuperLinea = () => {
    modal.abrirAlta();
  };

  const handleAbrirEdicion = (superLinea: SuperLinea) => {
    if (esSuperLineaSistema(superLinea)) return;
    modal.abrirEdicion(superLinea);
  };

  const handleDelete = async (superLinea: SuperLinea) => {
    if (esSuperLineaSistema(superLinea)) return;

    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DESTRUCTIVE,
      title: TituloAlertaConfirmacion.DESTRUCTIVE,
      message: `¿Estás seguro de que quieres eliminar la SuperLínea "${superLinea.denominacion}"? Las líneas asociadas quedarán sin SuperLínea.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });

    if (!confirmed) return;

    try {
      const response: ResponsePost = await SuperLineaService.eliminar(superLinea.id, usuarioId);

      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: response?.mensaje ?? "SuperLínea eliminada correctamente.",
        autoClose: true,
      });

      await handleBuscarSuperLineas();
    } catch (error) {
      addAlert({
        type: TipoAlerta.ERROR,
        title: TituloAlerta.ERROR,
        message: parseApiError(error),
        autoClose: true,
      });
    }
  };

  // ===========================
  // BÚSQUEDA
  // ===========================
  const handleBuscarSuperLineas = async (botonBuscar?: boolean) => {
    if (botonBuscar) {
      setSkip(0);
      setPaginaActual(1);
    }

    setLoading(true);

    const filtrosConPaginacion = {
      denominacion: filtrosSuperLinea.denominacion,
      ...(filtrosSuperLinea.incluirEliminados ? { incluirEliminados: true } : {}),
      skip: botonBuscar ? 0 : skip,
      take,
    };

    try {
      const response: DtoConsultarSuperLinea = await SuperLineaService.obtener(filtrosConPaginacion);
      setSuperLineas(response.data);
      setEntidadesTotales(response.total);
    } catch (error) {
      addAlert({
        type: TipoAlerta.ERROR,
        title: TituloAlerta.ERROR,
        message: parseApiError(error),
        autoClose: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarDesdeFiltro = (filtros: FiltrosSuperLineaValues) => {
    setFiltrosSuperLinea(filtros);
  };

  useEffect(() => {
    if (filtrosInicializados) {
      handleBuscarSuperLineas();
    }
  }, [paginaActual, filtrosInicializados]);

  useEffect(() => {
    if (filtrosInicializados) {
      handleBuscarSuperLineas(true);
    }
  }, [filtrosSuperLinea]);

  const handlePageChange = (skip: number, take: number, paginaActual: number) => {
    setSkip(skip);
    setTake(take);
    setPaginaActual(paginaActual);
  };

  // ===========================
  // SUCCESS MODAL
  // ===========================
  const handleSuccess = async (mensajeAlerta: string) => {
    modal.cerrar();

    addAlert({
      type: TipoAlerta.SUCCESS,
      title: TituloAlerta.SUCCESS,
      message: mensajeAlerta,
      autoClose: true,
    });

    await handleBuscarSuperLineas();
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex justify-between">
          <div className="hidden lg:block">
            <Header
              entidadesTotales={entidadesTotales}
              datosLength={superLineas.length}
              openModal={handleAltaSuperLinea}
            />
          </div>

          <div className="lg:hidden">
            <HeaderLg openModal={handleAltaSuperLinea} />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <FiltrosSuperLinea onBuscar={handleBuscarDesdeFiltro} mostrarIncluirEliminados />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
              <p className="text-gray-600 text-lg">Cargando SuperLíneas...</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block">
                <DatosTabla superLineas={superLineas} onEditar={handleAbrirEdicion} onDelete={handleDelete} />
              </div>

              {/* Mobile */}
              <div className="lg:hidden space-y-4">
                {superLineas.map((superLinea) => (
                  <DatosCards
                    key={superLinea.id}
                    superLinea={superLinea}
                    onEditar={handleAbrirEdicion}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Paginacion
          entidadesTotales={entidadesTotales}
          take={take}
          paginaActual={paginaActual}
          onChange={handlePageChange}
        />
      </div>

      <Alertas alerts={alerts} onRemove={removeAlert} />
      <AlertasConfirmacion />

      {/* MODAL ÚNICO */}
      <SuperLineaModal
        open={modal.tipo !== null}
        tipo={modal.tipo}
        superLinea={modal.superLinea}
        onClose={modal.cerrar}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
