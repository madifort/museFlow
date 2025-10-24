// Background service worker for Chrome extension
import { handleMessage, initializeMessageRouter } from "../backend/core/messageRouter";
import { initializeLogging, logInfo, logWarn, logError } from "../backend/utils/logger";

// Initialize the backend system
async function initializeBackend() {
  try {
    // Step 1: Initialize logging
    await initializeLogging();
    logInfo('Initializing backend...');
    
    // Step 2: Initialize message router
    await initializeMessageRouter();
    logInfo('Backend initialized successfully');

    // Step 3: Chrome AI Detection
    const hasChromeAI = 
      typeof chrome !== 'undefined' && 
      chrome.ai && 
      (chrome.ai.languageModel || chrome.ai.summarizer);
    
    logInfo(`Chrome AI detected: ${!!hasChromeAI}`);

    if (hasChromeAI) {
      logInfo('Testing Chrome AI summarizer...');
      try {
        // Test Chrome AI summarizer if available
        if (chrome.ai.summarizer) {
          const result = await chrome.ai.summarizer.summarize('MuseFlow AI integration test.', {
            length: 'short',
            format: 'paragraph'
          });
          logInfo('Chrome AI summarizer test successful:', result.summary);
        }
        
        // Test Chrome AI language model if available
        if (chrome.ai.languageModel) {
          const model = await chrome.ai.languageModel.create({ model: 'gemini-pro' });
          const response = await model.prompt('Test prompt for MuseFlow integration.', {
            temperature: 0.7,
            maxTokens: 50
          });
          logInfo('Chrome AI language model test successful:', response.response);
        }
        
        logInfo('Chrome AI integration verified - using native APIs');
      } catch (chromeError) {
        logWarn('Chrome AI test failed, will use fallback:', chromeError);
      }
    } else {
      logWarn('Chrome AI not available. Using fallback providers.');
    }

    logInfo('MuseFlow backend ready for production');
  } catch (error) {
    logError('Failed to initialize MuseFlow backend:', error);
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
