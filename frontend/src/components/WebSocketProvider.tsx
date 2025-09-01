import { createContext, useContext, useEffect, useState } from 'react';

interface Toast {
  id: number;
  message: string;
}

interface WSContext {
  connected: boolean;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const WebSocketContext = createContext<WSContext>({ connected: false, toasts: [], dismiss: () => {} });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard/');
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = typeof e.data === 'string' ? e.data : '';
      setToasts((t) => [...t, { id: Date.now(), message: msg }]);
      window.dispatchEvent(new CustomEvent('ws-message', { detail: msg }));
    };
    return () => ws.close();
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((toast) => toast.id !== id));

  return (
    <WebSocketContext.Provider value={{ connected, toasts, dismiss }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWebSocket() {
  return useContext(WebSocketContext);
}
