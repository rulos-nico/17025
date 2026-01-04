import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { classifyDocument, classifyBatch, getCategories } from '../services/mlService.js';

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['.pdf', '.docx', '.txt'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * POST /api/documents/classify
 * Clasificar un documento
 */
router.post(
  '/classify',
  upload.single('file'),
  [
    body('extract_metadata').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      // Validar
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

      // Clasificar documento
      const extractMetadata = req.body.extract_metadata !== 'false';
      const result = await classifyDocument(req.file, extractMetadata);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/documents/classify-batch
 * Clasificar múltiples documentos
 */
router.post(
  '/classify-batch',
  upload.array('files', 10), // Máximo 10 archivos
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron archivos' });
      }

      const result = await classifyBatch(req.files);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/documents/categories
 * Obtener todas las categorías disponibles
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/save-classification
 * Guardar resultado de clasificación en la base de datos
 */
router.post(
  '/save-classification',
  [
    body('filename').notEmpty(),
    body('predicted_class').notEmpty(),
    body('confidence').isFloat({ min: 0, max: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Aquí se guardaría en la base de datos
      // const saved = await DocumentModel.create(req.body);

      res.json({
        message: 'Clasificación guardada exitosamente',
        // data: saved
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
