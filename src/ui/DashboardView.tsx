import React from "react";
import { PageType } from "./Dashboard";

interface DashboardViewProps {
  onNavigate: (page: PageType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const quickActions = [
    {
      id: "summarize" as PageType,
      title: "Quick Summarize",
      icon: "📝",
      description: "Summarize selected text instantly",
      color: "green",
      gradient: "from-green-500 to-green-600",
      shortcut: "Ctrl+S",
    },
    {
      id: "rewrite" as PageType,
      title: "Smart Rewrite",
      icon: "✏️",
      description: "Improve text clarity and flow",
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      shortcut: "Ctrl+R",
    },
    {
      id: "translate" as PageType,
      title: "Instant Translate",
      icon: "🌐",
      description: "Translate to any language",
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      shortcut: "Ctrl+T",
    },
    {
      id: "ideate" as PageType,
      title: "Creative Ideate",
      icon: "💡",
      description: "Generate innovative ideas",
      color: "pink",
      gradient: "from-pink-500 to-pink-600",
      shortcut: "Ctrl+I",
    },
  ];

  const recentActivity = [
    {
      type: "summarize",
      text: "Chrome Extension Development Best Practices...",
      timestamp: "2 minutes ago",
      icon: "📝",
      color: "green",
    },
    {
      type: "rewrite",
      text: "User Interface Design Principles...",
      timestamp: "5 minutes ago",
      icon: "✏️",
      color: "purple",
    },
    {
      type: "translate",
      text: "Machine Learning Algorithms...",
      timestamp: "12 minutes ago",
      icon: "🌐",
      color: "orange",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">✨</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Welcome to MuseFlow AI! 🚀
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select text on any webpage and right-click to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>Quick Actions</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 dark:border-gray-700/20 p-4 hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg mb-2 group-hover:scale-110 transition-transform duration-200`}
                >
                  {action.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {action.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {action.shortcut}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>🕒</span>
          <span>Recent Activity</span>
        </h3>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 dark:border-gray-700/20 p-4 transition-colors duration-300">
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => onNavigate(activity.type as PageType)}
              >
                <div
                  className={`w-6 h-6 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/20 flex items-center justify-center`}
                >
                  <span className="text-xs">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {activity.text}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/20 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Quick Tips</span>
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Right-click selected text for instant processing</li>
          <li>• Use Ctrl+Enter to process text quickly</li>
          <li>• Try different operations for varied results</li>
        </ul>
      </div>
    </div>
  );
};
