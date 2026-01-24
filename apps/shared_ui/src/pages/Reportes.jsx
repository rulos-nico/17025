import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { API_CONFIG } from '../config';
import projectsExample from '../examples/projects.mock';

export default function Reportes() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [openProject, setOpenProject] = useState({});
	const [openPerforacion, setOpenPerforacion] = useState({});
	const [projects, setProjects] = useState([]);

	useEffect(() => {
		// Durante desarrollo usamos datos de ejemplo.
		// Lógica de llamada a la API (fetch) se mantiene comentada para activarla cuando el backend esté listo.
		setLoading(true);
		setError(null);
		// Durante desarrollo usamos datos de ejemplo para proyectos anidados
		setProjects(projectsExample);
		setLoading(false);

		/* Código original para usar la API (descomentar cuando esté disponible):
		const controller = new AbortController();
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.reportes.list}`, { signal: controller.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();

				const mapped = Array.isArray(data)
					? data.map((d, idx) => ({
							id: d.id || d._id || String(idx + 1),
							titulo: d.titulo || d.title || d.name || d.descripcion || `Item ${idx + 1}`,
							fecha: d.fecha || d.date || d.scheduledDate || '',
							hora: d.hora || d.time || d.scheduledTime || '',
							responsable: d.responsable || d.owner || d.assignee || '',
							detalle: d.detalle || d.description || d.notes || '',
						}))
					: [];

				setItems(mapped);
			} catch (err) {
				if (err.name !== 'AbortError') setError(err.message || String(err));
			} finally {
				setLoading(false);
			}
		};

		load();
		return () => controller.abort();
		*/
	}, []);

	return (
		<PageLayout title="Reportes">
			<p>Seguimiento proyectos</p>

			<h3 style={{ marginTop: '1rem' }}>Cronograma proyectos</h3>

			{loading && <p>Cargando proyectos...</p>}
			{error && <p style={{ color: 'var(--error)' }}>Error: {error}</p>}



			{!loading && !error && (
				<div className="projects-list">
					{projects.length === 0 && <p>No hay proyectos.</p>}

					{projects.map((p) => (
						<div key={p.id} className="project-card">
							<div className="project-header">
								<div>
									<strong>{p.codigo}</strong> — {p.nombre} <span className="muted">({p.cliente})</span> <span className="muted">[{p.estado}]</span>
								</div>

								<div>
									<button className="btn-link" onClick={() => setOpenProject((s) => ({ ...s, [p.id]: !s[p.id] }))}>
										{openProject[p.id] ? 'Ocultar' : 'Ver'}
									</button>
								</div>
							</div>

							{openProject[p.id] && (
								<div className="project-body">
									<h4>Perforaciones</h4>
									{p.perforaciones.length === 0 && <p className="muted">No hay perforaciones registradas aún.</p>}
									{p.perforaciones.map((f) => (
										<div key={f.id} className="perforacion-item">
											<div className="perforacion-header">
												<div>
													<strong>{f.codigo_perforacion}</strong> — {f.descripcion} <span className="muted">({f.fecha_solicitud})</span>
												</div>
												<div>
													<button className="btn-link" onClick={() => alert('Función de ensayos aún no implementada')}>Ver ensayos</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</PageLayout>
	);
}
