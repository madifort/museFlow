/**
 * Tests for translate AI handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTranslate, TranslateOptions, isLanguageSupported } from '../../../src/backend/ai/translate';

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
    targetLanguage: 'English',
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

describe('handleTranslate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should translate text successfully', async () => {
    const mockText = 'Hello, how are you?';
    const mockResponse = 'Hola, ¿cómo estás?';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleTranslate(mockText, { targetLanguage: 'Spanish' });

    expect(result.translatedText).toBe(mockResponse);
    expect(result.originalText).toBe(mockText);
    expect(result.targetLanguage).toBe('Spanish');
    expect(result.sourceLanguage).toBe('English');
  });

  it('should handle empty text', async () => {
    await expect(handleTranslate('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should detect source language', async () => {
    const mockText = 'Hola, ¿cómo estás?';
    const mockResponse = 'Hello, how are you?';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleTranslate(mockText, { targetLanguage: 'English' });

    expect(result.sourceLanguage).toBe('Spanish');
    expect(result.targetLanguage).toBe('English');
  });

  it('should handle different translation styles', async () => {
    const mockText = 'This is a formal text.';
    const options: TranslateOptions = {
      targetLanguage: 'Spanish',
      style: 'formal',
    };

    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: 'Este es un texto formal.',
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleTranslate(mockText, options);

    expect(result.translatedText).toBe('Este es un texto formal.');
  });

  it('should calculate confidence score', async () => {
    const mockText = 'Hello world.';
    const mockResponse = 'Hola mundo.';
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleTranslate(mockText, { targetLanguage: 'Spanish' });

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should check language support', () => {
    expect(isLanguageSupported('English')).toBe(true);
    expect(isLanguageSupported('Spanish')).toBe(true);
    expect(isLanguageSupported('French')).toBe(true);
    expect(isLanguageSupported('InvalidLanguage')).toBe(false);
  });
});
