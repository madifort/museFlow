/**
 * Ideate AI handler for MuseFlow
 * Handles creative ideation and brainstorming based on input text
 */

import { buildPrompt, PromptOptions } from "../core/promptBuilder";
import { callChromeAI, AIRequest } from "../utils/chromeWrapper";
import { getCachedResponse, saveToCache } from "../storage/cache";
import { getDefaultPromptOptions } from "../storage/settings";
import { logger } from "../utils/logger";

export interface IdeateOptions extends PromptOptions {
  /** Number of ideas to generate */
  ideaCount?: number;
  /** Type of ideas to generate */
  ideaType?: "creative" | "practical" | "strategic" | "innovative" | "mixed";
  /** Context or domain for ideation */
  domain?: string;
  /** Specific focus areas */
  focusAreas?: string[];
  /** Constraints or requirements */
  constraints?: string[];
  /** Target audience for ideas */
  audience?: string;
  /** Time frame for implementation */
  timeframe?: "short" | "medium" | "long";
}

export interface Idea {
  /** The idea title */
  title: string;
  /** Detailed description of the idea */
  description: string;
  /** Implementation steps or approach */
  implementation?: string[];
  /** Potential benefits */
  benefits?: string[];
  /** Potential challenges */
  challenges?: string[];
  /** Estimated effort level */
  effortLevel?: "low" | "medium" | "high";
  /** Estimated impact level */
  impactLevel?: "low" | "medium" | "high";
}

export interface IdeateResult {
  /** Generated ideas */
  ideas: Idea[];
  /** Context used for ideation */
  context: {
    originalText: string;
    domain?: string;
    focusAreas?: string[];
    constraints?: string[];
  };
  /** Ideation metadata */
  metadata: {
    ideaCount: number;
    processingTime: number;
    creativityScore?: number;
  };
}

/**
 * Handle creative ideation
 * @param text - Input text to ideate from
 * @param options - Ideation options
 * @returns Generated ideas with metadata
 */
