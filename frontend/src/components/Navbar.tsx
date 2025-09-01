export default function Navbar() {
  return (
    <nav className="bg-primary text-white p-4 flex flex-col sm:flex-row gap-4">
      <a href="/dashboard" className="font-semibold">Dashboard</a>
      <a href="/clients" className="font-semibold">Clients</a>
      <a href="/trips" className="font-semibold">Trips</a>
    </nav>
  );
}
