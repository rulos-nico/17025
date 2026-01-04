import axios from 'axios';
import FormData from 'form-data';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Clasificar un documento usando el servicio ML
 */
export async function classifyDocument(file, extractMetadata = true) {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
    formData.append('extract_metadata', extractMetadata.toString());

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/classify`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 segundos
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al clasificar documento:', error.message);
    
    if (error.response) {
      throw new Error(`Servicio ML error: ${error.response.data.detail || error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('No se pudo conectar al servicio ML. Verifica que esté ejecutándose.');
    } else {
      throw new Error(`Error al clasificar documento: ${error.message}`);
    }
  }
}

/**
 * Clasificar múltiples documentos
 */
export async function classifyBatch(files) {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/classify-batch`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 segundos para batch
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al clasificar documentos en lote:', error.message);
    throw new Error(`Error en clasificación por lotes: ${error.message}`);
  }
}

/**
 * Obtener categorías disponibles
 */
export async function getCategories() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/categories`, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    throw new Error(`Error al obtener categorías: ${error.message}`);
  }
}

/**
 * Verificar salud del servicio ML
 */
export async function checkMLHealth() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
