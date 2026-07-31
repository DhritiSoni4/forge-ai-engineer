import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface SettingsContextValue {
  open: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

const SettingsContext =
  createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
}: PropsWithChildren) {
  const [open, setOpen] = useState(false);

  const openSettings = useCallback(() => {
    setOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      open,
      openSettings,
      closeSettings,
      toggleSettings,
    }),
    [open, openSettings, closeSettings, toggleSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used within SettingsProvider."
    );
  }

  return context;
}