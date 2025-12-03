// import { useEffect, useRef } from "react";
// import type maplibregl from "maplibre-gl";
// import type { Form } from "../../../utils/types";
// import { provinceColors } from "../../../utils/constants";

// interface MapMarkersProps {
//   map: maplibregl.Map | null;
//   mapLoaded: boolean;
//   forms: Form[];
//   hoveredProvince: string | null;
//   getProvince: (lat: number, lng: number) => string;
//   onMarkerClick: (form: Form, event: MouseEvent) => void;
//   onMarkerHover: (form: Form, lng: number, lat: number) => void;
//   onMarkerLeave: () => void;
// }

// export const useMapMarkers = ({
//   map,
//   mapLoaded,
//   forms,
//   hoveredProvince,
//   getProvince,
//   onMarkerClick,
//   onMarkerHover,
//   onMarkerLeave,
// }: MapMarkersProps) => {
//   const markers = useRef<maplibregl.Marker[]>([]);
//   const formsRef = useRef<Form[]>([]);

//   // Store callbacks in refs to avoid recreating markers
//   const onMarkerClickRef = useRef(onMarkerClick);
//   const onMarkerHoverRef = useRef(onMarkerHover);
//   const onMarkerLeaveRef = useRef(onMarkerLeave);

//   useEffect(() => {
//     onMarkerClickRef.current = onMarkerClick;
//     onMarkerHoverRef.current = onMarkerHover;
//     onMarkerLeaveRef.current = onMarkerLeave;
//   }, [onMarkerClick, onMarkerHover, onMarkerLeave]);

//   // Update formsRef when forms change
//   useEffect(() => {
//     formsRef.current = forms;
//   }, [forms]);

//   // Render markers - only when map loads or forms identity changes
//   useEffect(() => {
//     if (!mapLoaded || !map || forms.length === 0) return;

//     // Clear existing markers
//     markers.current.forEach((marker) => marker?.remove());
//     markers.current = [];

//     forms.forEach((form: Form) => {
//       const lng = form.data.place.lng;
//       const lat = form.data.place.lat;

//       if (isNaN(lng) || isNaN(lat)) {
//         console.warn("Invalid coordinates for form", form.id, lng, lat);
//         return;
//       }

//       const province = getProvince(lat, lng);
//       const color = provinceColors[province] || "#ef4444";

//       const markerEl = document.createElement("div");
//       markerEl.setAttribute("data-marker", "true");
//       markerEl.setAttribute("data-province", province);
//       markerEl.style.backgroundColor = color;
//       markerEl.style.width = "16px";
//       markerEl.style.height = "16px";
//       markerEl.style.borderRadius = "50%";
//       markerEl.style.border = "3px solid white";
//       markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
//       markerEl.style.cursor = "pointer";
//       markerEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
//       markerEl.style.position = "absolute";
//       markerEl.style.zIndex = "100";

//       const wrapper = document.createElement("div");
//       wrapper.style.position = "absolute";
//       wrapper.style.transform = "translate(-50%, -50%)";
//       wrapper.appendChild(markerEl);

//       markerEl.setAttribute("data-form-id", form.id);

//       const handleMouseEnter = () => {
//         markerEl.style.transform = "scale(1.3)";
//         const color = markerEl.style.backgroundColor;
//         markerEl.style.boxShadow = `0 0 25px ${color}, 0 6px 16px rgba(0, 0, 0, 0.5)`;
//         onMarkerHoverRef.current(form, lng, lat);
//       };

//       const handleMouseLeave = () => {
//         markerEl.style.transform = "scale(1)";
//         const markerProvince = markerEl.getAttribute("data-province");
//         if (!hoveredProvince || hoveredProvince !== markerProvince) {
//           markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
//         }
//         onMarkerLeaveRef.current();
//       };

//       markerEl.addEventListener("mouseenter", handleMouseEnter);
//       markerEl.addEventListener("mouseleave", handleMouseLeave);
//       markerEl.addEventListener("click", (e) =>
//         onMarkerClickRef.current(form, e)
//       );

//       const marker = new window.maplibregl.Marker({
//         element: wrapper,
//         anchor: "center",
//         offset: [0, 0],
//       })
//         .setLngLat([lng, lat])
//         .addTo(map);

//       markers.current.push(marker);
//     });

