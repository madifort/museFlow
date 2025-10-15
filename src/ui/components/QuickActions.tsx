import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  action: () => void;
}

interface QuickActionsProps {
  onAction: (action: string, text?: string) => void;
  inputText: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction, inputText }) => {
  const quickActions: QuickAction[] = [
    {
      id: 'extract-keywords',
      label: 'Extract Keywords',
      icon: '🔑',
      description: 'Find key terms',
      action: () => onAction('extract-keywords', inputText)
    },
    {
      id: 'translate',
      label: 'Translate',
      icon: '🌐',
      description: 'Translate text',
      action: () => onAction('translate', inputText)
    },
    {
      id: 'tone-analysis',
      label: 'Tone Analysis',
      icon: '🎭',
      description: 'Analyze sentiment',
      action: () => onAction('tone-analysis', inputText)
    },
    {
      id: 'expand',
      label: 'Expand',
      icon: '📈',
      description: 'Add more detail',
      action: () => onAction('expand', inputText)
    }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>⚡</span>
        <span>Quick Actions</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={!inputText.trim()}
            className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{action.icon}</span>
              <div className="text-left">
                <div className="text-xs font-medium text-gray-900">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
