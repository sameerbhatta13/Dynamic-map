import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupPage from "./features/auth/pages/Signup";
import "./App.css";
import CreateTemplate from "./features/template/pages/CreateTemplate";
import InteractiveMap from "./features/maps/pages/InteractiveMap";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/create-template" element={<CreateTemplate />} />
        <Route path="/interactive-map" element={<InteractiveMap />} />

        {/* Optional: Add a redirect or 404 page */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                <a href="/signup" className="text-blue-600 hover:underline">
                  Go to Sign Up
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
