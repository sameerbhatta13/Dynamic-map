import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { NEPAL_BOUNDS } from "../utils/constants";

interface UseMapLibreProps {
  onMapClick: () => void;
  onMapClickForLocation: (e: maplibregl.MapMouseEvent) => void;
  isSettingLocation: boolean;
  onMapLoad: () => void;
}

export const useMapLibre = ({
  onMapClick,
  onMapClickForLocation,
  isSettingLocation,
  onMapLoad,
}: UseMapLibreProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Store callbacks and state in refs so they're always current
  const isSettingLocationRef = useRef(isSettingLocation);
  const onMapClickRef = useRef(onMapClick);
  const onMapClickForLocationRef = useRef(onMapClickForLocation);

  // Update refs when props change
  useEffect(() => {
    isSettingLocationRef.current = isSettingLocation;
  }, [isSettingLocation]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onMapClickForLocationRef.current = onMapClickForLocation;
  }, [onMapClickForLocation]);

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

      map.current.setMaxBounds(NEPAL_BOUNDS);
      map.current.addControl(
        new window.maplibregl.NavigationControl(),
        "top-right"
      );

      map.current.on("click", (e) => {
        // Check if click was on a marker
        const target = e.originalEvent.target as HTMLElement;
        const isMarkerClick = target.closest('[data-marker="true"]');

        if (isSettingLocationRef.current) {
          onMapClickForLocationRef.current(e);
        } else if (!isMarkerClick) {
          // Only clear locked markers and close modal if not clicking on a marker
          const allMarkers = document.querySelectorAll('[data-marker="true"]');
          allMarkers.forEach((m) => {
            m.removeAttribute("data-locked");
          });
          onMapClickRef.current();
        }
      });

      map.current.on("load", () => {
        map.current?.once("idle", () => {
          setMapLoaded(true);
          onMapLoad();
        });
      });
    };

    loadMapLibre();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array - initialize once

  // Update cursor based on isSettingLocation
  useEffect(() => {
    if (!map.current) return;

    const canvas = map.current.getCanvas();
    if (isSettingLocation) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
  }, [isSettingLocation]);

  return { mapContainer, map, mapLoaded };
};
