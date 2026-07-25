import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";
import { CommandProvider } from "./components/command/CommandProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandProvider>
      <App />
    </CommandProvider>
  </StrictMode>
);