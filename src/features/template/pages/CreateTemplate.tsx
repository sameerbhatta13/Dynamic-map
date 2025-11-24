import React, { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";

// Types
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

// Add this with other state declarations
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

const CreateTemplate: React.FC = () => {
  const [showTemplateForm, setShowTemplateForm] = useState(true);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Template state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [markerIcon, setMarkerIcon] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([
    { key: "", label: "", type: "string", required: false, description: "" },
  ]);

  // Created templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [forms, setForms] = useState<Form[]>([]);

  React.useEffect(() => {
    const loadTemplates = async () => {
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
          const loadedTemplates = await response.json();
          setTemplates(loadedTemplates);
        } else if (response.status === 204) {
          setTemplates([]);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Location form data
  const [locationData, setLocationData] = useState<LocationFormData>({
    place: { latitude: 0, longitude: 0 },
  });

  // Add new field
  const addField = () => {
    setFields([
      ...fields,
      { key: "", label: "", type: "string", required: false, description: "" },
    ]);
  };

  // Remove field
  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  // Update field
  const updateField = (index: number, field: Partial<TemplateField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
  };

  // Create template
  const handleCreateTemplate = async () => {
    // Validation
    if (!templateName || templateName.length < 3) {
      alert("Template name must be at least 3 characters long");
      return;
    }

    if (!markerIcon) {
      alert("Please fill in marker icon");
      return;
    }

    // Validate markerIcon format (only lowercase letters, numbers, and hyphens)
    const markerIconPattern = /^[a-z0-9-]+$/;
    if (!markerIconPattern.test(markerIcon)) {
      alert(
        "Marker icon must contain only lowercase letters, numbers, and hyphens (e.g., 'event', 'my-marker-1')"
      );
      return;
    }

    const validFields = fields.filter((f) => f.key && f.label);
    if (validFields.length === 0) {
      alert("Please add at least one valid field");
      return;
    }

    // Prepare fields without empty descriptions
    const preparedFields = validFields.map((field) => {
      const fieldData: {
        key: string;
        label: string;
        type: TemplateField["type"];
        required: boolean;
        description?: string;
      } = {
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
      };

      if (field.description && field.description.trim() !== "") {
        fieldData.description = field.description;
      }

      return fieldData;
    });

    const requestBody = {
      name: templateName,
      description: templateDescription || "",
      markerIcon: markerIcon,
      fields: preparedFields,
    };

    console.log("Sending request:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(
        "http://192.168.1.147:3000/api/template/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_SECRET_TOKEN",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates([...templates, newTemplate]);

        // Reset
        setTemplateName("");
        setTemplateDescription("");
        setMarkerIcon("");
        setFields([
          {
            key: "",
            label: "",
            type: "string",
            required: false,
            description: "",
          },
        ]);

        alert("Template created successfully!");
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", errorData);
        alert(
          `Failed to create template: ${
            errorData ? JSON.stringify(errorData) : response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Error creating template: " + error);
    }
  };

  // Handle location submission
  const handleLocationSubmit = async () => {
    if (!selectedTemplate) return;

    // Validate required fields
    if (!locationData.place.latitude || !locationData.place.longitude) {
      alert("Please provide latitude and longitude");
      return;
    }

    // Validate required dynamic fields
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

    // Prepare FormData
    const formData = new FormData();
    formData.append("templateId", selectedTemplate.id);
    formData.append("place.lat", locationData.place.latitude.toString());
    formData.append("place.lng", locationData.place.longitude.toString());

    // Add dynamic fields (including name and others)
    selectedTemplate.dynamicFields.forEach((field) => {
      const value = locationData[field.key];

      if (value !== null && value !== undefined && value !== "") {
        if (
          field.type === "place" &&
          typeof value === "object" &&
          "latitude" in value
        ) {
          // For place type fields
          formData.append(`${field.key}.lat`, value.latitude.toString());
          formData.append(`${field.key}.lng`, value.longitude.toString());
        } else if (field.type === "image" || field.type === "document") {
          // For file uploads
          if (value instanceof File) {
            formData.append(field.key, value);
          }
        } else {
          // For string, number, date, time fields (including name)
          formData.append(field.key, value.toString());
        }
      }
    });

    // Log what we're sending (for debugging)
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

        // Add to forms list
        setForms([...forms, newForm]);

        alert("Location added successfully!");

        // Reset form
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

  // Update location field
  const updateLocationField = (
    key: string,
    value: string | number | File | PlaceCoordinates | null
  ) => {
    setLocationData({ ...locationData, [key]: value });
  };

  // Add this function near your other fetch functions
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
        // Filter forms for this specific template
        const templateForms = allForms.filter(
          (form: Form) => form.templateId === templateId
        );
        setForms(templateForms);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    }
  };

  // Open location form
  const openLocationForm = (template: Template) => {
    setSelectedTemplate(template);
    setShowLocationForm(true);
    setShowTemplateForm(false);

    // Load forms for this template
    loadFormsForTemplate(template.id);

    // Initialize location data
    const initialData: LocationFormData = {
      place: { latitude: 0, longitude: 0 },
    };

    template.dynamicFields.forEach((field) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Template Manager
        </h1>
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center flex justify-center items-center">
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : (
          <>
            {/* Template Creation Section */}
            {showTemplateForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Create New Template
                </h2>

                <div className="space-y-4">
                  {/* Basic Template Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Event, Restaurant, Park"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marker Icon *
                      </label>
                      <input
                        type="text"
                        value={markerIcon}
                        onChange={(e) => setMarkerIcon(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., event, restaurant, park"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Template description"
                      rows={3}
                    />
                  </div>

                  {/* Dynamic Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">
                        Template Fields
                      </h3>
                      <button
                        type="button"
                        onClick={addField}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                      >
                        <Plus size={18} />
                        Add Field
                      </button>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 rounded-md bg-gray-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Field Key
                              </label>
                              <input
                                type="text"
                                value={field.key}
                                onChange={(e) =>
                                  updateField(index, { key: e.target.value })
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., name"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Field Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) =>
                                  updateField(index, { label: e.target.value })
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Name"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Field Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  updateField(index, {
                                    type: e.target
                                      .value as TemplateField["type"],
                                  })
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="time">Time</option>
                                <option value="image">Image</option>
                                <option value="document">Document</option>
                                <option value="place">Place</option>
                              </select>
                            </div>

                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) =>
                                    updateField(index, {
                                      required: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4"
                                />
                                Required
                              </label>

                              <button
                                type="button"
                                onClick={() => removeField(index)}
                                className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                disabled={fields.length === 1}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={field.description || ""}
                              onChange={(e) =>
                                updateField(index, {
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Optional field description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                  >
                    Create Template
                  </button>
                </div>
              </div>
            )}

            {/* Templates Table */}
            {showTemplateForm && templates.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Created Templates
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Icon
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Fields
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {template.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {template.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {template.markerIcon}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {template.dynamicFields.length} field(s)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openLocationForm(template)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition"
                            >
                              <MapPin size={16} />
                              Add Location
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Location Form */}
            {showLocationForm && selectedTemplate && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-700">
                    Add Location for: {selectedTemplate.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowLocationForm(false);
                      setShowTemplateForm(true);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    ← Back to Templates
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Fixed Place Field */}
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

                  {/* Dynamic Fields */}
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
                              value={
                                typeof fieldValue === "string" ? fieldValue : ""
                              }
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
                              value={
                                typeof fieldValue === "number" ? fieldValue : 0
                              }
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
                              value={
                                typeof fieldValue === "string" ? fieldValue : ""
                              }
                              onChange={(e) =>
                                updateLocationField(field.key, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : field.type === "time" ? (
                            <input
                              type="time"
                              value={
                                typeof fieldValue === "string" ? fieldValue : ""
                              }
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
                                  if (file)
                                    updateLocationField(field.key, file);
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
                                  if (file)
                                    updateLocationField(field.key, file);
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
            )}

            {showLocationForm && selectedTemplate && forms.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
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
                        {/* Location Coordinates */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            Location
                          </p>
                          <p className="text-sm text-gray-800">
                            {form.data.place.lat}, {form.data.place.lng}
                          </p>
                        </div>

                        {/* Dynamic Fields */}
                        {selectedTemplate.dynamicFields.map((field) => {
                          const value = form.data[field.key];

                          // Skip if value doesn't exist
                          if (value === undefined || value === null)
                            return null;

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

                        {/* Timestamps */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default CreateTemplate;
