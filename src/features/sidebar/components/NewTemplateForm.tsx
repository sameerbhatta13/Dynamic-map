import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TemplateField } from "../../../utils/types";
import { MARKER_ICONS } from "../../../utils/constants";

interface NewTemplateFormProps {
  onCreateTemplate: (data: {
    name: string;
    description: string;
    markerIcon: string;
    fields: TemplateField[];
  }) => Promise<void>;
}

export const NewTemplateForm: React.FC<NewTemplateFormProps> = ({
  onCreateTemplate,
}) => {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("location");
  const [fields, setFields] = useState<TemplateField[]>([
    { key: "", label: "", type: "text", required: false, description: "" },
  ]);

  const generateUniqueKey = (
    label: string,
    existingFields: TemplateField[],
    currentIndex?: number
  ): string => {
    const baseKey = label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    if (!baseKey) return "field";

    const existingKeys = existingFields
      .map((f, idx) =>
        currentIndex !== undefined && idx === currentIndex ? null : f.key
      )
      .filter(Boolean);

    let uniqueKey = baseKey;
    let counter = 1;

    while (existingKeys.includes(uniqueKey)) {
      uniqueKey = `${baseKey}${counter}`;
      counter++;
    }

    return uniqueKey;
  };

  const addField = () => {
    setFields([
      ...fields,
      { key: "", label: "", type: "text", required: false, description: "" },
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

    if (field.label !== undefined) {
      updatedFields[index].key = generateUniqueKey(
        field.label,
        updatedFields,
        index
      );
    }

    setFields(updatedFields);
  };

  const handleSubmit = async () => {
    if (!templateName || templateName.length < 3) {
      alert("Template name must be at least 3 characters long");
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

    await onCreateTemplate({
      name: templateName,
      description: templateDescription,
      markerIcon: selectedIcon,
      fields: preparedFields,
    });

    // Reset form
    setTemplateName("");
    setTemplateDescription("");
    setSelectedIcon("location");
    setFields([
      { key: "", label: "", type: "text", required: false, description: "" },
    ]);
  };

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Template Name"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        placeholder="Description..."
        value={templateDescription}
        onChange={(e) => setTemplateDescription(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          MARKER ICON
        </label>
        <div className="grid grid-cols-6 gap-2">
          {MARKER_ICONS.map((iconItem) => {
            const IconComponent = iconItem.icon;
            return (
              <button
                key={iconItem.id}
                onClick={() => setSelectedIcon(iconItem.id)}
                className={`p-3 border-2 rounded-lg transition flex items-center justify-center cursor-pointer hover:scale-101 ${
                  selectedIcon === iconItem.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <IconComponent size={24} className="text-gray-700" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            FORM FIELDS
          </label>
          <button
            onClick={addField}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:scale-102"
          >
            <Plus size={16} />
            Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-lg space-y-2"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => removeField(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer hover:scale-102"
                  disabled={fields.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Field Label"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <select
                value={field.type}
                onChange={(e) =>
                  updateField(index, {
                    type: e.target.value as TemplateField["type"],
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
                <option value="place">Place</option>
                <option value="link">Link</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(index, { required: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                Required
              </label>

              <input
                type="text"
                placeholder="Description (optional)"
                value={field.description || ""}
                onChange={(e) =>
                  updateField(index, { description: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
        Save Template
      </button>
    </div>
  );
};
