/**
 * Middleware para manejo centralizado de errores
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Error de Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'El archivo es demasiado grande',
      max_size: '10MB'
    });
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error personalizado
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
