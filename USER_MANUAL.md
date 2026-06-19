# TokenMeter v1.0 — User Manual
**Developed by Sagnik Kumar**

TokenMeter is a premium browser extension designed to track input and output tokens consumed during chats on LLM interfaces (ChatGPT, Claude, and Gemini). It calculates real-time API-equivalent token costs and organizes weekly consumption metrics. Note: Currently, only Microsoft Edge is officially supported.

---

## Table of Contents
1. [Installation Guide](#1-installation-guide)
2. [How it Works](#2-how-it-works)
3. [Features & Navigation](#3-features-navigation)
4. [Settings & Customization](#4-settings-customization)
5. [Troubleshooting & FAQs](#5-troubleshooting-faqs)

---

## 1. Installation Guide

Note: TokenMeter currently only supports Microsoft Edge. Support for other browsers (such as Google Chrome) is not officially supported at this time.

To install and run TokenMeter on Microsoft Edge using Git, follow the instructions below:

### Prerequisites
Make sure you have Git installed on your computer.

### Steps for Microsoft Edge
1. Open a terminal and clone the repository:
   ```bash
   git clone https://github.com/Sk1750-alt/LLM_Usage_Tracker.git
   ```
2. Open Microsoft Edge and navigate to `edge://extensions/`.
3. Locate the **Developer mode** toggle in the bottom-left corner of the page and switch it **ON**.
4. Click the **Load unpacked** button at the top of the screen.
5. Select the root folder of the cloned repository (the directory containing `manifest.json`).
6. Click the extensions puzzle icon in your browser toolbar to pin **TokenMeter**.

---

## 2. How it Works

TokenMeter operates securely and locally on your browser.

### Message & Model Scrapers
The content script monitors the active chat page using specific CSS selectors and DOM attributes:
* **ChatGPT:** Targets elements containing `[data-message-author-role]` for user and assistant speech. It reads the model selector dropdown to extract whether you are running `GPT-4o`, `GPT-4o mini`, or `GPT-4 Turbo`.
* **Claude:** Queries user message attributes and Claude message tags (`.font-claude-message`, `article`). It reads active selectors to identify `Claude 3.5 Sonnet`, `Claude 3.5 Haiku`, or `Claude 3 Opus`.
* **Gemini:** Scans query tags (`user-query`, `.query-text`) and response elements (`message-content`, `reply`). It detects whether you are using `Gemini 1.5 Pro` or `Gemini 1.5 Flash`.

### Fallback Safe Rates
If the UI changes or elements are hidden, TokenMeter automatically falls back to your custom-configured default models saved in your settings.

### Smart Session Tracking (No Double-Counting)
Rather than blindly adding text on every key mutation, TokenMeter extracts the **unique conversation thread ID** from the page URL path. 
* It estimates tokens for this thread and compares it against the previously logged token count.
* Only the **positive differences (deltas)** are added to your totals.
* If you edit a query, delete a chat message, or reload the page, TokenMeter safely ignores duplicate tokens, maintaining completely clean metrics.

### Token Estimation Formula
TokenMeter uses a balanced text-to-token approximation:
$$\text{Tokens} = \text{Average}(\text{Words} \times 1.3, \ \text{Characters} / 4)$$
This serves as a high-fidelity proxy for English and code blocks without loading heavy external libraries.

---

## 3. Features & Navigation

### 1. Dashboard Tab
* **Total Metrics:** Shows accumulated input tokens and output tokens across all services.
* **Header Cost Badge:** Displays total estimated spend in USD ($) based on active rates.
* **Provider Cards:** Separate breakdown blocks for ChatGPT, Claude, and Gemini displaying active chat count, tokens, cost, and time of last active session.

### 2. Chats Tab (Thread Explorer)
* **All Conversations:** View a list of your chats dynamically grouped and sorted by recency.
* **Specific Cost Computations:** Each chat displays its exact token length and computed cost, adapting automatically to the model that was active during that chat.
* **Search Filter:** Type keywords into the search bar at the top to filter chats by title instantly.

### 3. History Tab
* **SVG Bar Chart:** An interactive weekly consumption bar chart showing your total token usage over the last 7 days.
* **Key Metrics:** Highlights your average daily token consumption and peak consumption day.

---

## 4. Settings & Customization

The **Settings Tab** allows you to choose your layout styling and configure fallbacks:

### Style Themes
Toggle between three built-in visual schemes:
1. **Midnight Dark:** Space-navy background with blue highlights.
2. **Slate Dark:** Neutral slate-gray theme for a clean, office-friendly look.
3. **Light Mode:** High-contrast white background with professional navy accents.

### Fallback Rates Configuration
If model auto-detection is unavailable, calculations fall back to these default rates:

| Model | Input Rate (per Million) | Output Rate (per Million) |
| :--- | :--- | :--- |
| **GPT-4o** | \$2.50 | \$10.00 |
| **GPT-4o mini** | \$0.15 | \$0.60 |
| **GPT-4 Turbo** | \$10.00 | \$30.00 |
| **Claude 3.5 Sonnet** | \$3.00 | \$15.00 |
| **Claude 3.5 Haiku** | \$0.80 | \$4.00 |
| **Claude 3 Opus** | \$15.00 | \$75.00 |
| **Gemini 1.5 Flash** | \$0.075 | \$0.30 |
| **Gemini 1.5 Pro** | \$1.25 | \$5.00 |

* **Saving Settings:** Select your models, choose your theme, and click **Save Configuration**.
* **Resetting Logs:** To purge all history, click **Reset All Logs**. This clears the local chrome storage database.

---

## 5. Troubleshooting & FAQs

#### Q: The extension isn't counting my tokens.
* **A:** Check if Developer Mode is enabled and reload the extension in `edge://extensions/`. Ensure you are logged in and chatting on `chatgpt.com`, `claude.ai`, or `gemini.google.com`.

#### Q: Does my chat data leave my computer?
* **A:** No. All parsing, calculations, and history logs are saved locally inside your browser's private `chrome.storage.local` sandbox. No data is sent to external servers.

---
*Created and Developed by Sagnik Kumar.*
