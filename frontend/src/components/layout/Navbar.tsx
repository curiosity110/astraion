import { PlusIcon } from '@heroicons/react/24/outline';

export default function Navbar({ onAddClient }: { onAddClient?: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-semibold tracking-tight">
          Astraion
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="/trips" className="hover:text-primary">
            Trips
          </a>
          <a href="/clients" className="hover:text-primary">
            Clients
          </a>
          <a href="/dashboard" className="hover:text-primary">
            Dashboard
          </a>
          <a href="#" className="text-gray-400 cursor-not-allowed" aria-disabled="true">
            Settings
          </a>
        </nav>
        <button
          data-testid="open-add-client"
          onClick={onAddClient}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <PlusIcon className="w-4 h-4" /> Add Client
        </button>
      </div>
    </header>
  );
}
