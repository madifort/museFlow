import { useEffect } from "react";

interface ShortcutConfig {
  onProcess?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter: Process text
      if (e.ctrlKey && e.key === "Enter" && shortcuts.onProcess) {
        e.preventDefault();
        shortcuts.onProcess();
      }

      // Ctrl+Delete: Clear all
      if (e.ctrlKey && e.key === "Delete" && shortcuts.onClear) {
        e.preventDefault();
        shortcuts.onClear();
      }

      // Ctrl+C: Copy response (only if there's output to copy)
      if (e.ctrlKey && e.key === "c" && shortcuts.onCopy) {
        e.preventDefault();
        shortcuts.onCopy();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

export function createMuseFlowShortcuts(config: ShortcutConfig) {
  return config;
}
