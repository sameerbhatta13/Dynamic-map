import React from "react";
import { X, ArrowLeft } from "lucide-react";
import type {
  Template,
  LocationFormData,
  Form,
  TemplateField,
} from "../../../utils/types";
import { TemplateList } from "./TemplateList";
import { NewTemplateForm } from "./NewTemplateForm";
import { LocationForm } from "./LocationForm";
import { LocationsList } from "./LocationsList";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: "allLocations" | "templates" | "new" | "addLocation";
  setActiveView: (
    view: "allLocations" | "templates" | "new" | "addLocation"
  ) => void;
  templates: Template[];
  isLoadingTemplates: boolean;
  onSelectTemplate: (template: Template) => void;
  selectedTemplateForForm: Template | null;
  locationViewTab: "add" | "view";
  setLocationViewTab: (tab: "add" | "view") => void;
  locationFormData: LocationFormData;
  onLocationFormDataChange: (data: LocationFormData) => void;
  onSetLocationInMap: () => void;
  onSubmitLocation: () => void;
  forms: Form[];
  getProvince: (lat: number, lng: number) => string;
  onLocationClick: (form: Form) => void;
  onCreateTemplate: (data: {
    name: string;
    description: string;
    markerIcon: string;
    fields: TemplateField[];
  }) => Promise<void>;
  onDeleteTemplate: (templateId: string) => void;
  onUpdateForm: (
    formId: string,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteForm: (formId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  templates,
  isLoadingTemplates,
  onSelectTemplate,
  selectedTemplateForForm,
  locationViewTab,
  setLocationViewTab,
  locationFormData,
  onLocationFormDataChange,
  onSetLocationInMap,
  onSubmitLocation,
  forms,
  getProvince,
  onLocationClick,
  onCreateTemplate,
  onDeleteTemplate,
  onUpdateForm,
  onDeleteForm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 w-96 h-full bg-white shadow-2xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
          </svg>
          <h2 className="text-lg font-semibold">Interactive Map</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded cursor-pointer hover:scale-102"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {activeView === "addLocation" ? (
          <button
            onClick={() => {
              setActiveView("templates");
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer hover:scale-102"
          >
            <ArrowLeft size={18} />
            Back to Templates
          </button>
        ) : activeView === "new" ? (
          <button
            onClick={() => {
              setActiveView("templates");
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 cursor-pointer hover:scale-102"
          >
            <ArrowLeft size={18} />
            Back to Templates
          </button>
        ) : (
          <>
            <button
              onClick={() => setActiveView("allLocations")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                activeView === "allLocations"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              All Locations
            </button>
            <button
              onClick={() => setActiveView("templates")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                activeView === "templates"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Templates
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "new" ? (
          <NewTemplateForm
            onCreateTemplate={async (data) => {
              await onCreateTemplate(data);
              setActiveView("templates");
            }}
          />
        ) : activeView === "addLocation" && selectedTemplateForForm ? (
          <div className="flex flex-col h-full">
            {/* Sub-tabs for Add/View */}
            <div className="flex border-b">
              <button
                onClick={() => setLocationViewTab("add")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                  locationViewTab === "add"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Add Location
              </button>
              <button
                onClick={() => setLocationViewTab("view")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                  locationViewTab === "view"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                View Locations (
                {
                  forms.filter(
                    (f) => f.templateId === selectedTemplateForForm.id
                  ).length
                }
                )
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {locationViewTab === "add" ? (
                <LocationForm
                  template={selectedTemplateForForm}
                  formData={locationFormData}
                  onFormDataChange={onLocationFormDataChange}
                  onSetLocation={onSetLocationInMap}
                  onSubmit={onSubmitLocation}
                />
              ) : (
                <div className="p-4">
                  <LocationsList
                    key={`${selectedTemplateForForm.id}-${
                      forms.filter(
                        (f) => f.templateId === selectedTemplateForForm.id
                      ).length
                    }`}
                    forms={forms}
                    template={selectedTemplateForForm}
                    getProvince={getProvince}
                    onLocationClick={onLocationClick}
                    onUpdateForm={onUpdateForm}
                    onDeleteForm={onDeleteForm}
                    onSetLocationInMap={onSetLocationInMap}
                    locationFormData={locationFormData}
                    onLocationFormDataChange={onLocationFormDataChange}
                  />
                </div>
              )}
            </div>
          </div>
        ) : activeView === "allLocations" ? (
          <div className="p-4">
            <div className="mb-4 pb-3 border-b-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                All Locations ({forms.length})
              </h2>
            </div>
            {forms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No locations added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => {
                  const templateForms = forms.filter(
                    (f) => f.templateId === template.id
                  );
                  if (templateForms.length === 0) return null;

                  return (
                    <div key={template.id} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                        <h3 className="font-semibold text-gray-800">
                          {template.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          ({templateForms.length})
                        </span>
                      </div>
                      <LocationsList
                        forms={forms}
                        template={template}
                        getProvince={getProvince}
                        onLocationClick={onLocationClick}
                        onUpdateForm={onUpdateForm}
                        onDeleteForm={onDeleteForm}
                        onSetLocationInMap={onSetLocationInMap}
                        locationFormData={locationFormData} // ADD THIS
                        onLocationFormDataChange={onLocationFormDataChange}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => setActiveView("new")}
              className="w-full mb-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Template
            </button>
            <TemplateList
              templates={templates}
              isLoading={isLoadingTemplates}
              onSelectTemplate={onSelectTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
};
