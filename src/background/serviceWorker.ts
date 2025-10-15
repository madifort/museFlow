// Background service worker for Chrome extension
import { buildPrompt } from "../utils/promptBuilder";

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
}

// Mock Chrome AI API - replace with real implementation later
async function fakeChromeAI(
  operation: "summarize" | "rewrite" | "ideate",
  content: string,
): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const prompts = {
    summarize: `Summarize this content clearly and concisely:\n\n${content}`,
    rewrite: `Rewrite this content to be more engaging and clear:\n\n${content}`,
    ideate: `Generate creative ideas and suggestions based on this content:\n\n${content}`,
  };

  // Mock responses based on operation type
  const mockResponses = {
    summarize: `**Summary:**\n\n${content.substring(0, 100)}...\n\nKey points:\n• Main topic covered\n• Important details highlighted\n• Clear overview provided`,
    rewrite: `**Enhanced Version:**\n\n${content
      .split(" ")
      .map((word, i) => (i % 3 === 0 ? word.toUpperCase() : word))
      .join(
        " ",
      )}\n\nThis rewritten version improves clarity and engagement while maintaining the original meaning.`,
    ideate:
      "**Creative Ideas:**\n\n💡 **Expand on this topic** - Consider diving deeper into the technical aspects\n🎯 **Practical applications** - How can this be applied in real-world scenarios?\n🔍 **Related concepts** - Explore connections to other related topics\n📊 **Data visualization** - Create charts or diagrams to illustrate key points",
  };

  return mockResponses[operation];
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (message: ContextMessage, sender, sendResponse) => {
    if (message.type === "CONTEXT_CAPTURED") {
      handleContextCapture(message.data);
    }

    return true; // Keep message channel open for async response
  },
);

async function handleContextCapture(data: ContextMessage["data"]) {
  try {
    console.log("MuseFlow: Processing context capture:", data);

    // For now, default to summarize operation
    // In the full implementation, this would be determined by user selection
    const operation: "summarize" | "rewrite" | "ideate" = "summarize";

    // Build the prompt using our utility
    const prompt = buildPrompt(operation, data.selectedText);

    // Simulate Chrome AI API call
    const response = await fakeChromeAI(operation, data.selectedText);

    // Cache the response
    await cacheResponse(operation, data.selectedText, response);

    // Send response back to content script
    const responseMessage: AIResponseMessage = {
      type: "AI_RESPONSE",
      response,
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
  } catch (error) {
    console.error("MuseFlow: Error processing context:", error);
  }
}

// Cache responses using Chrome storage
async function cacheResponse(
  operation: string,
  input: string,
  response: string,
) {
  try {
    const cacheKey = `ai_cache_${Date.now()}`;
    const cacheData = {
      operation,
      input: input.substring(0, 500), // Limit input size
      response,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ [cacheKey]: cacheData });

    // Keep only last 3 responses
    const allCache = await chrome.storage.local.get();
    const cacheEntries = Object.entries(allCache)
      .filter(([key]) => key.startsWith("ai_cache_"))
      .sort(([, a], [, b]) => (b as any).timestamp - (a as any).timestamp)
      .slice(0, 3);

    // Clear old cache entries
    const newCache: Record<string, any> = {};
    cacheEntries.forEach(([key, value]) => {
      newCache[key] = value;
    });

    await chrome.storage.local.clear();
    await chrome.storage.local.set(newCache);
  } catch (error) {
    console.error("MuseFlow: Error caching response:", error);
  }
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
