import React, { useState, useEffect } from "react";

interface AIResponse {
  operation: string;
  input: string;
  response: string;
  timestamp: number;
}

const Sidebar: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<
    "summarize" | "rewrite" | "ideate"
  >("summarize");
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState("");
  const [cachedResponses, setCachedResponses] = useState<AIResponse[]>([]);

  // Load cached responses on component mount
  useEffect(() => {
    loadCachedResponses();
  }, []);

  const loadCachedResponses = async () => {
    try {
      const result = await chrome.storage.local.get();
      const responses = Object.entries(result)
        .filter(([key]) => key.startsWith("ai_cache_"))
        .map(([, value]) => value as AIResponse)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);

      setCachedResponses(responses);
    } catch (error) {
      console.error("Error loading cached responses:", error);
    }
  };

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text to process");
      return;
    }

    setIsProcessing(true);
    setOutput("");

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: "PROCESS_TEXT",
        data: {
          text: inputText,
          operation: selectedOperation,
        },
      });

      if (response && response.response) {
        setOutput(response.response);
      } else {
        setOutput(
          "Processing completed, but no response received. This is expected in the MVP version.",
        );
      }
    } catch (error) {
      console.error("Error processing text:", error);
      setOutput("Error processing text. Please try again.");
    } finally {
      setIsProcessing(false);
      // Reload cached responses to show the new one
      setTimeout(loadCachedResponses, 1000);
    }
  };

  const handleClearAll = () => {
    setInputText("");
    setOutput("");
  };

  const handleLoadCachedResponse = (response: AIResponse) => {
    setInputText(response.input);
    setOutput(response.response);
    setSelectedOperation(
      response.operation as "summarize" | "rewrite" | "ideate",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">MF</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                MuseFlow AI
              </h1>
              <p className="text-lg text-gray-600">
                Your Chrome AI companion for creative content processing
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          {/* Input Section */}
          <div className="mb-8">
            <label
              htmlFor="input-text"
              className="block text-lg font-medium text-gray-700 mb-3"
            >
              Enter text to process:
            </label>
            <div className="relative">
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your content here..."
                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200 bg-gray-50/50 text-gray-800"
              />
              {inputText.length > 0 && (
                <div className="absolute top-3 right-3 text-sm text-gray-400 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                  {inputText.length} characters
                </div>
              )}
            </div>
          </div>

          {/* Operation Selection */}
          <div className="mb-8">
            <label
              htmlFor="operation"
              className="block text-lg font-medium text-gray-700 mb-4"
            >
              Choose operation:
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  value: "summarize",
                  label: "Summarize",
                  icon: "📝",
                  desc: "Create a brief overview",
                  color: "blue",
                },
                {
                  value: "rewrite",
                  label: "Rewrite",
                  icon: "✏️",
                  desc: "Improve and enhance text",
                  color: "green",
                },
                {
                  value: "ideate",
                  label: "Ideate",
                  icon: "💡",
                  desc: "Generate creative ideas",
                  color: "purple",
                },
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() =>
                    setSelectedOperation(
                      op.value as "summarize" | "rewrite" | "ideate",
                    )
                  }
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedOperation === op.value
                      ? `border-${op.color}-500 bg-${op.color}-50 text-${op.color}-700 shadow-lg`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl mb-2">{op.icon}</div>
                  <div className="font-semibold text-base mb-1">{op.label}</div>
                  <div className="text-sm text-gray-600">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleProcessText}
              disabled={isProcessing || !inputText.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5"
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
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>🚀</span>
                  <span>Run MuseFlow</span>
                </div>
              )}
            </button>
            <button
              onClick={handleClearAll}
              className="px-6 py-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Clear all content"
            >
              <div className="flex items-center gap-2">
                <span>🗑️</span>
                <span>Clear</span>
              </div>
            </button>
          </div>

          {/* Output Section */}
          {output && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-medium text-gray-700">
                  AI Response:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setOutput("")}
                    className="text-sm text-gray-600 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg"
                    title="Clear response"
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 min-h-40 shadow-inner">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {output}
                </pre>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                Processing with AI...
              </div>
            </div>
          )}
        </div>

        {/* Cached Responses */}
        {cachedResponses.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📚 Recent Responses
            </h3>
            <div className="space-y-3">
              {cachedResponses.map((response, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleLoadCachedResponse(response)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-600 capitalize">
                      {response.operation}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {response.input.substring(0, 100)}
                    ...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>MuseFlow v1.0.0 - Chrome AI Creative Assistant</p>
          <p className="mt-1">
            Built for Google Chrome Built-in AI Challenge 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
