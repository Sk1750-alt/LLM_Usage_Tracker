// Tab Navigation
const tabButtons = document.querySelectorAll('.tab-btn');
const tabViews = document.querySelectorAll('.tab-view');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    tabViews.forEach(view => {
      view.classList.remove('active');
      if (view.id === tabName) {
        view.classList.add('active');
      }
    });

    if (tabName === 'history') {
      loadHistory();
    }
  });
});

// Model Pricing (Rates per 1 Million Tokens in USD)
const pricingTable = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku': { input: 0.80, output: 4.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'gemini-1-5-flash': { input: 0.075, output: 0.30 },
  'gemini-1-5-pro': { input: 1.25, output: 5.00 }
};

let currentSettings = {
  chatgptModel: 'gpt-4o-mini',
  claudeModel: 'claude-3-5-sonnet',
  geminiModel: 'gemini-1-5-flash',
  theme: 'midnight'
};

let allThreads = [];

function providerTitle(key) {
  if (key === 'chatgpt') return 'ChatGPT';
  if (key === 'claude') return 'Claude';
  if (key === 'gemini') return 'Gemini';
  return key;
}

function getModelForProvider(provider) {
  if (provider === 'chatgpt') return currentSettings.chatgptModel;
  if (provider === 'claude') return currentSettings.claudeModel;
  if (provider === 'gemini') return currentSettings.geminiModel;
  return null;
}

