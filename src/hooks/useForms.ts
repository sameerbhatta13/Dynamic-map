import { useState } from "react";
import type { Form } from "../utils/types";
import { API_BASE_URL, API_TOKEN } from "../utils/constants";

export const useForms = () => {
  const [forms, setForms] = useState<Form[]>([]);

  const loadAllForms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/form/list`, {
        method: "GET",
        headers: {
          Authorization: API_TOKEN,
        },
      });

      if (response.ok) {
        const allForms = await response.json();
        setForms(allForms);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    }
  };

  const createForm = async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/form/create`, {
        method: "POST",
        headers: {
          Authorization: API_TOKEN,
        },
        body: formData,
      });

      if (response.ok) {
        await loadAllForms();
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false };
    }
  };

  const updateForm = async (formId: string, formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/form/${formId}`, {
        method: "PUT",
        headers: {
          Authorization: API_TOKEN,
        },
        body: formData,
      });

      if (response.ok) {
        await loadAllForms();
        return { success: true };
      } else if (response.status === 404) {
        return { success: false, error: "Form not found" };
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData ? JSON.stringify(errorData) : "Validation error",
        };
      } else {
        return { success: false, error: "Failed to update form" };
      }
    } catch (error) {
      console.error("Error updating form:", error);
      return { success: false, error: "Network error" };
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/form/${formId}`, {
        method: "DELETE",
        headers: {
          Authorization: API_TOKEN,
        },
      });

      if (response.status === 204) {
        await loadAllForms();
        return { success: true };
      } else if (response.status === 404) {
        return { success: false, error: "Form not found" };
      } else if (response.status === 401) {
        return { success: false, error: "Unauthorized" };
      } else {
        return { success: false, error: "Failed to delete form" };
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      return { success: false, error: "Network error" };
    }
  };

  return { forms, loadAllForms, createForm, updateForm, deleteForm };
};
