import React from "react";
import { MapPin } from "lucide-react";
import type { Template } from "../../../utils/types";
import { MARKER_ICONS } from "../../../utils/constants";

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  onSelectTemplate: (template: Template) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  isLoading,
  onSelectTemplate,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading templates...</div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No templates found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {template.description || "No description"}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              {(() => {
                const iconData = MARKER_ICONS.find(
                  (i) => i.id === template.markerIcon
                );
                const IconComponent = iconData?.icon || MapPin;
                return <IconComponent size={20} className="text-gray-700" />;
              })()}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{template.dynamicFields.length} fields</span>
            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
          <button
            className="w-full py-2 bg-purple-100 hover:text-white text-sm font-medium rounded hover:bg-purple-500 border border-purple-600 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
            onClick={() => onSelectTemplate(template)}
          >
            <MapPin size={16} />
            Locations
          </button>
        </div>
      ))}
    </div>
  );
};
