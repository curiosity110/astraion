import { useState } from "react";

function App() {
  // SeatGrid.tsx
  const params = new URLSearchParams(location.search);
  const preselectSeat = Number(params.get("seat") ?? 0);
  // SeatGrid.tsx
  return (
    <div>
      <h1>Astraion Travel </h1>
    </div>
  );
}

export default App;
