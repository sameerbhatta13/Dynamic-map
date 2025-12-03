// import { useState } from "react";
// import type { Form } from "../utils/types";
// import { API_BASE_URL, API_TOKEN } from "../utils/constants";

// export const useForms = () => {
//   const [forms, setForms] = useState<Form[]>([]);

//   const loadAllForms = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/form/list`, {
//         method: "GET",
//         headers: {
//           Authorization: API_TOKEN,
//         },
//       });

//       if (response.ok) {
//         const allForms = await response.json();
//         console.log("Loaded forms:", allForms); // ADD THIS DEBUG LOG
//         setForms(allForms);
//         return allForms;
//       }
//     } catch (error) {
//       console.error("Error loading forms:", error);
//     }
//   };

//   // const createForm = async (formData: FormData) => {
//   //   try {
//   //     console.log("Creating form with data:");
//   //     for (const [key, value] of formData.entries()) {
//   //       console.log(`${key}:`, value);
//   //     }

//   //     const response = await fetch(`${API_BASE_URL}/form/create`, {
//   //       method: "POST",
//   //       headers: {
//   //         Authorization: API_TOKEN,
//   //       },
//   //       body: formData,
//   //     });

//   //     if (response.ok) {
//   //       const newForm = await response.json();
//   //       console.log("Created form:", newForm);
//   //       await loadAllForms();
//   //       return { success: true };
//   //     } else {
//   //       const errorText = await response.text();
//   //       console.error("Form creation failed:", errorText);
//   //       return { success: false, error: errorText };
//   //     }
//   //   } catch (error) {
//   //     console.error("Error:", error);
//   //     return { success: false, error: String(error) };
//   //   }
//   // };

//   const createForm = async (formData: FormData) => {
//     try {
//       console.log("Creating form with data:");
//       for (const [key, value] of formData.entries()) {
//         if (value instanceof File) {
//           console.log(`${key}:`, {
//             name: value.name,
//             type: value.type,
//             size: value.size,
//             lastModified: value.lastModified,
//           });
//         } else {
//           console.log(`${key}:`, value);
//         }
//       }

//       const response = await fetch(`${API_BASE_URL}/form/create`, {
//         method: "POST",
//         headers: {
//           Authorization: API_TOKEN,
//         },
//         body: formData,
//       });

//       // Read response as text first to see error details
//       const responseText = await response.text();

//       console.log("=== SERVER RESPONSE ===");
//       console.log("Status:", response.status);
//       console.log("Body:", responseText);
//       console.log("======================");

//       if (response.ok) {
//         const newForm = JSON.parse(responseText);
//         console.log("Created form:", newForm);
//         await loadAllForms();
//         return { success: true };
//       } else {
//         return { success: false, error: responseText };
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       return { success: false, error: String(error) };
//     }
//   };

//   const updateForm = async (formId: string, formData: FormData) => {
//     try {
//       console.log("Updating form:", formId);
//       console.log("Update data:");
//       for (const [key, value] of formData.entries()) {
//         console.log(`${key}:`, value);
//       }

//       const response = await fetch(`${API_BASE_URL}/form/${formId}`, {
//         method: "PUT",
//         headers: {
//           Authorization: API_TOKEN,
//         },
//         body: formData,
//       });

//       console.log("Response status:", response.status); // ADD THIS
//       console.log("Response headers:", response.headers); // ADD THIS

//       const responseText = await response.text(); // ADD THIS
//       console.log("Raw response text:", responseText); // ADD THIS

//       if (response.ok) {
//         const updatedForm = JSON.parse(responseText); // Change this
//         console.log("Updated form response:", updatedForm);

//         const reloadedForms = await loadAllForms();
//         console.log("Reloaded forms after update:", reloadedForms);
//         console.log("Looking for form with id:", formId);
//         const updatedFormInList = reloadedForms?.find(
//           (f: Form) => f.id === formId
//         );
//         console.log("Updated form in list:", updatedFormInList);

