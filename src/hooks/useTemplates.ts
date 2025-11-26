import { useState, useCallback } from "react";
import type { Template, TemplateField } from "../utils/types";
import { API_BASE_URL, API_TOKEN } from "../utils/constants";

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/template/list`, {
        method: "GET",
        headers: {
          Authorization: API_TOKEN,
        },
      });

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
  }, []); // Empty dependency array since it doesn't depend on any props or state

  const createTemplate = useCallback(
    async (templateData: {
      name: string;
      description: string;
      markerIcon: string;
      fields: TemplateField[];
    }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/template/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: API_TOKEN,
          },
          body: JSON.stringify(templateData),
        });

        if (response.ok) {
          await loadTemplates();
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => null);
          return {
            success: false,
            error: errorData ? JSON.stringify(errorData) : response.statusText,
          };
        }
      } catch (error) {
        console.error("Error creating template:", error);
        return { success: false, error: String(error) };
      }
    },
    [loadTemplates]
  );

  return { templates, isLoading, loadTemplates, createTemplate };
};
