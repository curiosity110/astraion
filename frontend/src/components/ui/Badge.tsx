import type { ReactNode } from 'react';

export function Badge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const map: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${map[tone]}`}>{children}</span>;
}
