import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";

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

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const nepalBounds: [[number, number], [number, number]] = [
    [78.0, 24.0],
    [90.5, 32.5],
  ];

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

      map.current.on("load", () => {
        loadBoundaries();
        map.current?.once("idle", () => {
          setMapLoaded(true);
        });
      });
    };

    const loadBoundaries = async () => {
      if (!map.current) return;

      try {
        // Load Nepal boundary
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

        // Load province boundaries
        const provincesResponse = await fetch(NEPAL_BOUNDARIES.provinces);
        const provincesData = await provincesResponse.json();

        map.current.addSource("provinces", {
          type: "geojson",
          data: provincesData,
          generateId: true,
        });

        // Add province fill
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
            "fill-opacity": 0.3,
          },
        });

        // Add province borders
        map.current.addLayer({
          id: "province-border",
          type: "line",
          source: "provinces",
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });

        // Add province labels
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
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg">
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
    </div>
  );
}
