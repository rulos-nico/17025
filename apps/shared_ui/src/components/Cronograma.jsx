import React, { useState } from 'react';

export default function Cronograma({ items = [] }) {
  const [open, setOpen] = useState({});

  const toggle = (id) => setOpen((s) => ({ ...s, [id]: !s[id] }));
  const expandAll = () => setOpen(Object.fromEntries(items.map((i) => [i.id, true])));
  const collapseAll = () => setOpen({});

  return (
    <div className="cronograma">
      <div className="cronograma-controls">
        <button className="btn-primary" onClick={expandAll}>Expandir todos</button>
        <button className="btn-link" onClick={collapseAll}>Colapsar todos</button>
      </div>

      <ul className="cronograma-list">
        {items.map((it) => (
          <li key={it.id} className="cronograma-item">
            <div className="cronograma-summary" onClick={() => toggle(it.id)}>
              <div>
                <div className="cronograma-title">{it.titulo}</div>
                <div className="cronograma-meta">{it.fecha} • {it.hora} • {it.responsable}</div>
              </div>
              <div className="cronograma-toggle">{open[it.id] ? '▲' : '▼'}</div>
            </div>

            {open[it.id] && (
              <div className="cronograma-details">
                <p>{it.detalle}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
