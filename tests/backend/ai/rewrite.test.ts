/**
 * Tests for rewrite AI handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRewrite, RewriteOptions } from '../../../src/backend/ai/rewrite';

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
    tone: 'professional',
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

describe('handleRewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should rewrite text successfully', async () => {
    const mockText = 'This is a test text that needs to be rewritten.';
    const mockResponse = 'This is a rewritten test text that has been improved.';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleRewrite(mockText);

    expect(result.rewrittenText).toBe(mockResponse);
    expect(result.originalText).toBe(mockText);
    expect(result.metadata.originalLength).toBe(mockText.length);
    expect(result.metadata.rewrittenLength).toBe(mockResponse.length);
  });

  it('should handle empty text', async () => {
    await expect(handleRewrite('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should handle different tones', async () => {
    const mockText = 'Test text for different tones.';
    const options: RewriteOptions = {
      tone: 'casual',
    };

    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'Casual rewrite of test text.',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleRewrite(mockText, options);

    expect(result.rewrittenText).toBe('Casual rewrite of test text.');
  });

  it('should calculate changes correctly', async () => {
    const mockText = 'Short text.';
    const mockResponse = 'This is a much longer rewritten version of the short text.';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleRewrite(mockText);

    expect(result.changes.wordCountChange).toBeGreaterThan(0);
    expect(result.changes.sentenceCountChange).toBeGreaterThan(0);
  });
});
