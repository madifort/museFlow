/**
 * Translate AI handler for MuseFlow
 * Handles text translation with language detection and quality preservation
 */

import { buildPrompt, PromptOptions } from "../core/promptBuilder";
import { callChromeAI, callChromeAITranslate, AIRequest } from "../utils/chromeWrapper";
import { getCachedResponse, saveToCache } from "../storage/cache";
import { getDefaultPromptOptions } from "../storage/settings";
import { logger } from "../utils/logger";

export interface TranslateOptions extends PromptOptions {
  /** Target language for translation */
  targetLanguage?: string;
  /** Source language (auto-detect if not specified) */
  sourceLanguage?: string;
  /** Translation style/register */
  style?: "formal" | "informal" | "technical" | "literary" | "conversational";
  /** Preserve formatting */
  preserveFormatting?: boolean;
  /** Include confidence score */
  includeConfidence?: boolean;
  /** Cultural adaptation */
  culturalAdaptation?: boolean;
  /** Domain-specific translation */
  domain?:
    | "general"
    | "business"
    | "technical"
    | "medical"
    | "legal"
    | "academic";
}

export interface TranslationResult {
  /** The translated text */
  translatedText: string;
  /** Original text */
  originalText: string;
  /** Detected source language */
  sourceLanguage: string;
  /** Target language */
  targetLanguage: string;
  /** Translation confidence score (0-1) */
  confidence?: number;
  /** Alternative translations */
  alternatives?: string[];
  /** Translation metadata */
  metadata: {
    originalLength: number;
    translatedLength: number;
    processingTime: number;
    qualityScore?: number;
  };
}

/**
 * Supported languages mapping
 */
export const SUPPORTED_LANGUAGES = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Russian: "ru",
  Chinese: "zh",
  Japanese: "ja",
  Korean: "ko",
  Arabic: "ar",
  Hindi: "hi",
  Dutch: "nl",
  Swedish: "sv",
  Norwegian: "no",
  Danish: "da",
  Finnish: "fi",
  Polish: "pl",
  Czech: "cs",
  Hungarian: "hu",
  Romanian: "ro",
  Bulgarian: "bg",
  Croatian: "hr",
  Serbian: "sr",
  Slovak: "sk",
  Slovenian: "sl",
  Greek: "el",
  Turkish: "tr",
  Hebrew: "he",
  Thai: "th",
  Vietnamese: "vi",
  Indonesian: "id",
  Malay: "ms",
  Tagalog: "tl",
  Ukrainian: "uk",
  Catalan: "ca",
  Basque: "eu",
  Galician: "gl",
  Welsh: "cy",
  Irish: "ga",
  "Scottish Gaelic": "gd",
  Icelandic: "is",
  Maltese: "mt",
  Latvian: "lv",
  Lithuanian: "lt",
  Estonian: "et",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Handle text translation
 * @param text - Input text to translate
 * @param options - Translation options
 * @returns Translated text with metadata
 */