//     return () => {
//       markers.current.forEach((marker) => marker?.remove());
//       markers.current = [];
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [mapLoaded, map, getProvince, forms.length]);

//   // Handle province hover styling - independent of marker recreation
//   useEffect(() => {
//     if (!mapLoaded || !map) return;

//     const allMarkers = document.querySelectorAll('[data-marker="true"]');

//     allMarkers.forEach((markerEl: Element) => {
//       const htmlMarker = markerEl as HTMLElement;
//       const markerProvince = htmlMarker.getAttribute("data-province");
//       const isInHoveredProvince = hoveredProvince === markerProvince;

//       // Get current transform to preserve individual marker hover
//       const currentTransform = htmlMarker.style.transform;

//       if (isInHoveredProvince) {
//         htmlMarker.style.width = "20px";
//         htmlMarker.style.height = "20px";
//         htmlMarker.style.border = "4px solid white";
//         htmlMarker.style.boxShadow = `0 0 20px ${htmlMarker.style.backgroundColor}, 0 4px 12px rgba(0, 0, 0, 0.4)`;
//         htmlMarker.style.zIndex = "1000";

//         // Add pulse animation
//         const color = htmlMarker.style.backgroundColor;
//         const colorHex = color.match(/#[0-9a-f]{6}/i)?.[0] || "#ef4444";
//         const styleId = `pulse-glow-${colorHex.replace("#", "")}`;

//         if (!document.getElementById(styleId)) {
//           const style = document.createElement("style");
//           style.id = styleId;
//           style.textContent = `
//           @keyframes pulse-glow-${colorHex.replace("#", "")} {
//             0%, 100% {
//               transform: scale(1);
//               box-shadow: 0 0 20px ${colorHex}, 0 4px 12px rgba(0, 0, 0, 0.4);
//             }
//             50% {
//               transform: scale(1.1);
//               box-shadow: 0 0 30px ${colorHex}, 0 6px 16px rgba(0, 0, 0, 0.5);
//             }
//           }
//         `;
//           document.head.appendChild(style);
//         }
//         htmlMarker.style.animation = `pulse-glow-${colorHex.replace(
//           "#",
//           ""
//         )} 2s infinite`;
//       } else {
//         // Reset to normal styling but preserve individual marker hover transform
//         htmlMarker.style.width = "16px";
//         htmlMarker.style.height = "16px";
//         htmlMarker.style.border = "3px solid white";

//         // Only reset shadow if not individually hovered (scale 1.3)
//         if (currentTransform !== "scale(1.3)") {
//           htmlMarker.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
//         }

//         htmlMarker.style.zIndex = "100";
//         htmlMarker.style.animation = "";
//       }
//     });
//   }, [hoveredProvince, mapLoaded, map]);

//   return markers;
// };

import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { Form } from "../../../utils/types";
import { statusColors } from "../../../utils/constants";

interface MapMarkersProps {
  map: maplibregl.Map | null;
  mapLoaded: boolean;
  forms: Form[];
  hoveredProvince: string | null;
  getProvince: (lat: number, lng: number) => string;
  onMarkerClick: (form: Form, event: MouseEvent) => void;
  onMarkerHover: (form: Form, lng: number, lat: number) => void;
  onMarkerLeave: () => void;
}

