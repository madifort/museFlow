/**
 * Settings management for MuseFlow backend
 * Handles user preferences and configuration storage
 */

import { logger } from '../utils/logger';
import { PromptOptions } from '../core/promptBuilder';

export interface UserSettings {
  /** Default language for translations */
  defaultLanguage: string;
  /** Default tone for rewriting */
  defaultTone: 'formal' | 'casual' | 'professional' | 'creative';
  /** Default summary length */
  defaultSummaryLength: 'short' | 'medium' | 'long';
  /** Preferred AI provider */
  preferredProvider: 'chrome' | 'openai' | 'gemini';
  /** Auto-cache responses */
  autoCache: boolean;
  /** Show debug information */
  showDebugInfo: boolean;
  /** Keyboard shortcuts enabled */
  keyboardShortcuts: boolean;
  /** Popup position preference */
  popupPosition: 'top' | 'bottom' | 'left' | 'right';
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
  /** Animation preferences */
  animations: boolean;
  /** Sound effects */
  soundEffects: boolean;
  /** Auto-expand popup */
  autoExpandPopup: boolean;
  /** Context window size */
  contextWindowSize: number;
}

export interface ProviderSettings {
  /** OpenAI API key (encrypted) */
  openaiApiKey?: string;
  /** Gemini API key (encrypted) */
  geminiApiKey?: string;
  /** Custom OpenAI endpoint */
  openaiEndpoint?: string;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Max retry attempts */
  maxRetries: number;
  /** Rate limiting */
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface AppSettings {
  /** User preferences */
  user: UserSettings;
  /** Provider configuration */
  providers: ProviderSettings;
  /** Last updated timestamp */
  lastUpdated: number;
  /** Version of settings schema */
  version: string;
}

/**
 * Default user settings
 */
export const defaultUserSettings: UserSettings = {
  defaultLanguage: 'English',
  defaultTone: 'professional',
  defaultSummaryLength: 'medium',
  preferredProvider: 'chrome',
  autoCache: true,
  showDebugInfo: false,
  keyboardShortcuts: true,
  popupPosition: 'top',
  theme: 'auto',
  animations: true,
  soundEffects: false,
  autoExpandPopup: false,
  contextWindowSize: 1000,
};

/**
 * Default provider settings
 */
export const defaultProviderSettings: ProviderSettings = {
  requestTimeout: 30000,
  maxRetries: 3,
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
};

/**
 * Default app settings
 */
export const defaultAppSettings: AppSettings = {
  user: defaultUserSettings,
  providers: defaultProviderSettings,
  lastUpdated: Date.now(),
  version: '1.0.0',
};

class SettingsManager {
  private settings: AppSettings = defaultAppSettings;
  private isInitialized = false;

  /**
   * Initialize settings manager
   */
  async initialize(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['appSettings']);
      
      if (result.appSettings) {
        this.settings = { ...defaultAppSettings, ...result.appSettings };
        logger.debug('Settings loaded from storage', { 
          version: this.settings.version,
          lastUpdated: new Date(this.settings.lastUpdated).toISOString()
        });
      } else {
        await this.saveSettings();
        logger.debug('Default settings initialized');
      }
      
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize settings', error as Error);
      this.settings = defaultAppSettings;
      this.isInitialized = true;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get user settings
   */
  getUserSettings(): UserSettings {
    return { ...this.settings.user };
  }

  /**
   * Get provider settings
   */
  getProviderSettings(): ProviderSettings {
    return { ...this.settings.providers };
  }

  /**
   * Update user settings
   */
  async updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
    try {
      this.settings.user = { ...this.settings.user, ...updates };
      this.settings.lastUpdated = Date.now();
      
      await this.saveSettings();
      
      logger.info('User settings updated', { 
        updates: Object.keys(updates),
        timestamp: new Date(this.settings.lastUpdated).toISOString()
      });
    } catch (error) {
      logger.error('Failed to update user settings', error as Error, { updates });
      throw error;
    }
  }

  /**
   * Update provider settings
   */
  async updateProviderSettings(updates: Partial<ProviderSettings>): Promise<void> {
    try {
      this.settings.providers = { ...this.settings.providers, ...updates };
      this.settings.lastUpdated = Date.now();
      
      await this.saveSettings();
      
      logger.info('Provider settings updated', { 
        updates: Object.keys(updates),
        timestamp: new Date(this.settings.lastUpdated).toISOString()
      });
    } catch (error) {
      logger.error('Failed to update provider settings', error as Error, { updates });
      throw error;
    }
  }

  /**
   * Get default prompt options based on user settings
   */
  getDefaultPromptOptions(): PromptOptions {
    return {
      targetLanguage: this.settings.user.defaultLanguage,
      tone: this.settings.user.defaultTone,
      summaryLength: this.settings.user.defaultSummaryLength,
    };
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      this.settings = { ...defaultAppSettings };
      await this.saveSettings();
      
      logger.info('Settings reset to defaults');
    } catch (error) {
      logger.error('Failed to reset settings', error as Error);
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(jsonString: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(jsonString);
      
      // Validate settings structure
      if (!importedSettings.user || !importedSettings.providers) {
        throw new Error('Invalid settings format');
      }
      
      // Merge with defaults to ensure all fields exist
      this.settings = {
        user: { ...defaultUserSettings, ...importedSettings.user },
        providers: { ...defaultProviderSettings, ...importedSettings.providers },
        lastUpdated: Date.now(),
        version: importedSettings.version || defaultAppSettings.version,
      };
      
      await this.saveSettings();
      
      logger.info('Settings imported successfully', { 
        version: this.settings.version 
      });
    } catch (error) {
      logger.error('Failed to import settings', error as Error);
      throw error;
    }
  }

  /**
   * Save settings to Chrome storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({ appSettings: this.settings });
      logger.debug('Settings saved to storage');
    } catch (error) {
      logger.error('Failed to save settings to storage', error as Error);
      throw error;
    }
  }

  /**
   * Check if settings are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get setting value by path
   */
  getSettingValue(path: string): any {
    const keys = path.split('.');
    let value: any = this.settings;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set setting value by path
   */
  async setSettingValue(path: string, value: any): Promise<void> {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.settings;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    this.settings.lastUpdated = Date.now();
    
    await this.saveSettings();
    
    logger.debug('Setting value updated', { path, value });
  }
}

/**
 * Global settings manager instance
 */
export const settingsManager = new SettingsManager();

/**
 * Initialize settings manager
 */
export async function initializeSettings(): Promise<void> {
  return settingsManager.initialize();
}

/**
 * Get current user settings
 */
export function getUserSettings(): UserSettings {
  return settingsManager.getUserSettings();
}

/**
 * Update user settings
 */
export async function updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
  return settingsManager.updateUserSettings(updates);
}

/**
 * Get default prompt options
 */
export function getDefaultPromptOptions(): PromptOptions {
  return settingsManager.getDefaultPromptOptions();
}

/**
 * Get setting value by path
 */
export function getSettingValue(path: string): any {
  return settingsManager.getSettingValue(path);
}

/**
 * Set setting value by path
 */
export async function setSettingValue(path: string, value: any): Promise<void> {
  return settingsManager.setSettingValue(path, value);
}
