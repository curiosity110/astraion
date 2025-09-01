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
    let attempt = 0;
    let ws: WebSocket | null = null;
    let timer: number | null = null;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const WS_URL = `${proto}://${window.location.host}/ws/dashboard/`;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
      } catch (e) {
        scheduleReconnect();
        return;
      }
      ws.onopen = () => {
        setConnected(true);
        attempt = 0;
      };
      ws.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };
      ws.onmessage = (e) => {
        const msg = typeof e.data === 'string' ? e.data : '';
        setToasts((t) => [...t, { id: Date.now(), message: msg }]);
        window.dispatchEvent(new CustomEvent('ws-message', { detail: msg }));
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    const scheduleReconnect = () => {
      attempt += 1;
      const delay = Math.min(30000, 500 * 2 ** Math.min(attempt, 6));
      if (timer) window.clearTimeout(timer);
      // @ts-ignore - setTimeout returns number in browsers
      timer = window.setTimeout(connect, delay);
    };

    connect();
    return () => {
      if (timer) window.clearTimeout(timer);
      ws?.close();
    };
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
