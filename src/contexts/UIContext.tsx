import { createContext, useContext } from "solid-js";

interface UIContextType {
  showConfirmDialog: (
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
      cancelLabel?: string;
      variant?: "primary" | "danger";
      hideCancel?: boolean;
    }
  ) => Promise<boolean>;
  showQuickPick: (
    items: { id: string; label: string; detail?: string }[],
    options?: { placeholder?: string }
  ) => Promise<string | undefined>;
  showPromptDialog: (
    title: string,
    fields: { id: string; label: string; type?: "text" | "password"; placeholder?: string; defaultValue?: string }[],
    options?: { message?: string; okLabel?: string; cancelLabel?: string }
  ) => Promise<Record<string, string> | null>;
}

export const UIContext = createContext<UIContextType>();

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return ctx;
}
