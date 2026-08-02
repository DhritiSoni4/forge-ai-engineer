import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/error/ErrorBoundary";
import "./index.css";

import App from "./App";

import { CommandProvider } from "./components/command/CommandProvider";
import { ToastProvider } from "./components/ui/toast/ToastProvider";
import { SettingsProvider } from "./components/Settings/SettingsProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandProvider>
      <ToastProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ToastProvider>
    </CommandProvider>
  </StrictMode>
);