export const useMapMarkers = ({
  map,
  mapLoaded,
  forms,
  hoveredProvince,
  getProvince,
  onMarkerClick,
  onMarkerHover,
  onMarkerLeave,
}: MapMarkersProps) => {
  const markers = useRef<maplibregl.Marker[]>([]);
  const formsRef = useRef<Form[]>([]);

  const onMarkerClickRef = useRef(onMarkerClick);
  const onMarkerHoverRef = useRef(onMarkerHover);
  const onMarkerLeaveRef = useRef(onMarkerLeave);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    onMarkerHoverRef.current = onMarkerHover;
    onMarkerLeaveRef.current = onMarkerLeave;
  }, [onMarkerClick, onMarkerHover, onMarkerLeave]);

  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);

  useEffect(() => {
    if (!mapLoaded || !map || forms.length === 0) return;

    markers.current.forEach((marker) => marker?.remove());
    markers.current = [];

    forms.forEach((form: Form) => {
      const lng = form.data.place.lng;
      const lat = form.data.place.lat;

      if (isNaN(lng) || isNaN(lat)) {
        console.warn("Invalid coordinates for form", form.id, lng, lat);
        return;
      }

      const province = getProvince(lat, lng);
      const color = statusColors[form.status]; // Use status color

      const markerEl = document.createElement("div");
      markerEl.setAttribute("data-marker", "true");
      markerEl.setAttribute("data-province", province);
      markerEl.setAttribute("data-status", form.status); // Add status attribute
      markerEl.style.backgroundColor = color;
      markerEl.style.width = "16px";
      markerEl.style.height = "16px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.border = "3px solid white";
      markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      markerEl.style.cursor = "pointer";
      markerEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      markerEl.style.position = "absolute";
      markerEl.style.zIndex = "100";

      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.transform = "translate(-50%, -50%)";
      wrapper.appendChild(markerEl);

      markerEl.setAttribute("data-form-id", form.id);

      const handleMouseEnter = () => {
        markerEl.style.transform = "scale(1.3)";
        const color = markerEl.style.backgroundColor;
        markerEl.style.boxShadow = `0 0 25px ${color}, 0 6px 16px rgba(0, 0, 0, 0.5)`;
        // Only trigger hover if not clicked/locked
        const isLocked = markerEl.getAttribute("data-locked") === "true";
        if (!isLocked) {
          onMarkerHoverRef.current(form, lng, lat);
        }
      };

      const handleMouseLeave = () => {
        markerEl.style.transform = "scale(1)";
        const markerProvince = markerEl.getAttribute("data-province");
        if (!hoveredProvince || hoveredProvince !== markerProvince) {
          markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
        }
        // Only clear hover if not clicked/locked
        const isLocked = markerEl.getAttribute("data-locked") === "true";
        if (!isLocked) {
          onMarkerLeaveRef.current();
        }
      };

      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();

        // Remove locked state from all other markers
        const allMarkers = document.querySelectorAll('[data-marker="true"]');
        allMarkers.forEach((m) => {
          if (m !== markerEl) {
            m.removeAttribute("data-locked");
          }
        });

        // Toggle locked state on this marker
        const isLocked = markerEl.getAttribute("data-locked") === "true";
        if (isLocked) {
          markerEl.removeAttribute("data-locked");
          onMarkerLeaveRef.current();
        } else {
          markerEl.setAttribute("data-locked", "true");
          onMarkerClickRef.current(form, e);
        }
      };

      markerEl.addEventListener("mouseenter", handleMouseEnter);
      markerEl.addEventListener("mouseleave", handleMouseLeave);
      markerEl.addEventListener("click", handleClick);

      markerEl.addEventListener("mouseenter", handleMouseEnter);
      markerEl.addEventListener("mouseleave", handleMouseLeave);
      markerEl.addEventListener("click", (e) =>
        onMarkerClickRef.current(form, e)
      );

      const marker = new window.maplibregl.Marker({
        element: wrapper,
        anchor: "center",
        offset: [0, 0],
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markers.current.push(marker);
    });

    return () => {
      markers.current.forEach((marker) => marker?.remove());
      markers.current = [];
    };
  }, [mapLoaded, map, getProvince, forms.length]);

  useEffect(() => {
    if (!mapLoaded || !map) return;

    const allMarkers = document.querySelectorAll('[data-marker="true"]');

    allMarkers.forEach((markerEl: Element) => {
      const htmlMarker = markerEl as HTMLElement;
      const markerProvince = htmlMarker.getAttribute("data-province");
      const isInHoveredProvince = hoveredProvince === markerProvince;

      const currentTransform = htmlMarker.style.transform;

      if (isInHoveredProvince) {
        htmlMarker.style.width = "20px";
        htmlMarker.style.height = "20px";
        htmlMarker.style.border = "4px solid white";
        htmlMarker.style.boxShadow = `0 0 20px ${htmlMarker.style.backgroundColor}, 0 4px 12px rgba(0, 0, 0, 0.4)`;
        htmlMarker.style.zIndex = "1000";

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
        htmlMarker.style.width = "16px";
        htmlMarker.style.height = "16px";
        htmlMarker.style.border = "3px solid white";

        if (currentTransform !== "scale(1.3)") {
          htmlMarker.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
        }

        htmlMarker.style.zIndex = "100";
        htmlMarker.style.animation = "";
      }
    });
  }, [hoveredProvince, mapLoaded, map]);

  return markers;
};
