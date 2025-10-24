/**
 * MuseFlow Backend - Main Entry Point
 * Exports all backend functionality for easy importing
 */

// Core functionality
export * from "./core/config";
export * from "./core/promptBuilder";
export * from "./core/messageRouter";

// AI handlers
export * from "./ai/summarize";
export * from "./ai/rewrite";
export * from "./ai/ideate";
export * from "./ai/translate";

// Storage
export * from "./storage/cache";
export * from "./storage/settings";

// Utils
export * from "./utils/logger";
export * from "./utils/chromeWrapper";
