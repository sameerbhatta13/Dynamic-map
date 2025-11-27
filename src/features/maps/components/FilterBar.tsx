import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { Template } from "../../../utils/types";
import { provinceColors, MARKER_ICONS } from "../../../utils/constants";

interface FilterBarProps {
  templates: Template[];
  selectedProvinces: string[];
  selectedTemplates: string[];
  onProvinceToggle: (province: string) => void;
  onTemplateToggle: (templateId: string) => void;
  onClearFilters: () => void;
  onSelectAllProvinces: () => void;
  onSelectAllTemplates: () => void;
}

const PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpaschim Province",
];

export const FilterBar: React.FC<FilterBarProps> = ({
  templates,
  selectedProvinces,
  selectedTemplates,
  onProvinceToggle,
  onTemplateToggle,
  onClearFilters,
  onSelectAllProvinces,
  onSelectAllTemplates,
}) => {
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const hasActiveFilters =
    selectedProvinces.length > 0 || selectedTemplates.length > 0;

  const allProvincesSelected =
    selectedProvinces.length === 0 ||
    selectedProvinces.length === PROVINCES.length;
  const allTemplatesSelected =
    selectedTemplates.length === 0 ||
    selectedTemplates.length === templates.length;

  return (
    <div className="flex gap-2">
      {/* Province Filter Bar */}
      <div className="bg-white rounded-lg shadow-lg relative">
        <button
          onClick={() => setIsProvinceOpen(!isProvinceOpen)}
          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition rounded-lg whitespace-nowrap"
        >
          <span className="font-medium text-gray-800">Provinces</span>
          <div className="flex items-center gap-2 ml-2">
            {selectedProvinces.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                {selectedProvinces.length}
              </span>
            )}
            {isProvinceOpen ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </div>
        </button>

        {isProvinceOpen && (
          <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto z-50">
            {/* All Provinces Option */}
            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition mb-2 border-b border-gray-200 pb-3">
              <input
                type="checkbox"
                checked={allProvincesSelected}
                onChange={onSelectAllProvinces}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800 flex-1">
                All Provinces
              </span>
            </label>

            {/* Individual Provinces */}
            <div className="space-y-2">
              {PROVINCES.map((province) => {
                const isSelected = selectedProvinces.includes(province);
                const color = provinceColors[province] || "#ef4444";

                return (
                  <label
                    key={province}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onProvinceToggle(province)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {province}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Template Filter Bar */}
      <div className="bg-white rounded-lg shadow-lg relative">
        <button
          onClick={() => setIsTemplateOpen(!isTemplateOpen)}
          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition rounded-lg whitespace-nowrap"
        >
          <span className="font-medium text-gray-800">Templates</span>
          <div className="flex items-center gap-2 ml-2">
            {selectedTemplates.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                {selectedTemplates.length}
              </span>
            )}
            {isTemplateOpen ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </div>
        </button>

        {isTemplateOpen && (
          <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto z-50">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">No templates available</p>
            ) : (
              <>
                {/* All Templates Option */}
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition mb-2 border-b border-gray-200 pb-3">
                  <input
                    type="checkbox"
                    checked={allTemplatesSelected}
                    onChange={onSelectAllTemplates}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-800 flex-1">
                    All Templates
                  </span>
                </label>

                {/* Individual Templates */}
                <div className="space-y-2">
                  {templates.map((template) => {
                    const isSelected = selectedTemplates.includes(template.id);
                    const iconData = MARKER_ICONS.find(
                      (i) => i.id === template.markerIcon
                    );
                    const IconComponent = iconData?.icon;

                    return (
                      <label
                        key={template.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTemplateToggle(template.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {IconComponent && (
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded flex-shrink-0">
                            <IconComponent
                              size={16}
                              className="text-gray-700"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 font-medium truncate">
                            {template.name}
                          </p>
                          {template.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Clear All Button - Shows when filters are active */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-lg shadow-lg transition flex items-center gap-2 font-medium whitespace-nowrap"
        >
          <X size={18} />
          Clear
        </button>
      )}
    </div>
  );
};
