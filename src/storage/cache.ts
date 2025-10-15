// Cache management for AI responses using Chrome storage

export interface CachedResponse {
  operation: 'summarize' | 'rewrite' | 'ideate';
  input: string;
  response: string;
  timestamp: number;
  url?: string;
  title?: string;
}

export interface CacheOptions {
  maxEntries?: number;
  maxAge?: number; // in milliseconds
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxEntries: 10,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Cache an AI response
 */
export async function cacheResponse(
  response: CachedResponse,
  options: CacheOptions = {},
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const cacheKey = `ai_cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await chrome.storage.local.set({
      [cacheKey]: {
        ...response,
        cachedAt: Date.now(),
      },
    });

    // Clean up old entries
    await cleanupCache(opts);
  } catch (error) {
    console.error('MuseFlow: Error caching response:', error);
    throw error;
  }
}

/**
 * Retrieve cached responses
 */
export async function getCachedResponses(
  options: CacheOptions = {},
): Promise<CachedResponse[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const allCache = await chrome.storage.local.get();
    const now = Date.now();

    const responses = Object.entries(allCache)
      .filter(([key]) => key.startsWith('ai_cache_'))
      .map(([, value]) => value as CachedResponse & { cachedAt: number })
      .filter((response) =>
        // Filter by age
        now - response.cachedAt < opts.maxAge)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, opts.maxEntries)
      .map(({ cachedAt, ...response }) => response); // Remove cachedAt from response

    return responses;
  } catch (error) {
    console.error('MuseFlow: Error retrieving cached responses:', error);
    return [];
  }
}

/**
 * Search cached responses by operation or content
 */
export async function searchCachedResponses(
  query: {
    operation?: 'summarize' | 'rewrite' | 'ideate';
    content?: string;
    url?: string;
  },
  options: CacheOptions = {},
): Promise<CachedResponse[]> {
  const allResponses = await getCachedResponses(options);

  return allResponses.filter((response) => {
    if (query.operation && response.operation !== query.operation) {
      return false;
    }

    if (query.content) {
      const searchTerm = query.content.toLowerCase();
      const matchesInput = response.input.toLowerCase().includes(searchTerm);
      const matchesResponse = response.response.toLowerCase().includes(searchTerm);
      if (!matchesInput && !matchesResponse) {
        return false;
      }
    }

    if (query.url && response.url !== query.url) {
      return false;
    }

    return true;
  });
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  try {
    const allCache = await chrome.storage.local.get();
    const cacheKeys = Object.keys(allCache)
      .filter((key) => key.startsWith('ai_cache_'));

    await chrome.storage.local.remove(cacheKeys);
  } catch (error) {
    console.error('MuseFlow: Error clearing cache:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    const allCache = await chrome.storage.local.get();
    const cacheEntries = Object.entries(allCache)
      .filter(([key]) => key.startsWith('ai_cache_'))
      .map(([, value]) => value as CachedResponse & { cachedAt: number });

    if (cacheEntries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    const timestamps = cacheEntries.map((entry) => entry.timestamp);
    const totalSize = JSON.stringify(allCache).length;

    return {
      totalEntries: cacheEntries.length,
      totalSize,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  } catch (error) {
    console.error('MuseFlow: Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

/**
 * Clean up old cache entries
 */
async function cleanupCache(options: Required<CacheOptions>): Promise<void> {
  try {
    const allCache = await chrome.storage.local.get();
    const now = Date.now();

    const validEntries: Record<string, any> = {};
    const cacheEntries = Object.entries(allCache)
      .filter(([key]) => key.startsWith('ai_cache_'))
      .map(([key, value]) => ({ key, value: value as CachedResponse & { cachedAt: number } }))
      .filter(({ value }) =>
        // Keep entries that are not too old
        now - value.cachedAt < options.maxAge)
      .sort((a, b) => b.value.timestamp - a.value.timestamp)
      .slice(0, options.maxEntries);

    // Rebuild cache with only valid entries
    cacheEntries.forEach(({ key, value }) => {
      validEntries[key] = value;
    });

    // Clear all cache entries first
    const allCacheKeys = Object.keys(allCache)
      .filter((key) => key.startsWith('ai_cache_'));

    if (allCacheKeys.length > 0) {
      await chrome.storage.local.remove(allCacheKeys);
    }

    // Add back only valid entries
    if (Object.keys(validEntries).length > 0) {
      await chrome.storage.local.set(validEntries);
    }
  } catch (error) {
    console.error('MuseFlow: Error cleaning up cache:', error);
  }
}

/**
 * Export cache data for backup
 */
export async function exportCache(): Promise<string> {
  try {
    const responses = await getCachedResponses();
    return JSON.stringify(responses, null, 2);
  } catch (error) {
    console.error('MuseFlow: Error exporting cache:', error);
    throw error;
  }
}

/**
 * Import cache data from backup
 */
export async function importCache(data: string): Promise<void> {
  try {
    const responses: CachedResponse[] = JSON.parse(data);

    for (const response of responses) {
      await cacheResponse(response);
    }
  } catch (error) {
    console.error('MuseFlow: Error importing cache:', error);
    throw error;
  }
}
