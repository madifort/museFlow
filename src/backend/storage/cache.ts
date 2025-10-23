/**
 * Cache system for MuseFlow backend
 * Manages AI response caching and recent requests storage
 */

import { logger } from '../utils/logger';
import { getConfig } from '../core/config';
import { AIResponse } from '../utils/chromeWrapper';

export interface CacheEntry {
  /** Unique identifier for the cache entry */
  id: string;
  /** Original input text */
  inputText: string;
  /** AI response */
  response: AIResponse;
  /** Timestamp when cached */
  timestamp: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Action type */
  action: string;
  /** Hash of input for quick lookup */
  inputHash: string;
}

export interface CacheStats {
  /** Total number of cache entries */
  totalEntries: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Cache hit rate */
  hitRate: number;
  /** Oldest entry timestamp */
  oldestEntry: number;
  /** Newest entry timestamp */
  newestEntry: number;
}

class CacheManager {
  private stats: CacheStats = {
    totalEntries: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    oldestEntry: 0,
    newestEntry: 0,
  };

  /**
   * Generate a hash for the input text
   */
  private generateHash(text: string, action: string): string {
    // Simple hash function for cache keys
    const combined = `${action}:${text}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Check if a cache entry exists and is valid
   */
  async getCacheEntry(inputText: string, action: string): Promise<AIResponse | null> {
    try {
      const config = await getConfig();
      
      if (!config.features.enableCaching) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const inputHash = this.generateHash(inputText, action);
      const cacheKey = `cache_${inputHash}`;
      
      const result = await chrome.storage.local.get([cacheKey]);
      const entry: CacheEntry = result[cacheKey];
      
      if (!entry) {
        this.stats.misses++;
        this.updateHitRate();
        logger.debug('Cache miss', { action, inputHash });
        return null;
      }
      
      // Check if entry is expired
      const now = Date.now();
      if (now > entry.timestamp + entry.ttl) {
        await this.removeCacheEntry(cacheKey);
        this.stats.misses++;
        this.updateHitRate();
        logger.debug('Cache entry expired', { action, inputHash, age: now - entry.timestamp });
        return null;
      }
      
      this.stats.hits++;
      this.updateHitRate();
      logger.debug('Cache hit', { action, inputHash, age: now - entry.timestamp });
      
      return entry.response;
      
    } catch (error) {
      logger.error('Failed to get cache entry', error as Error, { action });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Save a response to cache
   */
  async saveToCache(
    action: string,
    inputText: string,
    response: AIResponse
  ): Promise<void> {
    try {
      const config = await getConfig();
      
      if (!config.features.enableCaching) {
        return;
      }

      const inputHash = this.generateHash(inputText, action);
      const cacheKey = `cache_${inputHash}`;
      
      const entry: CacheEntry = {
        id: cacheKey,
        inputText,
        response,
        timestamp: Date.now(),
        ttl: config.limits.cacheTtl,
        action,
        inputHash,
      };
      
      await chrome.storage.local.set({ [cacheKey]: entry });
      
      this.stats.totalEntries++;
      this.updateStats();
      
      logger.debug('Response cached', { 
        action, 
        inputHash, 
        responseLength: response.text.length 
      });
      
      // Clean up old entries if we exceed the limit
      await this.cleanupOldEntries();
      
    } catch (error) {
      logger.error('Failed to save to cache', error as Error, { action });
    }
  }

  /**
   * Remove a specific cache entry
   */
  async removeCacheEntry(cacheKey: string): Promise<void> {
    try {
      await chrome.storage.local.remove([cacheKey]);
      this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
      this.updateStats();
      
      logger.debug('Cache entry removed', { cacheKey });
    } catch (error) {
      logger.error('Failed to remove cache entry', error as Error, { cacheKey });
    }
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(result).filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
      }
      
      this.stats.totalEntries = 0;
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.hitRate = 0;
      this.updateStats();
      
      logger.info('Cache cleared', { entriesRemoved: cacheKeys.length });
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache entries (for debugging)
   */
  async getAllCacheEntries(): Promise<CacheEntry[]> {
    try {
      const result = await chrome.storage.local.get(null);
      const entries: CacheEntry[] = [];
      
      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('cache_') && value && typeof value === 'object') {
          entries.push(value as CacheEntry);
        }
      }
      
      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to get all cache entries', error as Error);
      return [];
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    try {
      const entries = await this.getAllCacheEntries();
      
      if (entries.length > 0) {
        this.stats.oldestEntry = Math.min(...entries.map(e => e.timestamp));
        this.stats.newestEntry = Math.max(...entries.map(e => e.timestamp));
      } else {
        this.stats.oldestEntry = 0;
        this.stats.newestEntry = 0;
      }
    } catch (error) {
      logger.error('Failed to update cache stats', error as Error);
    }
  }

  /**
   * Clean up old entries when cache limit is exceeded
   */
  private async cleanupOldEntries(): Promise<void> {
    try {
      const config = await getConfig();
      const entries = await this.getAllCacheEntries();
      
      if (entries.length <= config.limits.maxCacheEntries) {
        return;
      }
      
      // Sort by timestamp (oldest first) and remove excess entries
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const entriesToRemove = entries.slice(0, entries.length - config.limits.maxCacheEntries);
      
      const keysToRemove = entriesToRemove.map(entry => entry.id);
      await chrome.storage.local.remove(keysToRemove);
      
      this.stats.totalEntries = entries.length - entriesToRemove.length;
      this.updateStats();
      
      logger.info('Cache cleanup completed', { 
        removed: entriesToRemove.length,
        remaining: this.stats.totalEntries 
      });
      
    } catch (error) {
      logger.error('Failed to cleanup old cache entries', error as Error);
    }
  }
}

/**
 * Global cache manager instance
 */
export const cacheManager = new CacheManager();

/**
 * Get cached response for given input and action
 */
export async function getCachedResponse(
  inputText: string,
  action: string
): Promise<AIResponse | null> {
  return cacheManager.getCacheEntry(inputText, action);
}

/**
 * Save response to cache
 */
export async function saveToCache(
  action: string,
  inputText: string,
  response: AIResponse
): Promise<void> {
  return cacheManager.saveToCache(action, inputText, response);
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  return cacheManager.clearCache();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return cacheManager.getStats();
}

/**
 * Get all cache entries for debugging
 */
export async function getAllCacheEntries(): Promise<CacheEntry[]> {
  return cacheManager.getAllCacheEntries();
}
