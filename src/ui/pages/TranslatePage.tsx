import React, { useState } from "react";
import { PageType } from "../Dashboard";
import { PageLayout } from "../components/PageLayout";
import StatsPanel from "../components/StatsPanel";
import {
  useKeyboardShortcuts,
  createMuseFlowShortcuts,
} from "../hooks/useKeyboardShortcuts";

interface TranslatePageProps {
  onNavigate: (page: PageType) => void;
}

export const TranslatePage: React.FC<TranslatePageProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translationMode, setTranslationMode] = useState<
    "standard" | "formal" | "casual"
  >("standard");

  const languages = [
    { code: "auto", name: "Auto-detect", flag: "🌍" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
  ];

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text to translate");
      return;
    }

    setIsProcessing(true);
    setOutput("");

    try {
      const response = await chrome.runtime.sendMessage({
        type: "PROCESS_TEXT",
        data: {
          text: inputText,
          operation: "translate",
          options: { sourceLanguage, targetLanguage, translationMode },
        },
      });

      if (response && response.response) {
        setOutput(response.response);
      } else {
        setOutput(
          "Translation completed! This is a mock response in the MVP version.",
        );
      }
    } catch (error) {
      console.error("Error processing text:", error);
      setOutput("Error processing text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setInputText("");
    setOutput("");
  };

  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  // Keyboard shortcuts
  const shortcuts = createMuseFlowShortcuts({
    onProcess: handleProcessText,
    onClear: handleClearAll,
    onCopy: output ? handleCopyOutput : undefined,
  });

  useKeyboardShortcuts({ shortcuts });

  return (
    <PageLayout
      title="Translate"
      icon="🌐"
      description="Translate text between different languages with context awareness"
      color="orange"
      gradient="from-orange-500 to-orange-600"
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Source Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
              From:
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50/50 dark:bg-white dark:text-black"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Translation Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
              Translation Style:
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "standard",
                  label: "Standard",
                  desc: "Balanced",
                  icon: "⚖️",
                },
                {
                  value: "formal",
                  label: "Formal",
                  desc: "Professional",
                  icon: "👔",
                },
                {
                  value: "casual",
                  label: "Casual",
                  desc: "Conversational",
                  icon: "😊",
                },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setTranslationMode(mode.value as any)}
                  className={`w-full p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                    translationMode === mode.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm mb-1">{mode.icon}</div>
                  <div className="text-xs font-medium">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
              To:
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50/50 dark:bg-white dark:text-black"
            >
              {languages
                .filter((lang) => lang.code !== "auto")
                .map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Language Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (sourceLanguage !== "auto") {
                const temp = sourceLanguage;
                setSourceLanguage(targetLanguage);
                setTargetLanguage(temp);
              }
            }}
            className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
            title="Swap languages"
          >
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
        </div>

        {/* Input Section */}
        <div>
          <label
            htmlFor="input-text"
            className="block text-sm font-medium text-gray-700 dark:text-white mb-2"
          >
            Text to translate:
          </label>
          <div className="relative">
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-32 p-4 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all duration-200 bg-gray-50/50 dark:bg-white dark:text-black"
            />
            {inputText.length > 0 && (
              <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                {inputText.length} chars
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleProcessText}
            disabled={isProcessing || !inputText.trim()}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-6 rounded-lg text-sm font-medium hover:from-orange-700 hover:to-orange-800 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Translating...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🌐</span>
                <span>Translate Text</span>
              </div>
            )}
          </button>

          <button
            onClick={handleClearAll}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
            title="Clear all"
          >
            🗑️
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-white">
                Translation:
              </label>
              <button
                onClick={handleCopyOutput}
                className="text-xs text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 min-h-24 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                {output}
              </pre>
            </div>
          </div>
        )}

        {/* Stats Panel */}
        {inputText && (
          <StatsPanel
            inputText={inputText}
            output={output}
            selectedOperation="translate"
          />
        )}
      </div>
    </PageLayout>
  );
};
