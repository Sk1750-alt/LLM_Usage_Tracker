function estimateTokens(text) {
  if (!text || text.trim() === "") return 0;
  
  // Heuristic token estimation:
  // Words multiplied by 1.3 is a standard BPE proxy for English text.
  // Characters divided by 4 is a standard fallback character-based proxy.
  // Taking their average yields a balanced estimate for various types of inputs (code, prose, logs).
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  
  const wordEstimate = Math.ceil(words * 1.3);
  const charEstimate = Math.ceil(chars / 4);
  
  return Math.max(1, Math.round((wordEstimate + charEstimate) / 2));
}

function nowISO() {
  return new Date().toISOString();
}

function getEmptyUsage() {
  return {
    chatgpt: { provider: "chatgpt", inputTokens: 0, outputTokens: 0, threads: {}, updatedAt: null },
    claude: { provider: "claude", inputTokens: 0, outputTokens: 0, threads: {}, updatedAt: null },
    gemini: { provider: "gemini", inputTokens: 0, outputTokens: 0, threads: {}, updatedAt: null }
  };
}

function getEmptySettings() {
  return {
    chatgptModel: "gpt-4o-mini",
    claudeModel: "claude-3-5-sonnet",
    geminiModel: "gemini-1-5-flash",
    theme: "midnight"
  };
}

async function getStoredData() {
  const result = await chrome.storage.local.get(["usage", "settings", "history"]);
  return {
    usage: result.usage || getEmptyUsage(),
    settings: result.settings || getEmptySettings(),
    history: result.history || {}
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PAGE_USAGE_UPDATE") {
    (async () => {
      const { usage, settings, history } = await getStoredData();
      const { provider, threadId, threadTitle, detectedModel, userText, assistantText } = message;

      if (!usage[provider]) {
        usage[provider] = {
          provider,
          inputTokens: 0,
          outputTokens: 0,
          threads: {},
          updatedAt: null
        };
      }

      if (!usage[provider].threads) {
        usage[provider].threads = {};
      }

      // Determine the active model (DOM-scraped or user setting fallback)
      const fallbackModel = provider === "chatgpt" ? settings.chatgptModel : (provider === "claude" ? settings.claudeModel : settings.geminiModel);
      const activeModel = detectedModel || fallbackModel;

      // Estimate tokens for current text
      const newInputTokens = estimateTokens(userText || "");
      const newOutputTokens = estimateTokens(assistantText || "");

      // Retrieve previous counts for this thread to calculate the delta
      const oldThread = usage[provider].threads[threadId] || { inputTokens: 0, outputTokens: 0 };
      const oldInput = oldThread.inputTokens || 0;
      const oldOutput = oldThread.outputTokens || 0;

      // Positive deltas only (ignore decreases like deleted chats/edited down queries)
      const deltaInput = Math.max(0, newInputTokens - oldInput);
      const deltaOutput = Math.max(0, newOutputTokens - oldOutput);

      // Save updated thread metrics with title and active model info
      usage[provider].threads[threadId] = {
        title: threadTitle || "Untitled Chat",
        model: activeModel,
        inputTokens: newInputTokens,
        outputTokens: newOutputTokens,
        updatedAt: nowISO()
      };

      // Accumulate deltas to the provider's global totals
      usage[provider].inputTokens += deltaInput;
      usage[provider].outputTokens += deltaOutput;
      usage[provider].updatedAt = nowISO();

      // Accumulate deltas to today's date in history
      const todayStr = new Date().toISOString().split("T")[0];
      if (!history[todayStr]) {
        history[todayStr] = { input: 0, output: 0 };
      }
      history[todayStr].input += deltaInput;
      history[todayStr].output += deltaOutput;

      // Persist the database
      await chrome.storage.local.set({ usage, history });
      
      sendResponse({ ok: true, usage: usage[provider] });
    })();

    return true;
  }

  if (message?.type === "GET_USAGE") {
    (async () => {
      const data = await getStoredData();
      sendResponse({ ok: true, ...data });
    })();
    return true;
  }

  if (message?.type === "SAVE_SETTINGS") {
    (async () => {
      await chrome.storage.local.set({ settings: message.settings });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message?.type === "RESET_USAGE") {
    (async () => {
      const emptyUsage = getEmptyUsage();
      const emptySettings = getEmptySettings();
      await chrome.storage.local.set({ 
        usage: emptyUsage, 
        history: {}, 
        settings: emptySettings 
      });
      sendResponse({ ok: true });
    })();
    return true;
  }
});