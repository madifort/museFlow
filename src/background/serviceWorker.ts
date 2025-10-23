// Background service worker for Chrome extension
import { initializeBackend } from "../backend/core/messageRouter";
import { logger } from "../backend/utils/logger";

// Initialize the backend system
initializeBackend().catch((error) => {
  console.error("Failed to initialize MuseFlow backend:", error);
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  logger.info("Extension installed/updated", {
    reason: details.reason,
    previousVersion: details.previousVersion,
  });

  // Create context menu for text selection
  chrome.contextMenus.create({
    id: "museflow-summarize",
    title: "Summarize with MuseFlow",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "museflow-rewrite",
    title: "Rewrite with MuseFlow",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "museflow-ideate",
    title: "Ideate with MuseFlow",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "museflow-translate",
    title: "Translate with MuseFlow",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText || !tab?.id) return;

  const action = info.menuItemId?.replace("museflow-", "") as
    | "summarize"
    | "rewrite"
    | "ideate"
    | "translate";

  if (
    action &&
    ["summarize", "rewrite", "ideate", "translate"].includes(action)
  ) {
    // Send message to content script to trigger the action
    chrome.tabs
      .sendMessage(tab.id, {
        type: "TRIGGER_ACTION",
        action,
        text: info.selectionText,
        source: "contextMenu",
      })
      .catch((error) => {
        logger.error(
          "Failed to send message to content script",
          error as Error,
          {
            tabId: tab.id,
            action,
          },
        );
      });
  }
});
