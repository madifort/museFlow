/**
 * Chrome API wrapper for MuseFlow
 * Abstracts Chrome API calls and provides fallback mechanisms
 */

import { logger } from "./logger";
import { getConfig } from "../core/config";

export interface AIResponse {
  text: string;
  model?: string;
  provider: string;
  timestamp: string;
  tokensUsed?: number;
}

export interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Call Chrome AI API with fallback to external providers
 */
export async function callChromeAI(request: AIRequest): Promise<AIResponse> {
  const config = await getConfig();

  try {
    // Try Chrome AI first if available
    if (config.ai.provider === "chrome" && chrome.ai) {
      logger.debug("Attempting Chrome AI API call", {
        model: config.ai.chrome.model,
      });

      const response = await callChromeAIAPI(request, config.ai.chrome.model);
      logger.info("Chrome AI API call successful", {
        provider: "chrome",
        model: config.ai.chrome.model,
        responseLength: response.text.length,
      });

      return response;
    }

    // Chrome AI not available, try fallback providers
    console.log('[MuseFlow] Chrome AI not available, trying fallback providers...');

    // Fallback to OpenAI
    if (config.features.enableFallback && config.ai.openai.apiKey) {
      logger.debug("Falling back to OpenAI API", {
        model: config.ai.openai.model,
      });

      const response = await callOpenAI(request, config.ai.openai);
      logger.info("OpenAI API call successful", {
        provider: "openai",
        model: config.ai.openai.model,
        responseLength: response.text.length,
      });

      return response;
    }

    // Fallback to Gemini
    if (config.features.enableFallback && config.ai.gemini.apiKey) {
      logger.debug("Falling back to Gemini API", {
        model: config.ai.gemini.model,
      });

      const response = await callGemini(request, config.ai.gemini);
      logger.info("Gemini API call successful", {
        provider: "gemini",
        model: config.ai.gemini.model,
        responseLength: response.text.length,
      });

      return response;
    }

    throw new Error("No AI provider available");
  } catch (error) {
    logger.error("AI API call failed", error as Error, {
      provider: config.ai.provider,
      request: { promptLength: request.prompt.length },
    });
    throw error;
  }
}

/**
 * Call Chrome AI API directly using real Chrome Built-in AI APIs
 */
