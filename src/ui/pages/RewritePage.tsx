import React, { useState } from 'react';
import { PageType } from '../Dashboard';
import { PageLayout } from '../components/PageLayout';
import StatsPanel from '../components/StatsPanel';
import { useKeyboardShortcuts, createMuseFlowShortcuts } from '../hooks/useKeyboardShortcuts';

interface RewritePageProps {
  onNavigate: (page: PageType) => void;
}

export const RewritePage: React.FC<RewritePageProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState('');
  const [rewriteStyle, setRewriteStyle] = useState<'professional' | 'casual' | 'creative'>('professional');
  const [targetAudience, setTargetAudience] = useState('general');

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to rewrite');
      return;
    }

    setIsProcessing(true);
    setOutput('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT',
        data: {
          text: inputText,
          operation: 'rewrite',
          options: { rewriteStyle, targetAudience }
        },
      });

      if (response && response.response) {
        setOutput(response.response);
      } else {
        setOutput('Rewrite completed! This is a mock response in the MVP version.');
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
      title="Rewrite"
      icon="✏️"
      description="Improve clarity, flow, and engagement of your content"
      color="purple"
      gradient="from-purple-500 to-purple-600"
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {/* Style and Audience Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rewrite Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
              Writing Style:
            </label>
            <div className="space-y-2">
              {[
                { value: 'professional', label: 'Professional', desc: 'Formal, business-like', icon: '👔' },
                { value: 'casual', label: 'Casual', desc: 'Friendly, conversational', icon: '😊' },
                { value: 'creative', label: 'Creative', desc: 'Engaging, imaginative', icon: '🎨' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setRewriteStyle(style.value as any)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    rewriteStyle === style.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-gray-500">{style.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
              Target Audience:
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50 dark:bg-white dark:text-black"
            >
              <option value="general">General Audience</option>
              <option value="technical">Technical Professionals</option>
              <option value="students">Students</option>
              <option value="executives">Business Executives</option>
              <option value="creatives">Creative Professionals</option>
            </select>
          </div>
        </div>

        {/* Input Section */}
        <div>
          <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Text to rewrite:
          </label>
          <div className="relative">
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-32 p-4 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all duration-200 bg-gray-50/50 dark:bg-white dark:text-black"
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
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Rewriting...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>✏️</span>
                <span>Rewrite Text</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleClearAll}
            className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
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
                Rewritten Text:
              </label>
              <button
                onClick={handleCopyOutput}
                className="text-xs text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 min-h-24 max-h-48 overflow-y-auto">
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
            selectedOperation="rewrite"
          />
        )}
      </div>
    </PageLayout>
  );
};
