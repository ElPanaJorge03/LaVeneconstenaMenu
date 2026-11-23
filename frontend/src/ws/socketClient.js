/**
 * Cliente WebSocket aislado con reconexión exponencial automática.
 * Cumple regla crítica de tiempo real en INSTRUCCIONES.md.
 */
function buildWsUrl(path) {
  const configured = (import.meta.env.VITE_WS_URL || "").replace(/\/$/, "");
  if (configured) {
    return `${configured}${path}`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export function createReconnectingSocket(path, handlers = {}) {
  let socket = null;
  let closedByUser = false;
  let attempt = 0;
  let reconnectTimer = null;
  const maxDelay = 15000;

  const notifyStatus = (status) => {
    handlers.onStatusChange?.(status);
  };

  const connect = () => {
    if (closedByUser) return;
    notifyStatus(attempt === 0 ? "connecting" : "reconnecting");

    try {
      socket = new WebSocket(buildWsUrl(path));
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      attempt = 0;
      notifyStatus("connected");
      handlers.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlers.onMessage?.(data);
      } catch {
        handlers.onMessage?.(event.data);
      }
    };

    socket.onerror = () => {
      notifyStatus("error");
    };

    socket.onclose = () => {
      if (!closedByUser) {
        notifyStatus("disconnected");
        scheduleReconnect();
      }
    };
  };

  const scheduleReconnect = () => {
    if (closedByUser) return;
    attempt += 1;
    const delay = Math.min(1000 * 2 ** Math.min(attempt - 1, 4), maxDelay);
    reconnectTimer = window.setTimeout(connect, delay);
  };

  connect();

  return {
    send(payload) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(typeof payload === "string" ? payload : JSON.stringify(payload));
      }
    },
    close() {
      closedByUser = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (socket) socket.close();
    },
  };
}
