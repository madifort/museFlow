// Content script for capturing user-selected text and context
interface ContextData {
  type: "CONTEXT_CAPTURED";
  data: {
    selectedText: string;
    title: string;
    url: string;
    snippet: string;
    timestamp: number;
  };
}

// Listen for text selection events
document.addEventListener("mouseup", async (event) => {
  const selectedText = window.getSelection()?.toString().trim();

  if (selectedText && selectedText.length > 10) {
    const contextData: ContextData = {
      type: "CONTEXT_CAPTURED",
      data: {
        selectedText,
        title: document.title,
        url: window.location.href,
        snippet:
          selectedText.substring(0, 200) +
          (selectedText.length > 200 ? "..." : ""),
        timestamp: Date.now(),
      },
    };

    // Send message to background script
    try {
      await chrome.runtime.sendMessage(contextData);
      console.log("MuseFlow: Context captured and sent to background");
    } catch (error) {
      console.error("MuseFlow: Error sending context to background:", error);
    }
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AI_RESPONSE") {
    // Handle AI response - could show a notification or update UI
    console.log("MuseFlow: AI response received:", message.response);

    // You could inject a temporary overlay to show the response
    showAIOverlay(message.response);
  }

  return true; // Keep message channel open for async response
});

function showAIOverlay(response: string) {
  // Create a temporary overlay to show AI response
  const overlay = document.createElement("div");
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
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #60a5fa;">MuseFlow AI</strong>
      <button id="close-overlay" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div style="max-height: 200px; overflow-y: auto;">${response}</div>
  `;

  document.body.appendChild(overlay);

  // Close overlay when clicking X
  overlay.querySelector("#close-overlay")?.addEventListener("click", () => {
    overlay.remove();
  });

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 10000);
}
