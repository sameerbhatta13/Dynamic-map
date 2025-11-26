import type { GeoJSONFeatureCollection } from "./types";

export const isPointInPolygon = (
  point: [number, number],
  polygon: Array<[number, number]>
): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const getProvinceFromCoordinates = (
  lat: number,
  lng: number,
  provincesData: GeoJSONFeatureCollection | null
): string => {
  if (!provincesData) {
    return "Unknown Province";
  }

  const point: [number, number] = [lng, lat];

  for (const feature of provincesData.features) {
    const provinceName = feature.properties?.shapeName;
    if (!provinceName) continue;

    const coordinates = feature.geometry.coordinates;
    const polygons =
      feature.geometry.type === "MultiPolygon"
        ? (coordinates as number[][][][])
        : [coordinates as number[][][]];

    for (const polygon of polygons) {
      if (isPointInPolygon(point, polygon[0] as Array<[number, number]>)) {
        return provinceName;
      }
    }
  }

  return "Unknown Province";
};
