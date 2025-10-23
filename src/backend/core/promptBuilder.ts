/**
 * Prompt Orchestration Engine for MuseFlow
 * Dynamically constructs prompt templates for all AI modes
 */

export type PromptMode = "summarize" | "rewrite" | "ideate" | "translate";

export interface PromptOptions {
  /** Target language for translation */
  targetLanguage?: string;
  /** Tone/style preferences */
  tone?: "formal" | "casual" | "professional" | "creative";
  /** Length preference for summaries */
  summaryLength?: "short" | "medium" | "long";
  /** Context for ideation */
  context?: string;
}

/**
 * Build a prompt for the specified mode and text
 * @param mode - The AI action mode
 * @param text - The input text to process
 * @param options - Additional options for prompt customization
 * @returns Formatted prompt string
 */
export function buildPrompt(
  mode: PromptMode,
  text: string,
  options: PromptOptions = {},
): string {
  // Context validation step: if text < 10 chars → return "INSUFFICIENT_CONTEXT"
  if (!text || text.trim().length < 10) {
    throw new Error("INSUFFICIENT_CONTEXT: Text must be at least 10 characters long");
  }

  // Validate input text length
  if (text.length > 5000) {
    console.warn("Text length exceeds recommended limit, truncating...");
    text = `${text.substring(0, 5000)}...`;
  }

  const baseInstruction = `Please process the following text according to the specified mode.`;

  switch (mode) {
    case "summarize":
      return buildSummarizePrompt(text, options);

    case "rewrite":
      return buildRewritePrompt(text, options);

    case "ideate":
      return buildIdeatePrompt(text, options);

    case "translate":
      return buildTranslatePrompt(text, options);

    default:
      throw new Error(`Unknown prompt mode: ${mode}`);
  }
}

/**
 * Build a summarization prompt
 */
function buildSummarizePrompt(text: string, options: PromptOptions): string {
  const lengthInstruction =
    options.summaryLength === "short"
      ? "Provide a concise summary (2-3 sentences)."
      : options.summaryLength === "long"
        ? "Provide a comprehensive summary with key details."
        : "Provide a balanced summary (3-5 sentences).";

  return `You are an AI assistant specialized in text summarization. Your task is to create clear, accurate, and concise summaries.

INSTRUCTIONS:
${lengthInstruction} Focus on the main points and key information while maintaining accuracy and clarity.
- Extract the core message and essential details
- Maintain the original meaning and context
- Use clear, readable language
- Do not invent facts or add information not present in the source
- If the context is insufficient, respond with 'INSUFFICIENT_CONTEXT'

SAFETY GUIDELINES:
- Do not invent facts or make assumptions
- If context is missing, respond with 'INSUFFICIENT_CONTEXT'
- Maintain factual accuracy
- Preserve the original intent and meaning

TEXT TO SUMMARIZE:
${text}

Please provide a clear, factual summary that captures the essential information.`;
}

/**
 * Build a rewriting prompt
 */
function buildRewritePrompt(text: string, options: PromptOptions): string {
  const toneInstruction =
    options.tone === "formal"
      ? "Use a formal, professional tone."
      : options.tone === "casual"
        ? "Use a casual, conversational tone."
        : options.tone === "creative"
          ? "Use a creative, engaging tone."
          : "Use a clear, polished tone.";

  return `You are an AI assistant specialized in text rewriting and improvement. Your task is to enhance text while preserving the original meaning and intent.

INSTRUCTIONS:
${toneInstruction} Improve clarity, flow, and readability while preserving the original meaning and intent.
- Enhance readability and flow
- Maintain the original meaning and context
- Use appropriate tone and style
- Improve sentence structure and clarity
- Do not change facts or add new information
- If the context is insufficient, respond with 'INSUFFICIENT_CONTEXT'

SAFETY GUIDELINES:
- Do not invent facts or make assumptions
- If context is missing, respond with 'INSUFFICIENT_CONTEXT'
- Maintain factual accuracy
- Preserve the original intent and meaning

ORIGINAL TEXT:
${text}

Please provide a rewritten version that is clearer, more engaging, and better structured.`;
}

/**
 * Build an ideation prompt
 */
function buildIdeatePrompt(text: string, options: PromptOptions): string {
  const contextAddition = options.context
    ? `\n\nCONTEXT: ${options.context}`
    : "";

  return `You are an AI assistant specialized in creative ideation and brainstorming. Your task is to generate innovative, practical ideas based on provided content.

INSTRUCTIONS:
Generate creative ideas, suggestions, or alternative approaches based on the provided text. Think outside the box and provide practical, actionable insights.
- Generate 3-5 creative, innovative ideas
- Make ideas specific and actionable
- Build upon the provided content
- Consider different perspectives and approaches
- Focus on practical implementation
- If the context is insufficient, respond with 'INSUFFICIENT_CONTEXT'

SAFETY GUIDELINES:
- Do not invent facts or make assumptions
- If context is missing, respond with 'INSUFFICIENT_CONTEXT'
- Maintain factual accuracy
- Focus on constructive, positive ideas
- Avoid harmful or inappropriate suggestions

SOURCE TEXT:
${text}${contextAddition}

Please provide 3-5 creative ideas, suggestions, or alternative approaches that build upon or relate to this content. Make them specific and actionable.`;
}

/**
 * Build a translation prompt
 */
function buildTranslatePrompt(text: string, options: PromptOptions): string {
  const targetLanguage = options.targetLanguage || "English";

  return `You are an AI assistant specialized in text translation. Your task is to provide accurate, natural translations while preserving meaning and context.

INSTRUCTIONS:
Translate the following text to ${targetLanguage} while preserving the original meaning, tone, and context. Maintain any technical terms, proper nouns, or specialized vocabulary appropriately.
- Preserve the original meaning and intent
- Maintain appropriate tone and style
- Keep technical terms and proper nouns accurate
- Ensure natural, fluent language in the target language
- If the context is insufficient, respond with 'INSUFFICIENT_CONTEXT'

SAFETY GUIDELINES:
- Do not invent facts or make assumptions
- If context is missing, respond with 'INSUFFICIENT_CONTEXT'
- Maintain factual accuracy
- Preserve the original intent and meaning
- Avoid adding or removing information

TEXT TO TRANSLATE:
${text}

Please provide an accurate translation that reads naturally in ${targetLanguage}.`;
}

/**
 * Get default options for a specific mode
 */
export function getDefaultOptions(mode: PromptMode): PromptOptions {
  switch (mode) {
    case "summarize":
      return { summaryLength: "medium" };
    case "rewrite":
      return { tone: "professional" };
    case "ideate":
      return {};
    case "translate":
      return { targetLanguage: "English" };
    default:
      return {};
  }
}

/**
 * Validate prompt options for a specific mode
 */
export function validateOptions(
  mode: PromptMode,
  options: PromptOptions,
): boolean {
  switch (mode) {
    case "summarize":
      return (
        !options.summaryLength ||
        ["short", "medium", "long"].includes(options.summaryLength)
      );
    case "rewrite":
      return (
        !options.tone ||
        ["formal", "casual", "professional", "creative"].includes(options.tone)
      );
    case "ideate":
      return true; // No specific validation needed
    case "translate":
      return (
        !options.targetLanguage || typeof options.targetLanguage === "string"
      );
    default:
      return false;
  }
}
