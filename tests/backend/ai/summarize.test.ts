/**
 * Tests for summarize AI handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSummarize, SummarizeOptions } from '../../../src/backend/ai/summarize';

// Mock dependencies
vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../src/backend/utils/chromeWrapper', () => ({
  callChromeAI: vi.fn(),
}));

vi.mock('../../../src/backend/storage/cache', () => ({
  getCachedResponse: vi.fn(),
  saveToCache: vi.fn(),
}));

vi.mock('../../../src/backend/storage/settings', () => ({
  getDefaultPromptOptions: vi.fn(() => ({})),
}));

describe('Summarize AI Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle basic summarization', async () => {
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    
    vi.mocked(getCachedResponse).mockResolvedValue(null);
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'This is a test summary.',
      model: 'test-model',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const result = await handleSummarize('This is a test text to summarize.');

    expect(result.summary).toBe('This is a test summary.');
    expect(result.metadata.originalLength).toBe(35);
    expect(result.metadata.summaryLength).toBe(25);
    expect(result.metadata.compressionRatio).toBeCloseTo(0.714, 2);
  });

  it('should use cached response when available', async () => {
    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    
    vi.mocked(getCachedResponse).mockResolvedValue({
      text: 'Cached summary',
      model: 'test-model',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const result = await handleSummarize('Test text');

    expect(result.summary).toBe('Cached summary');
    expect(getCachedResponse).toHaveBeenCalledWith('Test text', 'summarize', {});
  });

  it('should handle different summary lengths', async () => {
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    
    vi.mocked(getCachedResponse).mockResolvedValue(null);
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'Short summary.',
      model: 'test-model',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const options: SummarizeOptions = {
      summaryLength: 'short',
    };

    const result = await handleSummarize('Test text', options);

    expect(result.summary).toBe('Short summary.');
  });

  it('should throw error for empty text', async () => {
    await expect(handleSummarize('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should truncate long text', async () => {
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    
    vi.mocked(getCachedResponse).mockResolvedValue(null);
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'Summary of long text',
      model: 'test-model',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const longText = 'a'.repeat(6000);
    const result = await handleSummarize(longText);

    expect(result.metadata.originalLength).toBe(5003); // 5000 + '...'
  });
});