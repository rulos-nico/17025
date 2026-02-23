import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
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
