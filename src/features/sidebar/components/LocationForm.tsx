import React, { useState } from "react";
import { MapPin } from "lucide-react";
import type { Template, LocationFormData } from "../../../utils/types";

interface LocationFormProps {
  template: Template;
  formData: LocationFormData;
  onFormDataChange: (data: LocationFormData) => void;
  onSetLocation: () => void;
  onSubmit: () => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  template,
  formData,
  onFormDataChange,
  onSetLocation,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
        <p className="text-sm text-gray-600">{template.description}</p>
      </div>

      {/* Status Selector */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            onFormDataChange({
              ...formData,
              status: e.target.value as "created" | "ongoing" | "completed",
            })
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created">Halted (Created)</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Location Coordinates */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <MapPin size={16} />
          Location Coordinates *
        </h4>

        <button
          onClick={onSetLocation}
          className="w-full mb-3 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
        >
          <MapPin size={16} />
          Set in Map
        </button>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Latitude *
          </label>
          <input
            type="number"
            step="any"
            placeholder="Latitude (e.g., 27.7172)"
            value={formData.place.latitude}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                place: {
                  ...formData.place,
                  latitude:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Longitude *
          </label>
          <input
            type="number"
            step="any"
            placeholder="Longitude (e.g., 85.3240)"
            value={formData.place.longitude}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                place: {
                  ...formData.place,
                  longitude:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Dynamic Fields */}
      {template.dynamicFields.map((field) => {
        const fieldValue = formData[field.key];

        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && "*"}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={typeof fieldValue === "string" ? fieldValue : ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    [field.key]: e.target.value,
                  })
                }
                placeholder={
                  field.description || `Enter ${field.label.toLowerCase()}`
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={typeof fieldValue === "number" ? fieldValue : 0}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    [field.key]: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "date" && (
              <input
                type="date"
                value={typeof fieldValue === "string" ? fieldValue : ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    [field.key]: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "time" && (
              <input
                type="time"
                value={typeof fieldValue === "string" ? fieldValue : ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    [field.key]: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "link" && (
              <input
                type="url"
                value={typeof fieldValue === "string" ? fieldValue : ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    [field.key]: e.target.value,
                  })
                }
                placeholder={
                  field.description ||
                  "Enter full URL (e.g., https://example.com)"
                }
                pattern="https?://.+"
                title="Please enter a valid URL starting with http:// or https://"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "image" && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onFormDataChange({
                        ...formData,
                        [field.key]: file,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldValue instanceof File && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {fieldValue.name}
                  </p>
                )}
              </div>
            )}

            {field.type === "document" && (
              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onFormDataChange({
                        ...formData,
                        [field.key]: file,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldValue instanceof File && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {fieldValue.name}
                  </p>
                )}
              </div>
            )}

            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 text-white font-semibold rounded-lg transition ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 cursor-pointer hover:scale-102"
        }`}
      >
        {isSubmitting ? "Adding Location..." : "Add Location"}
      </button>
    </div>
  );
};
