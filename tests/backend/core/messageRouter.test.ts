/**
 * Tests for MuseFlow Message Router
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleMessage, MessageRequest } from '../../../src/backend/core/messageRouter';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
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

// Mock AI handlers
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

// Mock other dependencies
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

vi.mock('../../../src/backend/storage/cache', () => ({
  clearCache: vi.fn(),
}));

vi.mock('../../../src/backend/utils/chromeWrapper', () => ({
  verifyKey: vi.fn(),
}));

describe('Message Router', () => {
  let mockSendResponse: ReturnType<typeof vi.fn>;
  let mockSender: chrome.runtime.MessageSender;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendResponse = vi.fn();
    mockSender = {
      tab: { id: 1 },
      frameId: 0,
      id: 'test-sender',
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('handleMessage', () => {
  it('should handle ping action', async () => {
      const request: MessageRequest = {
      action: 'ping',
        source: 'test',
    };
    
      const result = await handleMessage(request, mockSender, mockSendResponse);
    
      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'pong',
          timestamp: expect.any(String),
        },
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          processingTime: expect.any(Number),
          timestamp: expect.any(String),
          action: 'ping',
        }),
      });
    });

    it('should handle summarize action', async () => {
      const { handleSummarize } = await import('../../../src/backend/ai/summarize');
      const mockResult = {
        summary: 'Test summary',
        metadata: {
          originalLength: 20,
          summaryLength: 12,
          compressionRatio: 0.6,
          processingTime: 100,
        },
      };
      
      vi.mocked(handleSummarize).mockResolvedValue(mockResult);

      const request: MessageRequest = {
        action: 'summarize',
        text: 'This is test text',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(handleSummarize).toHaveBeenCalledWith('This is test text', {});
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'summarize',
        }),
      });
    });

    it('should handle rewrite action', async () => {
      const { handleRewrite } = await import('../../../src/backend/ai/rewrite');
      const mockResult = {
        rewrittenText: 'Rewritten text',
        originalText: 'Original text',
        changes: {
          wordCountChange: 0,
          sentenceCountChange: 0,
        },
        metadata: {
          originalLength: 13,
          rewrittenLength: 14,
          processingTime: 150,
        },
      };
      
      vi.mocked(handleRewrite).mockResolvedValue(mockResult);

      const request: MessageRequest = {
        action: 'rewrite',
        text: 'Original text',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(handleRewrite).toHaveBeenCalledWith('Original text', {});
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'rewrite',
        }),
      });
    });

    it('should handle ideate action', async () => {
      const { handleIdeate } = await import('../../../src/backend/ai/ideate');
      const mockResult = {
        ideas: [
          {
            title: 'Test Idea',
            description: 'A test idea description',
          },
        ],
        context: {
          originalText: 'Test context',
        },
        metadata: {
          ideaCount: 1,
          processingTime: 200,
        },
      };
      
      vi.mocked(handleIdeate).mockResolvedValue(mockResult);

      const request: MessageRequest = {
        action: 'ideate',
        text: 'Test context',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(handleIdeate).toHaveBeenCalledWith('Test context', {});
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'ideate',
        }),
      });
    });

    it('should handle translate action', async () => {
      const { handleTranslate } = await import('../../../src/backend/ai/translate');
      const mockResult = {
        translatedText: 'Texto traducido',
        originalText: 'Translated text',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        metadata: {
          originalLength: 15,
          translatedLength: 16,
          processingTime: 180,
        },
      };
      
      vi.mocked(handleTranslate).mockResolvedValue(mockResult);

      const request: MessageRequest = {
        action: 'translate',
        text: 'Translated text',
        options: { targetLanguage: 'Spanish' },
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(handleTranslate).toHaveBeenCalledWith('Translated text', { targetLanguage: 'Spanish' });
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'translate',
        }),
      });
    });

    it('should handle verifyKey action', async () => {
      const { verifyKey } = await import('../../../src/backend/utils/chromeWrapper');
      vi.mocked(verifyKey).mockResolvedValue(true);

      const request: MessageRequest = {
        action: 'verifyKey',
        options: { provider: 'openai', apiKey: 'test-key' },
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(verifyKey).toHaveBeenCalledWith('openai', 'test-key');
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: { valid: true, provider: 'openai' },
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'verifyKey',
        }),
      });
    });

    it('should handle clearCache action', async () => {
      const { clearCache } = await import('../../../src/backend/storage/cache');
      vi.mocked(clearCache).mockResolvedValue();

      const request: MessageRequest = {
        action: 'clearCache',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(clearCache).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Cache cleared successfully' },
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'clearCache',
        }),
      });
    });

    it('should handle unknown action with error', async () => {
      const request: MessageRequest = {
        action: 'unknown' as any,
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action: unknown',
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'unknown',
        }),
      });
    });

    it('should handle missing action with error', async () => {
    const request = {
        source: 'test',
      } as MessageRequest;
    
      const result = await handleMessage(request, mockSender, mockSendResponse);
    
      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Action is required',
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: undefined,
        }),
      });
    });

    it('should handle INSUFFICIENT_CONTEXT error', async () => {
      const { handleSummarize } = await import('../../../src/backend/ai/summarize');
      vi.mocked(handleSummarize).mockRejectedValue(new Error('INSUFFICIENT_CONTEXT: Text must be at least 10 characters long'));

      const request: MessageRequest = {
        action: 'summarize',
        text: 'Hi',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'INSUFFICIENT_CONTEXT: Please provide at least 10 characters of text',
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'summarize',
        }),
      });
    });

    it('should handle Chrome AI unavailable error', async () => {
      const { handleSummarize } = await import('../../../src/backend/ai/summarize');
      vi.mocked(handleSummarize).mockRejectedValue(new Error('Chrome AI API not available'));

      const request: MessageRequest = {
        action: 'summarize',
        text: 'This is test text',
        source: 'test',
      };

      const result = await handleMessage(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'AI service unavailable: Chrome AI API not accessible',
        requestId: expect.any(String),
        metadata: expect.objectContaining({
          action: 'summarize',
        }),
      });
    });

    it('should generate unique request IDs', async () => {
      const request1: MessageRequest = {
        action: 'ping',
        source: 'test',
      };
      const request2: MessageRequest = {
        action: 'ping',
        source: 'test',
      };

      await handleMessage(request1, mockSender, mockSendResponse);
      const firstCall = mockSendResponse.mock.calls[0][0];
      
      mockSendResponse.mockClear();
      
      await handleMessage(request2, mockSender, mockSendResponse);
      const secondCall = mockSendResponse.mock.calls[0][0];

      expect(firstCall.requestId).not.toBe(secondCall.requestId);
    });
  });
});