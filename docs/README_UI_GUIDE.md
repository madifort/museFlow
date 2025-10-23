# 🎨 MuseFlow Frontend Developer Guide

## 1. Overview
MuseFlow is a Chrome AI-powered contextual assistant that performs **Summarization**, **Rewriting**, **Ideation**, and **Translation**.  
Your goal: implement a smooth, modern, and intuitive UI/UX that connects with the backend seamlessly.

---

## 2. Design System
MuseFlow uses a DesignToken system located in `src/ui/theme/DesignToken.tsx`.

🟢 **You can modify or replace these tokens** with your preferred design system or Figma variables.

| Token | Light | Dark | Usage |
|--------|--------|-------|--------|
| Primary | `#0078FF` | `#409CFF` | Buttons, accents |
| Background | `#FFFFFF` | `#0D1117` | Surfaces |
| Text Primary | `#111827` | `#F5F5F5` | Main text |

---

## 3. Core UI Areas
**Popup Overlay:** Appears on text highlight → offers 4 AI actions.  
**Sidebar:** Persistent interface showing history, settings.  
**Dashboard:** Options page for API keys, logs, theme.

Structure:
```
src/ui/
├── overlay/PopupContainer.tsx
├── sidebar/SidebarContainer.tsx
├── components/
├── hooks/useKeyboardShortcuts.ts
├── theme/DesignToken.tsx
└── DashboardView.tsx
```

---

## 4. Messaging Schema
Frontend communicates with the backend via:
```ts
chrome.runtime.sendMessage({
  action: "summarize" | "rewrite" | "ideate" | "translate",
  text: "...",
  options: { summaryLength, tone, targetLanguage }
});
```

Response:
```json
{ 
  "success": true, 
  "output": "string", 
  "provider": "chrome.ai", 
  "latencyMs": 1280 
}
```

## 5. Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl + Shift + M | Toggle sidebar |
| Ctrl + Alt + S | Summarize selection |
| ESC | Dismiss popup |

## 6. Milestones
| Week | Task |
|------|------|
| 1 | Replicate popup + sidebar skeleton |
| 2 | Implement messaging + storage |
| 3 | Polish animations + accessibility |
| 4 | QA + Integration testing |

## 7. Best Practices
✅ Reactive UI with hooks  
✅ Responsive (320–1440px)  
✅ Light/Dark parity  
✅ Chrome MV3 compliant  
✅ Simple, minimal, elegant  

Welcome to the MuseFlow team!
