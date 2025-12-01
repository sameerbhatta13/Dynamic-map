import { useState, useEffect, useCallback } from "react";
import { Activity } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

export function HealthMonitor() {
  const [status, setStatus] = useState<HealthStatus>("healthy");
  const [tooltip, setTooltip] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();

      if (data.status === "ok" && data.database === "connected") {
        setStatus("healthy");
        setTooltip("All systems operational");
      } else if (data.status === "ok" && data.database !== "connected") {
        setStatus("degraded");
        setTooltip("Database connection issue");
      } else {
        setStatus("unhealthy");
        setTooltip("Service experiencing issues");
      }
    } catch (error) {
      setStatus("unhealthy");
      setTooltip("Cannot reach server");
    }
  }, []);

  useEffect(() => {
    // Defer initial check to avoid synchronous setState
    const initialCheck = setTimeout(() => {
      void checkHealth();
    }, 0);

    const interval = setInterval(() => {
      void checkHealth();
    }, 30000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkHealth]);

  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "unhealthy":
        return "bg-red-500";
    }
  };

  const getStatusRing = () => {
    switch (status) {
      case "healthy":
        return "ring-green-400";
      case "degraded":
        return "ring-yellow-400";
      case "unhealthy":
        return "ring-red-400";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`${getStatusColor()} rounded-full p-3 shadow-lg cursor-pointer transition-all hover:scale-110 ring-4 ${getStatusRing()} ring-opacity-50`}
        >
          <Activity className="w-6 h-6 text-white" />
        </div>

        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}
