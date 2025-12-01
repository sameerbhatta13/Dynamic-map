import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "time" | "image" | "document" | "place";
  required: boolean;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  markerIcon: string;
  fixedFields: TemplateField[];
  dynamicFields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationFormData {
  place: PlaceCoordinates;
  [key: string]: string | number | File | PlaceCoordinates | null | undefined;
}

interface Form {
  id: string;
  templateId: string;
  data: {
    place: {
      lat: number;
      lng: number;
    };
    [key: string]: string | number | { lat: number; lng: number } | File;
  };
  createdAt: string;
  updatedAt: string;
}

const LocationForm: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [locationData, setLocationData] = useState<LocationFormData>({
    place: { latitude: 0, longitude: 0 },
  });
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return; // Add this check at the start

      try {
        const response = await fetch(
          "http://192.168.1.147:3000/api/template/list",
          {
            method: "GET",
            headers: {
              Authorization: "Bearer YOUR_SECRET_TOKEN",
            },
          }
        );

        if (response.ok) {
          const templates = await response.json();
          const template = templates.find((t: Template) => t.id === templateId);

          if (template) {
            setSelectedTemplate(template);

            // Initialize location data
            const initialData: LocationFormData = {
              place: { latitude: 0, longitude: 0 },
            };

            template.dynamicFields.forEach((field: TemplateField) => {
              if (field.type === "number") {
                initialData[field.key] = 0;
              } else if (field.type === "place") {
                initialData[field.key] = { latitude: 0, longitude: 0 };
              } else if (field.type === "image" || field.type === "document") {
                initialData[field.key] = null;
              } else {
                initialData[field.key] = "";
              }
            });

            setLocationData(initialData);

            // Load forms for this template
            loadFormsForTemplate(templateId); // Now TypeScript knows templateId is defined
          }
        }
      } catch (error) {
        console.error("Error loading template:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    } else {
      setIsLoading(false); // Handle case when templateId is undefined
    }
  }, [templateId]);

  const loadFormsForTemplate = async (templateId: string) => {
    try {
      const response = await fetch("http://192.168.1.147:3000/api/form/list", {
        method: "GET",
        headers: {
          Authorization: "Bearer YOUR_SECRET_TOKEN",
        },
      });

      if (response.ok) {
        const allForms = await response.json();
        const templateForms = allForms.filter(
          (form: Form) => form.templateId === templateId
        );
        setForms(templateForms);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    }
  };

  const updateLocationField = (
    key: string,
    value: string | number | File | PlaceCoordinates | null
  ) => {
    setLocationData({ ...locationData, [key]: value });
  };

  const handleLocationSubmit = async () => {
    if (!selectedTemplate) return;

    if (!locationData.place.latitude || !locationData.place.longitude) {
      alert("Please provide latitude and longitude");
      return;
    }

    for (const field of selectedTemplate.dynamicFields) {
      if (field.required) {
        const value = locationData[field.key];
        if (
          !value ||
          value === "" ||
          (typeof value === "number" && isNaN(value))
        ) {
          alert(`Please fill in the required field: ${field.label}`);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("templateId", selectedTemplate.id);
    formData.append("place.lat", locationData.place.latitude.toString());
    formData.append("place.lng", locationData.place.longitude.toString());

    selectedTemplate.dynamicFields.forEach((field) => {
      const value = locationData[field.key];

      if (value !== null && value !== undefined && value !== "") {
        if (
          field.type === "place" &&
          typeof value === "object" &&
          "latitude" in value
        ) {
          formData.append(`${field.key}.lat`, value.latitude.toString());
          formData.append(`${field.key}.lng`, value.longitude.toString());
        } else if (field.type === "image" || field.type === "document") {
          if (value instanceof File) {
            formData.append(field.key, value);
          }
        } else {
          formData.append(field.key, value.toString());
        }
      }
    });

    console.log("Submitting form data:");
    for (const [key, val] of formData.entries()) {
      console.log(key + ": " + val);
    }

    try {
      const response = await fetch(
        "http://192.168.1.147:3000/api/form/create",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer YOUR_SECRET_TOKEN",
          },
          body: formData,
        }
      );

      if (response.ok) {
        const newForm = await response.json();
        console.log("Location added:", newForm);

        setForms([...forms, newForm]);

        alert("Location added successfully!");

        window.dispatchEvent(new Event("formCreated"));

        const initialData: LocationFormData = {
          place: { latitude: 0, longitude: 0 },
        };
        selectedTemplate.dynamicFields.forEach((field) => {
          if (field.type === "number") {
            initialData[field.key] = 0;
          } else if (field.type === "place") {
            initialData[field.key] = { latitude: 0, longitude: 0 };
          } else if (field.type === "image" || field.type === "document") {
            initialData[field.key] = null;
          } else {
            initialData[field.key] = "";
          }
        });
        setLocationData(initialData);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", errorData);
        alert(
          `Failed to add location: ${
            errorData ? JSON.stringify(errorData) : response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error adding location:", error);
      alert("Error adding location: " + error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Template not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              Add Location for: {selectedTemplate.name}
            </h2>
            <button
              onClick={() => navigate("/interactive-map")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              ← Back to Templates
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <MapPin size={20} />
                Location Coordinates *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locationData.place.latitude}
                    onChange={(e) =>
                      updateLocationField("place", {
                        ...locationData.place,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 27.7172"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locationData.place.longitude}
                    onChange={(e) =>
                      updateLocationField("place", {
                        ...locationData.place,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 85.3240"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Additional Information
              </h3>

              {selectedTemplate.dynamicFields.map((field) => {
                const fieldValue = locationData[field.key];

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && "*"}
                    </label>

                    {field.type === "string" ? (
                      <input
                        type="text"
                        value={typeof fieldValue === "string" ? fieldValue : ""}
                        onChange={(e) =>
                          updateLocationField(field.key, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={
                          field.description ||
                          `Enter ${field.label.toLowerCase()}`
                        }
                      />
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        value={typeof fieldValue === "number" ? fieldValue : 0}
                        onChange={(e) =>
                          updateLocationField(
                            field.key,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : field.type === "date" ? (
                      <input
                        type="date"
                        value={typeof fieldValue === "string" ? fieldValue : ""}
                        onChange={(e) =>
                          updateLocationField(field.key, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : field.type === "time" ? (
                      <input
                        type="time"
                        value={typeof fieldValue === "string" ? fieldValue : ""}
                        onChange={(e) =>
                          updateLocationField(field.key, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : field.type === "image" ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateLocationField(field.key, file);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload an image file
                        </p>
                      </div>
                    ) : field.type === "document" ? (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateLocationField(field.key, file);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a document file
                        </p>
                      </div>
                    ) : field.type === "place" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={
                              fieldValue &&
                              typeof fieldValue === "object" &&
                              "latitude" in fieldValue
                                ? fieldValue.latitude
                                : 0
                            }
                            onChange={(e) => {
                              const currentValue =
                                fieldValue &&
                                typeof fieldValue === "object" &&
                                "latitude" in fieldValue
                                  ? fieldValue
                                  : { latitude: 0, longitude: 0 };
                              updateLocationField(field.key, {
                                ...currentValue,
                                latitude: parseFloat(e.target.value),
                              });
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={
                              fieldValue &&
                              typeof fieldValue === "object" &&
                              "longitude" in fieldValue
                                ? fieldValue.longitude
                                : 0
                            }
                            onChange={(e) => {
                              const currentValue =
                                fieldValue &&
                                typeof fieldValue === "object" &&
                                "longitude" in fieldValue
                                  ? fieldValue
                                  : { latitude: 0, longitude: 0 };
                              updateLocationField(field.key, {
                                ...currentValue,
                                longitude: parseFloat(e.target.value),
                              });
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : null}

                    {field.description &&
                      field.type !== "image" &&
                      field.type !== "document" && (
                        <p className="text-xs text-gray-500 mt-1">
                          {field.description}
                        </p>
                      )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLocationSubmit}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
            >
              Add Location
            </button>
          </div>
        </div>

        {forms.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Added Locations ({forms.length})
            </h3>

            <div className="space-y-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Location
                      </p>
                      <p className="text-sm text-gray-800">
                        {form.data.place.lat}, {form.data.place.lng}
                      </p>
                    </div>

                    {selectedTemplate.dynamicFields.map((field) => {
                      const value = form.data[field.key];

                      if (value === undefined || value === null) return null;

                      return (
                        <div key={field.key}>
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            {field.label}
                          </p>
                          <p className="text-sm text-gray-800">
                            {field.type === "place" &&
                            typeof value === "object" &&
                            "lat" in value
                              ? `${value.lat}, ${value.lng}`
                              : field.type === "image" ||
                                field.type === "document"
                              ? "File uploaded"
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}

                    <div className="col-span-full pt-2 border-t border-gray-200 mt-2">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(form.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationForm;
