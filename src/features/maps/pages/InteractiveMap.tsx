import { useEffect, useState, useCallback, useRef } from "react";
import type maplibregl from "maplibre-gl";
import HoverModal from "../components/HoverModal";
import { Sidebar } from "../../sidebar/components/Sidebar";
import { LocationBanner } from "../components/LocationBanner";
import { ProvinceInfo } from "../components/ProvinceInfo";
import { useMapLibre } from "../../../hooks/useMapLibre";
import { useTemplates } from "../../../hooks/useTemplates";
import { useForms } from "../../../hooks/useForms";
import { useProvinceDetection } from "../../../hooks/useProvinceDetection";
import { useProvinceLayer } from "../components/ProvinceLayer";
import { useMapMarkers } from "../components/MapMarkers";
import type {
  Template,
  LocationFormData,
  Form,
  TemplateField,
} from "../../../utils/types";

declare global {
  interface Window {
    maplibregl: typeof maplibregl;
  }
}

export default function InteractiveMap() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hover states
  const [hoveredForm, setHoveredForm] = useState<Form | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [filteredByHover, setFilteredByHover] = useState<Form[]>([]);
  const hoverTimeoutRef = useRef<number | null>(null);

  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [locationViewTab, setLocationViewTab] = useState<"add" | "view">("add");

  const [activeView, setActiveView] = useState<
    "templates" | "new" | "addLocation"
  >("new");
  const [selectedTemplateForForm, setSelectedTemplateForForm] =
    useState<Template | null>(null);
  const [locationFormData, setLocationFormData] = useState<LocationFormData>({
    place: { latitude: 0, longitude: 0 },
  });

  // Custom hooks
  const {
    templates,
    isLoading: isLoadingTemplates,
    loadTemplates,
    createTemplate,
  } = useTemplates();
  const { forms, loadAllForms, createForm } = useForms();
  const { setProvincesData, getProvince } = useProvinceDetection();

  // Map initialization
  const { mapContainer, map, mapLoaded } = useMapLibre({
    onMapClick: () => {
      setHoveredForm(null);
      setModalPosition(null);
    },
    onMapClickForLocation: (e: maplibregl.MapMouseEvent) => {
      if (!isSettingLocation) return;

      const { lng, lat } = e.lngLat;

      setLocationFormData((prev) => ({
        ...prev,
        place: {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        },
      }));

      setIsSettingLocation(false);
    },
    isSettingLocation,
    onMapLoad: loadAllForms,
  });

  // Create stable callback functions using refs
  const clearHoverState = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredForm(null);
      setModalPosition(null);
    }, 150);
  }, []);

  // Use a function that doesn't need memoization for marker click
  const handleMarkerClick = (form: Form, event: MouseEvent) => {
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
  };

  const handleModalClose = useCallback(() => {
    setHoveredForm(null);
    setModalPosition(null);
  }, []);

  // Use a function that doesn't need memoization for marker hover
  const handleMarkerHover = (form: Form, lng: number, lat: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredForm(form);
    if (map.current) {
      const point = map.current.project([lng, lat]);
      setModalPosition({ x: point.x, y: point.y });
    }
  };

  const onProvinceHover = useCallback((province: string, filtered: Form[]) => {
    setHoveredProvince(province);
    setFilteredByHover(filtered);
  }, []);

  const onProvinceLeave = useCallback(() => {
    setHoveredProvince(null);
    setFilteredByHover([]);
  }, []);

  // Province layer
  useProvinceLayer({
    map: map.current,
    forms,
    getProvince,
    onProvinceHover,
    onProvinceLeave,
    setProvincesData,
  });

  // Markers
  useMapMarkers({
    map: map.current,
    mapLoaded,
    forms,
    hoveredProvince,
    getProvince,
    onMarkerClick: handleMarkerClick,
    onMarkerHover: handleMarkerHover,
    onMarkerLeave: clearHoverState,
  });

  // Update modal position on map movement
  useEffect(() => {
    if (!map.current || !hoveredForm) return;

    const updateModalPosition = () => {
      if (hoveredForm && map.current) {
        const point = map.current.project([
          hoveredForm.data.place.lng,
          hoveredForm.data.place.lat,
        ]);
        setModalPosition({ x: point.x, y: point.y });
      }
    };

    map.current.on("move", updateModalPosition);
    map.current.on("zoom", updateModalPosition);

    return () => {
      if (map.current) {
        map.current.off("move", updateModalPosition);
        map.current.off("zoom", updateModalPosition);
      }
    };
  }, [hoveredForm]);

  // Load templates when sidebar opens
  useEffect(() => {
    if (sidebarOpen && activeView === "templates") {
      loadTemplates();
    }
  }, [sidebarOpen, activeView, loadTemplates]);

  // Cleanup hover timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateTemplate = async (data: {
    name: string;
    description: string;
    markerIcon: string;
    fields: TemplateField[];
  }) => {
    const result = await createTemplate(data);
    if (result.success) {
      alert("Template created successfully!");
    } else {
      alert(`Failed to create template: ${result.error}`);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateForForm(template);
    setActiveView("addLocation");
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
      } else if (field.type === "image" || field.type === "document") {
        initialData[field.key] = null;
      } else {
        initialData[field.key] = "";
      }
    });
    setLocationFormData(initialData);
  };

  const handleSubmitLocation = async () => {
    if (!selectedTemplateForForm) return;

    if (!locationFormData.place.latitude || !locationFormData.place.longitude) {
      alert("Please provide latitude and longitude");
      return;
    }

    const formData = new FormData();
    formData.append("templateId", selectedTemplateForForm.id);
    formData.append("place.lat", locationFormData.place.latitude.toString());
    formData.append("place.lng", locationFormData.place.longitude.toString());

    selectedTemplateForForm.dynamicFields.forEach((field) => {
      const value = locationFormData[field.key];
      if (value !== null && value !== undefined && value !== "") {
        if (value instanceof File) {
          formData.append(field.key, value);
        } else if (typeof value === "object" && "latitude" in value) {
          // Skip place type to avoid duplication
        } else {
          formData.append(field.key, value.toString());
        }
      }
    });

    const result = await createForm(formData);

    if (result.success) {
      alert("Location added successfully!");
      setLocationViewTab("view");

      const initialData: LocationFormData = {
        place: { latitude: 0, longitude: 0 },
      };
      selectedTemplateForForm.dynamicFields.forEach((field) => {
        if (field.type === "number") {
          initialData[field.key] = 0;
        } else if (field.type === "place") {
          initialData[field.key] = {
            latitude: 0,
            longitude: 0,
          };
        } else if (field.type === "image" || field.type === "document") {
          initialData[field.key] = null;
        } else {
          initialData[field.key] = "";
        }
      });
      setLocationFormData(initialData);
    } else {
      alert("Failed to add location");
    }
  };

  const handleLocationClick = (form: Form) => {
    if (map.current) {
      map.current.flyTo({
        center: [form.data.place.lng, form.data.place.lat],
        zoom: 14,
        duration: 1500,
      });
    }
    setHoveredForm(form);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      <LocationBanner
        isVisible={isSettingLocation}
        onCancel={() => setIsSettingLocation(false)}
      />

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition cursor-pointer hover:scale-102"
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

      {hoveredProvince && (
        <ProvinceInfo
          provinceName={hoveredProvince}
          locationCount={filteredByHover.length}
        />
      )}

      {hoveredForm && modalPosition && (
        <HoverModal
          form={hoveredForm}
          template={templates.find((t) => t.id === hoveredForm.templateId)}
          position={modalPosition}
          onClose={handleModalClose}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view === "templates" || view === "new") {
            setSelectedTemplateForForm(null);
          }
        }}
        templates={templates}
        isLoadingTemplates={isLoadingTemplates}
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateForForm={selectedTemplateForForm}
        locationViewTab={locationViewTab}
        setLocationViewTab={setLocationViewTab}
        locationFormData={locationFormData}
        onLocationFormDataChange={setLocationFormData}
        onSetLocationInMap={() => setIsSettingLocation(true)}
        onSubmitLocation={handleSubmitLocation}
        forms={forms}
        getProvince={getProvince}
        onLocationClick={handleLocationClick}
        onCreateTemplate={handleCreateTemplate}
      />

      {!mapLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg z-30">
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
    </div>
  );
}