//         return { success: true };
//       } else if (response.status === 404) {
//         return { success: false, error: "Form not found" };
//       } else if (response.status === 400) {
//         try {
//           const errorData = JSON.parse(responseText);
//           return {
//             success: false,
//             error: errorData ? JSON.stringify(errorData) : "Validation error",
//           };
//         } catch {
//           return { success: false, error: responseText };
//         }
//       } else {
//         console.error("Update failed:", responseText);
//         return { success: false, error: "Failed to update form" };
//       }
//     } catch (error) {
//       console.error("Error updating form:", error);
//       return { success: false, error: "Network error" };
//     }
//   };

//   const deleteForm = async (formId: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/form/${formId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: API_TOKEN,
//         },
//       });

//       if (response.status === 204) {
//         await loadAllForms();
//         return { success: true };
//       } else if (response.status === 404) {
//         return { success: false, error: "Form not found" };
//       } else if (response.status === 401) {
//         return { success: false, error: "Unauthorized" };
//       } else {
//         return { success: false, error: "Failed to delete form" };
//       }
//     } catch (error) {
//       console.error("Error deleting form:", error);
//       return { success: false, error: "Network error" };
//     }
//   };

//   return { forms, loadAllForms, createForm, updateForm, deleteForm };
// };
import { useState } from "react";
import type { Form } from "../utils/types";
import { API_BASE_URL, API_TOKEN } from "../utils/constants";

// Define the API response type (what the API actually returns)
interface FormAPIResponse {
  id: string;
  templateId: string;
  status?: "created" | "ongoing" | "completed"; // Optional since API might not return it
  data: {
    place: {
      lat: number;
      lng: number;
    };
    [key: string]: string | number | { lat: number; lng: number } | File;
  };
  createdAt: string;
  updatedAt: string;
}

// Helper function to ensure form has all required properties
const normalizeForm = (apiForm: FormAPIResponse): Form => {
  return {
    ...apiForm,
    status: apiForm.status || "ongoing", // Default to "ongoing" if missing
  };
};

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
        const allForms: FormAPIResponse[] = await response.json();
        console.log("Loaded forms:", allForms);
        // Normalize all forms to ensure they match the Form type
        const normalizedForms = allForms.map(normalizeForm);
        setForms(normalizedForms);
        return normalizedForms;
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    }
  };

  const createForm = async (formData: FormData) => {
    try {
      console.log("Creating form with data:");
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size,
            lastModified: value.lastModified,
          });
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await fetch(`${API_BASE_URL}/form/create`, {
        method: "POST",
        headers: {
          Authorization: API_TOKEN,
        },
        body: formData,
      });

      const responseText = await response.text();

      console.log("=== SERVER RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Body:", responseText);
      console.log("======================");

      if (response.ok) {
        const newForm: FormAPIResponse = JSON.parse(responseText);
        console.log("Created form:", newForm);
        await loadAllForms();
        return { success: true };
      } else {
        return { success: false, error: responseText };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: String(error) };
    }
  };

  const updateForm = async (formId: string, formData: FormData) => {
    try {
      console.log("Updating form:", formId);
      console.log("Update data:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(`${API_BASE_URL}/form/${formId}`, {
        method: "PUT",
        headers: {
          Authorization: API_TOKEN,
        },
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      if (response.ok) {
        const updatedForm: FormAPIResponse = JSON.parse(responseText);
        console.log("Updated form response:", updatedForm);

        const reloadedForms = await loadAllForms();
        console.log("Reloaded forms after update:", reloadedForms);
        console.log("Looking for form with id:", formId);
        const updatedFormInList = reloadedForms?.find(
          (f: Form) => f.id === formId
        );
        console.log("Updated form in list:", updatedFormInList);

        return { success: true };
      } else if (response.status === 404) {
        return { success: false, error: "Form not found" };
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText);
          return {
            success: false,
            error: errorData ? JSON.stringify(errorData) : "Validation error",
          };
        } catch {
          return { success: false, error: responseText };
        }
      } else {
        console.error("Update failed:", responseText);
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
