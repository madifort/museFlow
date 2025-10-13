import React, { useState, useEffect } from 'react';

interface AIResponse {
  operation: string;
  input: string;
  response: string;
  timestamp: number;
}

const Sidebar: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<'summarize' | 'rewrite' | 'ideate'>('summarize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState('');
  const [cachedResponses, setCachedResponses] = useState<AIResponse[]>([]);

  // Load cached responses on component mount
  useEffect(() => {
    loadCachedResponses();
  }, []);

  const loadCachedResponses = async () => {
    try {
      const result = await chrome.storage.local.get();
      const responses = Object.entries(result)
        .filter(([key]) => key.startsWith('ai_cache_'))
        .map(([, value]) => value as AIResponse)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
      
      setCachedResponses(responses);
    } catch (error) {
      console.error('Error loading cached responses:', error);
    }
  };

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to process');
      return;
    }

    setIsProcessing(true);
    setOutput('');

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT',
        data: {
          text: inputText,
          operation: selectedOperation
        }
      });

      if (response && response.response) {
        setOutput(response.response);
      } else {
        setOutput('Processing completed, but no response received. This is expected in the MVP version.');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      setOutput('Error processing text. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reload cached responses to show the new one
      setTimeout(loadCachedResponses, 1000);
    }
  };

  const handleClearAll = () => {
    setInputText('');
    setOutput('');
  };

  const handleLoadCachedResponse = (response: AIResponse) => {
    setInputText(response.input);
    setOutput(response.response);
    setSelectedOperation(response.operation as 'summarize' | 'rewrite' | 'ideate');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MuseFlow AI Assistant
          </h1>
          <p className="text-gray-600">
            Your Chrome AI companion for summarizing, rewriting, and ideating content
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Input Section */}
          <div className="mb-6">
            <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-2">
              Enter text to process:
            </label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Operation Selection */}
          <div className="mb-6">
            <label htmlFor="operation" className="block text-sm font-medium text-gray-700 mb-2">
              Choose operation:
            </label>
            <select
              id="operation"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value as 'summarize' | 'rewrite' | 'ideate')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summarize">📝 Summarize</option>
              <option value="rewrite">✏️ Rewrite</option>
              <option value="ideate">💡 Ideate</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleProcessText}
              disabled={isProcessing || !inputText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '🔄 Processing...' : '🚀 Run MuseFlow'}
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🗑️ Clear
            </button>
          </div>

          {/* Output Section */}
          {output && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Response:
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 min-h-32">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {output}
                </pre>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                    {response.input.substring(0, 100)}...
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
