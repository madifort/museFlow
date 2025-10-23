// Background service worker for Chrome extension
import { handleMessage } from "../backend/core/messageRouter";
import { logger } from "../backend/utils/logger";

// Initialize the backend system
async function initializeBackend() {
  try {
    await logger.initializeLogging();
    console.log('[MuseFlow] Backend initialized successfully');
  } catch (error) {
    console.error("Failed to initialize MuseFlow backend:", error);
  }
}

// Initialize on startup
initializeBackend();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[MuseFlow] Extension installed/updated:', details.reason);
  
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
        console.error('[MuseFlow] Failed to send message to content script:', error);
      });
  }
});

// Handle runtime messages - CRITICAL FIX
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[MuseFlow] Message received:', message);
  
  // Always return true to keep the message channel open for async responses
  handleMessage(message, sender, sendResponse).catch((error) => {
    console.error('[MuseFlow] Error handling message:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    });
  });
  
  return true; // This is crucial for async message handling
});
