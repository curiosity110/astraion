import ClientsList from './pages/ClientsList';
import ClientProfile from './pages/ClientProfile';
import TripsList from './pages/TripsList';
import TripDetail from './pages/TripDetail';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

function App() {
  const path = window.location.pathname;
  let page;
  if (path.startsWith('/clients/')) {
    const id = path.split('/')[2];
    page = <ClientProfile id={id} />;
  } else if (path === '/clients') {
    page = <ClientsList />;
  } else if (path.startsWith('/trips/')) {
    const id = path.split('/')[2];
    page = <TripDetail id={id} />;
  } else if (path === '/trips') {
    page = <TripsList />;
  } else {
    page = <Dashboard />;
  }
  return (
    <div>
      <Navbar />
      {page}
    </div>
  );
}

export default App;
