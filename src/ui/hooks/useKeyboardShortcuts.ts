import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(
        (shortcut) =>
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey,
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

// Common shortcuts for MuseFlow
export const createMuseFlowShortcuts = (actions: {
  onProcess: () => void;
  onClear: () => void;
  onCopy?: () => void;
}) => [
  {
    key: "Enter",
    ctrlKey: true,
    action: actions.onProcess,
    description: "Process text (Ctrl+Enter)",
  },
  {
    key: "Delete",
    ctrlKey: true,
    action: actions.onClear,
    description: "Clear all (Ctrl+Delete)",
  },
  ...(actions.onCopy
    ? [
        {
          key: "c",
          ctrlKey: true,
          action: actions.onCopy,
          description: "Copy response (Ctrl+C)",
        },
      ]
    : []),
];
