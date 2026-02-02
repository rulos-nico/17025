/**
 * Hook para gestionar el flujo de trabajo de ensayos con Google Sheets
 * Laboratorio ISO 17025
 */

import { useState, useCallback } from 'react';
import {
  EnsayoSheetService,
  WorkflowService,
  ENSAYO_WORKFLOW_STATES,
} from '../services/ensayoSheetService.js';

/**
 * Hook para crear y gestionar hojas de cálculo de ensayos
 */
export function useEnsayoSheet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetInfo, setSheetInfo] = useState(null);

  /**
   * Inicializa el servicio de Google
   */
  const inicializar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await EnsayoSheetService.init();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crea una nueva hoja de cálculo para un ensayo
   */
  const crearHojaEnsayo = useCallback(async (ensayo) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await EnsayoSheetService.crearHojaEnsayo(ensayo);
      setSheetInfo(resultado);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lee los datos de un ensayo desde su hoja de cálculo
   */
  const leerDatosEnsayo = useCallback(async (spreadsheetId, tipoEnsayo) => {
    setLoading(true);
    setError(null);
    try {
      const datos = await EnsayoSheetService.leerDatosEnsayo(spreadsheetId, tipoEnsayo);
      return datos;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene información de un spreadsheet
   */
  const getSheetInfo = useCallback(async (spreadsheetId) => {
    setLoading(true);
    setError(null);
    try {
      const info = await EnsayoSheetService.getInfo(spreadsheetId);
      setSheetInfo(info);
      return info;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verifica acceso a un spreadsheet
   */
  const verificarAcceso = useCallback(async (spreadsheetId) => {
    try {
      return await EnsayoSheetService.verificarAcceso(spreadsheetId);
    } catch {
      return false;
    }
  }, []);

  /**
   * Obtiene la URL de la hoja de cálculo
   */
  const getSheetUrl = useCallback((spreadsheetId) => {
    return EnsayoSheetService.getSheetUrl(spreadsheetId);
  }, []);

  return {
    // Estado
    loading,
    error,
    sheetInfo,
    // Acciones
    inicializar,
    crearHojaEnsayo,
    leerDatosEnsayo,
    getSheetInfo,
    verificarAcceso,
    getSheetUrl,
  };
}

/**
 * Hook para gestionar el flujo de trabajo (workflow) de un ensayo
 */
export function useEnsayoWorkflow(ensayo) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Estado actual del ensayo
   */
  const estadoActual = WorkflowService.getEstadoActual(ensayo || {});
  const infoEstado = WorkflowService.getInfoEstado(estadoActual);

  /**
   * Transiciones permitidas desde el estado actual
   */
  const transicionesPermitidas = WorkflowService.getTransicionesPermitidas(estadoActual);
  const opcionesTransicion = transicionesPermitidas.map(codigo => ({
    codigo,
    ...WorkflowService.getInfoEstado(codigo),
  }));

  /**
   * Ejecuta una transición de estado
   */
  const ejecutarTransicion = useCallback(async (nuevoEstado, usuario, comentario = '') => {
    if (!ensayo) {
      throw new Error('No hay ensayo seleccionado');
    }

    setLoading(true);
    setError(null);
    try {
      const resultado = await WorkflowService.ejecutarTransicion(
        ensayo,
        nuevoEstado,
        usuario,
        comentario
      );
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensayo]);

  /**
   * Verifica si una transición específica es válida
   */
  const esTransicionValida = useCallback((nuevoEstado) => {
    return WorkflowService.esTransicionValida(estadoActual, nuevoEstado);
  }, [estadoActual]);

  /**
   * Estados derivados
   */
  const estaEnRevision = WorkflowService.estaEnRevision(ensayo || {});
  const listoParaReporte = WorkflowService.listoParaReporte(ensayo || {});
  const estaFinalizado = WorkflowService.estaFinalizado(ensayo || {});

  return {
    // Estado
    loading,
    error,
    estadoActual,
    infoEstado,
    transicionesPermitidas,
    opcionesTransicion,
    // Estados derivados
    estaEnRevision,
    listoParaReporte,
    estaFinalizado,
    // Acciones
    ejecutarTransicion,
    esTransicionValida,
    // Helpers
    getInfoEstado: WorkflowService.getInfoEstado,
  };
}

/**
 * Hook combinado para gestionar un ensayo completo (sheet + workflow)
 */
export function useEnsayoCompleto(ensayo) {
  const sheet = useEnsayoSheet();
  const workflow = useEnsayoWorkflow(ensayo);

  /**
   * Crea un ensayo completo: genera la hoja y configura el estado inicial
   */
  const crearEnsayoCompleto = useCallback(async (datosEnsayo) => {
    // 1. Crear la hoja de cálculo
    const hojaCreada = await sheet.crearHojaEnsayo(datosEnsayo);

    // 2. Retornar el ensayo con la información de la hoja vinculada
    return {
      ...datosEnsayo,
      spreadsheet_id: hojaCreada.spreadsheetId,
      spreadsheet_url: hojaCreada.url,
      spreadsheet_nombre: hojaCreada.nombre,
      workflow_state: ENSAYO_WORKFLOW_STATES.SIN_PROGRAMAR,
      historial_workflow: [],
      createdAt: new Date().toISOString(),
    };
  }, [sheet]);

  /**
   * Carga los datos completos de un ensayo (metadata + datos del sheet)
   */
  const cargarDatosCompletos = useCallback(async () => {
    if (!ensayo?.spreadsheet_id) {
      throw new Error('El ensayo no tiene hoja de cálculo vinculada');
    }

    const datosSheet = await sheet.leerDatosEnsayo(
      ensayo.spreadsheet_id,
      ensayo.tipo
    );

    return {
      ensayo,
      datosSheet,
      estadoWorkflow: workflow.infoEstado,
    };
  }, [ensayo, sheet, workflow]);

  return {
    // Estado combinado
    loading: sheet.loading || workflow.loading,
    error: sheet.error || workflow.error,
    // Sheet
    sheetInfo: sheet.sheetInfo,
    crearHojaEnsayo: sheet.crearHojaEnsayo,
    leerDatosEnsayo: sheet.leerDatosEnsayo,
    getSheetUrl: sheet.getSheetUrl,
    inicializarGoogle: sheet.inicializar,
    // Workflow
    estadoActual: workflow.estadoActual,
    infoEstado: workflow.infoEstado,
    opcionesTransicion: workflow.opcionesTransicion,
    ejecutarTransicion: workflow.ejecutarTransicion,
    estaEnRevision: workflow.estaEnRevision,
    listoParaReporte: workflow.listoParaReporte,
    estaFinalizado: workflow.estaFinalizado,
    // Acciones combinadas
    crearEnsayoCompleto,
    cargarDatosCompletos,
  };
}

export default {
  useEnsayoSheet,
  useEnsayoWorkflow,
  useEnsayoCompleto,
};
