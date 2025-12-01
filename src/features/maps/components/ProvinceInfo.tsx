import React from "react";
import { provinceColors } from "../../../utils/constants";

interface ProvinceInfoProps {
  provinceName: string;
  locationCount: number;
}

export const ProvinceInfo: React.FC<ProvinceInfoProps> = ({
  provinceName,
  locationCount,
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20 shadow-2xl">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: provinceColors[provinceName] }}
        />
        <span className="font-medium">{provinceName}</span>
      </div>
      <div className="text-sm text-gray-300 mt-1">
        {locationCount} location{locationCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
};
