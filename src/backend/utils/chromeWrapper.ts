/**
 * Chrome API wrapper for MuseFlow
 * Abstracts Chrome API calls and provides fallback mechanisms
 */

import { logger } from './logger';
import { getConfig } from '../core/config';

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
    if (config.ai.provider === 'chrome' && chrome.ai) {
      logger.debug('Attempting Chrome AI API call', { model: config.ai.chrome.model });
      
      const response = await callChromeAIAPI(request, config.ai.chrome.model);
      logger.info('Chrome AI API call successful', { 
        provider: 'chrome',
        model: config.ai.chrome.model,
        responseLength: response.text.length
      });
      
      return response;
    }
    
    // Fallback to OpenAI
    if (config.features.enableFallback && config.ai.openai.apiKey) {
      logger.debug('Falling back to OpenAI API', { model: config.ai.openai.model });
      
      const response = await callOpenAI(request, config.ai.openai);
      logger.info('OpenAI API call successful', { 
        provider: 'openai',
        model: config.ai.openai.model,
        responseLength: response.text.length
      });
      
      return response;
    }
    
    // Fallback to Gemini
    if (config.features.enableFallback && config.ai.gemini.apiKey) {
      logger.debug('Falling back to Gemini API', { model: config.ai.gemini.model });
      
      const response = await callGemini(request, config.ai.gemini);
      logger.info('Gemini API call successful', { 
        provider: 'gemini',
        model: config.ai.gemini.model,
        responseLength: response.text.length
      });
      
      return response;
    }
    
    throw new Error('No AI provider available');
    
  } catch (error) {
    logger.error('AI API call failed', error as Error, { 
      provider: config.ai.provider,
      request: { promptLength: request.prompt.length }
    });
    throw error;
  }
}

/**
 * Call Chrome AI API directly
 */
async function callChromeAIAPI(request: AIRequest, model: string): Promise<AIResponse> {
  // Check if Chrome AI is available
  if (!chrome.ai) {
    throw new Error('Chrome AI API not available');
  }
  
  // This is a placeholder for the actual Chrome AI API call
  // The exact API will depend on Chrome's implementation
  try {
    // Simulate Chrome AI call - replace with actual implementation when available
    const response = await new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`Chrome AI response for: ${request.prompt.substring(0, 100)}...`);
      }, 1000);
    });
    
    return {
      text: response,
      model,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Chrome AI API call failed: ${error}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(request: AIRequest, config: any): Promise<AIResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    text: data.choices[0]?.message?.content || '',
    model: config.model,
    provider: 'openai',
    timestamp: new Date().toISOString(),
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Call Gemini API
 */
async function callGemini(request: AIRequest, config: any): Promise<AIResponse> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    text: data.candidates[0]?.content?.parts[0]?.text || '',
    model: config.model,
    provider: 'gemini',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Store data in Chrome storage
 */
export async function storeInChromeStorage(key: string, data: any): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: data });
    logger.debug('Data stored in Chrome storage', { key });
  } catch (error) {
    logger.error('Failed to store data in Chrome storage', error as Error, { key });
    throw error;
  }
}

/**
 * Retrieve data from Chrome storage
 */
export async function getFromChromeStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    logger.debug('Data retrieved from Chrome storage', { key, exists: !!result[key] });
    return result[key] || null;
  } catch (error) {
    logger.error('Failed to retrieve data from Chrome storage', error as Error, { key });
    throw error;
  }
}

/**
 * Remove data from Chrome storage
 */
export async function removeFromChromeStorage(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove([key]);
    logger.debug('Data removed from Chrome storage', { key });
  } catch (error) {
    logger.error('Failed to remove data from Chrome storage', error as Error, { key });
    throw error;
  }
}

/**
 * Send message to content script
 */
export async function sendMessageToContentScript(tabId: number, message: any): Promise<any> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    logger.debug('Message sent to content script', { tabId, messageType: message.type });
    return response;
  } catch (error) {
    logger.error('Failed to send message to content script', error as Error, { tabId });
    throw error;
  }
}

/**
 * Get current active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    logger.debug('Current tab retrieved', { tabId: tab?.id, url: tab?.url });
    return tab || null;
  } catch (error) {
    logger.error('Failed to get current tab', error as Error);
    throw error;
  }
}

/**
 * Check if Chrome AI is available
 */
export function isChromeAIAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.ai;
}

/**
 * Get Chrome extension info
 */
export async function getExtensionInfo(): Promise<chrome.management.ExtensionInfo | null> {
  try {
    const info = await chrome.management.getSelf();
    logger.debug('Extension info retrieved', { id: info.id, name: info.name });
    return info;
  } catch (error) {
    logger.error('Failed to get extension info', error as Error);
    return null;
  }
}
