import { Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to interactive map
  if (isAuthenticated) {
    return <Navigate to="/interactive-map" replace />;
  }

  // If not authenticated, show the public route (auth page)
  return <>{children}</>;
}
