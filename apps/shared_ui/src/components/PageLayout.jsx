import React from 'react';

export default function PageLayout({ title, children }) {
  return (
    <div className="page-layout">
      <header className="page-header">
        <div className="container">
          <h1>{title}</h1>
        </div>
      </header>
      <section className="page-body">
        <div className="container">{children}</div>
      </section>
    </div>
  );
}
