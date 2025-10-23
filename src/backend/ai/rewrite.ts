/**
 * Rewrite AI handler for MuseFlow
 * Handles text rewriting with configurable tone and style
 */

import { buildPrompt, PromptOptions } from "../core/promptBuilder";
import { callChromeAI, AIRequest } from "../utils/chromeWrapper";
import { getCachedResponse, saveToCache } from "../storage/cache";
import { getDefaultPromptOptions } from "../storage/settings";
import { logger } from "../utils/logger";

export interface RewriteOptions extends PromptOptions {
  /** Tone/style for rewriting */
  tone?:
    | "formal"
    | "casual"
    | "professional"
    | "creative"
    | "academic"
    | "conversational";
  /** Writing style preferences */
  style?: {
    /** Use active voice */
    activeVoice?: boolean;
    /** Simplify complex sentences */
    simplify?: boolean;
    /** Add more descriptive language */
    descriptive?: boolean;
    /** Focus on clarity */
    clarity?: boolean;
  };
  /** Target audience */
  audience?: "general" | "technical" | "academic" | "business" | "casual";
  /** Specific improvements to focus on */
  improvements?: string[];
}

export interface RewriteResult {
  /** The rewritten text */
  rewrittenText: string;
  /** Original text for comparison */
  originalText: string;
  /** Changes made */
  changes: {
    /** Word count change */
    wordCountChange: number;
    /** Sentence count change */
    sentenceCountChange: number;
    /** Readability improvements */
    readabilityScore?: number;
  };
  /** Confidence score (0-1) */
  confidence?: number;
  /** Processing metadata */
  metadata: {
    originalLength: number;
    rewrittenLength: number;
    processingTime: number;
  };
}

/**
 * Handle text rewriting
 * @param text - Input text to rewrite
 * @param options - Rewriting options
 * @returns Rewritten text with metadata
 */
