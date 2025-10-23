import React from "react";
import ReactDOM from "react-dom/client";
import Dashboard from "./ui/Dashboard";
import "./index.css";

// Determine if we're in popup or options context
const isPopup = window.location.pathname.includes("index.html");
const isOptions = window.location.pathname.includes("options.html");

if (isPopup) {
  // Load Dashboard component for popup
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>,
  );
} else if (isOptions) {
  // Load Dashboard component for options page
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>,
  );
} else {
  // Default to Dashboard
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>,
  );
}
