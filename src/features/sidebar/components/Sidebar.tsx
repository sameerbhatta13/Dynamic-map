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
  activeView: "templates" | "new" | "addLocation";
  setActiveView: (view: "templates" | "new" | "addLocation") => void;
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
        ) : (
          <>
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
            <button
              onClick={() => setActiveView("new")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer hover:scale-102 ${
                activeView === "new"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              New Template
            </button>
            {/* <button className="px-4 py-3 text-gray-400 hover:text-gray-600">
              <Settings size={18} />
            </button> */}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "new" ? (
          <NewTemplateForm onCreateTemplate={onCreateTemplate} />
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
                    // editFormData={locationFormData}
                    // onEditFormDataChange={onLocationFormDataChange}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
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
