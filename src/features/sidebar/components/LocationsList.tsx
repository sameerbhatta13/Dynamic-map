import React from "react";
import { MapPin } from "lucide-react";
import type { Form, Template } from "../../../utils/types";
import { provinceColors } from "../../../utils/constants";

interface LocationsListProps {
  forms: Form[];
  template: Template;
  getProvince: (lat: number, lng: number) => string;
  onLocationClick: (form: Form) => void;
}

export const LocationsList: React.FC<LocationsListProps> = ({
  forms,
  template,
  getProvince,
  onLocationClick,
}) => {
  const templateForms = forms.filter((f) => f.templateId === template.id);

  if (templateForms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No locations added yet for this template.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templateForms.map((form) => {
        const province = getProvince(form.data.place.lat, form.data.place.lng);
        return (
          <div
            key={form.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer"
            onClick={() => onLocationClick(form)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">
                    {form.data.place.lat.toFixed(4)},{" "}
                    {form.data.place.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: provinceColors[province] || "#ef4444",
                    }}
                  />
                  <span className="text-xs text-gray-500">{province}</span>
                </div>
              </div>
            </div>

            {/* Display form data */}
            <div className="mt-3 space-y-2">
              {template.dynamicFields.map((field) => {
                const value = form.data[field.key];
                if (value && value !== "" && !(value instanceof File)) {
                  return (
                    <div key={field.key} className="text-sm">
                      <span className="font-medium text-gray-700">
                        {field.label}:
                      </span>{" "}
                      <span className="text-gray-600">
                        {typeof value === "object" && "lat" in value
                          ? `${value.lat}, ${value.lng}`
                          : value.toString()}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Added: {new Date(form.createdAt).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};