function calculateCost(provider, inputTokens, outputTokens, threadModel) {
  const model = threadModel || getModelForProvider(provider);
  const rate = pricingTable[model];
  if (!rate) return 0;
  
  const inputCost = (inputTokens / 1000000) * rate.input;
  const outputCost = (outputTokens / 1000000) * rate.output;
  return inputCost + outputCost;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function renderCards(usage) {
  const container = document.getElementById('providerCards');
  container.innerHTML = '';
  
  let totalInput = 0;
  let totalOutput = 0;
  let totalSpend = 0;
  allThreads = [];

  Object.keys(usage).forEach(key => {
    const item = usage[key];
    
    // Accumulate all threads for thread explorer
    if (item.threads) {
      Object.keys(item.threads).forEach(threadId => {
        const threadData = item.threads[threadId];
        allThreads.push({
          id: threadId,
          provider: key,
          title: threadData.title || 'Untitled Chat',
          model: threadData.model || getModelForProvider(key),
          inputTokens: threadData.inputTokens || 0,
          outputTokens: threadData.outputTokens || 0,
          updatedAt: threadData.updatedAt ? new Date(threadData.updatedAt) : new Date(0)
        });
      });
    }

    const cost = calculateCost(key, item.inputTokens, item.outputTokens);
    totalInput += item.inputTokens;
    totalOutput += item.outputTokens;
    totalSpend += cost;

    const card = document.createElement('div');
    card.className = `provider-card ${key}`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-area">
          <span class="card-indicator"></span>
          <h3>${providerTitle(key)}</h3>
        </div>
        <span class="provider-cost">$${cost.toFixed(4)}</span>
      </div>
      <div class="card-details">
        <div class="detail-row">
          <span>Active Chats</span>
          <span>${item.threads ? Object.keys(item.threads).length : 0}</span>
        </div>
        <div class="detail-row">
          <span>Input Tokens</span>
          <span>${item.inputTokens.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span>Output Tokens</span>
          <span>${item.outputTokens.toLocaleString()}</span>
        </div>
        <div class="detail-row updated">
          <span>Last active</span>
          <span>${item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString() : 'Never'}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Sort threads by date descending
  allThreads.sort((a, b) => b.updatedAt - a.updatedAt);

  // Render Thread list initial load
  renderThreadList();

  // Update headers
  document.getElementById('totalInputTokens').innerText = totalInput.toLocaleString();
  document.getElementById('totalOutputTokens').innerText = totalOutput.toLocaleString();
  document.getElementById('headerTotalCost').innerText = `$${totalSpend.toFixed(3)}`;
}

function renderThreadList(filterText = '') {
  const container = document.getElementById('threadList');
  container.innerHTML = '';
  
  const query = filterText.toLowerCase().trim();
  const filtered = allThreads.filter(t => t.title.toLowerCase().includes(query));

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'thread-empty-state';
    empty.innerText = query ? 'No matching chats found' : 'No active chats recorded yet';
    container.appendChild(empty);
    return;
  }

  filtered.forEach(thread => {
    const cost = calculateCost(thread.provider, thread.inputTokens, thread.outputTokens, thread.model);
    const item = document.createElement('div');
    item.className = 'thread-item';
    
    item.innerHTML = `
      <div class="thread-item-header">
        <span class="thread-item-title" title="${escapeHTML(thread.title)}">${escapeHTML(thread.title)}</span>
        <span class="thread-item-cost">$${cost.toFixed(4)}</span>
      </div>
      <div class="thread-item-meta">
        <div class="thread-badge-group">
          <span class="thread-badge ${thread.provider}">${providerTitle(thread.provider)}</span>
          <span class="thread-model">${thread.model}</span>
        </div>
        <span class="thread-item-tokens">${(thread.inputTokens + thread.outputTokens).toLocaleString()} tokens</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// Add event listener to search input
document.getElementById('threadSearch').addEventListener('input', function() {
  renderThreadList(this.value);
});

// Load configurations and current usage
function loadUsage() {
  chrome.runtime.sendMessage({ type: 'GET_USAGE' }, response => {
    if (response?.ok) {
      if (response.settings) {
        currentSettings = response.settings;
        document.getElementById('chatgptModel').value = currentSettings.chatgptModel;
        document.getElementById('claudeModel').value = currentSettings.claudeModel;
        document.getElementById('geminiModel').value = currentSettings.geminiModel;
        
        const theme = currentSettings.theme || 'midnight';
        document.getElementById('appTheme').value = theme;
        document.body.className = 'theme-' + theme;
      }
      renderCards(response.usage);
    }
  });
}

// Draw history chart dynamically using SVG elements
function loadHistory() {
  chrome.runtime.sendMessage({ type: 'GET_USAGE' }, response => {
    if (!response?.ok) return;
    
    const history = response.history || {};
    const days = [];
    
    // Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({
        dateStr,
        label,
        tokens: history[dateStr] ? (history[dateStr].input + history[dateStr].output) : 0
      });
    }

    const maxTokens = Math.max(...days.map(d => d.tokens), 100); // minimum scale is 100
    const totalHistoryTokens = days.reduce((sum, d) => sum + d.tokens, 0);
    const avgDaily = Math.round(totalHistoryTokens / 7);
    
    document.getElementById('avgDailyTokens').innerText = avgDaily.toLocaleString();
    
    let peakDay = '-';
    let peakVal = 0;
    days.forEach(d => {
      if (d.tokens > peakVal) {
        peakVal = d.tokens;
        peakDay = d.label;
      }
    });
    document.getElementById('peakDayName').innerText = peakVal > 0 ? `${peakDay} (${peakVal.toLocaleString()} t)` : '-';

    const chart = document.getElementById('historyChart');
    const loadingMsg = document.getElementById('chartLoading');

    if (totalHistoryTokens === 0) {
      chart.style.display = 'none';
      loadingMsg.style.display = 'block';
      return;
    }

    loadingMsg.style.display = 'none';
    chart.style.display = 'block';

    const chartBars = document.getElementById('chartBars');
    const chartXAxisLabels = document.getElementById('chartXAxisLabels');
    const chartYAxisLabels = document.getElementById('chartYAxisLabels');

    chartBars.innerHTML = '';
    chartXAxisLabels.innerHTML = '';
    chartYAxisLabels.innerHTML = '';

    const yAxisMarks = [maxTokens, Math.round(maxTokens / 2), 0];
    const yAxisYPositions = [20, 85, 150];

    yAxisMarks.forEach((val, index) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '35');
      text.setAttribute('y', yAxisYPositions[index]);
      text.setAttribute('class', 'chart-axis-label');
      text.setAttribute('text-anchor', 'end');
      text.textContent = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
      chartYAxisLabels.appendChild(text);
    });

    const barWidth = 24;
    const startX = 55;
    const spacing = 36;
    const chartHeight = 130; 

    days.forEach((day, index) => {
      const x = startX + index * spacing;
      const pct = day.tokens / maxTokens;
      const barHeight = Math.max(pct * chartHeight, 2); 
      const y = 150 - barHeight;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('rx', '4');
      rect.setAttribute('class', 'chart-bar');
      rect.setAttribute('fill', 'url(#barGradient)');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${day.tokens.toLocaleString()} tokens`;
      rect.appendChild(title);

      chartBars.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', '166');
      text.setAttribute('class', 'chart-text');
      text.textContent = day.label;
      chartXAxisLabels.appendChild(text);
    });

    if (!chart.querySelector('defs')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
      `;
      chart.appendChild(defs);
    }
  });
}

// Event Listeners for settings
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const theme = document.getElementById('appTheme').value;
  const newSettings = {
    theme: theme,
    chatgptModel: document.getElementById('chatgptModel').value,
    claudeModel: document.getElementById('claudeModel').value,
    geminiModel: document.getElementById('geminiModel').value
  };

  chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    settings: newSettings
  }, response => {
    if (response?.ok) {
      currentSettings = newSettings;
      document.body.className = 'theme-' + theme;
      loadUsage(); 
      
      const btn = document.getElementById('saveSettingsBtn');
      btn.innerText = 'Saved!';
      btn.style.background = '#10b981';
      btn.style.color = '#ffffff';
      setTimeout(() => {
        btn.innerText = 'Save Configuration';
        btn.style.background = '';
        btn.style.color = '';
      }, 1500);
    }
  });
});

document.getElementById('resetDataBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all token usage logs and history?')) {
    chrome.runtime.sendMessage({ type: 'RESET_USAGE' }, () => {
      loadUsage();
      loadHistory();
    });
  }
});

// Event listener for Popout window creator
document.getElementById('popoutBtn').addEventListener('click', () => {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html?popout=true'),
    type: 'popup',
    width: 380,
    height: 560
  });
  window.close(); // Close the dropdown menu
});

// Hide popout button if we are already in a detached popup window
if (window.location.search.includes('popout=true')) {
  document.getElementById('popoutBtn').style.display = 'none';
}

// Initial load
loadUsage();