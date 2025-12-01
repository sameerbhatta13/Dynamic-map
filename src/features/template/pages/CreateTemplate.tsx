import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "time" | "image" | "document" | "place";
  required: boolean;
  description?: string;
}

const CreateTemplate: React.FC = () => {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [markerIcon, setMarkerIcon] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([
    { key: "", label: "", type: "string", required: false, description: "" },
  ]);

  const addField = () => {
    setFields([
      ...fields,
      { key: "", label: "", type: "string", required: false, description: "" },
    ]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, field: Partial<TemplateField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
  };

  const handleCreateTemplate = async () => {
    if (!templateName || templateName.length < 3) {
      alert("Template name must be at least 3 characters long");
      return;
    }

    if (!markerIcon) {
      alert("Please fill in marker icon");
      return;
    }

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
        await response.json(); // Just consume the response without storing it

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
        window.location.reload();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Create Template
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Create New Template
          </h2>

          <div className="space-y-4">
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
                              type: e.target.value as TemplateField["type"],
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
      </div>
    </div>
  );
};

export default CreateTemplate;
