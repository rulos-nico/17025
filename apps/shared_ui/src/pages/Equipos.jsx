import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { API_CONFIG } from '../config';
import equiposExample from '../examples/equipos.mock';

export default function Equipos() {
	const [equipos, setEquipos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [open, setOpen] = useState({});

	useEffect(() => {
		// Durante desarrollo usamos sólo los datos de ejemplo.
		// La comunicación con la API se deja comentada para activar posteriormente.
		setLoading(true);
		setError(null);
		setEquipos(equiposExample);
		setLoading(false);

		/* Código original para llamar a la API (descomentar cuando la API esté disponible):
		const c = new AbortController();
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.equipos.list}`, { signal: c.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();

				const mapped = Array.isArray(data)
					? data.map((d, i) => ({
							id: d.id || d._id || `eq-${i+1}`,
							identificado: d.identificado || d.tag || d.code || d.id || `EQ-${i+1}`,
							marca: d.marca || d.brand || d.make || '',
							modelo: d.modelo || d.model || '',
							numero_serie: d.numero_serie || d.serial || d.serialNumber || '',
							ubicacion: d.ubicacion || d.location || d.site || '',
							estado: d.estado || d.status || 'desconocido',
							ultima_comprobacion: d.ultima_comprobacion || d.lastCheck || d.checkedAt || '',
							ultima_calibracion: d.ultima_calibracion || d.lastCalibration || d.calibratedAt || '',
							detalle: d.detalle || d.notes || d.description || '',
						}))
					: [];

				if (!mapped || mapped.length === 0) {
					setEquipos(equiposExample);
				} else {
					setEquipos(mapped);
				}
			} catch (err) {
				if (err.name !== 'AbortError') {
					setEquipos(equiposExample);
					setError(`Usando datos de ejemplo: ${err.message || err}`);
				}
			} finally {
				setLoading(false);
			}
		};

		load();
		return () => c.abort();
		*/
	}, []);

	const toggle = (id) => setOpen((s) => ({ ...s, [id]: !s[id] }));

	return (
		<PageLayout title="Equipos">
			<p>Lista de equipos, estado y calibraciones.</p>

			{loading && <p>Cargando equipos...</p>}
			{error && <p style={{ color: 'var(--error)' }}>Error: {error}</p>}

			{!loading && !error && (
				<div className="equipos-table-wrapper">
					<table className="equipos-table">
						<thead>
							<tr>
								<th></th>
								<th>Identificado</th>
								<th>Marca</th>
								<th>Modelo</th>
								<th>N° Serie</th>
								<th>Ubicación</th>
								<th>Estado</th>
								<th>Últ. comprob.</th>
								<th>Últ. calibr.</th>
							</tr>
						</thead>
						<tbody>
							{equipos.length === 0 && (
								<tr>
									<td colSpan={9}>No hay equipos registrados.</td>
								</tr>
							)}

							{equipos.map((e) => (
								<React.Fragment key={e.id}>
									<tr className="equipos-row">
										<td className="expand-cell">
											<button className="btn-link" onClick={() => toggle(e.id)} aria-label="expandir">
												{open[e.id] ? '▾' : '▸'}
											</button>
										</td>
										<td>{e.identificado}</td>
										<td>{e.marca}</td>
										<td>{e.modelo}</td>
										<td>{e.numero_serie}</td>
										<td>{e.ubicacion}</td>
										<td><span className={`status-badge status-${String(e.estado).toLowerCase()}`}>{e.estado}</span></td>
										<td>{e.ultima_comprobacion}</td>
										<td>{e.ultima_calibracion}</td>
									</tr>

									{open[e.id] && (
										<tr className="equipos-row-details">
											<td colSpan={9}>
												<div className="equipos-details">
													<p><strong>Detalle:</strong> {e.detalle || '—'}</p>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
		</PageLayout>
	);
}
