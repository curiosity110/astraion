import ClientsList from './pages/ClientsList';
import ClientProfile from './pages/ClientProfile';
import TripsList from './pages/TripsList';
import TripDetail from './pages/TripDetail';

function App() {
  const path = window.location.pathname;
  if (path.startsWith('/clients/')) {
    const id = path.split('/')[2];
    return <ClientProfile id={id} />;
  }
  if (path === '/clients') {
    return <ClientsList />;
  }
  if (path.startsWith('/trips/')) {
    const id = path.split('/')[2];
    return <TripDetail id={id} />;
  }
  return <TripsList />;
}

export default App;
