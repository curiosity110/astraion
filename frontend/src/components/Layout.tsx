import type { ReactNode } from 'react';
import Toasts from './Toasts';
import AppShell from './layout/AppShell';

interface Crumb {
  label: string;
  href?: string;
}

export default function Layout({ title, breadcrumbs = [], children }: { title: string; breadcrumbs?: Crumb[]; children: ReactNode }) {
  return (
    <AppShell>
      <div className="space-y-4">
        {breadcrumbs.length > 0 && (
          <nav className="text-sm text-gray-500">
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
      </div>
      <Toasts />
    </AppShell>
  );
}
