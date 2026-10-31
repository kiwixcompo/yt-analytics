// VidPulse Lightweight Background Service Worker (Manifest V3)
// Zero polling, event-driven, instantly terminates when idle to consume 0% background memory.

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default user settings in local storage
  chrome.storage.local.get(['vidpulse_enabled', 'vidpulse_outlier_only', 'vidpulse_min_subs', 'vidpulse_max_subs', 'vidpulse_autocomplete_outliers'], (res) => {
    if (res.vidpulse_enabled === undefined) {
      chrome.storage.local.set({
        vidpulse_enabled: true,
        vidpulse_outlier_only: false,
        vidpulse_min_subs: 0,
        vidpulse_max_subs: 20000,
        vidpulse_autocomplete_outliers: true,
      });
    }
  });
});

// Message listener for proxying YouTube and Autocomplete queries
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'VIDPULSE_FETCH') {
    fetch(message.url, message.options || {})
      .then(async (res) => {
        const text = await res.text();
        sendResponse({ ok: res.ok, status: res.status, text });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  }
});