export async function handleTranslate(
  text: string,
  options: TranslateOptions = {},
): Promise<TranslationResult> {
  const startTime = Date.now();

  try {
    logger.info("Starting translation", {
      textLength: text.length,
      options: Object.keys(options),
    });

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

    // Detect source language if not provided
    const sourceLanguage =
      finalOptions.sourceLanguage || (await detectLanguage(text));
    const targetLanguage = finalOptions.targetLanguage || "English";

    // Check cache first
    const cachedResponse = await getCachedResponse(
      text,
      "translate",
      finalOptions,
    );

    if (cachedResponse) {
      logger.debug("Using cached translation response");
      return {
        translatedText: cachedResponse.text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        metadata: {
          originalLength: text.length,
          translatedLength: cachedResponse.text.length,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Build specialized prompt for translation
    const prompt = buildTranslatePrompt(
      text,
      sourceLanguage,
      targetLanguage,
      finalOptions,
    );

    // Prepare AI request
    const aiRequest: AIRequest = {
      prompt,
      maxTokens: Math.min(text.length * 2, 3000), // Allow for expansion in translation
      temperature: 0.3, // Lower temperature for more consistent translations
    };

    // Call Chrome AI service directly for translation
    let aiResponse;
    try {
      console.log('[MuseFlow] Attempting Chrome AI translation...');
      aiResponse = await callChromeAITranslate(
        text,
        finalOptions.targetLanguage || "English",
        finalOptions.sourceLanguage
      );
      console.log('[MuseFlow] Chrome AI translation successful');
    } catch (chromeError) {
      console.log('[MuseFlow] Chrome AI translation failed, falling back to general AI...');
      // Fallback to general AI call
      aiResponse = await callChromeAI(aiRequest);
    }

    // Parse and validate response
    const translatedText = parseTranslationResponse(aiResponse.text);

    // Calculate metadata
    const processingTime = Date.now() - startTime;
    const qualityScore = calculateTranslationQuality(
      text,
      translatedText,
      sourceLanguage,
      targetLanguage,
    );

    const finalResult: TranslationResult = {
      translatedText,
      originalText: text,
      sourceLanguage,
      targetLanguage,
      confidence: calculateConfidence(
        text,
        translatedText,
        sourceLanguage,
        targetLanguage,
      ),
      metadata: {
        originalLength: text.length,
        translatedLength: translatedText.length,
        processingTime,
        qualityScore,
      },
    };

    // Cache the response
    await saveToCache("translate", text, aiResponse, finalOptions);

    logger.info("Translation completed", {
      sourceLanguage: finalResult.sourceLanguage,
      targetLanguage: finalResult.targetLanguage,
      originalLength: finalResult.metadata.originalLength,
      translatedLength: finalResult.metadata.translatedLength,
      processingTime: finalResult.metadata.processingTime,
    });

    return finalResult;
  } catch (error) {
    logger.error("Translation failed", error as Error, {
      textLength: text.length,
      options: Object.keys(options),
      processingTime: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Build specialized translation prompt
 */
function buildTranslatePrompt(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options: TranslateOptions,
): string {
  const styleInstruction = getStyleInstruction(options.style);
  const domainInstruction = getDomainInstruction(options.domain);
  const culturalInstruction = options.culturalAdaptation
    ? " Adapt cultural references and idioms appropriately for the target language and culture."
    : "";
  const formattingInstruction = options.preserveFormatting
    ? " Preserve all formatting, including line breaks, punctuation, and special characters."
    : "";

  return `Translate the following text from ${sourceLanguage} to ${targetLanguage}.

INSTRUCTIONS:
${styleInstruction}${domainInstruction}${culturalInstruction}${formattingInstruction}
Maintain the original meaning, tone, and context while ensuring the translation reads naturally in ${targetLanguage}.
Preserve any technical terms, proper nouns, or specialized vocabulary appropriately.

TEXT TO TRANSLATE:
${text}

Please provide an accurate, natural-sounding translation in ${targetLanguage}.`;
}

/**
 * Get style instruction based on translation style
 */
function getStyleInstruction(style?: string): string {
  switch (style) {
    case "formal":
      return "Use formal language and register appropriate for official or academic contexts.";
    case "informal":
      return "Use informal, conversational language that sounds natural and casual.";
    case "technical":
      return "Use precise technical terminology and maintain technical accuracy.";
    case "literary":
      return "Preserve literary style, metaphors, and artistic expression.";
    case "conversational":
      return "Use conversational tone that feels natural and easy to read.";
    default:
      return "Use clear, natural language appropriate for general communication.";
  }
}

/**
 * Get domain instruction based on translation domain
 */
function getDomainInstruction(domain?: string): string {
  switch (domain) {
    case "business":
      return "Use business-appropriate language and terminology.";
    case "technical":
      return "Maintain technical accuracy and use precise technical terminology.";
    case "medical":
      return "Use accurate medical terminology and maintain clinical precision.";
    case "legal":
      return "Use precise legal terminology and maintain legal accuracy.";
    case "academic":
      return "Use scholarly language and maintain academic rigor.";
    default:
      return "";
  }
}

/**
 * Detect language of input text (simplified implementation)
 */
async function detectLanguage(text: string): Promise<string> {
  // This is a simplified language detection
  // In a real implementation, you might use a dedicated language detection service

  const commonPatterns = {
    English: /^(the|and|or|but|in|on|at|to|for|of|with|by)\s/i,
    Spanish: /^(el|la|los|las|un|una|de|del|en|con|por|para)\s/i,
    French: /^(le|la|les|un|une|de|du|des|en|avec|pour|par)\s/i,
    German: /^(der|die|das|ein|eine|und|oder|aber|in|auf|mit|für)\s/i,
    Italian: /^(il|la|lo|gli|le|un|una|di|del|della|in|con|per)\s/i,
    Portuguese: /^(o|a|os|as|um|uma|de|do|da|em|com|para)\s/i,
    Russian: /^[а-яё]/i,
    Chinese: /[\u4e00-\u9fff]/,
    Japanese: /[\u3040-\u309f\u30a0-\u30ff]/,
    Korean: /[\uac00-\ud7af]/,
    Arabic: /[\u0600-\u06ff]/,
  };

  for (const [language, pattern] of Object.entries(commonPatterns)) {
    if (pattern.test(text)) {
      return language;
    }
  }

  // Default to English if no pattern matches
  return "English";
}

/**
 * Parse translation response from AI
 */
function parseTranslationResponse(response: string): string {
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
      !line.toLowerCase().includes("translation") &&
      !line.toLowerCase().includes("translated")
    ) {
      startIndex = i;
      break;
    }
  }

  return lines.slice(startIndex).join("\n").trim();
}

/**
 * Calculate translation confidence score
 */
function calculateConfidence(
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
): number {
  let confidence = 0.5; // Base confidence

  // Length ratio check (translations can vary in length)
  const lengthRatio = translatedText.length / originalText.length;
  if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
    confidence += 0.2;
  }

  // Sentence structure preservation
  const originalSentences = originalText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const translatedSentences = translatedText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;

  if (Math.abs(originalSentences - translatedSentences) <= 1) {
    confidence += 0.2;
  }

  // Word count preservation (rough check)
  const originalWords = originalText.split(/\s+/).length;
  const translatedWords = translatedText.split(/\s+/).length;
  const wordRatio = translatedWords / originalWords;

  if (wordRatio >= 0.7 && wordRatio <= 1.5) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

/**
 * Calculate translation quality score
 */
function calculateTranslationQuality(
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
): number {
  let quality = 0.5; // Base quality

  // Completeness check
  if (translatedText.length > 0) {
    quality += 0.2;
  }

  // Language consistency check (basic)
  if (targetLanguage === "English" && /[a-zA-Z]/.test(translatedText)) {
    quality += 0.1;
  }

  // Structure preservation
  const originalParagraphs = originalText.split(/\n\s*\n/).length;
  const translatedParagraphs = translatedText.split(/\n\s*\n/).length;

  if (Math.abs(originalParagraphs - translatedParagraphs) <= 1) {
    quality += 0.1;
  }

  // Punctuation preservation
  const originalPunctuation = (originalText.match(/[.!?]/g) || []).length;
  const translatedPunctuation = (translatedText.match(/[.!?]/g) || []).length;

  if (Math.abs(originalPunctuation - translatedPunctuation) <= 2) {
    quality += 0.1;
  }

  return Math.min(1.0, quality);
}

/**
 * Get supported languages list
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in SUPPORTED_LANGUAGES;
}

/**
 * Get language code
 */
export function getLanguageCode(language: SupportedLanguage): string {
  return SUPPORTED_LANGUAGES[language];
}

/**
 * Batch translate multiple texts
 */
export async function handleBatchTranslate(
  texts: string[],
  options: TranslateOptions = {},
): Promise<TranslationResult[]> {
  logger.info("Starting batch translation", {
    textCount: texts.length,
    options: Object.keys(options),
  });

  const results: TranslationResult[] = [];

  // Process texts sequentially to avoid rate limiting
  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await handleTranslate(texts[i], options);
      results.push(result);

      // Add small delay between requests
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error("Batch translation failed for text", error as Error, {
        index: i,
        textLength: texts[i].length,
      });

      // Add error result
      results.push({
        translatedText: `Error: Failed to translate text ${i + 1}`,
        originalText: texts[i],
        sourceLanguage: "Unknown",
        targetLanguage: options.targetLanguage || "English",
        metadata: {
          originalLength: texts[i].length,
          translatedLength: 0,
          processingTime: 0,
        },
      });
    }
  }

  logger.info("Batch translation completed", {
    successful: results.filter((r) => !r.translatedText.startsWith("Error:"))
      .length,
    failed: results.filter((r) => r.translatedText.startsWith("Error:")).length,
  });

  return results;
}
