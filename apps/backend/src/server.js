import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Lab ISO 17025 Backend',
    timestamp: new Date().toISOString(),
    ml_service: process.env.ML_SERVICE_URL
  });
});

// Rutas
app.use('/api/documents', documentRoutes);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🧠 Servicio ML en: ${process.env.ML_SERVICE_URL}`);
  console.log(`📝 Docs API: http://localhost:${PORT}/api/documents`);
});

export default app;
