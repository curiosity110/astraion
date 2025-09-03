import { ReactNode, useState } from 'react';
import Navbar from './Navbar';
import AddClientModal from '../modals/AddClientModal';

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-primary-50/30 text-gray-900">
      <Navbar onAddClient={() => setOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</main>
      <AddClientModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
