import React, { useState, useEffect } from 'react';
import { PageType } from '../Dashboard';
import { PageLayout } from '../components/PageLayout';
import StatsPanel from '../components/StatsPanel';
import { useKeyboardShortcuts, createMuseFlowShortcuts } from '../hooks/useKeyboardShortcuts';

interface SummarizePageProps {
  onNavigate: (page: PageType) => void;
}

export const SummarizePage: React.FC<SummarizePageProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState('');
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'bullet'>('brief');

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to summarize');
      return;
    }

    setIsProcessing(true);
    setOutput('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT',
        data: {
          text: inputText,
          operation: 'summarize',
          options: { summaryType }
        },
      });

      if (response && response.response) {
        setOutput(response.response);
      } else {
        setOutput('Summary completed! This is a mock response in the MVP version.');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      setOutput('Error processing text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setInputText('');
    setOutput('');
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
      title="Summarize"
      icon="📝"
      description="Create clear, concise summaries of your content"
      color="green"
      gradient="from-green-500 to-green-600"
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Summary Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
            Summary Type:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'brief', label: 'Brief', desc: '2-3 sentences', icon: '⚡' },
              { value: 'detailed', label: 'Detailed', desc: 'Comprehensive', icon: '📋' },
              { value: 'bullet', label: 'Bullet Points', desc: 'Key points', icon: '•' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setSummaryType(type.value as any)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  summaryType === type.value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div>
          <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Text to summarize:
          </label>
          <div className="relative">
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-32 p-4 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none transition-all duration-200 bg-gray-50/50 dark:bg-white dark:text-black"
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
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Summarizing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>📝</span>
                <span>Create Summary</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleClearAll}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
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
                Summary:
              </label>
              <button
                onClick={handleCopyOutput}
                className="text-xs text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 min-h-24 max-h-48 overflow-y-auto">
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
            selectedOperation="summarize"
          />
        )}
      </div>
    </PageLayout>
  );
};
