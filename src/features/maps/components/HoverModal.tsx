import { useEffect, useState } from "react";
import {
  X,
  MapPin,
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
import type { Form, Template } from "../../../utils/types";

interface HoverModalProps {
  form: Form;
  template: Template | undefined;
  position: { x: number; y: number };
  onClose?: () => void;
}

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

  const color = "#6b7280";
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
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Location</p>
            <p className="text-sm text-gray-900">
              {form.data.place.lat.toFixed(6)}, {form.data.place.lng.toFixed(6)}
            </p>
          </div>

          {template?.dynamicFields.map((field) => {
            const value = form.data[field.key];
            if (!value || value === "" || value instanceof File) {
              return null;
            }

            // Handle file fields (document/image)
            if (field.type === "document" || field.type === "image") {
              let fileData;
              if (typeof value === "string") {
                try {
                  fileData = JSON.parse(value);
                } catch {
                  fileData = null;
                }
              } else if (typeof value === "object" && "url" in value) {
                fileData = value;
              }

              if (fileData && fileData.url) {
                return (
                  <div key={field.key}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {field.label}
                    </p>
                    <a
                      href={fileData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View {field.type === "image" ? "Image" : "Document"}
                    </a>
                  </div>
                );
              }
              return null;
            }

            // Handle place fields
            if (typeof value === "object" && "lat" in value) {
              return (
                <div key={field.key}>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    {field.label}
                  </p>
                  <p className="text-sm text-gray-900">
                    {value.lat}, {value.lng}
                  </p>
                </div>
              );
            }

            // Handle link fields
            if (field.type === "link" && typeof value === "string") {
              return (
                <div key={field.key}>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    {field.label}
                  </p>
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {value}
                  </a>
                </div>
              );
            }

            // Handle all other fields (text, number, date, time)
            return (
              <div key={field.key}>
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-gray-900 break-words">
                  {value.toString()}
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
