import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import TripsList from "./pages/TripsList";
import TripDetail from "./pages/TripDetail";
import ClientsList from "./pages/ClientsList";
import ClientProfile from "./pages/ClientProfile";
import { WebSocketProvider } from "./components/WebSocketProvider";

function Nav() {
  const { pathname } = useLocation();
  const Tab = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium",
        pathname.startsWith(to)
          ? "bg-primary text-white"
          : "text-white/80 hover:text-white hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
        <Link to="/" className="text-white font-semibold tracking-wide">Astraion</Link>
        <nav className="flex items-center gap-2">
          <Tab to="/trips" label="Trips" />
          <Tab to="/clients" label="Clients" />
          <a
            href="/admin/"
            className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10"
          >
            Admin
          </a>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <div className="min-h-screen bg-neutral-950 text-white">
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-6">
            <Routes>
              <Route path="/" element={<TripsList />} />
              <Route path="/trips" element={<TripsList />} />
              <Route path="/trips/:tripId" element={<TripDetail />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clients/:clientId" element={<ClientProfile />} />
            </Routes>
          </main>
        </div>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
