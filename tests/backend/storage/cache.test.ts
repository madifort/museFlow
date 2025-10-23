/**
 * Tests for cache system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheManager, getCachedResponse, saveToCache, clearCache } from '../../../src/backend/storage/cache';

// Mock Chrome storage
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
};

Object.defineProperty(global, 'chrome', {
  value: { storage: mockStorage },
  writable: true,
});

// Mock crypto.subtle
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(),
    },
  },
  writable: true,
});

// Mock dependencies
vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../src/backend/core/config', () => ({
  getConfig: vi.fn(() => Promise.resolve({
    features: { enableCaching: true },
    limits: { cacheTtl: 3600000, maxCacheEntries: 100 },
  })),
}));

describe('Cache System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock crypto.subtle.digest to return a mock hash
    vi.mocked(crypto.subtle.digest).mockResolvedValue(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    );
  });

  it('should save and retrieve cached response', async () => {
    const mockResponse = {
      text: 'Test response',
      model: 'test-model',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    };

    // Mock storage.get to return empty initially
    mockStorage.local.get.mockResolvedValue({});
    
    // Save to cache
    await saveToCache('summarize', 'test text', mockResponse, {});
    
    expect(mockStorage.local.set).toHaveBeenCalled();
    
    // Mock storage.get to return cached entry
    const cacheKey = 'cache_' + Array.from({ length: 32 }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join('');
    mockStorage.local.get.mockResolvedValue({
      [cacheKey]: {
        id: cacheKey,
        inputText: 'test text',
        response: mockResponse,
        timestamp: Date.now(),
        ttl: 3600000,
        action: 'summarize',
        inputHash: 'mock-hash',
      },
    });
    
    // Retrieve from cache
    const result = await getCachedResponse('test text', 'summarize', {});
    
    expect(result).toEqual(mockResponse);
  });

  it('should return null for cache miss', async () => {
    mockStorage.local.get.mockResolvedValue({});
    
    const result = await getCachedResponse('test text', 'summarize', {});
    
    expect(result).toBeNull();
  });

  it('should return null for expired cache entry', async () => {
    const cacheKey = 'cache_' + Array.from({ length: 32 }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join('');
    const expiredEntry = {
      id: cacheKey,
      inputText: 'test text',
      response: { text: 'expired response' },
      timestamp: Date.now() - 7200000, // 2 hours ago
      ttl: 3600000, // 1 hour TTL
      action: 'summarize',
      inputHash: 'mock-hash',
    };
    
    mockStorage.local.get.mockResolvedValue({ [cacheKey]: expiredEntry });
    mockStorage.local.remove.mockResolvedValue(undefined);
    
    const result = await getCachedResponse('test text', 'summarize', {});
    
    expect(result).toBeNull();
    expect(mockStorage.local.remove).toHaveBeenCalledWith([cacheKey]);
  });

  it('should clear all cache entries', async () => {
    mockStorage.local.get.mockResolvedValue({
      cache_1: { id: 'cache_1' },
      cache_2: { id: 'cache_2' },
      other_data: { id: 'other_data' },
    });
    
    await clearCache();
    
    expect(mockStorage.local.remove).toHaveBeenCalledWith(['cache_1', 'cache_2']);
  });

  it('should get cache statistics', () => {
    const stats = cacheManager.getStats();
    
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('hitRate');
  });

  it('should handle cache errors gracefully', async () => {
    mockStorage.local.get.mockRejectedValue(new Error('Storage error'));
    
    const result = await getCachedResponse('test text', 'summarize', {});
    
    expect(result).toBeNull();
  });
});
