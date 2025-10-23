import React from 'react';
import { PageType } from '../Dashboard';

interface PageLayoutProps {
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
  onNavigate: (page: PageType) => void;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  description,
  color,
  gradient,
  onNavigate,
  children
}) => {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          title="Back to Dashboard"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
          {icon}
        </div>
        
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 transition-colors duration-300">
        {children}
      </div>
    </div>
  );
};