export async function handleIdeate(
  text: string,
  options: IdeateOptions = {},
): Promise<IdeateResult> {
  const startTime = Date.now();

  try {
    logger.info("Starting ideation", {
      textLength: text.length,
      options: Object.keys(options),
    });

    // Check cache first
    const cachedResponse = await getCachedResponse(text, "ideate", options);

    if (cachedResponse) {
      logger.debug("Using cached ideation response");
      const ideas = parseIdeasFromResponse(cachedResponse.text);
      return {
        ideas,
        context: {
          originalText: text,
          domain: options.domain,
          focusAreas: options.focusAreas,
          constraints: options.constraints,
        },
        metadata: {
          ideaCount: ideas.length,
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

    // Build specialized prompt for ideation
    const prompt = buildIdeatePrompt(text, finalOptions);

    // Prepare AI request
    const aiRequest: AIRequest = {
      prompt,
      maxTokens: 1500, // Allow for detailed idea descriptions
      temperature: 0.8, // Higher temperature for creativity
    };

    // Call AI service
    const aiResponse = await callChromeAI(aiRequest);

    // Parse and validate response
    const ideas = parseIdeasFromResponse(aiResponse.text);

    // Calculate metadata
    const processingTime = Date.now() - startTime;
    const creativityScore = calculateCreativityScore(ideas);

    const finalResult: IdeateResult = {
      ideas,
      context: {
        originalText: text,
        domain: options.domain,
        focusAreas: options.focusAreas,
        constraints: options.constraints,
      },
      metadata: {
        ideaCount: ideas.length,
        processingTime,
        creativityScore,
      },
    };

    // Cache the response
    await saveToCache("ideate", text, aiResponse, options);

    logger.info("Ideation completed", {
      ideaCount: finalResult.metadata.ideaCount,
      creativityScore: finalResult.metadata.creativityScore,
      processingTime: finalResult.metadata.processingTime,
    });

    return finalResult;
  } catch (error) {
    logger.error("Ideation failed", error as Error, {
      textLength: text.length,
      options: Object.keys(options),
      processingTime: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Build specialized ideation prompt
 */
function buildIdeatePrompt(text: string, options: IdeateOptions): string {
  const ideaCount = options.ideaCount || 5;
  const ideaTypeInstruction = getIdeaTypeInstruction(
    options.ideaType || "mixed",
  );
  const domainInstruction = options.domain
    ? ` Focus on ideas relevant to the ${options.domain} domain.`
    : "";
  const focusInstruction =
    options.focusAreas && options.focusAreas.length > 0
      ? ` Pay special attention to: ${options.focusAreas.join(", ")}.`
      : "";
  const constraintsInstruction =
    options.constraints && options.constraints.length > 0
      ? ` Consider these constraints: ${options.constraints.join(", ")}.`
      : "";
  const audienceInstruction = options.audience
    ? ` Tailor ideas for a ${options.audience} audience.`
    : "";
  const timeframeInstruction = options.timeframe
    ? ` Focus on ${options.timeframe}-term implementation ideas.`
    : "";

  return `Generate creative, innovative ideas based on the following text. Think outside the box and provide practical, actionable insights.

INSTRUCTIONS:
Generate ${ideaCount} distinct ideas.${ideaTypeInstruction}${domainInstruction}${focusInstruction}${constraintsInstruction}${audienceInstruction}${timeframeInstruction}
Each idea should be specific, actionable, and build upon the content provided.

SOURCE TEXT:
${text}

For each idea, provide:
1. A clear, compelling title
2. A detailed description explaining the concept
3. Implementation steps or approach
4. Potential benefits
5. Potential challenges
6. Effort level (low/medium/high)
7. Impact level (low/medium/high)

Please format your response clearly with numbered ideas and organized sections.`;
}

/**
 * Get idea type instruction based on preference
 */
function getIdeaTypeInstruction(ideaType: string): string {
  switch (ideaType) {
    case "creative":
      return " Focus on highly creative, innovative, and out-of-the-box ideas.";
    case "practical":
      return " Focus on practical, implementable ideas with clear benefits.";
    case "strategic":
      return " Focus on strategic, long-term thinking and planning ideas.";
    case "innovative":
      return " Focus on breakthrough innovations and novel approaches.";
    case "mixed":
    default:
      return " Provide a mix of creative, practical, and strategic ideas.";
  }
}

/**
 * Parse ideas from AI response
 */
function parseIdeasFromResponse(response: string): Idea[] {
  const ideas: Idea[] = [];
  const lines = response.split("\n");

  let currentIdea: Partial<Idea> = {};
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Check for new idea (numbered or titled)
    if (/^\d+\./.test(line) || /^idea\s+\d+/i.test(line)) {
      // Save previous idea if exists
      if (currentIdea.title) {
        ideas.push(currentIdea as Idea);
      }

      // Start new idea
      currentIdea = {
        title: line.replace(/^\d+\.\s*/, "").replace(/^idea\s+\d+:\s*/i, ""),
      };
      currentSection = "";
      continue;
    }

    // Check for section headers
    if (
      line.toLowerCase().includes("description") ||
      line.toLowerCase().includes("explanation")
    ) {
      currentSection = "description";
      continue;
    } else if (
      line.toLowerCase().includes("implementation") ||
      line.toLowerCase().includes("steps")
    ) {
      currentSection = "implementation";
      continue;
    } else if (
      line.toLowerCase().includes("benefits") ||
      line.toLowerCase().includes("advantages")
    ) {
      currentSection = "benefits";
      continue;
    } else if (
      line.toLowerCase().includes("challenges") ||
      line.toLowerCase().includes("difficulties")
    ) {
      currentSection = "challenges";
      continue;
    } else if (
      line.toLowerCase().includes("effort") ||
      line.toLowerCase().includes("difficulty")
    ) {
      currentSection = "effort";
      continue;
    } else if (
      line.toLowerCase().includes("impact") ||
      line.toLowerCase().includes("effect")
    ) {
      currentSection = "impact";
      continue;
    }

    // Add content to current section
    if (currentSection === "description") {
      currentIdea.description = `${currentIdea.description || ""} ${line}`;
    } else if (currentSection === "implementation") {
      if (!currentIdea.implementation) currentIdea.implementation = [];
      currentIdea.implementation.push(line.replace(/^[-•*]\s*/, ""));
    } else if (currentSection === "benefits") {
      if (!currentIdea.benefits) currentIdea.benefits = [];
      currentIdea.benefits.push(line.replace(/^[-•*]\s*/, ""));
    } else if (currentSection === "challenges") {
      if (!currentIdea.challenges) currentIdea.challenges = [];
      currentIdea.challenges.push(line.replace(/^[-•*]\s*/, ""));
    } else if (currentSection === "effort") {
      const effortLevel = line.toLowerCase();
      if (effortLevel.includes("low")) currentIdea.effortLevel = "low";
      else if (effortLevel.includes("high")) currentIdea.effortLevel = "high";
      else currentIdea.effortLevel = "medium";
    } else if (currentSection === "impact") {
      const impactLevel = line.toLowerCase();
      if (impactLevel.includes("low")) currentIdea.impactLevel = "low";
      else if (impactLevel.includes("high")) currentIdea.impactLevel = "high";
      else currentIdea.impactLevel = "medium";
    }
  }

  // Add last idea
  if (currentIdea.title) {
    ideas.push(currentIdea as Idea);
  }

  // Clean up and validate ideas
  return ideas.map((idea) => ({
    ...idea,
    title: idea.title?.trim() || "Untitled Idea",
    description: idea.description?.trim() || "No description provided",
    implementation: idea.implementation || [],
    benefits: idea.benefits || [],
    challenges: idea.challenges || [],
    effortLevel: idea.effortLevel || "medium",
    impactLevel: idea.impactLevel || "medium",
  }));
}

/**
 * Calculate creativity score based on idea characteristics
 */
function calculateCreativityScore(ideas: Idea[]): number {
  if (ideas.length === 0) return 0;

  let score = 0;
  const totalIdeas = ideas.length;

  for (const idea of ideas) {
    let ideaScore = 0.2; // Base score

    // Title creativity
    if (idea.title && idea.title.length > 10) {
      ideaScore += 0.1;
    }

    // Description quality
    if (idea.description && idea.description.length > 50) {
      ideaScore += 0.2;
    }

    // Implementation details
    if (idea.implementation && idea.implementation.length > 0) {
      ideaScore += 0.2;
    }

    // Benefits and challenges
    if (idea.benefits && idea.benefits.length > 0) {
      ideaScore += 0.1;
    }
    if (idea.challenges && idea.challenges.length > 0) {
      ideaScore += 0.1;
    }

    // Effort and impact levels
    if (idea.effortLevel && idea.impactLevel) {
      ideaScore += 0.1;
    }

    score += ideaScore;
  }

  return Math.min(1.0, score / totalIdeas);
}

/**
 * Generate ideas for specific scenarios
 */
export async function handleScenarioIdeation(
  scenario: string,
  options: IdeateOptions = {},
): Promise<IdeateResult> {
  const scenarioPrompt = `Scenario: ${scenario}

Based on this scenario, generate creative ideas for how to approach, solve, or improve the situation.`;

  return handleIdeate(scenarioPrompt, options);
}

/**
 * Generate ideas for problem-solving
 */
export async function handleProblemIdeation(
  problem: string,
  context?: string,
  options: IdeateOptions = {},
): Promise<IdeateResult> {
  const problemPrompt = `Problem: ${problem}
${context ? `Context: ${context}` : ""}

Generate innovative solutions and approaches to address this problem.`;

  return handleIdeate(problemPrompt, options);
}

/**
 * Generate ideas for opportunity exploration
 */
export async function handleOpportunityIdeation(
  opportunity: string,
  context?: string,
  options: IdeateOptions = {},
): Promise<IdeateResult> {
  const opportunityPrompt = `Opportunity: ${opportunity}
${context ? `Context: ${context}` : ""}

Generate creative ways to capitalize on and maximize this opportunity.`;

  return handleIdeate(opportunityPrompt, options);
}

/**
 * Batch ideation for multiple inputs
 */
export async function handleBatchIdeation(
  inputs: string[],
  options: IdeateOptions = {},
): Promise<IdeateResult[]> {
  logger.info("Starting batch ideation", {
    inputCount: inputs.length,
    options: Object.keys(options),
  });

  const results: IdeateResult[] = [];

  // Process inputs sequentially to avoid rate limiting
  for (let i = 0; i < inputs.length; i++) {
    try {
      const result = await handleIdeate(inputs[i], options);
      results.push(result);

      // Add small delay between requests
      if (i < inputs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error("Batch ideation failed for input", error as Error, {
        index: i,
        inputLength: inputs[i].length,
      });

      // Add error result
      results.push({
        ideas: [
          {
            title: `Error: Failed to generate ideas for input ${i + 1}`,
            description: "An error occurred during ideation.",
            implementation: [],
            benefits: [],
            challenges: [],
            effortLevel: "medium",
            impactLevel: "low",
          },
        ],
        context: {
          originalText: inputs[i],
        },
        metadata: {
          ideaCount: 0,
          processingTime: 0,
        },
      });
    }
  }

  logger.info("Batch ideation completed", {
    successful: results.filter((r) => !r.ideas[0]?.title.startsWith("Error:"))
      .length,
    failed: results.filter((r) => r.ideas[0]?.title.startsWith("Error:"))
      .length,
  });

  return results;
}
