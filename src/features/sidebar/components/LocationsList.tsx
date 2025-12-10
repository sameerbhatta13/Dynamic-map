import React, { useState } from "react";
import { MapPin, Edit2, Trash2, X, Check } from "lucide-react";
import type { Form, Template, LocationFormData } from "../../../utils/types";
import { statusColors } from "../../../utils/constants";

interface LocationsListProps {
  forms: Form[];
  template: Template;
  getProvince: (lat: number, lng: number) => string;
  onLocationClick: (form: Form) => void;
  onUpdateForm: (
    formId: string,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteForm: (formId: string) => void;
  onSetLocationInMap: () => void;
  locationFormData?: LocationFormData; // ADD THIS (optional)
  onLocationFormDataChange?: (data: LocationFormData) => void;
}

export const LocationsList: React.FC<LocationsListProps> = ({
  forms,
  template,
  getProvince,
  onLocationClick,
  onUpdateForm,
  onDeleteForm,
  onSetLocationInMap,
  locationFormData,
  onLocationFormDataChange,
}) => {
  const [editingFormId, setEditingFormId] = React.useState<string | null>(null);
  // Local state for editing
  const [editFormData, setEditFormData] = React.useState<LocationFormData>({
    place: { latitude: 0, longitude: 0 },
    status: "ongoing",
  });

  const templateForms = forms.filter((f) => f.templateId === template.id);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (
      editingFormId &&
      locationFormData &&
      locationFormData.place.latitude !== 0
    ) {
      setEditFormData((prev) => ({
        ...prev,
        place: locationFormData.place,
      }));
      // Reset parent's locationFormData after syncing
      if (onLocationFormDataChange) {
        onLocationFormDataChange({
          ...locationFormData,
          place: { latitude: 0, longitude: 0 },
        });
      }
    }
  }, [
    locationFormData?.place.latitude,
    locationFormData?.place.longitude,
    editingFormId,
  ]);

  const handleEditClick = (e: React.MouseEvent, form: Form) => {
    e.stopPropagation();
    setEditingFormId(form.id);

    const initialData: LocationFormData = {
      place: {
        latitude: form.data.place.lat,
        longitude: form.data.place.lng,
      },
      status: form.status,
    };

    template.dynamicFields.forEach((field) => {
      const value = form.data[field.key];
      if (value !== undefined && value !== null) {
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

    setEditFormData(initialData);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFormId(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent, form: Form) => {
    e.stopPropagation();

    if (isSaving) return;

    if (!editFormData.place.latitude || !editFormData.place.longitude) {
      alert("Please provide latitude and longitude");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("place.lat", editFormData.place.latitude.toString());
    formData.append("place.lng", editFormData.place.longitude.toString());
    formData.append("status", editFormData.status);

    template.dynamicFields.forEach((field) => {
      const value = editFormData[field.key];
      if (value !== null && value !== undefined && value !== "") {
        if (value instanceof File) {
          formData.append(field.key, value);
        } else if (typeof value === "object" && "latitude" in value) {
          formData.append(`${field.key}.lat`, value.latitude.toString());
          formData.append(`${field.key}.lng`, value.longitude.toString());
        } else {
          formData.append(field.key, value.toString());
        }
      }
    });

    try {
      const result = await onUpdateForm(form.id, formData);

      if (result.success) {
        setEditingFormId(null);
      } else if (result.error) {
        alert(`Failed to update: ${result.error}`);
      }
    } finally {
      setIsSaving(false);
    }
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
        const statusLabel =
          form.status === "created"
            ? "Halted"
            : form.status.charAt(0).toUpperCase() + form.status.slice(1);

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
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: statusColors[form.status],
                        }}
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{province}</span>
                    </div>
                  </div>

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

                <div className="mt-3 space-y-2">
                  <div className="mt-3 space-y-2">
                    {template.dynamicFields.map((field) => {
                      const value = form.data[field.key];
                      if (!value || value === "" || value instanceof File) {
                        return null;
                      }

                      // Handle file fields (document/image)
                      if (field.type === "image") {
                        let fileData;
                        if (typeof value === "string") {
                          try {
                            fileData = JSON.parse(value);
                          } catch {
                            fileData = null;
                          }
                        } else if (
                          typeof value === "object" &&
                          "url" in value
                        ) {
                          fileData = value;
                        }

                        if (fileData && fileData.url) {
                          return (
                            <div key={field.key} className="space-y-1">
                              <span className="font-medium text-gray-700 text-sm block">
                                {field.label}:
                              </span>
                              <a
                                href={fileData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block"
                              >
                                <img
                                  src={fileData.url}
                                  alt={field.label}
                                  className="w-1/2 h-14 object-cover rounded border border-gray-200 hover:opacity-80 transition cursor-pointer"
                                />
                              </a>
                            </div>
                          );
                        }
                        return null;
                      }

                      if (field.type === "document") {
                        let fileData;
                        if (typeof value === "string") {
                          try {
                            fileData = JSON.parse(value);
                          } catch {
                            fileData = null;
                          }
                        } else if (
                          typeof value === "object" &&
                          "url" in value
                        ) {
                          fileData = value;
                        }

                        if (fileData && fileData.url) {
                          return (
                            <div key={field.key} className="text-sm">
                              <span className="font-medium text-gray-700">
                                {field.label}:
                              </span>{" "}
                              <a
                                href={fileData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Document
                              </a>
                            </div>
                          );
                        }
                        return null;
                      }

                      // Handle place fields
                      if (typeof value === "object" && "lat" in value) {
                        return (
                          <div key={field.key} className="text-sm">
                            <span className="font-medium text-gray-700">
                              {field.label}:
                            </span>{" "}
                            <span className="text-gray-600">
                              {value.lat}, {value.lng}
                            </span>
                          </div>
                        );
                      }

                      // Handle link fields
                      if (field.type === "link" && typeof value === "string") {
                        return (
                          <div key={field.key} className="text-sm">
                            <span className="font-medium text-gray-700">
                              {field.label}:
                            </span>{" "}
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {value}
                            </a>
                          </div>
                        );
                      }

                      // Handle all other fields (text, number, date, time)
                      return (
                        <div key={field.key} className="text-sm">
                          <span className="font-medium text-gray-700">
                            {field.label}:
                          </span>{" "}
                          <span className="text-gray-600">
                            {value.toString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  Added: {new Date(form.createdAt).toLocaleString()}
                </div>
              </>
            ) : (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Edit Location
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleSaveEdit(e, form)}
                      disabled={isSaving}
                      className={`p-1.5 rounded ${
                        isSaving
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-green-600 hover:bg-green-50 cursor-pointer hover:scale-102"
                      }`}
                      title={isSaving ? "Saving..." : "Save changes"}
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

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as
                          | "created"
                          | "ongoing"
                          | "completed",
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="created">Halted (Created)</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
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
                        setEditFormData({
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
                        setEditFormData({
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

                      {field.type === "text" && (
                        <input
                          type="text"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            setEditFormData({
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
                            setEditFormData({
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
                            setEditFormData({
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
                            setEditFormData({
                              ...editFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {field.type === "link" && (
                        <input
                          type="url"
                          value={
                            typeof fieldValue === "string" ? fieldValue : ""
                          }
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              [field.key]: e.target.value,
                            })
                          }
                          placeholder="Enter full URL (e.g., https://example.com)"
                          pattern="https?://.+"
                          title="Please enter a valid URL starting with http:// or https://"
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
                              setEditFormData({
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
                              setEditFormData({
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
