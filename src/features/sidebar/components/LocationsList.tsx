import React from "react";
import { MapPin, Edit2, Trash2, X, Check } from "lucide-react";
import type { Form, Template, LocationFormData } from "../../../utils/types";
import { provinceColors } from "../../../utils/constants";

interface LocationsListProps {
  forms: Form[];
  template: Template;
  getProvince: (lat: number, lng: number) => string;
  onLocationClick: (form: Form) => void;
  onUpdateForm: (formId: string, formData: FormData) => void;
  onDeleteForm: (formId: string) => void;
  onSetLocationInMap: () => void;
  editFormData: LocationFormData; // Use shared state
  onEditFormDataChange: (data: LocationFormData) => void; // Use shared setter
}

export const LocationsList: React.FC<LocationsListProps> = ({
  forms,
  template,
  getProvince,
  onLocationClick,
  onUpdateForm,
  onDeleteForm,
  onSetLocationInMap,
  editFormData,
  onEditFormDataChange,
}) => {
  const [editingFormId, setEditingFormId] = React.useState<string | null>(null);

  const templateForms = forms.filter((f) => f.templateId === template.id);

  const handleEditClick = (e: React.MouseEvent, form: Form) => {
    e.stopPropagation();
    setEditingFormId(form.id);

    // Populate shared editFormData with existing data
    const initialData: LocationFormData = {
      place: {
        latitude: form.data.place.lat,
        longitude: form.data.place.lng,
      },
    };

    template.dynamicFields.forEach((field) => {
      const value = form.data[field.key];
      if (value !== undefined && value !== null) {
        // Convert place format from {lat, lng} to {latitude, longitude}
        if (typeof value === "object" && "lat" in value && "lng" in value) {
          initialData[field.key] = {
            latitude: value.lat,
            longitude: value.lng,
          };
        } else {
          initialData[field.key] = value;
        }
      } else if (field.type === "number") {
        initialData[field.key] = 0;
      } else if (field.type === "place") {
        initialData[field.key] = { latitude: 0, longitude: 0 };
      } else if (field.type === "image" || field.type === "document") {
        initialData[field.key] = null;
      } else {
        initialData[field.key] = "";
      }
    });

    onEditFormDataChange(initialData);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFormId(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();

    if (!editFormData.place.latitude || !editFormData.place.longitude) {
      alert("Please provide latitude and longitude");
      return;
    }

    const formData = new FormData();
    formData.append("place.lat", editFormData.place.latitude.toString());
    formData.append("place.lng", editFormData.place.longitude.toString());

    template.dynamicFields.forEach((field) => {
      const value = editFormData[field.key];
      if (value !== null && value !== undefined && value !== "") {
        if (value instanceof File) {
          formData.append(field.key, value);
        } else if (typeof value === "object" && "latitude" in value) {
          // Skip place type to avoid duplication
        } else {
          formData.append(field.key, value.toString());
        }
      }
    });

    onUpdateForm(formId, formData);
    setEditingFormId(null);
  };

  const handleDeleteClick = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this location? This action cannot be undone."
    );

    if (confirmed) {
      onDeleteForm(formId);
    }
  };

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
        const isEditing = editingFormId === form.id;

        return (
          <div
            key={form.id}
            className={`p-4 border border-gray-200 rounded-lg hover:shadow-md transition ${
              !isEditing ? "cursor-pointer" : ""
            }`}
            onClick={() => !isEditing && onLocationClick(form)}
          >
            {!isEditing ? (
              <>
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
                          backgroundColor:
                            provinceColors[province] || "#ef4444",
                        }}
                      />
                      <span className="text-xs text-gray-500">{province}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleEditClick(e, form)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer hover:scale-102"
                      title="Edit location"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, form.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer hover:scale-102"
                      title="Delete location"
                    >
                      <Trash2 size={16} />
                    </button>
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
              </>
            ) : (
              // Edit Mode - use editFormData from props
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Edit Location
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleSaveEdit(e, form.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded cursor-pointer hover:scale-102"
                      title="Save changes"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded cursor-pointer hover:scale-102"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Coordinates with Set in Map button */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <MapPin size={14} />
                    Location Coordinates *
                  </h5>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetLocationInMap();
                    }}
                    className="w-full mb-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                  >
                    <MapPin size={14} />
                    Set in Map
                  </button>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.place.latitude}
                      onChange={(e) =>
                        onEditFormDataChange({
                          ...editFormData,
                          place: {
                            ...editFormData.place,
                            latitude: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <label className="block text-xs font-medium text-gray-700">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.place.longitude}
                      onChange={(e) =>
                        onEditFormDataChange({
                          ...editFormData,
                          place: {
                            ...editFormData.place,
                            longitude: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Dynamic Fields */}
                {template.dynamicFields.map((field) => {
                  const fieldValue = editFormData[field.key];

                  return (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {field.label} {field.required && "*"}
                      </label>

                      {field.type === "string" && (
                        <input
                          type="text"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            onEditFormDataChange({
                              ...editFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "number" && (
                        <input
                          type="number"
                          value={
                            typeof fieldValue === "number" ? fieldValue : 0
                          }
                          onChange={(e) =>
                            onEditFormDataChange({
                              ...editFormData,
                              [field.key]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "date" && (
                        <input
                          type="date"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            onEditFormDataChange({
                              ...editFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "time" && (
                        <input
                          type="time"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            onEditFormDataChange({
                              ...editFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "image" && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onEditFormDataChange({
                                ...editFormData,
                                [field.key]: file,
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "document" && (
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onEditFormDataChange({
                                ...editFormData,
                                [field.key]: file,
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
