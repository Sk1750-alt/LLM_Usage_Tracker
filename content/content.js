console.log("TokenMeter Content Script Active");

function detectProvider(hostname) {
  if (hostname.includes("chatgpt.com")) return "chatgpt";
  if (hostname.includes("claude.ai")) return "claude";
  if (hostname.includes("gemini.google.com")) return "gemini";
  return null;
}

// Extract a unique thread ID from the URL path
function getThreadId() {
  const path = window.location.pathname;
  if (path === "/" || path === "/chat" || path === "/app") {
    return "default_session";
  }
  return path;
}

// Clean and extract the thread title from the document title
function getThreadTitle(provider) {
  let title = document.title || "Untitled Chat";
  title = title.replace(/\s*-\s*ChatGPT/i, "")
               .replace(/\s*\|\s*Claude/i, "")
               .replace(/\s*-\s*Gemini/i, "")
               .replace(/Gemini\s*-\s*/i, "");
  return title.trim() || "Untitled Chat";
}

// Scrape DOM to detect active model name on the page
function detectModelOnPage(provider) {
  if (provider === "chatgpt") {
    const btn = document.querySelector('[data-testid="model-selector-button"], [id*="model-selector"], button[class*="model-selector"]');
    if (btn) {
      const text = btn.innerText.toLowerCase();
      if (text.includes("4o-mini") || text.includes("mini")) return "gpt-4o-mini";
      if (text.includes("gpt-4") || text.includes("4o") || text.includes("gpt 4")) return "gpt-4o";
      if (text.includes("turbo")) return "gpt-4-turbo";
    }
  } else if (provider === "claude") {
    const selectors = [
      'div[class*="model-selector"]',
      'button[aria-haspopup="listbox"]',
      'span[class*="model-name"]',
      'div[class*="ModelSelector"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText.toLowerCase();
        if (text.includes("haiku")) return "claude-3-5-haiku";
        if (text.includes("opus")) return "claude-3-opus";
        if (text.includes("sonnet")) return "claude-3-5-sonnet";
      }
    }
  } else if (provider === "gemini") {
    const selectors = [
      'div[class*="model-selector"]',
      'button[class*="model-picker"]',
      'div[class*="model-picker"]',
      'span[class*="picker-button"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText.toLowerCase();
        if (text.includes("advanced") || text.includes("pro")) return "gemini-1-5-pro";
        if (text.includes("flash") || text.includes("gemini")) return "gemini-1-5-flash";
      }
    }
  }
  return null;
}

// ChatGPT: Target specific author role selectors
function getChatGPTMessages() {
  const messages = document.querySelectorAll("[data-message-author-role]");
  let userText = "";
  let assistantText = "";

  messages.forEach((el) => {
    const role = el.getAttribute("data-message-author-role");
    const text = el.innerText || "";
    if (role === "user") {
      userText += " " + text;
    } else if (role === "assistant") {
      assistantText += " " + text;
    }
  });

  return { userText, assistantText };
}

// Claude: Target standard user message testids and claude class identifiers
function getClaudeMessages() {
  let userText = "";
  let assistantText = "";

  const userElements = document.querySelectorAll('[data-testid="user-message"], div[class*="UserMessage"], div[class*="user-message"]');
  userElements.forEach(el => {
    userText += " " + (el.innerText || "");
  });

  const assistantElements = document.querySelectorAll('.font-claude-message, [data-testid="assistant-message"], div[class*="ClaudeMessage"], div[class*="assistant-message"], article');
  assistantElements.forEach(el => {
    assistantText += " " + (el.innerText || "");
  });

  return { userText, assistantText };
}

// Gemini: Target user-query and message-content tags
function getGeminiMessages() {
  let userText = "";
  let assistantText = "";

  const userElements = document.querySelectorAll('user-query, .query-text, div[class*="user-query"]');
  userElements.forEach(el => {
    userText += " " + (el.innerText || "");
  });

  const assistantElements = document.querySelectorAll('message-content, .message-content, div[class*="message-content"], div[class*="reply"]');
  assistantElements.forEach(el => {
    assistantText += " " + (el.innerText || "");
  });

  return { userText, assistantText };
}

function sendUsage() {
  const provider = detectProvider(window.location.hostname);
  if (!provider) return;

  const threadId = getThreadId();
  let data = { userText: "", assistantText: "" };

  if (provider === "chatgpt") {
    data = getChatGPTMessages();
  } else if (provider === "claude") {
    data = getClaudeMessages();
  } else if (provider === "gemini") {
    data = getGeminiMessages();
  }

  // Prevent sending empty text reports
  if (!data.userText.trim() && !data.assistantText.trim()) return;

  const threadTitle = getThreadTitle(provider);
  const detectedModel = detectModelOnPage(provider);

  console.log(`Sending TokenMeter Update [${provider}][${threadId}]`);

  chrome.runtime.sendMessage({
    type: "PAGE_USAGE_UPDATE",
    provider,
    threadId,
    threadTitle,
    detectedModel,
    userText: data.userText,
    assistantText: data.assistantText
  });
}

// Watch for changes in the DOM, debounced to 1.5 seconds to avoid performance overhead
let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    sendUsage();
  }, 1500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Trigger initial count after pages load
setTimeout(sendUsage, 2500);