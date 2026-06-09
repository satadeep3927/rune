import { JSX, splitProps, Show } from "solid-js";
import { cn } from "@/utils/cn";

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: "warning" | "error" | "success" | "info";
  icon?: JSX.Element | boolean;
  actions?: JSX.Element;
}

export function Alert(props: AlertProps) {
  const [local, others] = splitProps(props, ["class", "variant", "icon", "actions", "children"]);
  const variant = () => local.variant || "info";

  const colorVar = () => {
    switch (variant()) {
      case "warning": return "var(--color-warning)";
      case "error": return "var(--color-error)";
      case "success": return "var(--color-success)";
      default: return "var(--color-accent)";
    }
  };

  const defaultIcon = () => {
    if (local.icon === false) return null;
    if (local.icon && typeof local.icon !== "boolean") return local.icon;
    
    switch (variant()) {
      case "warning":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
        );
      case "error":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case "success":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  return (
    <div 
      class={cn("flex items-center justify-between px-4 py-2 text-xs border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]", local.class)}
      {...others}
    >
      <div class="flex items-center gap-2 font-medium" style={{ color: colorVar() }}>
        {defaultIcon()}
        <span>{local.children}</span>
      </div>
      <Show when={local.actions}>
        <div class="flex items-center gap-2">
          {local.actions}
        </div>
      </Show>
    </div>
  );
}
