import { useEffect, useRef } from "react";

export function useNotificationPolling({
  fetchFn,
  activeInterval = 30000,
  inactiveInterval = 90000,
  enabled = true,
}) {
  const intervalRef = useRef(null);

  function clearPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startPolling(interval) {
    clearPolling();
    intervalRef.current = setInterval(fetchFn, interval);
  }

  useEffect(() => {
    if (!enabled) {
      clearPolling();
      return;
    }

    // chamada imediata
    fetchFn();

    // começa no intervalo ativo
    startPolling(activeInterval);

    function handleVisibilityChange() {
      if (document.hidden) {
        startPolling(inactiveInterval);
      } else {
        startPolling(activeInterval);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearPolling();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [enabled, fetchFn, activeInterval, inactiveInterval]);
}
