import { useEffect, useState } from "react";
import { createReconnectingSocket } from "../ws/socketClient";

export function useWebSocketStatus(path = "/ws/health/", enabled = true) {
  const [status, setStatus] = useState(enabled ? "connecting" : "idle");

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("WebSocket" in window)) {
      return undefined;
    }

    const client = createReconnectingSocket(path, {
      onStatusChange: setStatus,
      onOpen: () => {
        client.send({ type: "ping" });
      },
    });

    return () => {
      client.close();
    };
  }, [path, enabled]);

  return status;
}
