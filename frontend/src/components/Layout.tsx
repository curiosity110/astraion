import type { ReactNode } from 'react';
import Toasts from './Toasts';
import Navbar from './Navbar';

interface Crumb {
  label: string;
  href?: string;
}

export default function Layout({ title, breadcrumbs = [], children }: { title: string; breadcrumbs?: Crumb[]; children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr] bg-background text-foreground">
      <Navbar />
      <main className="p-4 max-w-7xl mx-auto w-full space-y-4">
        {breadcrumbs.length > 0 && (
          <nav className="text-sm text-foreground/60">
            {breadcrumbs.map((bc, i) => (
              <span key={i}>
                {bc.href ? (
                  <a className="hover:underline" href={bc.href}>
                    {bc.label}
                  </a>
                ) : (
                  <span>{bc.label}</span>
                )}
                {i < breadcrumbs.length - 1 && ' / '}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </main>
      <Toasts />
    </div>
  );
}
