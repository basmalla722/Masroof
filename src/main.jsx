import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CategoriesProvider } from "./context/CategoriesContext";
import { DataProvider } from "./context/DataContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import "./index.css";
import "./advisor.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PreferencesProvider>
      <DataProvider>
        <CategoriesProvider>
          <App />
        </CategoriesProvider>
      </DataProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
