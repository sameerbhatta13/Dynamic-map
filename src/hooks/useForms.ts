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

  return { forms, loadAllForms, createForm };
};
