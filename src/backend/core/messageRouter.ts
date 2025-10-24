/**
 * Message Router for MuseFlow backend
 * Handles Chrome runtime messaging and routes requests to appropriate AI handlers
 */

import { logger, initializeLogging } from "../utils/logger";
import { initializeSettings } from "../storage/settings";
import { handleSummarize, SummarizeOptions } from "../ai/summarize";
import { handleRewrite, RewriteOptions } from "../ai/rewrite";
import { handleIdeate, IdeateOptions } from "../ai/ideate";
import { handleTranslate, TranslateOptions } from "../ai/translate";

export type ActionType =
  | "summarize"
  | "rewrite"
  | "ideate"
  | "translate"
  | "verifyKey"
  | "ping"
  | "getSettings"
  | "updateSettings"
  | "clearCache";

export interface MessageRequest {
  /** Action to perform */
  action: ActionType;
  /** Input text to process */
  text?: string;
  /** Options for the action */
  options?:
    | SummarizeOptions
    | RewriteOptions
    | IdeateOptions
    | TranslateOptions
    | any;
  /** Request ID for tracking */
  requestId?: string;
  /** Tab ID for context */
  tabId?: number;
  /** Source of the request */
  source?: "content" | "popup" | "options" | "background";
}

export interface MessageResponse {
  /** Request success status */
  success: boolean;
  /** Response data */
  data?: any;
  /** Error message if failed */
  error?: string;
  /** Request ID for tracking */
  requestId?: string;
  /** Processing metadata */
  metadata?: {
    processingTime: number;
    timestamp: string;
    action: ActionType;
  };
}

/**
 * Initialize the message router
 */
export async function initializeMessageRouter(): Promise<void> {
  try {
    // Initialize logging and settings
    await initializeLogging();
    await initializeSettings();

    // Set up message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    logger.info("Message router initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize message router", error as Error);
    throw error;
  }
}

/**
 * Handle incoming messages
 */
export async function handleMessage(
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void,
): Promise<boolean> {
  const startTime = Date.now();
  const requestId = request.requestId || generateRequestId();

  try {
    console.log('[MuseFlow] Message received:', {
      action: request.action,
      requestId,
      source: request.source,
      tabId: request.tabId,
      senderId: sender.tab?.id,
    });

    // Validate request - ensure action is present and ignore legacy 'type' field
    if (!request.action) {
      throw new Error("Action is required");
    }

    // Log that we're ignoring legacy 'type' field if present
    if ((request as any).type) {
      console.log('[MuseFlow] Ignoring legacy type field:', (request as any).type);
    }

    let result: any;
    const metadata = {
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      action: request.action,
    };

    // Route to appropriate handler
    switch (request.action) {
      case "ping":
        result = await handlePing();
        break;

      case "summarize":
        result = await handleSummarizeAction(
          request.text!,
          request.options as SummarizeOptions,
        );
        break;

      case "rewrite":
        result = await handleRewriteAction(
          request.text!,
          request.options as RewriteOptions,
        );
        break;

      case "ideate":
        result = await handleIdeateAction(
          request.text!,
          request.options as IdeateOptions,
        );
        break;

      case "translate":
        result = await handleTranslateAction(
          request.text!,
          request.options as TranslateOptions,
        );
        break;

      case "verifyKey":
        result = await handleVerifyKey(request.options);
        break;

      case "getSettings":
        result = await handleGetSettings();
        break;

      case "updateSettings":
        result = await handleUpdateSettings(request.options);
        break;

      case "clearCache":
        result = await handleClearCache();
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const response: MessageResponse = {
      success: true,
      data: result,
      requestId,
      metadata,
    };

    console.log('[MuseFlow][INFO] Received', request.action);
    console.log('[MuseFlow][INFO] Processed', request.action, 'successfully');
    console.log('[MuseFlow] Router executed action:', request.action);
    console.log('[MuseFlow] Response sent:', response);

    sendResponse(response);
    return true;
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('[MuseFlow] Message processing failed:', error);

    const response: MessageResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      requestId,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        action: request.action,
      },
    };

    // Handle specific error types with structured responses
    if (error instanceof Error) {
      if (error.message.includes("INSUFFICIENT_CONTEXT")) {
        response.error = "INSUFFICIENT_CONTEXT: Please provide at least 10 characters of text";
      } else if (error.message.includes("Chrome AI API not available")) {
        response.error = "AI service unavailable: Chrome AI API not accessible";
      } else if (error.message.includes("No AI provider available")) {
        response.error = "AI service unavailable: No AI providers configured";
      }
    }

    console.log('[MuseFlow] Error response sent:', response);
    sendResponse(response);
    return true;
  }
}

/**
 * Handle ping action
 */
async function handlePing(): Promise<{ status: string; timestamp: string }> {
  return {
    status: "pong",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle summarize action
 */
async function handleSummarizeAction(
  text: string,
  options: SummarizeOptions = {},
): Promise<any> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for summarization");
  }

  return await handleSummarize(text, options);
}

