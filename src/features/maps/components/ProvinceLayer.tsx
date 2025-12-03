import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import { NEPAL_BOUNDARIES, provinceColors } from "../../../utils/constants";
import type { GeoJSONFeatureCollection, Form } from "../../../utils/types";

interface ProvinceLayerProps {
  map: maplibregl.Map | null;
  forms: Form[];
  getProvince: (lat: number, lng: number) => string;
  onProvinceHover: (province: string, filteredForms: Form[]) => void;
  onProvinceLeave: () => void;
  setProvincesData: (data: GeoJSONFeatureCollection) => void;
}

export const useProvinceLayer = ({
  map,
  forms,
  getProvince,
  onProvinceHover,
  onProvinceLeave,
  setProvincesData,
}: ProvinceLayerProps) => {
  const hoveredProvinceIdRef = useRef<string | number | null>(null);
  const boundariesLoadedRef = useRef(false);

  useEffect(() => {
    if (!map || boundariesLoadedRef.current) return;

    const loadBoundaries = async () => {
      try {
        const boundaryResponse = await fetch(NEPAL_BOUNDARIES.boundary);
        const boundaryData = await boundaryResponse.json();

        map.addSource("nepal-boundary", {
          type: "geojson",
          data: boundaryData,
        });

        map.addLayer({
          id: "nepal-boundary-outline",
          type: "line",
          source: "nepal-boundary",
          paint: {
            "line-color": "#000000",
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });

        // Add semi-transparent overlay outside Nepal
        map.addSource("world", {
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

        map.addLayer({
          id: "world-mask",
          type: "fill",
          source: "world",
          paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 1,
          },
        });

        const provincesResponse = await fetch(NEPAL_BOUNDARIES.provinces);
        const provincesData = await provincesResponse.json();

        setProvincesData(provincesData);

        map.addSource("provinces", {
          type: "geojson",
          data: provincesData,
          generateId: true,
        });

        map.addLayer({
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

        map.addLayer({
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

        map.addLayer({
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

        boundariesLoadedRef.current = true;
      } catch (error) {
        console.error("Failed to load boundaries:", error);
      }
    };

    loadBoundaries();
  }, [map, setProvincesData]);

  // Separate effect for hover handlers
  useEffect(() => {
    if (!map || !boundariesLoadedRef.current) return;

    const handleMouseMove = (
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
            map.setFeatureState(
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
            map.setFeatureState(
              { source: "provinces", id: featureId },
              { hover: true }
            );
          } catch (error) {
            console.warn("Failed to set hover state:", error);
          }
        }

        const rawProvinceName = e.features[0].properties?.shapeName;

        const filtered = forms.filter((form: Form) => {
          const formProvince = getProvince(
            form.data.place.lat,
            form.data.place.lng
          );
          return formProvince === rawProvinceName;
        });

        onProvinceHover(rawProvinceName, filtered);
        map.getCanvas().style.cursor = "pointer";
      }
    };

    const handleMouseLeave = () => {
      if (
        hoveredProvinceIdRef.current !== null &&
        hoveredProvinceIdRef.current !== undefined
      ) {
        try {
          map.setFeatureState(
            { source: "provinces", id: hoveredProvinceIdRef.current },
            { hover: false }
          );
        } catch (error) {
          console.warn("Failed to clear hover state on leave:", error);
        }
      }
      hoveredProvinceIdRef.current = null;
      onProvinceLeave();
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", "province-fill", handleMouseMove);
    map.on("mouseleave", "province-fill", handleMouseLeave);

    return () => {
      map.off("mousemove", "province-fill", handleMouseMove);
      map.off("mouseleave", "province-fill", handleMouseLeave);
    };
  }, [map, forms, getProvince, onProvinceHover, onProvinceLeave]);
};
