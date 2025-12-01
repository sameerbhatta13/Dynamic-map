import { useRef, useCallback } from "react";
import type { GeoJSONFeatureCollection } from "../utils/types";
import { getProvinceFromCoordinates } from "../utils/provinceUtils";

export const useProvinceDetection = () => {
  const provincesDataRef = useRef<GeoJSONFeatureCollection | null>(null);

  const setProvincesData = useCallback((data: GeoJSONFeatureCollection) => {
    provincesDataRef.current = data;
  }, []);

  // Wrap getProvince with useCallback to maintain stable reference
  const getProvince = useCallback((lat: number, lng: number): string => {
    return getProvinceFromCoordinates(lat, lng, provincesDataRef.current);
  }, []); // Empty array because provincesDataRef is a ref

  return { setProvincesData, getProvince };
};
