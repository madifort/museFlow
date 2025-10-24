import React, { useState, useEffect } from "react";
import QuickActions from "../components/QuickActions";
import StatsPanel from "../components/StatsPanel";
import {
  useKeyboardShortcuts,
  createMuseFlowShortcuts,
} from "../hooks/useKeyboardShortcuts";

interface AIResponse {
  operation: string;
  input: string;
  response: string;
  timestamp: number;
}

const Popup: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<
    "summarize" | "rewrite" | "ideate" | "translate"
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

    console.log('[MuseFlow] Popup: Starting process for action:', selectedOperation);
    setIsProcessing(true);
    setOutput("");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      console.log('[MuseFlow] Popup: Sending message to background script');
      // Send message to background script using proper format
      const response = await chrome.runtime.sendMessage({
        action: selectedOperation,
        text: inputText,
        options: {},
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: "popup",
      });

      clearTimeout(timeout);
      console.log('[MuseFlow] Popup: Received response:', response);

      if (!response || !response.success) {
        throw new Error(response?.error || 'No response from MuseFlow backend');
      }

      // Extract the result from the response
      let resultText = '';
      if (typeof response.data === 'string') {
        resultText = response.data;
      } else if (response.data.summary) {
        resultText = response.data.summary;
      } else if (response.data.rewrittenText) {
        resultText = response.data.rewrittenText;
      } else if (response.data.ideas && Array.isArray(response.data.ideas)) {
        resultText = response.data.ideas
          .map((idea: any, index: number) => 
            `${index + 1}. ${idea.title || "Idea"}\n${idea.description || ""}`
          )
          .join("\n\n");
      } else if (response.data.translatedText) {
        resultText = response.data.translatedText;
      } else {
        resultText = JSON.stringify(response.data, null, 2);
      }

      setOutput(resultText);
    } catch (error) {
      console.error('[MuseFlow] Popup Error:', error);
      console.error('[MuseFlow] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'AbortError') {
        setOutput("Request timed out. Please try again.");
      } else if (error.message.includes('Extension context invalidated')) {
        setOutput("Extension context invalidated. Please reload the page and try again.");
      } else {
        setOutput(`Error: ${error.message || 'MuseFlow backend not responding.'}`);
      }
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

  const handleQuickAction = (action: string, text?: string) => {
    // Handle quick actions
    console.log("Quick action:", action, text);
    // For now, just show an alert - in a real implementation, this would call different AI operations
    alert(
      `Quick action "${action}" would be processed here with Chrome AI APIs`,
    );
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
    <div className="w-96 h-[600px] bg-gradient-to-br from-gray-50 to-blue-50 p-4 overflow-y-auto fixed top-0 left-0 z-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">MF</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MuseFlow AI</h1>
            <p className="text-sm text-gray-600">
              Chrome AI Creative Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5 mb-4">
        {/* Input Section */}
        <div className="mb-4">
          <label
            htmlFor="input-text"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Text to process:
          </label>
          <div className="relative">
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200 bg-gray-50/50"
            />
            {inputText.length > 0 && (
              <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                {inputText.length} chars
              </div>
            )}
          </div>
        </div>

        {/* Operation Selection */}
        <div className="mb-4">
          <label
            htmlFor="operation"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Operation:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                value: "summarize",
                label: "Summarize",
                icon: "📝",
                desc: "Brief overview",
              },
              {
                value: "rewrite",
                label: "Rewrite",
                icon: "✏️",
                desc: "Improve text",
              },
              {
                value: "ideate",
                label: "Ideate",
                icon: "💡",
                desc: "Generate ideas",
              },
              {
                value: "translate",
                label: "Translate",
                icon: "🌐",
                desc: "Translate text",
              },
            ].map((op) => (
              <button
                key={op.value}
                onClick={() =>
                  setSelectedOperation(
                    op.value as "summarize" | "rewrite" | "ideate" | "translate",
                  )
                }
                className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                  selectedOperation === op.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-sm mb-1">{op.icon}</div>
                <div className="font-medium">{op.label}</div>
                <div className="text-xs text-gray-500">{op.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleProcessText}
            disabled={isProcessing || !inputText.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Run MuseFlow</span>
              </div>
            )}
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            title="Clear all"
          >
            🗑️
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                AI Response:
              </label>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 min-h-20 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-gray-800 font-sans leading-relaxed">
                {output}
              </pre>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
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
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {inputText && (
        <StatsPanel
          inputText={inputText}
          output={output}
          selectedOperation={selectedOperation}
        />
      )}

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} inputText={inputText} />

      {/* Cached Responses */}
      {cachedResponses.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📚</span>
            <span>Recent Responses</span>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {cachedResponses.length}
            </span>
          </h3>
          <div className="space-y-3">
            {cachedResponses.map((response, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 group"
                onClick={() => handleLoadCachedResponse(response)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-blue-600 capitalize bg-blue-50 px-2 py-1 rounded-full">
                    {response.operation}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(response.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-700 line-clamp-2 group-hover:text-gray-900 transition-colors">
                  {response.input.substring(0, 80)}
                  ...
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  Click to load →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/30">
          <p className="text-xs text-gray-600 font-medium">MuseFlow v1.0.0</p>
          <p className="text-xs text-gray-500">Chrome AI Challenge 2025</p>
          <div className="mt-2 flex justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
