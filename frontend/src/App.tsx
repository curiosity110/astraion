import ClientsList from "./pages/ClientsList";
import ClientProfile from "./pages/ClientProfile";
import TripsList from "./pages/TripsList";
import TripDetail from "./pages/TripDetail";
import Dashboard from "./pages/Dashboard";
import ActivityFeed from "./pages/ActivityFeed";
import { WebSocketProvider } from "./components/WebSocketProvider";

function App() {
  const path = window.location.pathname;
  let page;
  if (path.startsWith("/clients/")) {
    const id = path.split("/")[2];
    page = <ClientProfile id={id} />;
  } else if (path === "/clients") {
    page = <ClientsList />;
  } else if (path.startsWith("/trips/")) {
    const id = path.split("/")[2];
    page = <TripDetail id={id} />;
  } else if (path === "/trips") {
    page = <TripsList />;
  } else if (path === "/activity") {
    page = <ActivityFeed />;
  } else {
    page = <Dashboard />;
  }
  return <WebSocketProvider>{page}</WebSocketProvider>;
}

export default App;
