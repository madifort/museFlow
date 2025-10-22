import React, { useState } from 'react';
import { DashboardView } from './DashboardView';
import { SummarizePage } from './pages/SummarizePage';
import { RewritePage } from './pages/RewritePage';
import { TranslatePage } from './pages/TranslatePage';
import { IdeatePage } from './pages/IdeatePage';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { DarkModeToggle } from './components/DarkModeToggle';

export type PageType = 'dashboard' | 'summarize' | 'rewrite' | 'translate' | 'ideate';

export interface NavigationItem {
  id: PageType;
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '🏠',
    description: 'Overview & Quick Access',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'summarize',
    title: 'Summarize',
    icon: '📝',
    description: 'Brief overview & key points',
    color: 'green',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'rewrite',
    title: 'Rewrite',
    icon: '✏️',
    description: 'Improve clarity & engagement',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'translate',
    title: 'Translate',
    icon: '🌐',
    description: 'Language translation',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'ideate',
    title: 'Ideate',
    icon: '💡',
    description: 'Generate creative ideas',
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600'
  }
];

const DashboardContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentPage} />;
      case 'summarize':
        return <SummarizePage onNavigate={setCurrentPage} />;
      case 'rewrite':
        return <RewritePage onNavigate={setCurrentPage} />;
      case 'translate':
        return <TranslatePage onNavigate={setCurrentPage} />;
      case 'ideate':
        return <IdeatePage onNavigate={setCurrentPage} />;
      default:
        return <DashboardView onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">MF</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">MuseFlow AI</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Chrome AI Assistant</p>
              </div>
            </div>
            
            {/* Dark Mode Toggle and Status Indicators */}
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20">
        <div className="flex overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-all duration-200 ${
                currentPage === item.id
                  ? `text-${item.color}-700 dark:text-${item.color}-300 bg-${item.color}-50 dark:bg-${item.color}-900/20 border-b-2 border-${item.color}-500`
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto h-[calc(100%-120px)]">
        <div className="p-4">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <DarkModeProvider>
      <DashboardContent />
    </DarkModeProvider>
  );
};

export default Dashboard;
