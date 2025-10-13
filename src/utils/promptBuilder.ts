// Utility for building context-aware prompts for Chrome AI APIs

export type AIOperation = 'summarize' | 'rewrite' | 'ideate';

export interface PromptContext {
  content: string;
  title?: string;
  url?: string;
  language?: string;
  targetAudience?: string;
}

/**
 * Builds a context-aware prompt for Chrome AI APIs
 */
export function buildPrompt(
  type: AIOperation, 
  content: string, 
  context?: Partial<PromptContext>
): string {
  const baseContent = content.trim();
  
  if (!baseContent) {
    throw new Error('Content cannot be empty');
  }
  
  switch (type) {
    case 'summarize':
      return buildSummarizePrompt(baseContent, context);
    
    case 'rewrite':
      return buildRewritePrompt(baseContent, context);
    
    case 'ideate':
      return buildIdeatePrompt(baseContent, context);
    
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

function buildSummarizePrompt(content: string, context?: Partial<PromptContext>): string {
  let prompt = `Summarize this content clearly and concisely:\n\n${content}`;
  
  if (context?.title) {
    prompt = `Given this context: "${context.title}"\n\n${prompt}`;
  }
  
  if (context?.targetAudience) {
    prompt += `\n\nTailor the summary for: ${context.targetAudience}`;
  }
  
  prompt += `\n\nProvide:\n- A clear main summary (2-3 sentences)\n- Key points in bullet format\n- Important details or statistics`;
  
  return prompt;
}

function buildRewritePrompt(content: string, context?: Partial<PromptContext>): string {
  let prompt = `Rewrite this content to be more engaging and clear:\n\n${content}`;
  
  if (context?.title) {
    prompt = `Given this context: "${context.title}"\n\n${prompt}`;
  }
  
  if (context?.targetAudience) {
    prompt += `\n\nTarget audience: ${context.targetAudience}`;
  }
  
  if (context?.language && context.language !== 'en') {
    prompt += `\n\nAdapt for ${context.language} language and cultural context`;
  }
  
  prompt += `\n\nImprove:\n- Clarity and readability\n- Engagement and flow\n- Structure and organization\n- Tone and voice`;
  
  return prompt;
}

function buildIdeatePrompt(content: string, context?: Partial<PromptContext>): string {
  let prompt = `Generate creative ideas and suggestions based on this content:\n\n${content}`;
  
  if (context?.title) {
    prompt = `Given this context: "${context.title}"\n\n${prompt}`;
  }
  
  if (context?.url) {
    prompt += `\n\nSource: ${context.url}`;
  }
  
  prompt += `\n\nProvide:\n- 💡 Creative expansion ideas\n- 🎯 Practical applications\n- 🔍 Related concepts to explore\n- 📊 Ways to visualize or present\n- 🚀 Action items or next steps`;
  
  return prompt;
}

/**
 * Validates content length and quality for AI processing
 */
export function validateContent(content: string): { valid: boolean; message?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: 'Content cannot be empty' };
  }
  
  if (content.trim().length < 10) {
    return { valid: false, message: 'Content too short (minimum 10 characters)' };
  }
  
  if (content.length > 10000) {
    return { valid: false, message: 'Content too long (maximum 10,000 characters)' };
  }
  
  return { valid: true };
}

/**
 * Extracts key information from content for context
 */
export function extractContentContext(content: string): Partial<PromptContext> {
  const context: Partial<PromptContext> = {};
  
  // Detect language (simple heuristic)
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = content.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter(word => englishWords.includes(word)).length;
  const isEnglish = englishWordCount / words.length > 0.1;
  
  context.language = isEnglish ? 'en' : 'auto-detect';
  
  // Detect if content seems technical
  const technicalKeywords = ['api', 'function', 'method', 'class', 'variable', 'code', 'algorithm', 'database', 'server'];
  const hasTechnicalContent = technicalKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  if (hasTechnicalContent) {
    context.targetAudience = 'technical audience';
  }
  
  return context;
}
