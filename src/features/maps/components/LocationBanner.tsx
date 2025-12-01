import React from "react";
import { MapPin } from "lucide-react";

interface LocationBannerProps {
  isVisible: boolean;
  onCancel: () => void;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  isVisible,
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-4 shadow-lg">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <MapPin size={24} className="animate-pulse" />
          <span className="font-semibold text-lg">
            Click on the map to set location
          </span>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium cursor-pointer hover:scale-102"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
