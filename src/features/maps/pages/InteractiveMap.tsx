import { useEffect, useRef, useState, useCallback } from "react";
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
import type maplibregl from "maplibre-gl";
import HoverModal from "../components/HoverModal";

declare global {
  interface Window {
    maplibregl: typeof maplibregl;
  }
}

const NEPAL_BOUNDARIES = {
  boundary: "/geoBoundaries-NPL-ADM1/geoBoundaries-NPL-ADM0_simplified.geojson",
  provinces:
    "/geoBoundaries-NPL-ADM1/geoBoundaries-NPL-ADM1_simplified.geojson",
};

const provinceColors: Record<string, string> = {
  "Koshi Province": "#ef4444",
  "Madhesh Province": "#f97316",
  "Bagmati Province": "#eab308",
  "Gandaki Province": "#22c55e",
  "Lumbini Province": "#06b6d4",
  "Karnali Province": "#8b5cf6",
  "Sudurpaschim Province": "#ec4899",
};

interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "time" | "image" | "document" | "place";
  required: boolean;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  markerIcon: string;
  fixedFields: TemplateField[];
  dynamicFields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

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

interface LocationFormData {
  place: {
    latitude: number;
    longitude: number;
  };
  [key: string]:
    | string
    | number
    | File
    | { latitude: number; longitude: number }
    | null;
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

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Template creation states
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("location");
  const [fields, setFields] = useState<TemplateField[]>([
    { key: "", label: "", type: "string", required: false, description: "" },
  ]);

