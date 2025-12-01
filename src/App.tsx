import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./features/auth/components/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { HealthMonitor } from "./features/components/HealthMonitor";
import AuthPage from "./features/auth/pages/AuthPage";
import InteractiveMap from "./features/maps/pages/InteractiveMap";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth page - only accessible when NOT authenticated */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Interactive map - only accessible when authenticated */}
          <Route
            path="/interactive-map"
            element={
              <ProtectedRoute>
                <InteractiveMap />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to interactive map (will redirect to auth if not authenticated) */}
          <Route
            path="/"
            element={<Navigate to="/interactive-map" replace />}
          />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                  <a href="/auth" className="text-blue-600 hover:underline">
                    Go to Login
                  </a>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Health monitor appears on all pages */}
        <HealthMonitor />
      </Router>
    </AuthProvider>
  );
}

export default App;
