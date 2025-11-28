// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import CreateTemplate from "./features/template/pages/CreateTemplate";
// import InteractiveMapp from "./features/maps/pages/InteractiveMapp";
// import ViewTemplates from "./features/template/components/ViewTemplate";
// import LocationForm from "./features/template/components/LocationForm";
// import InteractiveMap from "./features/maps/pages/InteractiveMap";
// import AuthPage from "./features/auth/pages/AuthPage";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/signup" element={<AuthPage />} />
//         <Route path="/create-template" element={<CreateTemplate />} />
//         <Route path="/view-template" element={<ViewTemplates />} />
//         <Route path="/add-location/:templateId" element={<LocationForm />} />
//         <Route path="/interactive-map" element={<InteractiveMap />} />
//         <Route path="/interactive-mapp" element={<InteractiveMapp />} />

//         {/* Optional: Add a redirect or 404 page */}
//         <Route
//           path="*"
//           element={
//             <div className="min-h-screen flex items-center justify-center">
//               <div className="text-center">
//                 <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
//                 <a href="/signup" className="text-blue-600 hover:underline">
//                   Go to Sign Up
//                 </a>
//               </div>
//             </div>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./features/auth/components/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import { HealthMonitor } from "./features/components/HealthMonitor";
import AuthPage from "./features/auth/pages/AuthPage";
import InteractiveMap from "./features/maps/pages/InteractiveMap";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

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
