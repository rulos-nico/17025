/**
 * Servicio para gestión de hojas de cálculo de ensayos
 * Laboratorio ISO 17025
 * 
 * Flujo de trabajo:
 * 1. Al crear un ensayo -> Se genera un Google Sheet desde plantilla
 * 2. Los técnicos ingresan datos crudos en el Sheet
 * 3. El ensayo pasa por revisiones (técnica, coordinación, dirección)
 * 4. Al finalizar -> Se generan los datos procesados para el PDF
 * 5. Se notifica al cliente
 */

import { getWorkflowInfo, DRIVE_CONFIG } from '../config.js';
import {
  initGoogleServices,
  requestAuthorization,
  isAuthenticated,
  copyTemplate,
  createEnsayoSheet,
  getAccessToken,
} from './driveService.js';
import {
  readSheetAsObjects,
  readSheet,
  writeSheet,
  getSpreadsheetMetadata,
  getSheetUrl,
} from './googleSheets.js';

// ============================================
// CONFIGURACIÓN DE PLANTILLAS
// ============================================

/**
 * Plantillas de Google Sheets por tipo de ensayo
 * Cada plantilla tiene la estructura de captura de datos específica
 */
const PLANTILLAS_ENSAYO = {
  traccion: {
    id: import.meta.env.VITE_PLANTILLA_TRACCION_ID || DRIVE_CONFIG?.plantillas?.traccion,
    nombre: 'Ensayo de Tracción',
    hojas: {
      datos: 'Datos Crudos',
      calculos: 'Cálculos',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
  dureza: {
    id: import.meta.env.VITE_PLANTILLA_DUREZA_ID || DRIVE_CONFIG?.plantillas?.dureza,
    nombre: 'Ensayo de Dureza',
    hojas: {
      datos: 'Mediciones',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
  impacto: {
    id: import.meta.env.VITE_PLANTILLA_IMPACTO_ID || DRIVE_CONFIG?.plantillas?.impacto,
    nombre: 'Ensayo de Impacto',
    hojas: {
      datos: 'Mediciones',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
  quimico_oes: {
    id: import.meta.env.VITE_PLANTILLA_QUIMICO_ID || DRIVE_CONFIG?.plantillas?.quimico_oes,
    nombre: 'Análisis Químico OES',
    hojas: {
      datos: 'Lecturas',
      composicion: 'Composición',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
  metalografia: {
    id: import.meta.env.VITE_PLANTILLA_METALOGRAFIA_ID || DRIVE_CONFIG?.plantillas?.metalografia,
    nombre: 'Análisis Metalográfico',
    hojas: {
      datos: 'Observaciones',
      imagenes: 'Imágenes',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
  // Plantilla genérica para tipos no especificados
  default: {
    id: import.meta.env.VITE_PLANTILLA_DEFAULT_ID || DRIVE_CONFIG?.plantillas?.default,
    nombre: 'Ensayo General',
    hojas: {
      datos: 'Datos',
      resultados: 'Resultados',
      metadata: 'Información',
    },
  },
};

// ============================================
// SERVICIO PRINCIPAL
// ============================================

/**
 * Servicio para gestionar el ciclo de vida de hojas de ensayo
 */
export const EnsayoSheetService = {
  /**
   * Inicializa el servicio (debe llamarse antes de usar)
   */
  async init() {
    await initGoogleServices();
    if (!isAuthenticated()) {
      await requestAuthorization();
    }
  },

  /**
   * Verifica si está autenticado
   */
  isReady() {
    return isAuthenticated();
  },

  /**
   * Obtiene la plantilla correspondiente al tipo de ensayo
   */
  getPlantilla(tipoEnsayo) {
    return PLANTILLAS_ENSAYO[tipoEnsayo] || PLANTILLAS_ENSAYO.default;
  },

  /**
   * Crea una copia de la plantilla para un nuevo ensayo
   * @param {Object} ensayo - Datos del ensayo
   * @param {string} perforacionFolderId - ID de la carpeta de la perforación
   * @returns {Promise<Object>} - Datos del spreadsheet creado
   */
  async crearHojaEnsayo(ensayo, perforacionFolderId = null) {
    const plantilla = this.getPlantilla(ensayo.tipo);
    
    if (!plantilla.id) {
      throw new Error(`No hay plantilla configurada para el tipo de ensayo: ${ensayo.tipo}`);
    }

    // Nombre del nuevo archivo
    const nombreArchivo = `${ensayo.codigo} - ${plantilla.nombre}`;

    try {
      let nuevoSheet;
      
      if (perforacionFolderId) {
        // Usar el nuevo driveService con carpeta específica
        nuevoSheet = await createEnsayoSheet(
          { codigo: ensayo.codigo, tipo: ensayo.tipo },
          perforacionFolderId
        );
      } else {
        // Copiar plantilla sin carpeta específica
        nuevoSheet = await copyTemplate(
          ensayo.tipo,
          DRIVE_CONFIG?.folders?.proyectos?.id,
          nombreArchivo
        );
      }

      // Escribir metadata del ensayo en la hoja de información
      await this.escribirMetadataEnsayo(nuevoSheet.id, ensayo, plantilla);

      return {
        spreadsheetId: nuevoSheet.id,
        nombre: nombreArchivo,
        url: nuevoSheet.url || getSheetUrl(nuevoSheet.id),
        editUrl: nuevoSheet.editUrl,
        plantilla: plantilla.nombre,
        tipoEnsayo: ensayo.tipo,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creando hoja de ensayo:', error);
      throw error;
    }
  },

  /**
   * Escribe los metadatos del ensayo en la hoja de información
   */
  async escribirMetadataEnsayo(spreadsheetId, ensayo, plantilla) {
    const hojaMetadata = plantilla.hojas.metadata || 'Información';
    
    const metadata = [
      ['Campo', 'Valor'],
      ['Código Ensayo', ensayo.codigo],
      ['Tipo Ensayo', ensayo.tipo],
      ['Cliente ID', ensayo.cliente_id || ensayo.clienteId || ''],
      ['Proyecto ID', ensayo.proyecto_id || ensayo.proyectoId || ''],
      ['Perforación ID', ensayo.perforacion_id || ensayo.perforacionId || ''],
      ['Fecha Solicitud', ensayo.fecha_solicitud || ''],
      ['Fecha Programada', ensayo.fecha_programada || ''],
      ['Muestra', ensayo.muestra || ''],
      ['Norma', ensayo.norma || ''],
      ['Técnico ID', ensayo.tecnico_id || ensayo.responsableId || ''],
      ['Técnico Nombre', ensayo.tecnico_nombre || ''],
      ['Observaciones', ensayo.observaciones || ''],
      ['Estado', ensayo.workflow_state || 'E1'],
      ['Urgente', ensayo.urgente ? 'Sí' : 'No'],
      ['Creado', new Date().toISOString()],
    ];

    await writeSheet(spreadsheetId, `${hojaMetadata}!A1`, metadata);
  },

  /**
   * Actualiza la metadata de un ensayo existente
   */
  async actualizarMetadataEnsayo(spreadsheetId, tipoEnsayo, datosActualizados) {
    const plantilla = this.getPlantilla(tipoEnsayo);
    const hojaMetadata = plantilla.hojas.metadata || 'Información';
    
    // Leer metadata actual
    const metadataActual = await readSheet(spreadsheetId, `${hojaMetadata}!A1:B20`);
    
    // Actualizar los campos
    const metadataActualizada = metadataActual.map(([campo, valor]) => {
      const key = campo?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
      
      if (datosActualizados[key] !== undefined) {
        return [campo, datosActualizados[key]];
      }
      return [campo, valor];
    });
    
    // Agregar campo de actualización
    metadataActualizada.push(['Última Actualización', new Date().toISOString()]);
    
    await writeSheet(spreadsheetId, `${hojaMetadata}!A1`, metadataActualizada);
  },

  /**
   * Lee los datos crudos de un ensayo desde su hoja de cálculo
   * @param {string} spreadsheetId - ID del spreadsheet
   * @param {string} tipoEnsayo - Tipo de ensayo para saber qué hojas leer
   * @returns {Promise<Object>} - Datos del ensayo
   */
  async leerDatosEnsayo(spreadsheetId, tipoEnsayo) {
    const plantilla = this.getPlantilla(tipoEnsayo);
    
    try {
      const resultado = {
        metadata: {},
        datos: [],
        resultados: [],
      };

      // Leer metadata
      if (plantilla.hojas.metadata) {
        const metadataRaw = await readSheet(spreadsheetId, plantilla.hojas.metadata);
        resultado.metadata = this.parseMetadata(metadataRaw);
      }

      // Leer datos crudos
      if (plantilla.hojas.datos) {
        resultado.datos = await readSheetAsObjects(spreadsheetId, plantilla.hojas.datos);
      }

      // Leer resultados procesados
      if (plantilla.hojas.resultados) {
        resultado.resultados = await readSheetAsObjects(spreadsheetId, plantilla.hojas.resultados);
      }

      // Leer hojas específicas según tipo de ensayo
      if (plantilla.hojas.calculos) {
        resultado.calculos = await readSheetAsObjects(spreadsheetId, plantilla.hojas.calculos);
      }
      if (plantilla.hojas.composicion) {
        resultado.composicion = await readSheetAsObjects(spreadsheetId, plantilla.hojas.composicion);
      }
      if (plantilla.hojas.imagenes) {
        resultado.imagenes = await readSheetAsObjects(spreadsheetId, plantilla.hojas.imagenes);
      }

      return resultado;
    } catch (error) {
      console.error('Error leyendo datos del ensayo:', error);
      throw error;
    }
  },

  /**
   * Parsea los metadatos de formato clave-valor
   */
  parseMetadata(rawData) {
    const metadata = {};
    if (!rawData || rawData.length < 2) return metadata;

    // Saltar header (fila 0)
    for (let i = 1; i < rawData.length; i++) {
      const [campo, valor] = rawData[i];
      if (campo) {
        const key = campo
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_');
        metadata[key] = valor || '';
      }
    }
    return metadata;
  },

  /**
   * Obtiene la URL de la hoja de cálculo del ensayo
   */
  getSheetUrl(spreadsheetId) {
    return getSheetUrl(spreadsheetId);
  },

  /**
   * Verifica si un spreadsheet existe y es accesible
   */
  async verificarAcceso(spreadsheetId) {
    try {
      await getSpreadsheetMetadata(spreadsheetId);
      return true;
    } catch (error) {
      console.error('No se puede acceder al spreadsheet:', error);
      return false;
    }
  },

  /**
   * Obtiene información básica del spreadsheet
   */
  async getInfo(spreadsheetId) {
    try {
      const metadata = await getSpreadsheetMetadata(spreadsheetId);
      return {
        id: spreadsheetId,
        titulo: metadata.properties.title,
        hojas: metadata.sheets.map(s => s.properties.title),
        url: getSheetUrl(spreadsheetId),
      };
    } catch (error) {
      console.error('Error obteniendo info del spreadsheet:', error);
      throw error;
    }
  },

  /**
   * Exporta el ensayo como PDF
   */
  async exportarPdf(spreadsheetId) {
    const token = getAccessToken();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf&portrait=true&size=letter`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error exportando PDF: ${response.status}`);
    }
    
    return await response.blob();
  },
};

// ============================================
// ESTADOS Y FLUJO DE REVISIONES
// ============================================

/**
 * Estados del flujo de trabajo de un ensayo
 */
export const ENSAYO_WORKFLOW_STATES = {
  // Fase inicial
  SIN_PROGRAMAR: 'E1',
  PROGRAMADO: 'E2',
  ANULADO: 'E3',
  REPETICION: 'E4',
  NOVEDAD: 'E5',
  
  // Fase de ejecución
  EN_EJECUCION: 'E6',
  ESPERA_BASICOS: 'E7',
  PROCESAMIENTO: 'E8',
  
  // Fase de revisión
  REVISION_TECNICA: 'E9',
  REVISION_COORDINACION: 'E10',
  REVISION_DIRECCION: 'E11',
  
  // Fase de entrega
  POR_ENVIAR: 'E12',
  ENVIADO: 'E13',
  ENTREGADO: 'E14',
  FACTURADO: 'E15',
};

/**
 * Transiciones permitidas entre estados
 */
export const WORKFLOW_TRANSITIONS = {
  E1: ['E2', 'E3'], // Sin programar -> Programado o Anulado
  E2: ['E6', 'E3', 'E5'], // Programado -> En ejecución, Anulado o Novedad
  E3: [], // Anulado -> (fin)
  E4: ['E6'], // Repetición -> En ejecución
  E5: ['E2', 'E3'], // Novedad -> Programado o Anulado
  E6: ['E7', 'E8', 'E4', 'E5'], // En ejecución -> Espera, Procesamiento, Repetición o Novedad
  E7: ['E6'], // Espera básicos -> En ejecución
  E8: ['E9', 'E4'], // Procesamiento -> Revisión técnica o Repetición
  E9: ['E10', 'E8'], // Rev. técnica -> Rev. coordinación o volver a procesamiento
  E10: ['E11', 'E9'], // Rev. coordinación -> Rev. dirección o volver a técnica
  E11: ['E12', 'E10'], // Rev. dirección -> Por enviar o volver a coordinación
  E12: ['E13'], // Por enviar -> Enviado
  E13: ['E14'], // Enviado -> Entregado
  E14: ['E15'], // Entregado -> Facturado
  E15: [], // Facturado -> (fin)
};

/**
 * Servicio para gestionar el flujo de trabajo de revisiones
 */
export const WorkflowService = {
  /**
   * Obtiene el estado actual de un ensayo
   */
  getEstadoActual(ensayo) {
    return ensayo.workflow_state || ENSAYO_WORKFLOW_STATES.SIN_PROGRAMAR;
  },

  /**
   * Obtiene las transiciones permitidas desde el estado actual
   */
  getTransicionesPermitidas(estadoActual) {
    return WORKFLOW_TRANSITIONS[estadoActual] || [];
  },

  /**
   * Verifica si una transición es válida
   */
  esTransicionValida(estadoActual, nuevoEstado) {
    const permitidas = this.getTransicionesPermitidas(estadoActual);
    return permitidas.includes(nuevoEstado);
  },

  /**
   * Ejecuta una transición de estado
   * @returns {Object} - Resultado con el nuevo estado y metadata
   */
  async ejecutarTransicion(ensayo, nuevoEstado, usuario, comentario = '') {
    const estadoActual = this.getEstadoActual(ensayo);

    if (!this.esTransicionValida(estadoActual, nuevoEstado)) {
      throw new Error(
        `Transición no permitida de ${estadoActual} a ${nuevoEstado}`
      );
    }

    const transicion = {
      de: estadoActual,
      a: nuevoEstado,
      usuario: usuario.id,
      usuarioNombre: usuario.nombre ? `${usuario.nombre} ${usuario.apellido || ''}`.trim() : usuario.email,
      fecha: new Date().toISOString(),
      comentario,
    };

    return {
      nuevoEstado,
      transicion,
      historial: [...(ensayo.historial_workflow || []), transicion],
    };
  },

  /**
   * Obtiene información del estado (delegado a config.js)
   */
  getInfoEstado(codigo) {
    return getWorkflowInfo(codigo);
  },

  /**
   * Verifica si el ensayo está en fase de revisión
   */
  estaEnRevision(ensayo) {
    const estado = this.getEstadoActual(ensayo);
    return ['E9', 'E10', 'E11'].includes(estado);
  },

  /**
   * Verifica si el ensayo está listo para generar reporte
   */
  listoParaReporte(ensayo) {
    const estado = this.getEstadoActual(ensayo);
    return ['E12', 'E13', 'E14', 'E15'].includes(estado);
  },

  /**
   * Verifica si el ensayo está finalizado
   */
  estaFinalizado(ensayo) {
    const estado = this.getEstadoActual(ensayo);
    return ['E3', 'E14', 'E15'].includes(estado);
  },

  /**
   * Verifica si el ensayo está activo (no anulado ni finalizado)
   */
  estaActivo(ensayo) {
    const estado = this.getEstadoActual(ensayo);
    return !['E3', 'E15'].includes(estado);
  },

  /**
   * Obtiene el porcentaje de progreso del ensayo
   */
  getProgreso(ensayo) {
    const estado = this.getEstadoActual(ensayo);
    const progresos = {
      E1: 0, E2: 10, E3: 0, E4: 15, E5: 5,
      E6: 30, E7: 25, E8: 50,
      E9: 60, E10: 75, E11: 85,
      E12: 90, E13: 95, E14: 100, E15: 100,
    };
    return progresos[estado] || 0;
  },
};

// ============================================
// EXPORTS
// ============================================

export default {
  EnsayoSheetService,
  WorkflowService,
  ENSAYO_WORKFLOW_STATES,
  WORKFLOW_TRANSITIONS,
  PLANTILLAS_ENSAYO,
};
