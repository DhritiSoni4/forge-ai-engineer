import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { registerDefaultCommands } from "./commands";

interface CommandContextValue {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({
  children,
}: PropsWithChildren) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerDefaultCommands();
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggle]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
    }),
    [open, toggle]
  );

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandContext);

  if (!context) {
    throw new Error(
      "useCommandPalette must be used inside CommandProvider"
    );
  }

  return context;
}