import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getWsUrl } from '../config/api';

export function useWebSocket(caseId?: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const addAlert = useStore((state) => state.addAlert);

  useEffect(() => {
    const wsBase = getWsUrl();
    const url = caseId ? `${wsBase}/ws/cases/${caseId}` : `${wsBase}/ws/alerts`;
    let socket: WebSocket;
    let retryTimeout: NodeJS.Timeout;

    function connect() {
      try {
        socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
          // Send ping to start
          socket.send(JSON.stringify({ type: 'ping' }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'alert' || data.type === 'critical_attribution') {
              addAlert({
                level: 'CRITICAL',
                title: 'High-Confidence De-Anonymization',
                message: data.data?.message || `Target de-anonymized in case ${data.case_id}`,
                case_id: data.case_id,
              });
            } else if (data.type === 'tor_circuit_rotated') {
              addAlert({
                level: 'INFO',
                title: 'Tor Circuit Rotated',
                message: `Tor proxy acquired fresh exit relay (${data.data?.mode})`,
              });
            }
          } catch {
            // Non-JSON ping/pong
          }
        };

        socket.onclose = () => {
          // Reconnect after 5s
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {
        retryTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [caseId, addAlert]);

  return wsRef;
}