async function callChromeAIAPI(
  request: AIRequest,
  model: string,
): Promise<AIResponse> {
  // Check if Chrome AI is available
  if (!chrome.ai) {
    throw new Error("Chrome AI API not available");
  }

  try {
    console.log('[MuseFlow] Using real Chrome AI API with model:', model);
    
    // Use Chrome AI Language Model API (primary method)
    if (chrome.ai.languageModel) {
      console.log('[MuseFlow] Creating Chrome AI language model...');
      
      // Create model instance
      const languageModel = await chrome.ai.languageModel.create({ 
        model: model || "gemini-pro" 
      });
      
      console.log('[MuseFlow] Model created, generating response...');
      
      // Generate response using the model
      const response = await languageModel.prompt(request.prompt, {
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 500,
        topP: 0.9,
      });

      console.log('[MuseFlow] Chrome AI response received:', response.response);

      return {
        text: response.response,
        model: model || "gemini-pro",
        provider: "chrome",
        timestamp: new Date().toISOString(),
        tokensUsed: response.usage?.totalTokens,
      };
    }

    // Fallback to Chrome AI Summarizer API if available
    if (chrome.ai.summarizer) {
      console.log('[MuseFlow] Using Chrome AI summarizer...');
      
      const response = await chrome.ai.summarizer.summarize(request.prompt, {
        length: "medium",
        format: "paragraph",
      });

      console.log('[MuseFlow] Chrome AI summarizer response:', response.summary);

      return {
        text: response.summary,
        model: model || "gemini-pro",
        provider: "chrome",
        timestamp: new Date().toISOString(),
      };
    }

    // If no Chrome AI APIs are available, throw error
    throw new Error("No Chrome AI APIs available - neither languageModel nor summarizer");
  } catch (error) {
    console.error('[MuseFlow] Chrome AI API call failed:', error);
    throw new Error(`Chrome AI API call failed: ${error}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  request: AIRequest,
  config: any,
): Promise<AIResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    text: data.choices[0]?.message?.content || "",
    model: config.model,
    provider: "openai",
    timestamp: new Date().toISOString(),
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Call Gemini API
 */
async function callGemini(
  request: AIRequest,
  config: any,
): Promise<AIResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 1000,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} ${errorData.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    text: data.candidates[0]?.content?.parts[0]?.text || "",
    model: config.model,
    provider: "gemini",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Store data in Chrome storage
 */
export async function storeInChromeStorage(
  key: string,
  data: any,
): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: data });
    logger.debug("Data stored in Chrome storage", { key });
  } catch (error) {
    logger.error("Failed to store data in Chrome storage", error as Error, {
      key,
    });
    throw error;
  }
}

/**
 * Retrieve data from Chrome storage
 */
export async function getFromChromeStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    logger.debug("Data retrieved from Chrome storage", {
      key,
      exists: !!result[key],
    });
    return result[key] || null;
  } catch (error) {
    logger.error(
      "Failed to retrieve data from Chrome storage",
      error as Error,
      { key },
    );
    throw error;
  }
}

/**
 * Remove data from Chrome storage
 */
export async function removeFromChromeStorage(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove([key]);
    logger.debug("Data removed from Chrome storage", { key });
  } catch (error) {
    logger.error("Failed to remove data from Chrome storage", error as Error, {
      key,
    });
    throw error;
  }
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
 * Get current active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    logger.debug("Current tab retrieved", { tabId: tab?.id, url: tab?.url });
    return tab || null;
  } catch (error) {
    logger.error("Failed to get current tab", error as Error);
    throw error;
  }
}

/**
 * Check if Chrome AI is available
 */
export function isChromeAIAvailable(): boolean {
  return typeof chrome !== "undefined" && !!chrome.ai;
}

/**
 * Verify OpenAI API key validity
 */
export async function verifyOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    logger.error("Failed to verify OpenAI API key", error as Error);
    return false;
  }
}

/**
 * Verify Gemini API key validity
 */
export async function verifyGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
      },
    );

    return response.ok;
  } catch (error) {
    logger.error("Failed to verify Gemini API key", error as Error);
    return false;
  }
}

/**
 * Verify API key for any provider
 */
export async function verifyKey(
  provider: "openai" | "gemini",
  apiKey: string,
): Promise<boolean> {
  switch (provider) {
    case "openai":
      return await verifyOpenAIKey(apiKey);
    case "gemini":
      return await verifyGeminiKey(apiKey);
    default:
      return false;
  }
}

/**
 * Get Chrome extension info
 */
export async function getExtensionInfo(): Promise<chrome.management.ExtensionInfo | null> {
  try {
    const info = await chrome.management.getSelf();
    logger.debug("Extension info retrieved", { id: info.id, name: info.name });
    return info;
  } catch (error) {
    logger.error("Failed to get extension info", error as Error);
    return null;
  }
}

/**
 * Chrome AI Summarization using real Chrome AI APIs
 */
export async function callChromeAISummarize(
  text: string,
  options: { length?: "short" | "medium" | "long" } = {}
): Promise<AIResponse> {
  if (!chrome.ai) {
    throw new Error("Chrome AI API not available");
  }

  try {
    console.log('[MuseFlow] Using Chrome AI Summarizer API...');
    
    if (chrome.ai.summarizer) {
      const response = await chrome.ai.summarizer.summarize(text, {
        length: options.length || "medium",
        format: "paragraph",
      });

      return {
        text: response.summary,
        model: "chrome-summarizer",
        provider: "chrome",
        timestamp: new Date().toISOString(),
      };
    }

    // Fallback to language model for summarization
    if (chrome.ai.languageModel) {
      const model = await chrome.ai.languageModel.create({ model: "gemini-pro" });
      const prompt = `Summarize the following text in ${options.length || "medium"} length:\n\n${text}`;
      
      const response = await model.prompt(prompt, {
        temperature: 0.3,
        maxTokens: options.length === "short" ? 150 : options.length === "long" ? 500 : 300,
        topP: 0.9,
      });

      return {
        text: response.response,
        model: "gemini-pro",
        provider: "chrome",
        timestamp: new Date().toISOString(),
        tokensUsed: response.usage?.totalTokens,
      };
    }

    throw new Error("No Chrome AI summarization APIs available");
  } catch (error) {
    console.error('[MuseFlow] Chrome AI summarization failed:', error);
    throw error;
  }
}

/**
 * Chrome AI Text Generation using real Chrome AI APIs
 */
export async function callChromeAIGenerate(
  prompt: string,
  options: { 
    temperature?: number; 
    maxTokens?: number; 
    topP?: number;
    model?: string;
  } = {}
): Promise<AIResponse> {
  if (!chrome.ai) {
    throw new Error("Chrome AI API not available");
  }

  try {
    console.log('[MuseFlow] Using Chrome AI Language Model API...');
    
    if (chrome.ai.languageModel) {
      const model = await chrome.ai.languageModel.create({ 
        model: options.model || "gemini-pro" 
      });
      
      const response = await model.prompt(prompt, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 500,
        topP: options.topP || 0.9,
      });

      return {
        text: response.response,
        model: options.model || "gemini-pro",
        provider: "chrome",
        timestamp: new Date().toISOString(),
        tokensUsed: response.usage?.totalTokens,
      };
    }

    throw new Error("Chrome AI Language Model API not available");
  } catch (error) {
    console.error('[MuseFlow] Chrome AI text generation failed:', error);
    throw error;
  }
}

/**
 * Chrome AI Translation using real Chrome AI APIs
 */
export async function callChromeAITranslate(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<AIResponse> {
  if (!chrome.ai) {
    throw new Error("Chrome AI API not available");
  }

  try {
    console.log('[MuseFlow] Using Chrome AI for translation...');
    
    if (chrome.ai.languageModel) {
      const model = await chrome.ai.languageModel.create({ model: "gemini-pro" });
      
      const prompt = `Translate the following text from ${sourceLanguage || "auto-detect"} to ${targetLanguage}:\n\n${text}`;
      
      const response = await model.prompt(prompt, {
        temperature: 0.3,
        maxTokens: Math.min(text.length * 2, 1000),
        topP: 0.9,
      });

      return {
        text: response.response,
        model: "gemini-pro",
        provider: "chrome",
        timestamp: new Date().toISOString(),
        tokensUsed: response.usage?.totalTokens,
      };
    }

    throw new Error("Chrome AI Language Model API not available for translation");
  } catch (error) {
    console.error('[MuseFlow] Chrome AI translation failed:', error);
    throw error;
  }
}
