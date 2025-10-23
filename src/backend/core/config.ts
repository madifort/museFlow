/**
 * Configuration settings for MuseFlow backend
 * Centralized configuration for AI providers, storage, and feature flags
 */

export interface Config {
  /** AI provider configuration */
  ai: {
    /** Preferred AI provider */
    provider: 'chrome' | 'openai' | 'gemini';
    /** OpenAI API configuration */
    openai: {
      apiKey?: string;
      model: string;
      baseUrl: string;
    };
    /** Chrome AI configuration */
    chrome: {
      model: string;
    };
    /** Gemini configuration */
    gemini: {
      apiKey?: string;
      model: string;
    };
  };
  
  /** Text processing limits */
  limits: {
    /** Maximum text length for processing */
    maxTextLength: number;
    /** Maximum cache entries */
    maxCacheEntries: number;
    /** Cache TTL in milliseconds */
    cacheTtl: number;
  };
  
  /** Feature flags */
  features: {
    /** Enable caching */
    enableCaching: boolean;
    /** Enable logging */
    enableLogging: boolean;
    /** Enable fallback providers */
    enableFallback: boolean;
  };
}

/**
 * Default configuration for MuseFlow
 */
export const defaultConfig: Config = {
  ai: {
    provider: 'chrome',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-3.5-turbo',
      baseUrl: 'https://api.openai.com/v1',
    },
    chrome: {
      model: 'gemini-pro',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-pro',
    },
  },
  limits: {
    maxTextLength: 5000,
    maxCacheEntries: 100,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
  },
  features: {
    enableCaching: true,
    enableLogging: true,
    enableFallback: true,
  },
};

/**
 * Get current configuration from storage or return defaults
 */
export async function getConfig(): Promise<Config> {
  try {
    const result = await chrome.storage.sync.get(['config']);
    return { ...defaultConfig, ...result.config };
  } catch (error) {
    console.warn('Failed to load config from storage, using defaults:', error);
    return defaultConfig;
  }
}

/**
 * Save configuration to storage
 */
export async function saveConfig(config: Partial<Config>): Promise<void> {
  try {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...config };
    await chrome.storage.sync.set({ config: newConfig });
  } catch (error) {
    console.error('Failed to save config to storage:', error);
    throw error;
  }
}
