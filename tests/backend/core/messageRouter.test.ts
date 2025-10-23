/**
 * Tests for message router
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
};

// Mock global chrome object
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
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

vi.mock('../../../src/backend/storage/settings', () => ({
  initializeSettings: vi.fn(),
}));

vi.mock('../../../src/backend/utils/logger', () => ({
  initializeLogging: vi.fn(),
}));

describe('Message Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize message router', async () => {
    const { initializeMessageRouter } = await import('../../../src/backend/core/messageRouter');
    
    await expect(initializeMessageRouter()).resolves.not.toThrow();
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('should handle ping action', async () => {
    const { initializeMessageRouter } = await import('../../../src/backend/core/messageRouter');
    
    await initializeMessageRouter();
    
    // Get the message handler
    const messageHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    const mockSendResponse = vi.fn();
    const request = {
      action: 'ping',
      requestId: 'test-request',
    };
    
    await messageHandler(request, {}, mockSendResponse);
    
    expect(mockSendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'pong',
        }),
        requestId: 'test-request',
      })
    );
  });

  it('should handle unknown action', async () => {
    const { initializeMessageRouter } = await import('../../../src/backend/core/messageRouter');
    
    await initializeMessageRouter();
    
    const messageHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    const mockSendResponse = vi.fn();
    const request = {
      action: 'unknown',
      requestId: 'test-request',
    };
    
    await messageHandler(request, {}, mockSendResponse);
    
    expect(mockSendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unknown action: unknown',
        requestId: 'test-request',
      })
    );
  });

  it('should handle missing action', async () => {
    const { initializeMessageRouter } = await import('../../../src/backend/core/messageRouter');
    
    await initializeMessageRouter();
    
    const messageHandler = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    const mockSendResponse = vi.fn();
    const request = {
      requestId: 'test-request',
    };
    
    await messageHandler(request, {}, mockSendResponse);
    
    expect(mockSendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Action is required',
        requestId: 'test-request',
      })
    );
  });
});