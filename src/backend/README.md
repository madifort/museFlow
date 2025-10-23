# MuseFlow Backend Architecture

This directory contains the complete backend architecture for MuseFlow, a Chrome extension built for the Google Chrome Built-in AI Challenge.

## 🏗️ Architecture Overview

The backend is organized into modular components that handle different aspects of the AI processing pipeline:

```
src/backend/
├── ai/                    # AI action handlers
│   ├── summarize.ts      # Text summarization
│   ├── rewrite.ts        # Text rewriting
│   ├── ideate.ts         # Creative ideation
│   └── translate.ts      # Text translation
├── core/                 # Core functionality
│   ├── config.ts         # Configuration management
│   ├── promptBuilder.ts  # Prompt orchestration
│   └── messageRouter.ts  # Chrome runtime messaging
├── storage/              # Data persistence
│   ├── cache.ts          # Response caching
│   └── settings.ts       # User settings
├── utils/                # Utility functions
│   ├── logger.ts         # Structured logging
│   └── chromeWrapper.ts  # Chrome API abstraction
└── index.ts              # Main entry point
```

## 🚀 Core Features

### AI Actions
- **Summarize**: Generate concise summaries with configurable length
- **Rewrite**: Improve text clarity and style with tone options
- **Ideate**: Generate creative ideas and suggestions
- **Translate**: Translate text between languages with quality preservation

### Storage System
- **Caching**: Intelligent response caching with TTL and cleanup
- **Settings**: User preferences and configuration management
- **Chrome Storage**: Integration with Chrome's storage APIs

### Chrome Integration
- **Manifest V3**: Full compatibility with Chrome extension APIs
- **Message Routing**: Efficient communication between components
- **Context Menus**: Right-click integration for AI actions
- **Background Processing**: Service worker integration

## 🔧 Configuration

The backend supports multiple AI providers with fallback mechanisms:

1. **Chrome AI** (preferred) - Uses Chrome's built-in AI APIs
2. **OpenAI** (fallback) - GPT models via API
3. **Gemini** (fallback) - Google's Gemini models

Configuration is managed through `src/backend/core/config.ts` and can be customized via user settings.

## 📡 API Usage

### From Content Scripts
```typescript
// Send AI action request
const response = await chrome.runtime.sendMessage({
  action: 'summarize',
  text: 'Your text here',
  options: { summaryLength: 'short' }
});

if (response.success) {
  console.log('Summary:', response.data.summary);
}
```

### From Popup/Options
```typescript
// Request user settings
const settings = await chrome.runtime.sendMessage({
  action: 'getSettings'
});

// Update settings
await chrome.runtime.sendMessage({
  action: 'updateSettings',
  options: {
    user: { defaultTone: 'casual' }
  }
});
```

## 🧪 Testing

The backend includes comprehensive test coverage:

```bash
npm run test
```

Tests are organized in `tests/backend/` and cover:
- AI action handlers
- Message routing
- Cache management
- Settings persistence
- Error handling

## 🔒 Security

- API keys are stored securely in Chrome storage
- No plaintext credentials in code
- Input validation and sanitization
- Rate limiting and request throttling

## 📊 Performance

- Intelligent caching reduces API calls
- Parallel processing where possible
- Memory-efficient storage management
- Background processing for non-blocking operations

## 🚀 Deployment

The backend is automatically built and bundled with the extension:

```bash
npm run build
```

All backend code is compiled and optimized for the Chrome extension environment.

## 🔄 Integration Points

### Frontend Integration
- **Content Scripts**: `src/content/extractor.ts`
- **Popup UI**: `src/ui/overlay/Popup.tsx`
- **Options Page**: `src/ui/sidebar/Sidebar.tsx`

### Service Worker
- **Background Processing**: `src/background/serviceWorker.ts`
- **Message Handling**: Automatic routing and processing
- **Context Menus**: Right-click AI actions

## 📈 Monitoring

The backend includes comprehensive logging and monitoring:

- Structured logging with different levels
- Performance metrics tracking
- Error reporting and handling
- Cache statistics and hit rates

## 🔧 Development

### Adding New AI Actions
1. Create handler in `src/backend/ai/`
2. Add prompt template in `src/backend/core/promptBuilder.ts`
3. Register in `src/backend/core/messageRouter.ts`
4. Add tests in `tests/backend/ai/`

### Extending Storage
1. Add new storage module in `src/backend/storage/`
2. Export from `src/backend/index.ts`
3. Add configuration options in `src/backend/core/config.ts`

## 📝 License

This backend is part of MuseFlow, built for the Google Chrome Built-in AI Challenge.
