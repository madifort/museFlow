/**
 * Tests for summarize AI handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSummarize, SummarizeOptions } from '../../../src/backend/ai/summarize';

// Mock dependencies
vi.mock('../../../src/backend/utils/chromeWrapper', () => ({
  callChromeAI: vi.fn(),
}));

vi.mock('../../../src/backend/storage/cache', () => ({
  getCachedResponse: vi.fn(),
  saveToCache: vi.fn(),
}));

vi.mock('../../../src/backend/storage/settings', () => ({
  getDefaultPromptOptions: vi.fn(() => ({
    summaryLength: 'medium',
  })),
}));

vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('handleSummarize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should summarize text successfully', async () => {
    const mockText = 'This is a test text that needs to be summarized.';
    const mockResponse = 'Test summary of the text.';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleSummarize(mockText);

    expect(result.summary).toBe(mockResponse);
    expect(result.metadata.originalLength).toBe(mockText.length);
    expect(result.metadata.summaryLength).toBe(mockResponse.length);
    expect(result.metadata.compressionRatio).toBe(mockResponse.length / mockText.length);
  });

  it('should handle empty text', async () => {
    await expect(handleSummarize('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should handle long text by truncating', async () => {
    const longText = 'a'.repeat(6000);
    const mockResponse = 'Summary of long text.';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleSummarize(longText);

    expect(result.metadata.originalLength).toBeLessThanOrEqual(5000);
  });

  it('should use cached response when available', async () => {
    const mockText = 'Test text for caching.';
    const cachedResponse = {
      text: 'Cached summary.',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    };

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(cachedResponse);

    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue(cachedResponse);

    const result = await handleSummarize(mockText);

    expect(result.summary).toBe(cachedResponse.text);
    expect(vi.mocked(callChromeAI)).not.toHaveBeenCalled();
  });

  it('should handle different summary lengths', async () => {
    const mockText = 'Test text for different summary lengths.';
    const options: SummarizeOptions = {
      summaryLength: 'short',
    };

    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'Short summary.',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleSummarize(mockText, options);

    expect(result.summary).toBe('Short summary.');
  });
});
