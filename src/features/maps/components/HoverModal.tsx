import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  MapPin,
  Settings,
  ArrowLeft,
  Calendar,
  Pin,
  AlertTriangle,
  Building,
  Bell,
  Car,
  Utensils,
  Camera,
  BarChart3,
  Info,
  Hospital,
} from "lucide-react";

interface Form {
  id: string;
  templateId: string;
  data: {
    place: {
      lat: number;
      lng: number;
    };
    [key: string]: string | number | { lat: number; lng: number } | File;
  };
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  markerIcon: string;
}

interface HoverModalProps {
  form: Form;
  template: Template | undefined;
  position: { x: number; y: number };
  onClose?: () => void;
}

// const provinceColors: Record<string, string> = {
//   Koshi: "#ef4444",
//   Madhesh: "#f97316",
//   Bagmati: "#eab308",
//   Gandaki: "#22c55e",
//   Lumbini: "#06b6d4",
//   Karnali: "#8b5cf6",
//   Sudurpaschim: "#ec4899",
// };

const MARKER_ICONS = [
  { id: "location", icon: MapPin },
  { id: "calendar", icon: Calendar },
  { id: "pin", icon: Pin },
  { id: "warning", icon: AlertTriangle },
  { id: "building", icon: Building },
  { id: "bell", icon: Bell },
  { id: "car", icon: Car },
  { id: "restaurant", icon: Utensils },
  { id: "camera", icon: Camera },
  { id: "chart", icon: BarChart3 },
  { id: "info", icon: Info },
  { id: "hospital", icon: Hospital },
];

export default function HoverModal({
  form,
  template,
  position,
  onClose,
}: HoverModalProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-hover-modal]") && onClose) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!form) return null;

  const color = "#6b7280"; // Default gray
  const modalWidth = 320;
  const modalHeight = 300;

  let left = position.x + 15;
  let top = position.y - 10;

  if (left + modalWidth > windowSize.width) {
    left = position.x - modalWidth - 15;
  }

  if (top + modalHeight > windowSize.height) {
    top = position.y - modalHeight + 10;
  }

  if (top < 10) {
    top = 10;
  }

  if (left < 10) {
    left = 10;
  }

  const MarkerIconComponent =
    MARKER_ICONS.find((i) => i.id === template?.markerIcon)?.icon || MapPin;

  return (
    <div
      data-hover-modal="true"
      className="fixed z-50 pointer-events-auto"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-80 shadow-2xl border-2 bg-white rounded-lg animate-in fade-in-0 zoom-in-95 duration-200"
        style={{ borderColor: color }}
      >
        <div
          className="pb-3 pt-4 px-4 relative rounded-t-lg"
          style={{ backgroundColor: `${color}10` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg">
                  <MarkerIconComponent size={20} className="text-gray-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {template?.name || "Location"}
                </h3>
              </div>
            </div>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 h-6 w-6 hover:bg-gray-100 rounded-full flex-shrink-0 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Location</p>
            <p className="text-sm text-gray-900">
              {form.data.place.lat.toFixed(6)}, {form.data.place.lng.toFixed(6)}
            </p>
          </div>

          {Object.entries(form.data).map(([key, value]) => {
            if (key === "place") return null;

            return (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-600 mb-1 capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-gray-900 break-words">
                  {typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </p>
              </div>
            );
          })}

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Created: {new Date(form.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
