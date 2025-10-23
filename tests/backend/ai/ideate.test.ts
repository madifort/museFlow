/**
 * Tests for ideate AI handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleIdeate, IdeateOptions } from '../../../src/backend/ai/ideate';

// Mock dependencies
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

vi.mock('../../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('handleIdeate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate ideas successfully', async () => {
    const mockText = 'This is a test text for ideation.';
    const mockResponse = `
1. Idea One
Description: This is the first idea based on the text.

2. Idea Two
Description: This is the second idea based on the text.
`;
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleIdeate(mockText);

    expect(result.ideas).toHaveLength(2);
    expect(result.ideas[0].title).toBe('Idea One');
    expect(result.ideas[1].title).toBe('Idea Two');
    expect(result.metadata.ideaCount).toBe(2);
  });

  it('should handle empty text', async () => {
    await expect(handleIdeate('')).rejects.toThrow('Input text cannot be empty');
  });

  it('should handle different idea types', async () => {
    const mockText = 'Test text for creative ideation.';
    const options: IdeateOptions = {
      ideaType: 'creative',
      ideaCount: 3,
    };

    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: `
1. Creative Idea One
Description: A highly creative idea.

2. Creative Idea Two
Description: Another creative idea.

3. Creative Idea Three
Description: A third creative idea.
`,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleIdeate(mockText, options);

    expect(result.ideas).toHaveLength(3);
    expect(result.metadata.ideaCount).toBe(3);
  });

  it('should calculate creativity score', async () => {
    const mockText = 'Test text for creativity scoring.';
    const mockResponse = `
1. Well-Developed Idea
Description: This is a well-developed idea with detailed implementation steps and clear benefits.
Implementation: Step 1, Step 2, Step 3
Benefits: Benefit 1, Benefit 2
Challenges: Challenge 1
Effort: medium
Impact: high
`;
    
    const { callChromeAI } = await import('../../../src/backend/utils/chromeWrapper');
    vi.mocked(callChromeAI).mockResolvedValue({
      text: mockResponse,
      provider: 'chrome',
      timestamp: new Date().toISOString(),
    });

    const { getCachedResponse } = await import('../../../src/backend/storage/cache');
    vi.mocked(getCachedResponse).mockResolvedValue(null);

    const result = await handleIdeate(mockText);

    expect(result.metadata.creativityScore).toBeGreaterThan(0);
    expect(result.metadata.creativityScore).toBeLessThanOrEqual(1);
  });
});
