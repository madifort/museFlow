/**
 * Tests for MuseFlow Cache System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getCachedResponse, 
  saveToCache, 
  clearCache, 
  getCacheStats,
  getAllCacheEntries 
} from '../../../src/backend/storage/cache';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
};

// Mock global chrome object
global.chrome = mockChrome as any;

// Mock the config module
vi.mock('../../../src/backend/core/config', () => ({
  getConfig: vi.fn(() => Promise.resolve({
    features: { enableCaching: true },
    limits: { maxCacheEntries: 100, cacheTtl: 3600000 }, // 1 hour
  })),
}));

// Mock the logger module
vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Cache System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCachedResponse', () => {
    it('should return null when caching is disabled', async () => {
      const { getConfig } = await import('../../../src/backend/core/config');
      vi.mocked(getConfig).mockResolvedValue({
        features: { enableCaching: false },
        limits: { maxCacheEntries: 100, cacheTtl: 3600000 },
      });

      const result = await getCachedResponse('test text', 'summarize', {});

      expect(result).toBeNull();
      expect(mockChrome.storage.local.get).not.toHaveBeenCalled();
    });

    it('should return null for cache miss', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const result = await getCachedResponse('test text', 'summarize', {});

      expect(result).toBeNull();
    });

    it('should return cached response for cache hit', async () => {
      const mockCachedEntry = {
        id: 'cache_abc123',
        inputText: 'test text',
        response: {
          text: 'cached summary',
          model: 'gemini-pro',
          provider: 'chrome',
          timestamp: new Date().toISOString(),
        },
        timestamp: Date.now() - 1000, // 1 second ago
        ttl: 3600000, // 1 hour
        action: 'summarize',
        inputHash: 'abc123',
      };

      mockChrome.storage.local.get.mockResolvedValue({
        'cache_abc123': mockCachedEntry,
      });

      const result = await getCachedResponse('test text', 'summarize', {});

      expect(result).toEqual(mockCachedEntry.response);
    });

    it('should return null for expired cache entry', async () => {
      const expiredEntry = {
        id: 'cache_abc123',
        inputText: 'test text',
        response: {
          text: 'cached summary',
          model: 'gemini-pro',
          provider: 'chrome',
          timestamp: new Date().toISOString(),
        },
        timestamp: Date.now() - 7200000, // 2 hours ago
        ttl: 3600000, // 1 hour TTL
        action: 'summarize',
        inputHash: 'abc123',
      };

      mockChrome.storage.local.get.mockResolvedValue({
        'cache_abc123': expiredEntry,
      });

      const result = await getCachedResponse('test text', 'summarize', {});

      expect(result).toBeNull();
      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['cache_abc123']);
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const result = await getCachedResponse('test text', 'summarize', {});

      expect(result).toBeNull();
    });
  });

  describe('saveToCache', () => {
    it('should not save when caching is disabled', async () => {
      const { getConfig } = await import('../../../src/backend/core/config');
      vi.mocked(getConfig).mockResolvedValue({
        features: { enableCaching: false },
        limits: { maxCacheEntries: 100, cacheTtl: 3600000 },
      });

      const mockResponse = {
        text: 'test response',
        model: 'gemini-pro',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };

      await saveToCache('summarize', 'test text', mockResponse, {});

      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should save response to cache', async () => {
      const mockResponse = {
        text: 'test response',
        model: 'gemini-pro',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await saveToCache('summarize', 'test text', mockResponse, {});

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [expect.stringMatching(/^cache_/)]: expect.objectContaining({
            inputText: 'test text',
            response: mockResponse,
            action: 'summarize',
            timestamp: expect.any(Number),
            ttl: 3600000,
          }),
        })
      );
    });

    it('should handle storage errors gracefully', async () => {
      const mockResponse = {
        text: 'test response',
        model: 'gemini-pro',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };

      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(saveToCache('summarize', 'test text', mockResponse, {})).resolves.toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      const mockCacheData = {
        'cache_abc123': { id: 'cache_abc123' },
        'cache_def456': { id: 'cache_def456' },
        'other_data': { some: 'data' },
      };

      mockChrome.storage.local.get.mockResolvedValue(mockCacheData);
      mockChrome.storage.local.remove.mockResolvedValue(undefined);

      await clearCache();

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['cache_abc123', 'cache_def456']);
    });

    it('should handle no cache entries', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      await clearCache();

      expect(mockChrome.storage.local.remove).not.toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(clearCache()).resolves.toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();

      expect(stats).toMatchObject({
        totalEntries: expect.any(Number),
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.any(Number),
        oldestEntry: expect.any(Number),
        newestEntry: expect.any(Number),
      });
    });
  });

  describe('getAllCacheEntries', () => {
    it('should return all cache entries', async () => {
      const mockCacheData = {
        'cache_abc123': {
          id: 'cache_abc123',
          inputText: 'test text 1',
          response: { text: 'response 1' },
          timestamp: Date.now() - 1000,
          ttl: 3600000,
          action: 'summarize',
          inputHash: 'abc123',
        },
        'cache_def456': {
          id: 'cache_def456',
          inputText: 'test text 2',
          response: { text: 'response 2' },
          timestamp: Date.now() - 2000,
          ttl: 3600000,
          action: 'rewrite',
          inputHash: 'def456',
        },
        'other_data': { some: 'data' },
      };

      mockChrome.storage.local.get.mockResolvedValue(mockCacheData);

      const entries = await getAllCacheEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('cache_def456'); // Should be sorted by timestamp (newest first)
      expect(entries[1].id).toBe('cache_abc123');
    });

    it('should return empty array when no cache entries', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const entries = await getAllCacheEntries();

      expect(entries).toEqual([]);
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const entries = await getAllCacheEntries();

      expect(entries).toEqual([]);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same input', async () => {
      const mockResponse = {
        text: 'test response',
        model: 'gemini-pro',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      // Save same text twice
      await saveToCache('summarize', 'test text', mockResponse, {});
      await saveToCache('summarize', 'test text', mockResponse, {});

      // Should use same cache key
      const calls = mockChrome.storage.local.set.mock.calls;
      expect(calls[0][0]).toEqual(calls[1][0]);
    });

    it('should generate different cache keys for different inputs', async () => {
      const mockResponse = {
        text: 'test response',
        model: 'gemini-pro',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await saveToCache('summarize', 'test text 1', mockResponse, {});
      await saveToCache('summarize', 'test text 2', mockResponse, {});

      const calls = mockChrome.storage.local.set.mock.calls;
      const keys1 = Object.keys(calls[0][0]);
      const keys2 = Object.keys(calls[1][0]);

      expect(keys1[0]).not.toBe(keys2[0]);
    });
  });
});