/**
 * Handle rewrite action
 */
async function handleRewriteAction(
  text: string,
  options: RewriteOptions = {},
): Promise<any> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for rewriting");
  }

  return await handleRewrite(text, options);
}

/**
 * Handle ideate action
 */
async function handleIdeateAction(
  text: string,
  options: IdeateOptions = {},
): Promise<any> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for ideation");
  }

  return await handleIdeate(text, options);
}

/**
 * Handle translate action
 */
async function handleTranslateAction(
  text: string,
  options: TranslateOptions = {},
): Promise<any> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for translation");
  }

  return await handleTranslate(text, options);
}

/**
 * Handle get settings action
 */
async function handleGetSettings(): Promise<any> {
  const { settingsManager } = await import("../storage/settings");
  return settingsManager.getSettings();
}

/**
 * Handle update settings action
 */
async function handleUpdateSettings(settings: any): Promise<any> {
  const { settingsManager } = await import("../storage/settings");

  if (settings.user) {
    await settingsManager.updateUserSettings(settings.user);
  }

  if (settings.providers) {
    await settingsManager.updateProviderSettings(settings.providers);
  }

  return settingsManager.getSettings();
}

/**
 * Handle verify key action
 */
async function handleVerifyKey(
  options: any,
): Promise<{ valid: boolean; provider?: string }> {
  const { verifyKey } = await import("../utils/chromeWrapper");

  if (!options.provider || !options.apiKey) {
    throw new Error("Provider and API key are required");
  }

  const valid = await verifyKey(options.provider, options.apiKey);

  return {
    valid,
    provider: options.provider,
  };
}

/**
 * Handle clear cache action
 */
async function handleClearCache(): Promise<{ message: string }> {
  const { clearCache } = await import("../storage/cache");
  await clearCache();
  return { message: "Cache cleared successfully" };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send message to content script
 */
export async function sendMessageToContentScript(
  tabId: number,
  message: any,
): Promise<any> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    logger.debug("Message sent to content script", {
      tabId,
      messageType: message.type,
    });
    return response;
  } catch (error) {
    logger.error("Failed to send message to content script", error as Error, {
      tabId,
    });
    throw error;
  }
}

/**
 * Send message to popup
 */
export async function sendMessageToPopup(message: any): Promise<any> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    logger.debug("Message sent to popup", { messageType: message.type });
    return response;
  } catch (error) {
    logger.error("Failed to send message to popup", error as Error);
    throw error;
  }
}

/**
 * Broadcast message to all tabs
 */
export async function broadcastMessage(message: any): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
          logger.debug("Failed to send message to tab", {
            tabId: tab.id,
            error: (error as Error).message,
          });
        }
      }
    }

    logger.debug("Message broadcasted to all tabs", {
      messageType: message.type,
    });
  } catch (error) {
    logger.error("Failed to broadcast message", error as Error);
    throw error;
  }
}

/**
 * Get current active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab || null;
  } catch (error) {
    logger.error("Failed to get current tab", error as Error);
    return null;
  }
}

/**
 * Handle tab updates
 */
export function setupTabUpdateHandler(): void {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      logger.debug("Tab updated", { tabId, url: tab.url });

      // Send tab update message to content script
      sendMessageToContentScript(tabId, {
        type: "tabUpdated",
        url: tab.url,
        timestamp: new Date().toISOString(),
      }).catch((error) => {
        logger.debug("Failed to notify content script of tab update", {
          tabId,
          error: error.message,
        });
      });
    }
  });
}

/**
 * Handle extension installation/update
 */
export function setupInstallHandler(): void {
  chrome.runtime.onInstalled.addListener((details) => {
    logger.info("Extension installed/updated", {
      reason: details.reason,
      previousVersion: details.previousVersion,
    });

    if (details.reason === "install") {
      // Initialize settings on first install
      initializeSettings().catch((error) => {
        logger.error(
          "Failed to initialize settings on install",
          error as Error,
        );
      });
    }
  });
}

/**
 * Handle extension startup
 */
export function setupStartupHandler(): void {
  chrome.runtime.onStartup.addListener(() => {
    logger.info("Extension started");

    // Reinitialize on startup
    initializeMessageRouter().catch((error) => {
      logger.error(
        "Failed to reinitialize message router on startup",
        error as Error,
      );
    });
  });
}

/**
 * Setup all event handlers
 */
export function setupEventHandlers(): void {
  setupTabUpdateHandler();
  setupInstallHandler();
  setupStartupHandler();
}

/**
 * Initialize the complete backend system
 */
export async function initializeBackend(): Promise<void> {
  try {
    await initializeMessageRouter();
    setupEventHandlers();

    logger.info("MuseFlow backend initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize MuseFlow backend", error as Error);
    throw error;
  }
}

// Export for use in service worker
export { initializeBackend as default };
