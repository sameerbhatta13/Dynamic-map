import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const ViewTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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

  const openLocationForm = (template: Template) => {
    navigate(`/add-location/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          View Templates
        </h1>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center flex justify-center items-center">
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length > 0 ? (
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
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              No templates found. Create one to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTemplates;
