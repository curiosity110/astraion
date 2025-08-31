import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { client_fetch } from "./components/clients/Client_Fetch";

function App() {
  // SeatGrid.tsx
  const params = new URLSearchParams(location.search);
  const preselectSeat = Number(params.get("seat") ?? 0);
  // SeatGrid.tsx
  const { clients, loading, error, refetch } = client_fetch();
  const [count, setCount] = useState(0);

  if (loading) return <p>Loading…</p>;
  if (error)
    return (
      <p style={{ color: "crimson" }}>
        Error: {error} <button onClick={refetch}>Try again</button>
      </p>
    );

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Astration Travel</h1>
      <div>
        <h1>Clients</h1>
        <button onClick={refetch}>Refresh</button>
        <ul>
          {clients.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
