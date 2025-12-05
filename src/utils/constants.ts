import {
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

export const NEPAL_BOUNDARIES = {
  boundary: "/geoBoundaries-NPL-ADM1/geoBoundaries-NPL-ADM0_simplified.geojson",
  provinces:
    "/geoBoundaries-NPL-ADM1/geoBoundaries-NPL-ADM1_simplified.geojson",
};

export const statusColors: Record<string, string> = {
  created: "#ef4444", // Red for halted/created
  ongoing: "#eab308", // Yellow for ongoing
  completed: "#22c55e", // Green for completed
};

export const provinceColors: Record<string, string> = {
  "Koshi Province": "#ef4444",
  "Madhesh Province": "#f97316",
  "Bagmati Province": "#eab308",
  "Gandaki Province": "#22c55e",
  "Lumbini Province": "#06b6d4",
  "Karnali Province": "#8b5cf6",
  "Sudurpaschim Province": "#ec4899",
};

export const MARKER_ICONS = [
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

export const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [78.0, 24.0],
  [90.5, 32.5],
];

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://map-be.cellapp.co/api";
export const API_TOKEN = "Bearer YOUR_SECRET_TOKEN";

export const APP_BASE_URL =
  import.meta.env.VITE_APP_URL || "https://map-be.cellapp.co";
