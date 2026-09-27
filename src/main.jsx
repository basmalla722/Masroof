import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CategoriesProvider } from "./context/CategoriesContext";
import "./index.css";
import "./advisor.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CategoriesProvider>
      <App />
    </CategoriesProvider>
  </React.StrictMode>
);
