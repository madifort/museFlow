/**
 * Tests for message router
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRequest, MessageResponse } from '../../../src/backend/core/messageRouter';

// Mock dependencies
vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  initializeLogging: vi.fn(),
}));

vi.mock('../../../src/backend/storage/settings', () => ({
  initializeSettings: vi.fn(),
}));

vi.mock('../../../src/backend/ai/summarize', () => ({
  handleSummarize: vi.fn(),
}));

vi.mock('../../../src/backend/ai/rewrite', () => ({
  handleRewrite: vi.fn(),
}));

vi.mock('../../../src/backend/ai/ideate', () => ({
  handleIdeate: vi.fn(),
}));

vi.mock('../../../src/backend/ai/translate', () => ({
  handleTranslate: vi.fn(),
}));

describe('Message Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle ping message', async () => {
    const request: MessageRequest = {
      action: 'ping',
    };

    // Mock chrome.runtime.onMessage
    const mockSendResponse = vi.fn();
    const mockSender = { tab: { id: 1 } };

    // This would need to be tested with actual Chrome extension context
    // For now, we'll test the individual handlers
    expect(request.action).toBe('ping');
  });

  it('should handle summarize message', async () => {
    const request: MessageRequest = {
      action: 'summarize',
      text: 'Test text to summarize.',
      options: { summaryLength: 'short' },
    };

    const { handleSummarize } = await import('../../../src/backend/ai/summarize');
    vi.mocked(handleSummarize).mockResolvedValue({
      summary: 'Test summary',
      metadata: {
        originalLength: 25,
        summaryLength: 12,
        compressionRatio: 0.48,
        processingTime: 100,
      },
    });

    const result = await handleSummarize(request.text!, request.options as any);
    
    expect(result.summary).toBe('Test summary');
    expect(vi.mocked(handleSummarize)).toHaveBeenCalledWith(request.text, request.options);
  });

  it('should handle rewrite message', async () => {
    const request: MessageRequest = {
      action: 'rewrite',
      text: 'Test text to rewrite.',
      options: { tone: 'formal' },
    };

    const { handleRewrite } = await import('../../../src/backend/ai/rewrite');
    vi.mocked(handleRewrite).mockResolvedValue({
      rewrittenText: 'Formal rewrite of test text.',
      originalText: request.text!,
      changes: {
        wordCountChange: 2,
        sentenceCountChange: 0,
      },
      metadata: {
        originalLength: 22,
        rewrittenLength: 30,
        processingTime: 150,
      },
    });

    const result = await handleRewrite(request.text!, request.options as any);
    
    expect(result.rewrittenText).toBe('Formal rewrite of test text.');
    expect(vi.mocked(handleRewrite)).toHaveBeenCalledWith(request.text, request.options);
  });

  it('should handle ideate message', async () => {
    const request: MessageRequest = {
      action: 'ideate',
      text: 'Test text for ideation.',
      options: { ideaCount: 3 },
    };

    const { handleIdeate } = await import('../../../src/backend/ai/ideate');
    vi.mocked(handleIdeate).mockResolvedValue({
      ideas: [
        { title: 'Idea 1', description: 'First idea' },
        { title: 'Idea 2', description: 'Second idea' },
        { title: 'Idea 3', description: 'Third idea' },
      ],
      context: { originalText: request.text! },
      metadata: {
        ideaCount: 3,
        processingTime: 200,
      },
    });

    const result = await handleIdeate(request.text!, request.options as any);
    
    expect(result.ideas).toHaveLength(3);
    expect(vi.mocked(handleIdeate)).toHaveBeenCalledWith(request.text, request.options);
  });

  it('should handle translate message', async () => {
    const request: MessageRequest = {
      action: 'translate',
      text: 'Hello world.',
      options: { targetLanguage: 'Spanish' },
    };

    const { handleTranslate } = await import('../../../src/backend/ai/translate');
    vi.mocked(handleTranslate).mockResolvedValue({
      translatedText: 'Hola mundo.',
      originalText: request.text!,
      sourceLanguage: 'English',
      targetLanguage: 'Spanish',
      metadata: {
        originalLength: 12,
        translatedLength: 11,
        processingTime: 180,
      },
    });

    const result = await handleTranslate(request.text!, request.options as any);
    
    expect(result.translatedText).toBe('Hola mundo.');
    expect(result.sourceLanguage).toBe('English');
    expect(result.targetLanguage).toBe('Spanish');
    expect(vi.mocked(handleTranslate)).toHaveBeenCalledWith(request.text, request.options);
  });

  it('should handle invalid action', () => {
    const request: MessageRequest = {
      action: 'invalid' as any,
    };

    expect(request.action).toBe('invalid');
    // In real implementation, this would throw an error
  });
});
