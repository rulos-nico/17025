import { useState } from 'react';
import PageLayout from '../components/PageLayout';

/**
 * Página de reportes y seguimiento de proyectos
 * Muestra cronograma de proyectos con sus perforaciones
 * 
 * TODO: Conectar con useProyectos() cuando Google Sheets esté configurado
 */
export default function Reportes() {
	// Datos vacíos - se conectarán con Google Sheets
	const projects = [];
	const loading = false;
	const error = null;
	const [openProject, setOpenProject] = useState({});

	return (
		<PageLayout title="Reportes">
			<p>Seguimiento proyectos</p>

			<h3 style={{ marginTop: '1rem' }}>Cronograma proyectos</h3>

			{loading && <p>Cargando proyectos...</p>}
			{error && <p style={{ color: 'var(--error)' }}>Error: {error}</p>}

			{!loading && !error && (
				<div className="projects-list">
					{projects.length === 0 ? (
						<div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem' }}>
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
								<path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
							</svg>
							<p>No hay proyectos registrados</p>
							<p className="muted" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								Conecta con Google Sheets para ver los proyectos
							</p>
						</div>
					) : (
						projects.map((p) => (
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
										{(!p.perforaciones || p.perforaciones.length === 0) && <p className="muted">No hay perforaciones registradas aún.</p>}
										{p.perforaciones && p.perforaciones.map((f) => (
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
						))
					)}
				</div>
			)}
		</PageLayout>
	);
}
