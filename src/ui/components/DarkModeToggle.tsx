import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

export const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' 
          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
      }}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Track */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 opacity-20" />
      
      {/* Toggle Button */}
      <div
        className={`relative w-5 h-5 rounded-full shadow-lg transition-all duration-300 ease-in-out transform ${
          isDarkMode ? 'translate-x-3' : '-translate-x-3'
        }`}
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
        }}
      >
        {/* Icon inside toggle button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isDarkMode ? (
            <svg className="w-3 h-3 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  );
};
