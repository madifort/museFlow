// Content script for capturing user-selected text and context
interface TriggerActionMessage {
  type: "TRIGGER_ACTION";
  action: "summarize" | "rewrite" | "ideate" | "translate";
  text: string;
  source: string;
}

interface AIResponseMessage {
  type: "AI_RESPONSE";
  success: boolean;
  data?: any;
  error?: string;
  action: string;
}

// Listen for text selection events
document.addEventListener("mouseup", async (event) => {
  const selectedText = window.getSelection()?.toString().trim();

  if (selectedText && selectedText.length > 10) {
    // Show action buttons for the selected text
    showActionButtons(selectedText, event);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener(
  (message: TriggerActionMessage | AIResponseMessage, sender, sendResponse) => {
    if (message.type === "TRIGGER_ACTION") {
      handleTriggerAction(message);
    } else if (message.type === "AI_RESPONSE") {
      handleAIResponse(message);
    }

    return true; // Keep message channel open for async response
  },
);

async function handleTriggerAction(message: TriggerActionMessage) {
  try {
    // Send request to background script
    const response = await chrome.runtime.sendMessage({
      action: message.action,
      text: message.text,
      options: {},
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "content",
    });

    if (response.success) {
      showAIOverlay(response.data, message.action);
    } else {
      showErrorOverlay(response.error || "Unknown error occurred");
    }
  } catch (error) {
    console.error("MuseFlow: Error processing action:", error);
    showErrorOverlay("Failed to process request");
  }
}

function handleAIResponse(message: AIResponseMessage) {
  if (message.success) {
    showAIOverlay(message.data, message.action);
  } else {
    showErrorOverlay(message.error || "Unknown error occurred");
  }
}

function showActionButtons(selectedText: string, event: MouseEvent) {
  // Remove any existing buttons
  const existingButtons = document.querySelectorAll(".museflow-buttons");
  existingButtons.forEach((btn) => btn.remove());

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "museflow-buttons";
  buttonContainer.style.cssText = `
    position: fixed;
    top: ${event.clientY - 10}px;
    left: ${event.clientX}px;
    background: #1f2937;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    gap: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const actions = [
    { id: "summarize", label: "Summarize", icon: "📝" },
    { id: "rewrite", label: "Rewrite", icon: "✏️" },
    { id: "ideate", label: "Ideate", icon: "💡" },
    { id: "translate", label: "Translate", icon: "🌐" },
  ];

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = `${action.icon} ${action.label}`;
    button.style.cssText = `
      background: #374151;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.background = "#4b5563";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "#374151";
    });

    button.addEventListener("click", async () => {
      buttonContainer.remove();
      await handleTriggerAction({
        type: "TRIGGER_ACTION",
        action: action.id as any,
        text: selectedText,
        source: "content",
      });
    });

    buttonContainer.appendChild(button);
  });

  document.body.appendChild(buttonContainer);

  // Remove buttons when clicking elsewhere
  const removeButtons = (e: Event) => {
    if (!buttonContainer.contains(e.target as Node)) {
      buttonContainer.remove();
      document.removeEventListener("click", removeButtons);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", removeButtons);
  }, 100);
}

function showAIOverlay(data: any, action: string) {
  // Create a temporary overlay to show AI response
  const overlay = document.createElement("div");
  overlay.className = "museflow-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1f2937;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    max-height: 500px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    overflow-y: auto;
  `;

  let content = "";
  if (typeof data === "string") {
    content = data;
  } else if (data.summary) {
    content = data.summary;
  } else if (data.rewrittenText) {
    content = data.rewrittenText;
  } else if (data.ideas && Array.isArray(data.ideas)) {
    content = data.ideas
      .map(
        (idea: any, index: number) =>
          `${index + 1}. ${idea.title || "Idea"}\n${idea.description || ""}`,
      )
      .join("\n\n");
  } else if (data.translatedText) {
    content = data.translatedText;
  } else {
    content = JSON.stringify(data, null, 2);
  }

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #60a5fa;">MuseFlow ${action.charAt(0).toUpperCase() + action.slice(1)}</strong>
      <button id="close-overlay" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto;">${content}</div>
  `;

  document.body.appendChild(overlay);

  // Close overlay when clicking X
  overlay.querySelector("#close-overlay")?.addEventListener("click", () => {
    overlay.remove();
  });

  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 15000);
}

function showErrorOverlay(error: string) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #fca5a5;">MuseFlow Error</strong>
      <button id="close-overlay" style="background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div>${error}</div>
  `;

  document.body.appendChild(overlay);

  // Close overlay when clicking X
  overlay.querySelector("#close-overlay")?.addEventListener("click", () => {
    overlay.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 5000);
}