  // Templates and forms
  const [templates, setTemplates] = useState<Template[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Hover states
  const [hoveredForm, setHoveredForm] = useState<Form | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [filteredByHover, setFilteredByHover] = useState<Form[]>([]);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoveredProvinceIdRef = useRef<string | number | null>(null);

  const nepalBounds: [[number, number], [number, number]] = [
    [78.0, 24.0],
    [90.5, 32.5],
  ];

  // Add these to your existing state declarations
  const [activeView, setActiveView] = useState<
    "templates" | "new" | "addLocation"
  >("new");
  const [selectedTemplateForForm, setSelectedTemplateForForm] =
    useState<Template | null>(null);
  const [locationFormData, setLocationFormData] = useState<LocationFormData>({
    place: { latitude: 0, longitude: 0 },
  });

  // Determine which province a coordinate falls into
  const getProvinceFromCoordinates = useCallback(
    (lat: number, lng: number): string => {
      // Approximate province boundaries (you may need to adjust these)
      if (lng > 87.0 && lat > 26.5) return "Koshi Province";
      if (lng < 85.5 && lat < 27.5 && lat > 26.0) return "Madhesh Province";
      if (lng > 84.5 && lng < 86.5 && lat > 27.0 && lat < 28.5)
        return "Bagmati Province";
      if (lng > 83.0 && lng < 85.0 && lat > 27.5) return "Gandaki Province";
      if (lng < 83.5 && lat < 28.0 && lat > 27.0) return "Lumbini Province";
      if (lng < 82.5 && lat > 28.5) return "Karnali Province";
      if (lng < 81.0) return "Sudurpaschim Province";
      return "Bagmati Province"; // Default
    },
    []
  );

  // Clear hover states
  const clearHoverState = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredForm(null);
      setModalPosition(null);
    }, 150);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((form: Form, event: MouseEvent) => {
    event.stopPropagation();

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    setHoveredForm(form);
    if (map.current) {
      const point = map.current.project([
        form.data.place.lng,
        form.data.place.lat,
      ]);
      setModalPosition({ x: point.x, y: point.y });
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(() => {
    setHoveredForm(null);
    setModalPosition(null);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setHoveredForm(null);
    setModalPosition(null);
  }, []);

  // Load all forms
  const loadAllForms = async () => {
    try {
      const response = await fetch("http://192.168.1.147:3000/api/form/list", {
        method: "GET",
        headers: {
          Authorization: "Bearer YOUR_SECRET_TOKEN",
        },
      });

      if (response.ok) {
        const allForms = await response.json();
        setForms(allForms);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    }
  };

  // Map initialization
  useEffect(() => {
    const loadMapLibre = () => {
      if (window.maplibregl) {
        initializeMap();
        return;
      }

      const link = document.createElement("link");
      link.href = "https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js";
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (map.current || !mapContainer.current || !window.maplibregl) return;

      map.current = new window.maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap Contributors",
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [84.0, 28.4],
        zoom: 6,
        renderWorldCopies: false,
      });

      map.current.setMaxBounds(nepalBounds);
      map.current.addControl(
        new window.maplibregl.NavigationControl(),
        "top-right"
      );

      map.current.on("click", handleMapClick);

      map.current.on("load", () => {
        loadBoundaries();
        map.current?.once("idle", () => {
          setMapLoaded(true);
          loadAllForms();
        });
      });

      // Update modal position on map movement
      const updateModalPosition = () => {
        if (hoveredForm) {
          const point = map.current!.project([
            hoveredForm.data.place.lng,
            hoveredForm.data.place.lat,
          ]);
          setModalPosition({ x: point.x, y: point.y });
        }
      };

      map.current.on("move", updateModalPosition);
      map.current.on("zoom", updateModalPosition);
    };

    const loadBoundaries = async () => {
      if (!map.current) return;

      try {
        const boundaryResponse = await fetch(NEPAL_BOUNDARIES.boundary);
        const boundaryData = await boundaryResponse.json();

        map.current.addSource("nepal-boundary", {
          type: "geojson",
          data: boundaryData,
        });

        map.current.addLayer({
          id: "nepal-boundary-outline",
          type: "line",
          source: "nepal-boundary",
          paint: {
            "line-color": "#000000",
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });

        // Add inverse mask (everything outside Nepal)
        // map.current.addSource("world", {
        //   type: "geojson",
        //   data: {
        //     type: "Feature",
        //     properties: {}, // Add this line
        //     geometry: {
        //       type: "Polygon",
        //       coordinates: [
        //         [
        //           [-180, -90],
        //           [-180, 90],
        //           [180, 90],
        //           [180, -90],
        //           [-180, -90],
        //         ],
        //         ...boundaryData.features[0].geometry.coordinates,
        //       ],
        //     },
        //   },
        // });

        // map.current.addLayer({
        //   id: "world-mask",
        //   type: "fill",
        //   source: "world",
        //   paint: {
        //     "fill-color": "#e5e5e5",
        //     "fill-opacity": 1,
        //   },
        // });

        // Add semi-transparent overlay outside Nepal
        map.current.addSource("world", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-180, -90],
                  [-180, 90],
                  [180, 90],
                  [180, -90],
                  [-180, -90],
                ],
                ...boundaryData.features[0].geometry.coordinates,
              ],
            },
          },
        });

        map.current.addLayer({
          id: "world-mask",
          type: "fill",
          source: "world",
          paint: {
            "fill-color": "#ffffff", // White overlay
            "fill-opacity": 0.8, // 60% opacity - adjust this value (0.4 to 0.8 work well)
          },
        });

        const provincesResponse = await fetch(NEPAL_BOUNDARIES.provinces);
        const provincesData = await provincesResponse.json();

        map.current.addSource("provinces", {
          type: "geojson",
          data: provincesData,
          generateId: true,
        });

        map.current.addLayer({
          id: "province-fill",
          type: "fill",
          source: "provinces",
          paint: {
            "fill-color": [
              "case",
              ["in", ["get", "shapeName"], ["literal", ["Koshi Province"]]],
              provinceColors["Koshi Province"],
              ["in", ["get", "shapeName"], ["literal", ["Madhesh Province"]]],
              provinceColors["Madhesh Province"],
              ["in", ["get", "shapeName"], ["literal", ["Bagmati Province"]]],
              provinceColors["Bagmati Province"],
              ["in", ["get", "shapeName"], ["literal", ["Gandaki Province"]]],
              provinceColors["Gandaki Province"],
              ["in", ["get", "shapeName"], ["literal", ["Lumbini Province"]]],
              provinceColors["Lumbini Province"],
              ["in", ["get", "shapeName"], ["literal", ["Karnali Province"]]],
              provinceColors["Karnali Province"],
              [
                "in",
                ["get", "shapeName"],
                ["literal", ["Sudurpaschim Province"]],
              ],
              provinceColors["Sudurpaschim Province"],
              "#ef4444",
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.4,
              0.1,
            ],
          },
        });

        map.current.addLayer({
          id: "province-border",
          type: "line",
          source: "provinces",
          paint: {
            "line-color": [
              "case",
              ["in", ["get", "shapeName"], ["literal", ["Koshi Province"]]],
              provinceColors["Koshi Province"],
              ["in", ["get", "shapeName"], ["literal", ["Madhesh Province"]]],
              provinceColors["Madhesh Province"],
              ["in", ["get", "shapeName"], ["literal", ["Bagmati Province"]]],
              provinceColors["Bagmati Province"],
              ["in", ["get", "shapeName"], ["literal", ["Gandaki Province"]]],
              provinceColors["Gandaki Province"],
              ["in", ["get", "shapeName"], ["literal", ["Lumbini Province"]]],
              provinceColors["Lumbini Province"],
              ["in", ["get", "shapeName"], ["literal", ["Karnali Province"]]],
              provinceColors["Karnali Province"],
              [
                "in",
                ["get", "shapeName"],
                ["literal", ["Sudurpaschim Province"]],
              ],
              provinceColors["Sudurpaschim Province"],
              "#6b7280",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              4,
              2,
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              1,
              0.6,
            ],
          },
        });

        map.current.addLayer({
          id: "province-labels",
          type: "symbol",
          source: "provinces",
          layout: {
            "text-field": ["get", "shapeName"],
            "text-font": ["Open Sans Regular"],
            "text-size": 14,
            "text-transform": "uppercase",
          },
          paint: {
            "text-color": "#333333",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });

        // Province hover interactions
        map.current.on(
          "mousemove",
          "province-fill",
          (
            e: maplibregl.MapMouseEvent & {
              features?: maplibregl.MapGeoJSONFeature[];
            }
          ) => {
            if (e.features && e.features.length > 0) {
              if (
                hoveredProvinceIdRef.current !== null &&
                hoveredProvinceIdRef.current !== undefined
              ) {
                try {
                  map.current!.setFeatureState(
                    { source: "provinces", id: hoveredProvinceIdRef.current },
                    { hover: false }
                  );
                } catch (error) {
                  console.warn("Failed to clear previous hover state:", error);
                }
              }

              const featureId = e.features[0].id;
              if (featureId !== null && featureId !== undefined) {
                hoveredProvinceIdRef.current = featureId;
                try {
                  map.current!.setFeatureState(
                    { source: "provinces", id: featureId },
                    { hover: true }
                  );
                } catch (error) {
                  console.warn("Failed to set hover state:", error);
                }
              }

              const rawProvinceName = e.features[0].properties?.shapeName;
              setHoveredProvince(rawProvinceName);

              const filtered = forms.filter((form: Form) => {
                const formProvince = getProvinceFromCoordinates(
                  form.data.place.lat,
                  form.data.place.lng
                );
                return formProvince === rawProvinceName;
              });

              setFilteredByHover(filtered);
              map.current!.getCanvas().style.cursor = "pointer";
            }
          }
        );

        map.current.on("mouseleave", "province-fill", () => {
          if (
            hoveredProvinceIdRef.current !== null &&
            hoveredProvinceIdRef.current !== undefined
          ) {
            try {
              map.current!.setFeatureState(
                { source: "provinces", id: hoveredProvinceIdRef.current },
                { hover: false }
              );
            } catch (error) {
              console.warn("Failed to clear hover state on leave:", error);
            }
          }
          hoveredProvinceIdRef.current = null;
          setHoveredProvince(null);
          setFilteredByHover([]);
          map.current!.getCanvas().style.cursor = "";
        });
      } catch (error) {
        console.error("Failed to load boundaries:", error);
      }
    };

    loadMapLibre();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [handleMapClick, getProvinceFromCoordinates]);

  // Handle marker styling based on hovered province
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const allMarkers = document.querySelectorAll('[data-marker="true"]');

    allMarkers.forEach((markerEl: Element) => {
      const htmlMarker = markerEl as HTMLElement;
      const markerProvince = htmlMarker.getAttribute("data-province");
      const isInHoveredProvince = hoveredProvince === markerProvince;

      // Get current transform to preserve individual marker hover
      const currentTransform = htmlMarker.style.transform;

      if (isInHoveredProvince) {
        htmlMarker.style.width = "20px";
        htmlMarker.style.height = "20px";
        htmlMarker.style.border = "4px solid white";
        htmlMarker.style.boxShadow = `0 0 20px ${htmlMarker.style.backgroundColor}, 0 4px 12px rgba(0, 0, 0, 0.4)`;
        htmlMarker.style.zIndex = "1000";

        // Add pulse animation
        const color = htmlMarker.style.backgroundColor;
        const colorHex = color.match(/#[0-9a-f]{6}/i)?.[0] || "#ef4444";
        const styleId = `pulse-glow-${colorHex.replace("#", "")}`;

        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
            @keyframes pulse-glow-${colorHex.replace("#", "")} {
              0%, 100% { 
                transform: scale(1);
                box-shadow: 0 0 20px ${colorHex}, 0 4px 12px rgba(0, 0, 0, 0.4);
              }
              50% { 
                transform: scale(1.1);
                box-shadow: 0 0 30px ${colorHex}, 0 6px 16px rgba(0, 0, 0, 0.5);
              }
            }
          `;
          document.head.appendChild(style);
        }
        htmlMarker.style.animation = `pulse-glow-${colorHex.replace(
          "#",
          ""
        )} 2s infinite`;
      } else {
        // Reset to normal styling but preserve individual marker hover transform
        htmlMarker.style.width = "16px";
        htmlMarker.style.height = "16px";
        htmlMarker.style.border = "3px solid white";

        // Only reset shadow if not individually hovered (scale 1.3)
        if (currentTransform !== "scale(1.3)") {
          htmlMarker.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
        }

        htmlMarker.style.zIndex = "100";
        htmlMarker.style.animation = "";
      }
    });
  }, [hoveredProvince, mapLoaded]);

  // Render markers when forms or map loads
  useEffect(() => {
    if (!mapLoaded || !map.current || forms.length === 0) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker?.remove());
    markers.current = [];

    forms.forEach((form: Form) => {
      const lng = form.data.place.lng;
      const lat = form.data.place.lat;

      if (isNaN(lng) || isNaN(lat)) {
        console.warn("Invalid coordinates for form", form.id, lng, lat);
        return;
      }

      // const province = getProvinceFromCoordinates(lat, lng);
      // const color = provinceColors[province] || "#ef4444";
      // const isInHoveredProvince = hoveredProvince
      //   ? hoveredProvince === province
      //   : false;

      // const markerEl = document.createElement("div");
      // markerEl.setAttribute("data-marker", "true");
      // markerEl.style.backgroundColor = color;
      // markerEl.style.width = isInHoveredProvince ? "20px" : "16px";
      // markerEl.style.height = isInHoveredProvince ? "20px" : "16px";
      // markerEl.style.borderRadius = "50%";
      // markerEl.style.border = isInHoveredProvince
      //   ? "4px solid white"
      //   : "3px solid white";
      // markerEl.style.boxShadow = isInHoveredProvince
      //   ? `0 0 20px ${color}, 0 4px 12px rgba(0, 0, 0, 0.4)`
      //   : "0 2px 8px rgba(0, 0, 0, 0.3)";
      // markerEl.style.cursor = "pointer";
      // markerEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      // markerEl.style.position = "absolute";
      // markerEl.style.zIndex = isInHoveredProvince ? "1000" : "100";

      const province = getProvinceFromCoordinates(lat, lng);
      const color = provinceColors[province] || "#ef4444";
      const isInHoveredProvince = false; // Remove hover-based styling from initial render

      const markerEl = document.createElement("div");
      markerEl.setAttribute("data-marker", "true");
      markerEl.setAttribute("data-province", province); // Add this to identify province
      markerEl.style.backgroundColor = color;
      markerEl.style.width = "16px"; // Always start with normal size
      markerEl.style.height = "16px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.border = "3px solid white"; // Always start with normal border
      markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      markerEl.style.cursor = "pointer";
      markerEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      markerEl.style.position = "absolute";
      markerEl.style.zIndex = "100";

      // Remove the isInHoveredProvince conditional styling and animation

      if (isInHoveredProvince) {
        const styleId = `pulse-glow-${color.replace("#", "")}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
            @keyframes pulse-glow-${color.replace("#", "")} {
              0%, 100% { 
                transform: scale(1);
                box-shadow: 0 0 20px ${color}, 0 4px 12px rgba(0, 0, 0, 0.4);
              }
              50% { 
                transform: scale(1.1);
                box-shadow: 0 0 30px ${color}, 0 6px 16px rgba(0, 0, 0, 0.5);
              }
            }
          `;
          document.head.appendChild(style);
        }
        markerEl.style.animation = `pulse-glow-${color.replace(
          "#",
          ""
        )} 2s infinite`;
      }

      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.transform = "translate(-50%, -50%)";
      wrapper.appendChild(markerEl);

      // Store form data in the marker element for easy access
      markerEl.setAttribute("data-form-id", form.id);

      const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Apply hover transform
        markerEl.style.transform = "scale(1.3)";
        const color = markerEl.style.backgroundColor;
        markerEl.style.boxShadow = `0 0 25px ${color}, 0 6px 16px rgba(0, 0, 0, 0.5)`;

        // Show form details
        setHoveredForm(form);
        const point = map.current!.project([lng, lat]);
        setModalPosition({ x: point.x, y: point.y });
      };

      const handleMouseLeave = () => {
        // Reset transform but keep province hover styling if applicable
        markerEl.style.transform = "scale(1)";

        // Only reset shadow if not in a hovered province
        const markerProvince = markerEl.getAttribute("data-province");
        if (!hoveredProvince || hoveredProvince !== markerProvince) {
          markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
        }

        clearHoverState();
      };

      markerEl.addEventListener("mouseenter", handleMouseEnter);
      markerEl.addEventListener("mouseleave", handleMouseLeave);
      markerEl.addEventListener("click", (e) => handleMarkerClick(form, e));

      const marker = new window.maplibregl.Marker({
        element: wrapper,
        anchor: "center",
        offset: [0, 0],
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [
    forms,
    mapLoaded,
    handleMarkerClick,
    // hoveredProvince,
    // filteredByHover,
    clearHoverState,
    getProvinceFromCoordinates,
  ]);

  // Load templates when sidebar opens
  useEffect(() => {
    if (sidebarOpen && activeView === "templates") {
      loadTemplates();
    }
  }, [sidebarOpen, activeView]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch(
        "http://192.168.1.147:3000/api/template/list",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer YOUR_SECRET_TOKEN",
          },
        }
      );

      if (response.ok) {
        const loadedTemplates = await response.json();
        setTemplates(loadedTemplates);
      } else if (response.status === 204) {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const addField = () => {
    setFields([
      ...fields,
      { key: "", label: "", type: "string", required: false, description: "" },
    ]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, field: Partial<TemplateField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
  };

  const handleCreateTemplate = async () => {
    if (!templateName || templateName.length < 3) {
      alert("Template name must be at least 3 characters long");
      return;
    }

    const validFields = fields.filter((f) => f.key && f.label);
    if (validFields.length === 0) {
      alert("Please add at least one valid field");
      return;
    }

    const preparedFields = validFields.map((field) => {
      const fieldData: {
        key: string;
        label: string;
        type: TemplateField["type"];
        required: boolean;
        description?: string;
      } = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
      };
      if (field.description && field.description.trim() !== "") {
        fieldData.description = field.description;
      }

      return fieldData;
    });

    const requestBody = {
      name: templateName,
      description: templateDescription || "",
      markerIcon: selectedIcon,
      fields: preparedFields,
    };

    try {
      const response = await fetch(
        "http://192.168.1.147:3000/api/template/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_SECRET_TOKEN",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        setTemplateName("");
        setTemplateDescription("");
        setSelectedIcon("pin");
        setFields([
          {
            key: "",
            label: "",
            type: "string",
            required: false,
            description: "",
          },
        ]);
        alert("Template created successfully!");
        loadTemplates();
      } else {
        const errorData = await response.json().catch(() => null);
        alert(
          `Failed to create template: ${
            errorData ? JSON.stringify(errorData) : response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Error creating template: " + error);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-2 w-64">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border-none outline-none text-sm"
          />
        </div>
      </div>

      {/* Province Hover Info */}
      {hoveredProvince && (
        <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20 shadow-2xl">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: provinceColors[hoveredProvince] }}
            />
            <span className="font-medium">{hoveredProvince}</span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {filteredByHover.length} location
            {filteredByHover.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Hover Modal */}
      {hoveredForm && modalPosition && (
        <HoverModal
          form={hoveredForm}
          template={templates.find((t) => t.id === hoveredForm.templateId)}
          position={modalPosition}
          onClose={handleModalClose}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="absolute top-0 left-0 w-96 h-full bg-white shadow-2xl z-20 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
              </svg>
              <h2 className="text-lg font-semibold">Interactive Map</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded cursor-pointer hover:scale-102"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {activeView === "addLocation" ? (
              <button
                onClick={() => {
                  setActiveView("templates");
                  setSelectedTemplateForForm(null);
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer hover:scale-102"
              >
                <ArrowLeft size={18} />
                Back to Templates
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveView("templates")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                    activeView === "templates"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveView("new")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                    activeView === "new"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  New Template
                </button>
                <button className="px-4 py-3 text-gray-400 hover:text-gray-600">
                  <Settings size={18} />
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeView === "new" ? (
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                  placeholder="Description..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MARKER ICON
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {MARKER_ICONS.map((iconItem) => {
                      const IconComponent = iconItem.icon;
                      return (
                        <button
                          key={iconItem.id}
                          onClick={() => setSelectedIcon(iconItem.id)}
                          className={`p-3 border-2 rounded-lg transition flex items-center justify-center cursor-pointer hover:scale-101 ${
                            selectedIcon === iconItem.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <IconComponent size={24} className="text-gray-700" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      FORM FIELDS
                    </label>
                    <button
                      onClick={addField}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:scale-102"
                    >
                      <Plus size={16} />
                      Add Field
                    </button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Field Key"
                            value={field.key}
                            onChange={(e) =>
                              updateField(index, { key: e.target.value })
                            }
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeField(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer hover:scale-102"
                            disabled={fields.length === 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Field Label"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, {
                              type: e.target.value as TemplateField["type"],
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="image">Image</option>
                          <option value="document">Document</option>
                          <option value="place">Place</option>
                        </select>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(index, { required: e.target.checked })
                            }
                            className="w-4 h-4"
                          />
                          Required
                        </label>
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={field.description || ""}
                          onChange={(e) =>
                            updateField(index, { description: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateTemplate}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                  Save Template
                </button>
              </div>
            ) : activeView === "addLocation" && selectedTemplateForForm ? (
              // NEW: Location form in sidebar
              <div className="p-4 space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedTemplateForForm.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedTemplateForForm.description}
                  </p>
                </div>

                {/* Location Coordinates */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    Location Coordinates *
                  </h4>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (e.g., 27.7172)"
                      value={locationFormData.place.latitude}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          place: {
                            ...locationFormData.place,
                            latitude:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (e.g., 85.3240)"
                      value={locationFormData.place.longitude}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          place: {
                            ...locationFormData.place,
                            longitude:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Dynamic Fields */}
                {selectedTemplateForForm.dynamicFields.map((field) => {
                  const fieldValue = locationFormData[field.key];

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && "*"}
                      </label>

                      {field.type === "string" && (
                        <input
                          type="text"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            setLocationFormData({
                              ...locationFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          placeholder={
                            field.description ||
                            `Enter ${field.label.toLowerCase()}`
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "number" && (
                        <input
                          type="number"
                          value={
                            typeof fieldValue === "number" ? fieldValue : 0
                          }
                          onChange={(e) =>
                            setLocationFormData({
                              ...locationFormData,
                              [field.key]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "date" && (
                        <input
                          type="date"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            setLocationFormData({
                              ...locationFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "time" && (
                        <input
                          type="time"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            setLocationFormData({
                              ...locationFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={async () => {
                    // Validate required fields
                    if (
                      !locationFormData.place.latitude ||
                      !locationFormData.place.longitude
                    ) {
                      alert("Please provide latitude and longitude");
                      return;
                    }

                    // Submit form
                    const formData = new FormData();
                    formData.append("templateId", selectedTemplateForForm.id);
                    formData.append(
                      "place.lat",
                      locationFormData.place.latitude.toString()
                    );
                    formData.append(
                      "place.lng",
                      locationFormData.place.longitude.toString()
                    );

                    selectedTemplateForForm.dynamicFields.forEach((field) => {
                      const value = locationFormData[field.key];
                      if (
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                      ) {
                        formData.append(field.key, value.toString());
                      }
                    });

                    try {
                      const response = await fetch(
                        "http://192.168.1.147:3000/api/form/create",
                        {
                          method: "POST",
                          headers: {
                            Authorization: "Bearer YOUR_SECRET_TOKEN",
                          },
                          body: formData,
                        }
                      );

                      if (response.ok) {
                        alert("Location added successfully!");
                        loadAllForms(); // Refresh the forms
                        setActiveView("templates"); // Go back to templates view
                      } else {
                        alert("Failed to add location");
                      }
                    } catch (error) {
                      console.error("Error:", error);
                      alert("Error adding location");
                    }
                  }}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition cursor-pointer hover:scale-102"
                >
                  Add Location
                </button>
              </div>
            ) : (
              <div className="p-4">
                {isLoadingTemplates ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading templates...
                  </div>
                ) : templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {template.description || "No description"}
                            </p>
                          </div>
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {(() => {
                              const iconData = MARKER_ICONS.find(
                                (i) => i.id === template.markerIcon
                              );
                              const IconComponent = iconData?.icon || MapPin;
                              return (
                                <IconComponent
                                  size={20}
                                  className="text-gray-700"
                                />
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{template.dynamicFields.length} fields</span>
                          <span>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          className="w-full py-2 bg-purple-100 hover:text-white text-sm font-medium rounded hover:bg-purple-500 border border-purple-600 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                          onClick={() => {
                            setSelectedTemplateForForm(template);
                            setActiveView("addLocation");
                            // Initialize form data with proper typing
                            const initialData: LocationFormData = {
                              place: { latitude: 0, longitude: 0 },
                            };
                            template.dynamicFields.forEach((field) => {
                              if (field.type === "number") {
                                initialData[field.key] = 0;
                              } else if (field.type === "place") {
                                initialData[field.key] = {
                                  latitude: 0,
                                  longitude: 0,
                                };
                              } else if (
                                field.type === "image" ||
                                field.type === "document"
                              ) {
                                initialData[field.key] = null;
                              } else {
                                initialData[field.key] = "";
                              }
                            });
                            setLocationFormData(initialData);
                          }}
                        >
                          <MapPin size={16} />
                          Add Location
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No templates found. Create one to get started!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg z-30">
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
    </div>
  );
}
