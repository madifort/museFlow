/**
 * Summarize AI handler for MuseFlow
 * Handles text summarization with configurable length and style
 */

import { buildPrompt, PromptOptions } from "../core/promptBuilder";
import { callChromeAI, callChromeAISummarize, AIRequest } from "../utils/chromeWrapper";
import { getCachedResponse, saveToCache } from "../storage/cache";
import { getDefaultPromptOptions } from "../storage/settings";
import { logger } from "../utils/logger";

export interface SummarizeOptions extends PromptOptions {
  /** Summary length preference */
  summaryLength?: "short" | "medium" | "long";
  /** Include key points as bullet list */
  includeKeyPoints?: boolean;
  /** Focus on specific aspects */
  focusAreas?: string[];
}

export interface SummarizeResult {
  /** The generated summary */
  summary: string;
  /** Key points if requested */
  keyPoints?: string[];
  /** Confidence score (0-1) */
  confidence?: number;
  /** Processing metadata */
  metadata: {
    originalLength: number;
    summaryLength: number;
    compressionRatio: number;
    processingTime: number;
  };
}

/**
 * Handle text summarization
 * @param text - Input text to summarize
 * @param options - Summarization options
 * @returns Summarized text with metadata
 */
export async function handleSummarize(
  text: string,
  options: SummarizeOptions = {},
): Promise<SummarizeResult> {
  const startTime = Date.now();

  try {
    logger.info("Starting summarization", {
      textLength: text.length,
      options: Object.keys(options),
    });

    // Check cache first
    const cachedResponse = await getCachedResponse(text, "summarize", options);

    if (cachedResponse) {
      logger.debug("Using cached summarization response");
      return {
        summary: cachedResponse.text,
        metadata: {
          originalLength: text.length,
          summaryLength: cachedResponse.text.length,
          compressionRatio: cachedResponse.text.length / text.length,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Merge with default options
    const defaultOptions = getDefaultPromptOptions();
    const finalOptions = { ...defaultOptions, ...options };

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Input text cannot be empty");
    }

    if (text.length > 5000) {
      logger.warn("Text length exceeds recommended limit, truncating...");
      text = `${text.substring(0, 5000)}...`;
    }

    // Build specialized prompt for summarization
    const prompt = buildSummarizePrompt(text, finalOptions);

    // Prepare AI request
    const aiRequest: AIRequest = {
      prompt,
      maxTokens: getMaxTokensForLength(finalOptions.summaryLength || "medium"),
      temperature: 0.3, // Lower temperature for more consistent summaries
    };

    // Call Chrome AI service directly for summarization
    let aiResponse;
    try {
      console.log('[MuseFlow] Attempting Chrome AI summarization...');
      aiResponse = await callChromeAISummarize(text, {
        length: finalOptions.summaryLength || "medium"
      });
      console.log('[MuseFlow] Chrome AI summarization successful');
    } catch (chromeError) {
      console.log('[MuseFlow] Chrome AI summarization failed, falling back to general AI...');
      // Fallback to general AI call
      aiResponse = await callChromeAI(aiRequest);
    }

    // Parse and validate response
    const result = parseSummarizeResponse(aiResponse.text, finalOptions);

    // Add metadata
    const processingTime = Date.now() - startTime;
    const finalResult: SummarizeResult = {
      ...result,
      metadata: {
        originalLength: text.length,
        summaryLength: result.summary.length,
        compressionRatio: result.summary.length / text.length,
        processingTime,
      },
    };

    // Cache the response
    await saveToCache("summarize", text, aiResponse, options);

    logger.info("Summarization completed", {
      originalLength: finalResult.metadata.originalLength,
      summaryLength: finalResult.metadata.summaryLength,
      compressionRatio: finalResult.metadata.compressionRatio,
      processingTime: finalResult.metadata.processingTime,
    });

    return finalResult;
  } catch (error) {
    logger.error("Summarization failed", error as Error, {
      textLength: text.length,
      options: Object.keys(options),
      processingTime: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Build specialized summarization prompt
 */
function buildSummarizePrompt(text: string, options: SummarizeOptions): string {
  const lengthInstruction = getLengthInstruction(
    options.summaryLength || "medium",
  );
  const keyPointsInstruction = options.includeKeyPoints
    ? " Also provide key points as a bulleted list."
    : "";
  const focusInstruction =
    options.focusAreas && options.focusAreas.length > 0
      ? ` Focus specifically on: ${options.focusAreas.join(", ")}.`
      : "";

  return `Summarize the following text clearly and concisely.

INSTRUCTIONS:
${lengthInstruction}${keyPointsInstruction}${focusInstruction}
Focus on the main points and key information while maintaining accuracy and clarity.
Remove redundant information and present the core message effectively.

TEXT TO SUMMARIZE:
${text}

Please provide a well-structured summary that captures the essential information.`;
}

/**
 * Get length instruction based on summary length preference
 */
function getLengthInstruction(summaryLength: string): string {
  switch (summaryLength) {
    case "short":
      return "Provide a concise summary (1-2 sentences).";
    case "long":
      return "Provide a comprehensive summary with key details and context.";
    case "medium":
    default:
      return "Provide a balanced summary (3-5 sentences).";
  }
}

/**
 * Get maximum tokens based on summary length preference
 */
function getMaxTokensForLength(summaryLength: string): number {
  switch (summaryLength) {
    case "short":
      return 150;
    case "long":
      return 500;
    case "medium":
    default:
      return 300;
  }
}

/**
 * Parse AI response for summarization
 */
function parseSummarizeResponse(
  response: string,
  options: SummarizeOptions,
): Omit<SummarizeResult, "metadata"> {
  // Clean up the response
  const cleanResponse = response.trim();

  if (!cleanResponse) {
    throw new Error("Empty response from AI service");
  }

  const result: Omit<SummarizeResult, "metadata"> = {
    summary: cleanResponse,
  };

  // Extract key points if requested and present
  if (options.includeKeyPoints) {
    const keyPoints = extractKeyPoints(cleanResponse);
    if (keyPoints.length > 0) {
      result.keyPoints = keyPoints;
    }
  }

  // Calculate confidence based on response quality indicators
  result.confidence = calculateConfidence(cleanResponse);

  return result;
}

/**
 * Extract key points from response
 */
function extractKeyPoints(response: string): string[] {
  const bulletPoints: string[] = [];

  // Look for bullet points or numbered lists
  const lines = response.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for various bullet point formats
    if (
      trimmed.startsWith("•") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("◦") ||
      /^\d+\./.test(trimmed)
    ) {
      const point = trimmed.replace(/^[•\-*◦]|\d+\./, "").trim();
      if (point.length > 0) {
        bulletPoints.push(point);
      }
    }
  }

  return bulletPoints;
}

/**
 * Calculate confidence score based on response characteristics
 */
function calculateConfidence(response: string): number {
  let confidence = 0.5; // Base confidence

  // Length check (not too short, not too long)
  if (response.length >= 50 && response.length <= 1000) {
    confidence += 0.2;
  }

  // Sentence structure check
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length >= 2 && sentences.length <= 10) {
    confidence += 0.2;
  }

  // Coherence indicators
  if (
    response.includes("The") ||
    response.includes("This") ||
    response.includes("It")
  ) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

/**
 * Batch summarize multiple texts
 */
export async function handleBatchSummarize(
  texts: string[],
  options: SummarizeOptions = {},
): Promise<SummarizeResult[]> {
  logger.info("Starting batch summarization", {
    textCount: texts.length,
    options: Object.keys(options),
  });

  const results: SummarizeResult[] = [];

  // Process texts sequentially to avoid rate limiting
  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await handleSummarize(texts[i], options);
      results.push(result);

      // Add small delay between requests
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error("Batch summarization failed for text", error as Error, {
        index: i,
        textLength: texts[i].length,
      });

      // Add error result
      results.push({
        summary: `Error: Failed to summarize text ${i + 1}`,
        metadata: {
          originalLength: texts[i].length,
          summaryLength: 0,
          compressionRatio: 0,
          processingTime: 0,
        },
      });
    }
  }

  logger.info("Batch summarization completed", {
    successful: results.filter((r) => !r.summary.startsWith("Error:")).length,
    failed: results.filter((r) => r.summary.startsWith("Error:")).length,
  });

  return results;
}
