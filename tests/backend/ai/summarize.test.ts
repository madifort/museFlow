/**
 * Tests for MuseFlow Summarize AI Handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleSummarize, SummarizeOptions } from '../../../src/backend/ai/summarize';

// Mock Chrome APIs
const mockChrome = {
  ai: {
    summarizer: {
      summarize: vi.fn(),
    },
    languageModel: {
      create: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
};

// Mock global chrome object
global.chrome = mockChrome as any;

// Mock the chromeWrapper module
vi.mock('../../../src/backend/utils/chromeWrapper', () => ({
  callChromeAISummarize: vi.fn(),
  callChromeAI: vi.fn(),
}));

// Mock the cache module
vi.mock('../../../src/backend/storage/cache', () => ({
  getCachedResponse: vi.fn(),
  saveToCache: vi.fn(),
}));

// Mock the settings module
vi.mock('../../../src/backend/storage/settings', () => ({
  getDefaultPromptOptions: vi.fn(() => ({})),
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

describe('Summarize AI Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('handleSummarize', () => {
    it('should throw error for insufficient context', async () => {
      const shortText = 'Hi';
      
      await expect(handleSummarize(shortText)).rejects.toThrow('INSUFFICIENT_CONTEXT');
    });

    it('should throw error for empty text', async () => {
      await expect(handleSummarize('')).rejects.toThrow('INSUFFICIENT_CONTEXT');
    });

    it('should use cached response when available', async () => {
      const { getCachedResponse } = await import('../../../src/backend/storage/cache');
      const mockCachedResponse = {
        text: 'Cached summary',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(getCachedResponse).mockResolvedValue(mockCachedResponse);

      const result = await handleSummarize('This is a test text for summarization.');

      expect(result.summary).toBe('Cached summary');
      expect(getCachedResponse).toHaveBeenCalledWith(
        'This is a test text for summarization.',
        'summarize',
        {}
      );
    });

    it('should call Chrome AI summarizer when available', async () => {
      const { callChromeAISummarize } = await import('../../../src/backend/utils/chromeWrapper');
      const mockResponse = {
        text: 'Generated summary',
        model: 'chrome-summarizer',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(callChromeAISummarize).mockResolvedValue(mockResponse);

      const result = await handleSummarize('This is a test text for summarization.');

      expect(result.summary).toBe('Generated summary');
      expect(callChromeAISummarize).toHaveBeenCalledWith(
        'This is a test text for summarization.',
        { length: 'medium' }
      );
    });

    it('should fallback to general AI when Chrome AI fails', async () => {
      const { callChromeAISummarize, callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
      const mockFallbackResponse = {
        text: 'Fallback summary',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(callChromeAISummarize).mockRejectedValue(new Error('Chrome AI not available'));
      vi.mocked(callChromeAI).mockResolvedValue(mockFallbackResponse);

      const result = await handleSummarize('This is a test text for summarization.');

      expect(result.summary).toBe('Fallback summary');
      expect(callChromeAI).toHaveBeenCalled();
    });

    it('should handle different summary lengths', async () => {
      const { callChromeAISummarize } = await import('../../../src/backend/utils/chromeWrapper');
      const mockResponse = {
        text: 'Short summary',
        model: 'chrome-summarizer',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(callChromeAISummarize).mockResolvedValue(mockResponse);

      const options: SummarizeOptions = { summaryLength: 'short' };
      await handleSummarize('This is a test text for summarization.', options);

      expect(callChromeAISummarize).toHaveBeenCalledWith(
        'This is a test text for summarization.',
        { length: 'short' }
      );
    });

    it('should truncate text that exceeds length limit', async () => {
      const { callChromeAISummarize } = await import('../../../src/backend/utils/chromeWrapper');
      const mockResponse = {
        text: 'Summary of long text',
        model: 'chrome-summarizer',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(callChromeAISummarize).mockResolvedValue(mockResponse);

      const longText = 'A'.repeat(6000); // Exceeds 5000 char limit
      await handleSummarize(longText);

      expect(callChromeAISummarize).toHaveBeenCalledWith(
        expect.stringMatching(/^A{5000}\.\.\.$/),
        { length: 'medium' }
      );
    });

    it('should return proper metadata', async () => {
      const { callChromeAISummarize } = await import('../../../src/backend/utils/chromeWrapper');
      const mockResponse = {
        text: 'Generated summary',
        model: 'chrome-summarizer',
        provider: 'chrome',
        timestamp: new Date().toISOString(),
      };
      
      vi.mocked(callChromeAISummarize).mockResolvedValue(mockResponse);

      const text = 'This is a test text for summarization.';
      const result = await handleSummarize(text);

      expect(result.metadata).toMatchObject({
        originalLength: text.length,
        summaryLength: 'Generated summary'.length,
        compressionRatio: expect.any(Number),
        processingTime: expect.any(Number),
      });
    });
  });
});