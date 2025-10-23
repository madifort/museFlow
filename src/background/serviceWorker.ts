// Background service worker for Chrome extension
import { initializeBackend } from "../backend/core/messageRouter";

interface ContextMessage {
  type: "CONTEXT_CAPTURED";
  data: {
    selectedText: string;
    title: string;
    url: string;
    snippet: string;
    timestamp: number;
  };
}

interface AIResponseMessage {
  type: "AI_RESPONSE";
  response: string;
  action: "summarize" | "rewrite" | "ideate" | "translate";
}

// Initialize the backend system
initializeBackend().catch((error) => {
  console.error("MuseFlow: Failed to initialize backend:", error);
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (message: ContextMessage | any, sender, sendResponse) => {
    // Handle context capture messages
    if (message.type === "CONTEXT_CAPTURED") {
      handleContextCapture(message.data);
      return true;
    }
    
    // Handle AI action requests from popup/content
    if (message.action && ['summarize', 'rewrite', 'ideate', 'translate'].includes(message.action)) {
      handleAIAction(message, sender, sendResponse);
      return true;
    }

    return false;
  },
);

async function handleContextCapture(data: ContextMessage["data"]) {
  try {
    console.log("MuseFlow: Processing context capture:", data);

    // For now, default to summarize operation
    // In the full implementation, this would be determined by user selection
    const action = "summarize";

    // Send AI action request to backend
    const response = await chrome.runtime.sendMessage({
      action,
      text: data.selectedText,
      options: {},
    });

    if (response.success) {
      // Send response back to content script
      const responseMessage: AIResponseMessage = {
        type: "AI_RESPONSE",
        response: response.data.summary || response.data.rewrittenText || response.data.ideas?.map((i: any) => i.title).join('\n') || response.data.translatedText || 'No response',
        action: action as any,
      };

      // Send to all tabs that might be listening
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, responseMessage).catch(() => {
              // Ignore errors for tabs that don't have our content script
            });
          }
        });
      });
    }
  } catch (error) {
    console.error("MuseFlow: Error processing context:", error);
  }
}

async function handleAIAction(message: any, sender: any, sendResponse: any) {
  try {
    // Forward to backend message router
    const response = await chrome.runtime.sendMessage(message);
    sendResponse(response);
  } catch (error) {
    console.error("MuseFlow: Error handling AI action:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Legacy cache function - now handled by backend cache system
async function cacheResponse(
  operation: string,
  input: string,
  response: string,
) {
  // This is now handled by the backend cache system
  // Keeping for backward compatibility
  console.log("MuseFlow: Caching handled by backend system");
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("MuseFlow: Extension installed/updated:", details.reason);

  // Create context menu for text selection
  chrome.contextMenus.create({
    id: "museflow-ai",
    title: "Process with MuseFlow AI",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "museflow-ai" && info.selectionText) {
    // Trigger the same flow as text selection
    const contextData: ContextMessage = {
      type: "CONTEXT_CAPTURED",
      data: {
        selectedText: info.selectionText,
        title: tab?.title || "Unknown",
        url: tab?.url || "Unknown",
        snippet:
          info.selectionText.substring(0, 200) +
          (info.selectionText.length > 200 ? "..." : ""),
        timestamp: Date.now(),
      },
    };

    handleContextCapture(contextData.data);
  }
});

// Add context menu items for different AI actions
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Create context menu for text selection with different AI actions
    chrome.contextMenus.create({
      id: "museflow-summarize",
      title: "Summarize with MuseFlow",
      contexts: ["selection"],
      parentId: "museflow-ai",
    });

    chrome.contextMenus.create({
      id: "museflow-rewrite",
      title: "Rewrite with MuseFlow",
      contexts: ["selection"],
      parentId: "museflow-ai",
    });

    chrome.contextMenus.create({
      id: "museflow-ideate",
      title: "Generate Ideas with MuseFlow",
      contexts: ["selection"],
      parentId: "museflow-ai",
    });

    chrome.contextMenus.create({
      id: "museflow-translate",
      title: "Translate with MuseFlow",
      contexts: ["selection"],
      parentId: "museflow-ai",
    });
  }
});

// Handle context menu clicks for different actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText && info.menuItemId?.toString().startsWith("museflow-")) {
    const action = info.menuItemId.toString().replace("museflow-", "");
    
    // Send AI action request
    chrome.runtime.sendMessage({
      action,
      text: info.selectionText,
      options: {},
    }).then((response) => {
      if (response.success && tab?.id) {
        // Send response to content script
        chrome.tabs.sendMessage(tab.id, {
          type: "AI_RESPONSE",
          response: response.data.summary || response.data.rewrittenText || 
                   response.data.ideas?.map((i: any) => i.title).join('\n') || 
                   response.data.translatedText || 'No response',
          action,
        });
      }
    }).catch((error) => {
      console.error("MuseFlow: Error processing context menu action:", error);
    });
  }
});
