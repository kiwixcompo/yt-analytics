// VidPulse Studio Extension Popup Script
// Manages real-time YouTube communication, live outlier previews, shortcuts and preferences

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const intelCount = document.getElementById('intel-count');
  const outliersContainer = document.getElementById('outliers-container');

  // Settings elements
  const toggleEnabled = document.getElementById('toggle-enabled');
  const toggleOutliers = document.getElementById('toggle-outliers');
  const toggleAutocomplete = document.getElementById('toggle-autocomplete');
  const selectMinSubs = document.getElementById('select-min-subs');
  const selectMaxSubs = document.getElementById('select-max-subs');
  const settingsAccordion = document.getElementById('settings-accordion');
  const settingsToggleBtn = document.getElementById('settings-toggle-btn');

  // Toggle settings accordion
  settingsToggleBtn?.addEventListener('click', () => {
    settingsAccordion.classList.toggle('open');
  });

  // Load saved configuration
  chrome.storage.local.get(
    ['vidpulse_enabled', 'vidpulse_outlier_only', 'vidpulse_min_subs', 'vidpulse_max_subs', 'vidpulse_autocomplete_outliers'],
    (res) => {
      if (res.vidpulse_enabled !== undefined) toggleEnabled.checked = res.vidpulse_enabled;
      if (res.vidpulse_outlier_only !== undefined) toggleOutliers.checked = res.vidpulse_outlier_only;
      if (res.vidpulse_autocomplete_outliers !== undefined) toggleAutocomplete.checked = res.vidpulse_autocomplete_outliers;
      if (res.vidpulse_min_subs !== undefined) selectMinSubs.value = String(res.vidpulse_min_subs);
      if (res.vidpulse_max_subs !== undefined) selectMaxSubs.value = String(res.vidpulse_max_subs);
    }
  );

  // Settings change listeners
  toggleEnabled?.addEventListener('change', () => {
    chrome.storage.local.set({ vidpulse_enabled: toggleEnabled.checked });
  });

  toggleOutliers?.addEventListener('change', () => {
    chrome.storage.local.set({ vidpulse_outlier_only: toggleOutliers.checked });
  });

  toggleAutocomplete?.addEventListener('change', () => {
    chrome.storage.local.set({ vidpulse_autocomplete_outliers: toggleAutocomplete.checked });
  });

  selectMinSubs?.addEventListener('change', () => {
    chrome.storage.local.set({ vidpulse_min_subs: parseInt(selectMinSubs.value, 10) });
  });

  selectMaxSubs?.addEventListener('change', () => {
    chrome.storage.local.set({ vidpulse_max_subs: parseInt(selectMaxSubs.value, 10) });
  });

  // Query active tab and request live intelligence from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) return;

    const isYouTube = activeTab.url && (activeTab.url.includes('youtube.com') || activeTab.url.includes('youtu.be'));

    if (!isYouTube) {
      statusBadge.className = 'status-badge inactive';
      statusText.textContent = 'Not on YouTube';
      intelCount.textContent = '0 Detected';
      outliersContainer.innerHTML = `
        <div class="no-outliers-box">
          Browse YouTube to inspect live view-to-sub ratios and outlier breakthroughs.
        </div>
      `;
      return;
    }

    // Ping content script
    chrome.tabs.sendMessage(activeTab.id, { type: 'VIDPULSE_GET_PAGE_DATA' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.ok) {
        statusBadge.className = 'status-badge active';
        statusText.textContent = 'Live on YT';
        intelCount.textContent = 'Scanning...';
        outliersContainer.innerHTML = `
          <div class="no-outliers-box">
            VidPulse observer active. Scroll YouTube results or wait a moment for ratios to calculate.
          </div>
        `;
        return;
      }

      // We have live page data!
      statusBadge.className = 'status-badge active';
      statusText.textContent = 'Live on YT';

      const count = response.outliersCount || 0;
      intelCount.textContent = `${count} Detected`;

      if (count > 0 && response.outliers && response.outliers.length > 0) {
        let html = '';
        response.outliers.slice(0, 3).forEach((item) => {
          const ratioDisplay = item.ratio ? `${item.ratio}x Ratio` : 'Outlier';
          const title = escapeHtml(item.title);
          const thumb = item.thumbnail || `https://i.ytimg.com/vi/${(item.videoUrl || '').match(/v=([^&]+)/)?.[1] || ''}/hqdefault.jpg`;
          html += `
            <a href="${item.videoUrl}" target="_blank" class="outlier-card" style="margin-bottom: 6px;">
              <img src="${thumb}" class="outlier-thumb" alt="thumb" onerror="this.style.opacity=0.3" />
              <div class="outlier-info">
                <div class="outlier-title" title="${title}">${title}</div>
                <div class="outlier-meta">
                  <span class="ratio-pill">${ratioDisplay}</span>
                  <span>${escapeHtml(item.viewsText || '')}</span>
                  <span>&bull;</span>
                  <span>${escapeHtml(item.subsText || '')}</span>
                </div>
              </div>
            </a>
          `;
        });
        outliersContainer.innerHTML = html;
      } else {
        outliersContainer.innerHTML = `
          <div class="no-outliers-box">
            ${response.totalScanned > 0 
              ? `Scanned ${response.totalScanned} videos. No breakthrough small creators exceeding view-to-sub ratio yet.` 
              : 'Scanning YouTube feed...'}
          </div>
        `;
      }
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
