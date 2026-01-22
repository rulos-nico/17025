import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import Cronograma from '../components/Cronograma';
import { API_CONFIG } from '../config';

export default function Reportes() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const controller = new AbortController();
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.reportes.list}`, { signal: controller.signal });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();

				// Map API shape to Cronograma item shape (flexible)
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
	}, []);

	return (
		<PageLayout title="Reportes">
			<p>Generación, descarga y aprobación de reportes.</p>

			<h3 style={{ marginTop: '1rem' }}>Cronograma de actividades</h3>

			{loading && <p>Cargando cronograma...</p>}
			{error && <p style={{ color: 'var(--error)' }}>Error cargando cronograma: {error}</p>}

			{!loading && !error && <Cronograma items={items} />}
		</PageLayout>
	);
}
