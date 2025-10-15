import React, { useState, useEffect } from "react";

interface StatsPanelProps {
  inputText: string;
  output: string;
  selectedOperation: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  inputText,
  output,
  selectedOperation,
}) => {
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
    outputWordCount: 0,
    compressionRatio: 0,
  });

  useEffect(() => {
    const words = inputText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const chars = inputText.length;
    const readingTime = Math.ceil(words.length / 200); // Average reading speed: 200 words per minute

    const outputWords = output
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const compressionRatio =
      words.length > 0
        ? Math.round((1 - outputWords.length / words.length) * 100)
        : 0;

    setStats({
      wordCount: words.length,
      charCount: chars,
      readingTime,
      outputWordCount: outputWords.length,
      compressionRatio,
    });
  }, [inputText, output]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>📊</span>
        <span>Statistics</span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">Input</div>
          <div className="text-lg font-bold text-blue-800">
            {stats.wordCount}
          </div>
          <div className="text-xs text-blue-600">words</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 font-medium mb-1">Output</div>
          <div className="text-lg font-bold text-green-800">
            {stats.outputWordCount}
          </div>
          <div className="text-xs text-green-600">words</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium mb-1">
            Reading Time
          </div>
          <div className="text-lg font-bold text-purple-800">
            {stats.readingTime}
          </div>
          <div className="text-xs text-purple-600">minutes</div>
        </div>

        {selectedOperation === "summarize" && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-xs text-orange-600 font-medium mb-1">
              Compression
            </div>
            <div className="text-lg font-bold text-orange-800">
              {stats.compressionRatio}%
            </div>
            <div className="text-xs text-orange-600">reduced</div>
          </div>
        )}

        {selectedOperation === "expand" && (
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-xs text-indigo-600 font-medium mb-1">
              Expansion
            </div>
            <div className="text-lg font-bold text-indigo-800">
              {Math.round((stats.outputWordCount / stats.wordCount - 1) * 100)}%
            </div>
            <div className="text-xs text-indigo-600">increase</div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Operation:</span> {selectedOperation}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
