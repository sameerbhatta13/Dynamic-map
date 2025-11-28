import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { APP_BASE_URL, API_BASE_URL } from "../../../utils/constants";

const authSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .optional()
    .or(z.literal("")),
  email: z.email("Please enter a valid email address"),
});

type AuthFormData = z.infer<typeof authSchema>;

interface MagicLinkPayload {
  email: string;
  callbackURL: string;
  errorCallbackURL: string;
  name?: string;
  newUserCallbackURL?: string;
}

interface ApiResponse {
  status: boolean;
}

interface ApiErrorResponse {
  message?: string;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitMessage(null);

      const payload: MagicLinkPayload = {
        email: data.email,
        callbackURL: `${APP_BASE_URL}/interactive-map`,
        errorCallbackURL: `${APP_BASE_URL}/auth?error=true`,
      };

      // Only include name for signup
      if (mode === "signup" && data.name) {
        payload.name = data.name;
        payload.newUserCallbackURL = `${APP_BASE_URL}/interactive-map`;
      }

      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/auth/sign-in/magic-link`,
        payload,
        { withCredentials: true }
      );

      if (response.data.status) {
        setSubmitMessage({
          type: "success",
          message: `Magic link sent! Please check your email to ${
            mode === "signup" ? "verify your account" : "log in"
          }.`,
        });
        reset();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as ApiErrorResponse | undefined;
        setSubmitMessage({
          type: "error",
          message:
            errorData?.message || "An error occurred. Please try again later.",
        });
      } else {
        setSubmitMessage({
          type: "error",
          message: "An unexpected error occurred. Please try again later.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === "login"
              ? "Enter your email to receive a magic link"
              : "Sign up to get started with our platform"}
          </p>
        </div>

        {/* Toggle between Login and Signup */}
        <div className="flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg border ${
              mode === "login"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border ${
              mode === "signup"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name (Optional)
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter your email"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {submitMessage && (
            <div
              className={`rounded-md p-4 ${
                submitMessage.type === "success" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p
                className={`text-sm ${
                  submitMessage.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {submitMessage.message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? "Sending..."
                : mode === "login"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