export async function handleRewrite(
  text: string,
  options: RewriteOptions = {},
): Promise<RewriteResult> {
  const startTime = Date.now();

  try {
    logger.info("Starting text rewriting", {
      textLength: text.length,
      options: Object.keys(options),
    });

    // Check cache first
    const cachedResponse = await getCachedResponse(text, "rewrite", options);

    if (cachedResponse) {
      logger.debug("Using cached rewrite response");
      return {
        rewrittenText: cachedResponse.text,
        originalText: text,
        changes: calculateChanges(text, cachedResponse.text),
        metadata: {
          originalLength: text.length,
          rewrittenLength: cachedResponse.text.length,
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

    // Build specialized prompt for rewriting
    const prompt = buildRewritePrompt(text, finalOptions);

    // Prepare AI request
    const aiRequest: AIRequest = {
      prompt,
      maxTokens: Math.min(text.length * 1.5, 2000), // Allow some expansion
      temperature: 0.4, // Slightly higher for creativity but still controlled
    };

    // Call AI service
    const aiResponse = await callChromeAI(aiRequest);

    // Parse and validate response
    const rewrittenText = parseRewriteResponse(aiResponse.text);

    // Calculate changes and metadata
    const changes = calculateChanges(text, rewrittenText);
    const processingTime = Date.now() - startTime;

    const finalResult: RewriteResult = {
      rewrittenText,
      originalText: text,
      changes,
      confidence: calculateConfidence(text, rewrittenText, finalOptions),
      metadata: {
        originalLength: text.length,
        rewrittenLength: rewrittenText.length,
        processingTime,
      },
    };

    // Cache the response
    await saveToCache("rewrite", text, aiResponse, options);

    logger.info("Text rewriting completed", {
      originalLength: finalResult.metadata.originalLength,
      rewrittenLength: finalResult.metadata.rewrittenLength,
      wordCountChange: finalResult.changes.wordCountChange,
      processingTime: finalResult.metadata.processingTime,
    });

    return finalResult;
  } catch (error) {
    logger.error("Text rewriting failed", error as Error, {
      textLength: text.length,
      options: Object.keys(options),
      processingTime: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Build specialized rewriting prompt
 */
function buildRewritePrompt(text: string, options: RewriteOptions): string {
  const toneInstruction = getToneInstruction(options.tone || "professional");
  const styleInstruction = getStyleInstruction(options.style);
  const audienceInstruction = getAudienceInstruction(options.audience);
  const improvementsInstruction =
    options.improvements && options.improvements.length > 0
      ? ` Focus on these specific improvements: ${options.improvements.join(", ")}.`
      : "";

  return `Rewrite the following text to improve clarity, flow, and readability while preserving the original meaning and intent.

INSTRUCTIONS:
${toneInstruction}${styleInstruction}${audienceInstruction}${improvementsInstruction}
Maintain the core message and key information while enhancing the writing quality.

ORIGINAL TEXT:
${text}

Please provide a rewritten version that is clearer, more engaging, and better structured.`;
}

/**
 * Get tone instruction based on tone preference
 */
function getToneInstruction(tone: string): string {
  switch (tone) {
    case "formal":
      return "Use a formal, professional tone with sophisticated vocabulary.";
    case "casual":
      return "Use a casual, conversational tone that is friendly and approachable.";
    case "professional":
      return "Use a professional, business-appropriate tone that is clear and authoritative.";
    case "creative":
      return "Use a creative, engaging tone with vivid language and compelling narrative.";
    case "academic":
      return "Use an academic tone with precise terminology and scholarly language.";
    case "conversational":
      return "Use a conversational tone that feels natural and easy to read.";
    default:
      return "Use a clear, polished tone.";
  }
}

/**
 * Get style instruction based on style preferences
 */
function getStyleInstruction(style?: RewriteOptions["style"]): string {
  if (!style) return "";

  const instructions: string[] = [];

  if (style.activeVoice) {
    instructions.push("Use active voice whenever possible.");
  }

  if (style.simplify) {
    instructions.push(
      "Simplify complex sentences and use clear, straightforward language.",
    );
  }

  if (style.descriptive) {
    instructions.push(
      "Add descriptive language and vivid details where appropriate.",
    );
  }

  if (style.clarity) {
    instructions.push("Prioritize clarity and eliminate any ambiguity.");
  }

  return instructions.length > 0 ? ` ${instructions.join(" ")}` : "";
}

/**
 * Get audience instruction based on target audience
 */
function getAudienceInstruction(audience?: string): string {
  if (!audience) return "";

  switch (audience) {
    case "technical":
      return " Write for a technical audience familiar with specialized terminology.";
    case "academic":
      return " Write for an academic audience with scholarly expectations.";
    case "business":
      return " Write for a business audience focused on results and professionalism.";
    case "casual":
      return " Write for a casual audience that prefers simple, friendly language.";
    case "general":
    default:
      return " Write for a general audience that values clarity and accessibility.";
  }
}

/**
 * Parse AI response for rewriting
 */
function parseRewriteResponse(response: string): string {
  // Clean up the response
  const cleanResponse = response.trim();

  if (!cleanResponse) {
    throw new Error("Empty response from AI service");
  }

  // Remove any prefix that might indicate it's a response
  const lines = cleanResponse.split("\n");
  let startIndex = 0;

  // Skip lines that look like headers or instructions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line &&
      !line.toLowerCase().includes("rewritten") &&
      !line.toLowerCase().includes("version")
    ) {
      startIndex = i;
      break;
    }
  }

  return lines.slice(startIndex).join("\n").trim();
}

/**
 * Calculate changes between original and rewritten text
 */
function calculateChanges(
  originalText: string,
  rewrittenText: string,
): RewriteResult["changes"] {
  const originalWords = originalText.split(/\s+/).length;
  const rewrittenWords = rewrittenText.split(/\s+/).length;

  const originalSentences = originalText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const rewrittenSentences = rewrittenText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;

  return {
    wordCountChange: rewrittenWords - originalWords,
    sentenceCountChange: rewrittenSentences - originalSentences,
    readabilityScore: calculateReadabilityScore(rewrittenText),
  };
}

/**
 * Calculate readability score (simplified Flesch Reading Ease)
 */
function calculateReadabilityScore(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const words = text.split(/\s+/).length;
  const syllables = text.split(/\s+/).reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);

  if (sentences === 0 || words === 0) return 0;

  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleanWord.length === 0) return 0;

  const vowels = "aeiouy";
  let syllables = 0;
  let previousWasVowel = false;

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e'
  if (cleanWord.endsWith("e") && syllables > 1) {
    syllables--;
  }

  return Math.max(1, syllables);
}

/**
 * Calculate confidence score based on response quality
 */
function calculateConfidence(
  originalText: string,
  rewrittenText: string,
  options: RewriteOptions,
): number {
  let confidence = 0.5; // Base confidence

  // Length check (shouldn't be too different from original)
  const lengthRatio = rewrittenText.length / originalText.length;
  if (lengthRatio >= 0.7 && lengthRatio <= 1.5) {
    confidence += 0.2;
  }

  // Sentence structure improvement
  const originalSentences = originalText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const rewrittenSentences = rewrittenText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;

  if (rewrittenSentences > 0 && rewrittenSentences <= originalSentences * 1.5) {
    confidence += 0.2;
  }

  // Tone consistency check
  if (options.tone) {
    const toneIndicators = getToneIndicators(options.tone);
    const toneMatches = toneIndicators.filter((indicator) =>
      rewrittenText.toLowerCase().includes(indicator.toLowerCase()),
    ).length;

    if (toneMatches > 0) {
      confidence += 0.1;
    }
  }

  return Math.min(1.0, confidence);
}

/**
 * Get tone indicators for confidence checking
 */
function getToneIndicators(tone: string): string[] {
  switch (tone) {
    case "formal":
      return ["therefore", "furthermore", "consequently", "moreover"];
    case "casual":
      return ["actually", "really", "pretty", "kind of"];
    case "professional":
      return ["recommend", "suggest", "propose", "indicate"];
    case "creative":
      return ["imagine", "picture", "envision", "visualize"];
    default:
      return [];
  }
}

/**
 * Batch rewrite multiple texts
 */
export async function handleBatchRewrite(
  texts: string[],
  options: RewriteOptions = {},
): Promise<RewriteResult[]> {
  logger.info("Starting batch rewriting", {
    textCount: texts.length,
    options: Object.keys(options),
  });

  const results: RewriteResult[] = [];

  // Process texts sequentially to avoid rate limiting
  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await handleRewrite(texts[i], options);
      results.push(result);

      // Add small delay between requests
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error("Batch rewriting failed for text", error as Error, {
        index: i,
        textLength: texts[i].length,
      });

      // Add error result
      results.push({
        rewrittenText: `Error: Failed to rewrite text ${i + 1}`,
        originalText: texts[i],
        changes: {
          wordCountChange: 0,
          sentenceCountChange: 0,
        },
        metadata: {
          originalLength: texts[i].length,
          rewrittenLength: 0,
          processingTime: 0,
        },
      });
    }
  }

  logger.info("Batch rewriting completed", {
    successful: results.filter((r) => !r.rewrittenText.startsWith("Error:"))
      .length,
    failed: results.filter((r) => r.rewrittenText.startsWith("Error:")).length,
  });

  return results;
}
