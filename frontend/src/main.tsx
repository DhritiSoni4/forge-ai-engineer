import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

import ErrorBoundary from "./components/error/ErrorBoundary";
import { CommandProvider } from "./components/command/CommandProvider";
import { ToastProvider } from "./components/ui/toast/ToastProvider";
import { SettingsProvider } from "./components/Settings/SettingsProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CommandProvider>
        <ToastProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </ToastProvider>
      </CommandProvider>
    </ErrorBoundary>
  </StrictMode>
);