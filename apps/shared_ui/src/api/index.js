// apps/shared_ui/src/api/index.js
import express from 'express';
import cors from 'cors';

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Ejemplo: proyectos (in-memory para pruebas)
let proyectos = [];
app.get('/api/proyectos', (req, res) => res.json(proyectos));
app.post('/api/proyectos', (req, res) => {
  const id = `p-${Date.now()}`;
  const p = { id, ...req.body, perforaciones: [] };
  proyectos.push(p);
  res.status(201).json(p);
});

// Perforaciones anidadas
app.post('/api/proyectos/:projectId/perforaciones', (req, res) => {
  const { projectId } = req.params;
  const proyecto = proyectos.find((p) => p.id === projectId);
  if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });
  const perf = { id: `f-${Date.now()}`, ...req.body, ensayos: [] };
  proyecto.perforaciones.push(perf);
  res.status(201).json(perf);
});

// Ensayos por perforación
app.post('/api/perforaciones/:perforacionId/ensayos', (req, res) => {
  const { perforacionId } = req.params;
  let found = null;
  for (const p of proyectos) {
    const f = p.perforaciones.find((x) => x.id === perforacionId);
    if (f) { found = f; break; }
  }
  if (!found) return res.status(404).json({ message: 'Perforación no encontrada' });
  const ensayo = { id: `e-${Date.now()}`, origen: req.body.origen || 'solicitado', ...req.body };
  found.ensayos.push(ensayo);
  res.status(201).json(ensayo);
});

// Compare endpoint (ejemplo simple)
app.get('/api/proyectos/:projectId/ensayos/compare', (req, res) => {
  const { projectId } = req.params;
  const proyecto = proyectos.find((p) => p.id === projectId);
  if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });

  // composición simple: contar por origen
  const counts = { propuesta: 0, solicitado: 0 };
  for (const f of proyecto.perforaciones) {
    for (const e of f.ensayos) {
      counts[e.origen] = (counts[e.origen] || 0) + 1;
    }
  }

  res.json({ projectId, totals: counts });
});

// Error handler básico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => console.log(`API dev server listening on http://localhost:${PORT}`));
