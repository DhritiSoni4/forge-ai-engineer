import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import LoadingOverlay from "./LoadingOverlay";

interface LoadingContextValue {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext =
  createContext<LoadingContextValue | null>(null);

export function LoadingProvider({
  children,
}: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoading = useCallback(
    (text = "Loading...") => {
      setMessage(text);
      setIsLoading(true);
    },
    []
  );

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      message,
      showLoading,
      hideLoading,
    }),
    [isLoading, message, showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error(
      "useLoading must be used within LoadingProvider."
    );
  }

  return context;
}