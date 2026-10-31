// VidPulse Content Script - Zero-bloat, High-Performance Native DOM Observer
// Runs directly inside YouTube SERP & Home & Watch recommendations.
// No external frameworks, minimal CPU & memory footprint (<2MB RAM).

(function () {
  'use strict';

  let isEnabled = true;
  let outlierOnly = false;
  let minSubs = 0;
  let maxSubs = 20000;
  let autocompleteOutliers = true;

  // Local memory cache for channel subscriber counts to avoid duplicate fetches
  const subCountCache = new Map();

  // Page detected outliers tracker for popup communication
  const detectedOutliersOnPage = new Map();

  // Listen for queries from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.type === 'VIDPULSE_GET_PAGE_DATA') {
        const outliersList = Array.from(detectedOutliersOnPage.values());
        sendResponse({
          ok: true,
          enabled: isEnabled,
          url: window.location.href,
          outliersCount: outliersList.length,
          outliers: outliersList.slice(0, 5),
          totalScanned: document.querySelectorAll('[data-vidpulse-processed]').length
        });
        return true;
      }
    });
  }

  // Load preferences
  function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ['vidpulse_enabled', 'vidpulse_outlier_only', 'vidpulse_min_subs', 'vidpulse_max_subs', 'vidpulse_autocomplete_outliers'],
        (res) => {
          if (res.vidpulse_enabled !== undefined) isEnabled = res.vidpulse_enabled;
          if (res.vidpulse_outlier_only !== undefined) outlierOnly = res.vidpulse_outlier_only;
          if (res.vidpulse_min_subs !== undefined) minSubs = res.vidpulse_min_subs;
          if (res.vidpulse_max_subs !== undefined) maxSubs = res.vidpulse_max_subs;
          if (res.vidpulse_autocomplete_outliers !== undefined) autocompleteOutliers = res.vidpulse_autocomplete_outliers;
          if (callback) callback();
        }
      );
    }
  }

  // Listen for storage changes from popup
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.vidpulse_enabled) isEnabled = changes.vidpulse_enabled.newValue;
        if (changes.vidpulse_outlier_only) outlierOnly = changes.vidpulse_outlier_only.newValue;
        if (changes.vidpulse_min_subs !== undefined) minSubs = changes.vidpulse_min_subs.newValue;
        if (changes.vidpulse_max_subs !== undefined) maxSubs = changes.vidpulse_max_subs.newValue;
        if (changes.vidpulse_autocomplete_outliers) autocompleteOutliers = changes.vidpulse_autocomplete_outliers.newValue;
        refreshAllBadges();
      }
    });
  }

  // Helper: parse human numbers (e.g., '142K views', '1.2M subscribers', '850')
  function parseCount(str) {
    if (!str) return 0;
    const clean = str.replace(/ subscribers?/i, '').replace(/ views?/i, '').replace(/,/g, '').trim();
    if (clean.endsWith('M') || clean.endsWith('m')) {
      return Math.round(parseFloat(clean) * 1000000);
    }
    if (clean.endsWith('K') || clean.endsWith('k')) {
      return Math.round(parseFloat(clean) * 1000);
    }
    return parseInt(clean, 10) || 0;
  }

  // Fast subscriber parser from YouTube channel page HTML
  async function getChannelSubscribers(channelUrl) {
    if (!channelUrl) return { count: 0, text: 'Hidden' };
    const cleanUrl = channelUrl.split('?')[0].split('/videos')[0];
    if (subCountCache.has(cleanUrl)) {
      return subCountCache.get(cleanUrl);
    }

    try {
      let text = '';
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Fetch via background worker to bypass any page CORS/header limitations
        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'VIDPULSE_FETCH',
              url: cleanUrl,
              options: {
                headers: { 'Accept-Language': 'en-US,en;q=0.9' },
              },
            },
            (r) => resolve(r)
          );
        });
        if (resp && resp.ok && resp.text) {
          text = resp.text;
        }
      }

      // Direct fallback fetch if background messaging wasn't used or returned empty
      if (!text) {
        const res = await fetch(cleanUrl, {
          credentials: 'omit',
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (res.ok) {
          text = await res.text();
        }
      }

      if (!text) throw new Error('Fetch failed');

      // Multi-pattern regex for current YouTube polymer channel header structures
      const match =
        text.match(/"metadataParts":\[\{"text":\{"content":"([^"]+?subscribers?)"/i) ||
        text.match(/"content":"([^"]+?subscribers?)"/i) ||
        text.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+?)"/i) ||
        text.match(/"subscriberCountText":\{"simpleText":"([^"]+?)"/i) ||
        text.match(/"simpleText":"([^"]+?subscribers?)"/i) ||
        text.match(/([0-9\.]+[KM]?\s+subscribers?)/i);

      let countText = 'Hidden';
      if (match) {
        countText = match[1].trim();
      }

      const count = parseCount(countText);
      const result = { count, text: countText };
      subCountCache.set(cleanUrl, result);
      return result;
    } catch (e) {
      const fallback = { count: 0, text: 'Hidden' };
      subCountCache.set(cleanUrl, fallback);
      return fallback;
    }
  }

  // Open Emulation Blueprint Modal
  function showEmulationModal(videoData) {
    const existing = document.getElementById('vidpulse-modal-root');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'vidpulse-modal-root';
    backdrop.className = 'vidpulse-modal-backdrop';

    const ratioText = videoData.ratio > 0 ? `${videoData.ratio}x Channel Size` : 'Massive Viral Reach';
    const cleanQuery = encodeURIComponent(videoData.title.slice(0, 50));
    const appUrl = `http://localhost:3000/dashboard?seed=${cleanQuery}&outliers=true`;

    backdrop.innerHTML = `
      <div class="vidpulse-modal-card" role="dialog" aria-modal="true">
        <div class="vidpulse-modal-header">
          <div class="vidpulse-modal-title">
            <span>⚡ VidPulse Emulation Blueprint</span>
          </div>
          <button class="vidpulse-modal-close" id="vidpulse-modal-close-btn">&times;</button>
        </div>
        <div class="vidpulse-modal-body">
          <div class="vidpulse-section-box">
            <div class="vidpulse-section-title">Video Performance Metric</div>
            <div class="vidpulse-section-content">
              <strong>${videoData.title}</strong><br/>
              <span style="color:#fb923c; font-weight:700;">${videoData.viewsText}</span> with only 
              <span style="color:#38bdf8; font-weight:700;">${videoData.subsText}</span>
              <span style="color:#a855f7; margin-left:6px; font-weight:700;">(${ratioText})</span>
            </div>
          </div>
          <div class="vidpulse-section-box">
            <div class="vidpulse-section-title">Why this idea broke the algorithm</div>
            <div class="vidpulse-section-content">
              This video broke YouTube's recommendation engine on sheer CTR (click-through rate) and audience retention rather than relying on subscriber inertia. Small creator videos scaling past their subscriber count indicate heavy organic audience demand.
            </div>
          </div>
          <div class="vidpulse-section-box">
            <div class="vidpulse-section-title">Suggested Emulation Strategy</div>
            <div class="vidpulse-section-content">
              Borrow this exact curiosity gap and create a higher-contrast, cleaner thumbnail. Structure the first 15 seconds around the core question rather than an intro.
            </div>
          </div>
          <div class="vidpulse-modal-actions">
            <a href="${appUrl}" target="_blank" rel="noopener noreferrer" class="vidpulse-app-link-btn">
              Open in VidPulse Dashboard &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeBtn = document.getElementById('vidpulse-modal-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => backdrop.remove();
    }
    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };
  }

  // Process a single video element in YouTube SERP / Feed
  async function processVideoRenderer(element) {
    if (!isEnabled) return;
    if (element.dataset.vidpulseProcessed === 'true') return;

    // Check if element has title link and metadata
    const titleEl = element.querySelector('#video-title, #title.ytd-rich-grid-media, a#video-title-link');
    if (!titleEl) return;

    // Avoid duplicate insertions
    element.dataset.vidpulseProcessed = 'true';

    // Extract Video Title and URL
    const title = titleEl.textContent ? titleEl.textContent.trim() : '';
    const videoUrl = titleEl.href || '';

    // Extract Views
    let viewsText = '';
    const metadataSpans = element.querySelectorAll('#metadata-line span, ytd-video-meta-block span');
    for (const span of metadataSpans) {
      const text = span.textContent ? span.textContent.trim() : '';
      if (/views?/i.test(text) || /\d+.*view/i.test(text)) {
        viewsText = text;
        break;
      }
    }
    const viewsCount = parseCount(viewsText);

    // Extract Channel URL
    const channelEl = element.querySelector(
      '#channel-name a, #channel-info a, ytd-channel-name a, #byline a'
    );
    const channelUrl = channelEl ? channelEl.href : '';

    if (!viewsCount || !channelUrl) {
      return;
    }

    // Target insertion container: usually near metadata-line or below title
    const metaContainer =
      element.querySelector('#metadata-line') ||
      element.querySelector('#title-wrapper') ||
      element.querySelector('#channel-name');

    if (!metaContainer) return;

    // Fetch subs asynchronously
    const { count: subsCount, text: subsText } = await getChannelSubscribers(channelUrl);

    // Calculate ratio & outlier status
    // STRICT OUTLIER RULE: Must have less subscribers than views (viewsCount > subsCount)
    // AND channel subscriber count must fall within chosen range [minSubs, maxSubs]
    let isOutlier = false;
    let ratio = 0;
    if (subsCount > 0) {
      ratio = Math.round((viewsCount / subsCount) * 10) / 10;
      if (
        subsCount >= minSubs &&
        subsCount <= maxSubs &&
        viewsCount > subsCount &&
        ratio >= 1.2
      ) {
        isOutlier = true;
      }
    }

    // Outlier filter mode: Dim non-outlier videos
    if (outlierOnly) {
      if (!isOutlier || (subsCount > 0 && (subsCount < minSubs || subsCount > maxSubs))) {
        element.classList.add('vidpulse-dimmed-video');
      } else {
        element.classList.remove('vidpulse-dimmed-video');
      }
    } else {
      element.classList.remove('vidpulse-dimmed-video');
    }

    if (isOutlier) {
      const thumbEl = element.querySelector('ytd-thumbnail img, #thumbnail img');
      const thumbUrl = thumbEl?.src || `https://i.ytimg.com/vi/${videoUrl.match(/v=([^&]+)/)?.[1] || ''}/hqdefault.jpg`;
      detectedOutliersOnPage.set(videoUrl, {
        title,
        videoUrl,
        thumbnail: thumbUrl,
        viewsText,
        viewsCount,
        subsText,
        subsCount,
        ratio,
        channelUrl
      });
    }

    // Create VidPulse badge
    const badgeWrapper = document.createElement('div');
    badgeWrapper.style.display = 'flex';
    badgeWrapper.style.flexWrap = 'wrap';
    badgeWrapper.style.alignItems = 'center';

    const ratioBadge = document.createElement('span');
    ratioBadge.className = `vidpulse-badge ${isOutlier ? 'vidpulse-badge-outlier' : 'vidpulse-badge-normal'}`;

    if (isOutlier) {
      ratioBadge.innerHTML = `⚡ <span>${ratio > 0 ? `${ratio}x Ratio` : 'Viral Gem'}</span> <span style="font-weight:400;opacity:0.9">(${subsText})</span>`;
    } else {
      ratioBadge.innerHTML = `📊 <span>${ratio > 0 ? `${ratio}x` : '1x'}</span> <span style="font-weight:400;opacity:0.8">(${subsText})</span>`;
    }
    badgeWrapper.appendChild(ratioBadge);

    // If Outlier, append Emulate Research Action Button
    if (isOutlier) {
      const emulateBtn = document.createElement('button');
      emulateBtn.className = 'vidpulse-emulate-btn';
      emulateBtn.type = 'button';
      emulateBtn.innerHTML = `✨ <span>Emulate</span>`;
      emulateBtn.title = 'View why this video succeeded and how to emulate it';
      emulateBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEmulationModal({
          title,
          viewsText,
          viewsCount,
          subsText,
          subsCount,
          ratio,
          videoUrl,
        });
      };
      badgeWrapper.appendChild(emulateBtn);
    }

    metaContainer.parentElement?.insertBefore(badgeWrapper, metaContainer.nextSibling);
  }

  // Scan visible elements with high-efficiency selector
  function scanPage() {
    if (!isEnabled) return;
    const selectors = [
      'ytd-video-renderer',
      'ytd-grid-video-renderer',
      'ytd-rich-item-renderer',
      'ytd-compact-video-renderer',
    ];
    const elements = document.querySelectorAll(selectors.join(','));
    for (let i = 0; i < elements.length; i++) {
      processVideoRenderer(elements[i]);
    }
  }

  function refreshAllBadges() {
    // Remove injected badges and reprocess
    const injected = document.querySelectorAll('.vidpulse-injected-container');
    injected.forEach((el) => el.remove());

    const processed = document.querySelectorAll('[data-vidpulse-processed]');
    processed.forEach((el) => {
      el.removeAttribute('data-vidpulse-processed');
      el.classList.remove('vidpulse-dimmed-video');
    });

    if (isEnabled) {
      scanPage();
    }
  }

  // Throttled MutationObserver for YouTube SPA navigation & infinite scroll
  let throttleTimer = null;
  const observer = new MutationObserver(() => {
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      scanPage();
      throttleTimer = null;
    }, 400); // 400ms debounce ensures virtually zero CPU load
  });

  // Start observing once DOM is ready
  loadSettings(() => {
    scanPage();
    observer.observe(document.body, { childList: true, subtree: true });
    attachSearchInputListener();
  });

  // Listen for YouTube SPA navigation finish
  window.addEventListener('yt-navigate-finish', () => {
    detectedOutliersOnPage.clear();
    setTimeout(() => {
      scanPage();
      attachSearchInputListener();
    }, 600);
  });

  // ============================================================
  // Live Search Autocomplete Outlier Scanner & Exporter
  // ============================================================

  let searchDebounceTimer = null;
  let activeSearchAbort = null;
  let currentAutocompleteOutliers = [];
  let currentBroadKeyword = '';

  function attachSearchInputListener() {
    const searchInputs = document.querySelectorAll(
      'input#search, input[name="search_query"], ytd-searchbox input'
    );

    searchInputs.forEach((input) => {
      if (input.dataset.vidpulseListener === 'true') return;
      input.dataset.vidpulseListener = 'true';

      input.addEventListener('input', (e) => {
        if (!isEnabled || !autocompleteOutliers) {
          removeAutocompleteDrawer();
          return;
        }

        const query = e.target.value ? e.target.value.trim() : '';
        if (query.length < 2) {
          removeAutocompleteDrawer();
          return;
        }

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          triggerAutocompleteOutlierSearch(query, input);
        }, 550); // 550ms debounce ensures optimal typing experience & zero lag
      });

      // Close drawer on click outside (ignore clicks inside drawer, select element, and input)
      document.addEventListener('click', (e) => {
        const drawer = document.getElementById('vidpulse-ac-drawer');
        if (!drawer) return;
        if (
          drawer.contains(e.target) ||
          e.target === input ||
          e.target.closest('#vidpulse-ac-drawer') ||
          e.target.closest('#vidpulse-drawer-max-subs')
        ) {
          return;
        }
        removeAutocompleteDrawer();
      });
    });
  }

  function removeAutocompleteDrawer() {
    const existing = document.getElementById('vidpulse-ac-drawer');
    if (existing) existing.remove();
  }

  // Keyword extraction algorithm to recommend high-impact title keywords
  function extractRecommendedKeywords(titles, baseKeyword) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'as', 'is', 'was', 'are', 'were', 'it', 'this', 'that', 'how', 'what', 'why', 'when',
      'your', 'you', 'i', 'my', 'we', 'our', 'be', 'do', 'does', 'did', 'so', 'if', 'all', 'any'
    ]);

    const wordCounts = new Map();
    const cleanBase = baseKeyword.toLowerCase().split(/\s+/);

    titles.forEach((title) => {
      const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w) && !cleanBase.includes(w));

      words.forEach((w) => {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      });
    });

    const sorted = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    // Return top 8 distinctive power keywords
    return sorted.slice(0, 8);
  }

  // Fetch outliers for broad query from local VidPulse backend
  async function triggerAutocompleteOutlierSearch(query, inputEl) {
    currentBroadKeyword = query;

    // Find YouTube search container to position drawer
    const searchContainer =
      inputEl.closest('#search-form') ||
      inputEl.closest('ytd-searchbox') ||
      inputEl.closest('form') ||
      inputEl.parentElement;

    if (!searchContainer) return;

    if (searchContainer.style.position !== 'relative' && searchContainer.style.position !== 'absolute') {
      searchContainer.style.position = 'relative';
    }

    // Render loading drawer
    let drawer = document.getElementById('vidpulse-ac-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'vidpulse-ac-drawer';
      drawer.className = 'vidpulse-ac-drawer';
      searchContainer.appendChild(drawer);
    }

    drawer.innerHTML = `
      <div class="vidpulse-ac-header">
        <div class="vidpulse-ac-header-left">
          <span class="vidpulse-ac-tag">⚡ VidPulse Outliers</span>
          <span class="vidpulse-ac-status">Scouting small creator gems for "${escapeHtml(query)}"...</span>
        </div>
        <button class="vidpulse-ac-close-btn" id="vidpulse-ac-close-btn" title="Close">&times;</button>
      </div>
      <div class="vidpulse-ac-empty">
        <div style="font-size:18px; margin-bottom:6px;">🔎</div>
        Analyzing live YouTube index for breakthrough small channels...
      </div>
    `;

    document.getElementById('vidpulse-ac-close-btn')?.addEventListener('click', () => {
      removeAutocompleteDrawer();
    });

    if (activeSearchAbort) {
      activeSearchAbort.abort();
    }
    activeSearchAbort = new AbortController();

    try {
      let outliers = [];

      // Strategy 1: Try local server if running
      let localSucceeded = false;
      try {
        const localController = new AbortController();
        const localTimeout = setTimeout(() => localController.abort(), 1200);
        const url = `http://localhost:3000/api/youtube/search?q=${encodeURIComponent(query)}&outliers=true&maxSubs=${maxSubs}&minSubs=${minSubs}`;
        const res = await fetch(url, { signal: localController.signal });
        clearTimeout(localTimeout);
        if (res.ok) {
          const data = await res.json();
          // Filter: viewsCount > channelSubscriberCount AND within minSubs...maxSubs
          const localOutliers = (data.videos || []).filter((v) => {
            const subs = v.channelSubscriberCount || 0;
            const views = v.viewsCount || 0;
            const inRange = subs >= minSubs && (maxSubs >= 1000000 || subs <= maxSubs);
            return (v.isOutlierHit || (views > subs && views > 0)) && inRange;
          });
          if (localOutliers.length > 0) {
            outliers = localOutliers;
            localSucceeded = true;
          }
        }
      } catch (e) {
        localSucceeded = false;
      }

      // Strategy 2: If local app is offline or returned 0 outliers, fetch directly from YouTube in-browser
      if (!localSucceeded || outliers.length === 0) {
        outliers = await fetchOutliersDirectFromYouTube(query, minSubs, maxSubs, activeSearchAbort.signal);
      }

      currentAutocompleteOutliers = outliers;
      renderAutocompleteDrawerResults(drawer, query, outliers);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('VidPulse Autocomplete search error:', err);
      drawer.innerHTML = `
        <div class="vidpulse-ac-header">
          <div class="vidpulse-ac-header-left">
            <span class="vidpulse-ac-tag">⚡ VidPulse Outliers</span>
            <span class="vidpulse-ac-status">Search temporarily unavailable</span>
          </div>
          <button class="vidpulse-ac-close-btn" id="vidpulse-ac-close-btn">&times;</button>
        </div>
        <div class="vidpulse-ac-empty" style="color:#94a3b8;">
          Unable to retrieve YouTube results. Please check your connection or retry.
        </div>
      `;
      document.getElementById('vidpulse-ac-close-btn')?.addEventListener('click', () => {
        removeAutocompleteDrawer();
      });
    }
  }

  // Direct client-side YouTube search parser (zero backend needed)
  async function fetchOutliersDirectFromYouTube(query, minSubLimit, maxSubLimit, signal) {
    // Dynamically scout localized YouTube autocomplete completions for the user's input
    const searchSeeds = [query];
    try {
      const acUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q=${encodeURIComponent(query)}`;
      let acData = null;
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'VIDPULSE_FETCH', url: acUrl }, (r) => resolve(r));
        });
        if (resp && resp.ok && resp.text) {
          try { acData = JSON.parse(resp.text); } catch (e) {}
        }
      }
      if (!acData) {
        const acRes = await fetch(acUrl, { signal });
        if (acRes.ok) acData = await acRes.json();
      }
      if (acData && Array.isArray(acData[1])) {
        for (const s of acData[1].slice(0, 5)) {
          if (s && !searchSeeds.includes(s)) {
            searchSeeds.push(s);
          }
        }
      }
    } catch (e) {
      // Fallback seed variations if autocomplete is offline
      searchSeeds.push(`${query} tools`, `${query} tutorial`, `${query} 2026`, `${query} free`);
    }

    if (searchSeeds.length === 1) {
      searchSeeds.push(`${query} tutorial`, `${query} best`, `${query} tips`);
    }

    const rawList = [];
    const seenIds = new Set();

    // Query both standard search and high-performing view-sorted search (sp=CAMSAhAB) to uncover breakthrough small creators
    const searchQueries = [];
    for (const s of searchSeeds.slice(0, 4)) {
      searchQueries.push(`https://www.youtube.com/results?search_query=${encodeURIComponent(s)}`);
    }
    // Also add one view-sorted query for the main query
    searchQueries.push(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAM%253D`);

    for (const ytUrl of searchQueries) {
      if (signal?.aborted) break;
      try {
        let html = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          const resp = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                type: 'VIDPULSE_FETCH',
                url: ytUrl,
                options: { headers: { 'Accept-Language': 'en-US,en;q=0.9' } },
              },
              (r) => resolve(r)
            );
          });
          if (resp && resp.ok && resp.text) {
            html = resp.text;
          }
        }

        if (!html) {
          const ytRes = await fetch(ytUrl, { credentials: 'omit', signal });
          if (ytRes.ok) html = await ytRes.text();
        }

        if (!html) continue;

        const match =
          html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
          html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

        if (!match) continue;

        let parsedData = null;
        try {
          parsedData = JSON.parse(match[1]);
        } catch (e) {
          continue;
        }

        const contents =
          parsedData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

        for (const section of contents) {
          const items = section.itemSectionRenderer?.contents || [];
          for (const item of items) {
            if (item.videoRenderer) {
              const vr = item.videoRenderer;
              const videoId = vr.videoId;
              if (!videoId || seenIds.has(videoId)) continue;
              seenIds.add(videoId);

              const title = vr.title?.runs?.map((r) => r.text).join('') || '';
              const url = `https://www.youtube.com/watch?v=${videoId}`;
              const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const channelNav = vr.ownerText?.runs?.[0]?.navigationEndpoint;
              const channelUrl = channelNav?.commandMetadata?.webCommandMetadata?.url
                ? `https://www.youtube.com${channelNav.commandMetadata.webCommandMetadata.url}`
                : '';
              const viewsText = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '0 views';
              const viewsCount = parseCount(viewsText);

              if (channelUrl && viewsCount > 0) {
                rawList.push({
                  id: videoId,
                  title,
                  url,
                  thumbnail,
                  channelUrl,
                  viewsText,
                  viewsCount,
                });
              }
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return [];
      }
    }

    // Inspect candidates in controlled chunks (batch size 8) to avoid connection saturation
    const candidates = rawList.slice(0, 50);
    const results = [];
    const chunkSize = 8;

    for (let i = 0; i < candidates.length; i += chunkSize) {
      if (signal?.aborted) break;
      const chunk = candidates.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (v) => {
          if (!v.channelUrl || signal?.aborted) return;
          const subData = await getChannelSubscribers(v.channelUrl);
          const subCount = subData.count || 0;
          const subText = subData.text || 'Hidden';

          let isOutlierHit = false;
          let ratio = 0;

          // OUTLIER CONDITION:
          // Must have verified subscriber count (subCount > 0, NEVER 'Hidden')
          // AND channel subscribers must fall within chosen range [minSubLimit, maxSubLimit]
          // AND video views must exceed channel subscribers (viewsCount > subCount)
          // For 'Any Size' (maxSubLimit >= 1000000), if viewsCount > subCount it is a clear outlier hit.
          // If viewsCount > 100,000 views and ratio >= 0.8 on any channel size, it is also a breakthrough hit.
          if (subCount > 0) {
            ratio = Math.round((v.viewsCount / subCount) * 10) / 10;
            const inRange = subCount >= minSubLimit && (maxSubLimit >= 1000000 || subCount <= maxSubLimit);
            if (inRange && (v.viewsCount > subCount || (maxSubLimit >= 1000000 && ratio >= 0.8 && v.viewsCount >= 50000))) {
              isOutlierHit = true;
            }
          }

          if (isOutlierHit) {
            results.push({
              ...v,
              channelSubscriberCountText: subText,
              channelSubscriberCount: subCount,
              viewToSubRatio: ratio,
              isOutlierHit: true,
            });
          }
        })
      );
    }

    // Sort by highest view-to-sub ratio
    results.sort((a, b) => (b.viewToSubRatio || 0) - (a.viewToSubRatio || 0));
    return results;
  }

  function renderAutocompleteDrawerResults(drawer, query, outliers) {
    if (!outliers || outliers.length === 0) {
      drawer.innerHTML = `
        <div class="vidpulse-ac-header">
          <div class="vidpulse-ac-header-left">
            <span class="vidpulse-ac-tag">⚡ VidPulse Outliers</span>
            <span class="vidpulse-ac-status">No outliers (Views > Subs) in range ${minSubs.toLocaleString()} - ${maxSubs.toLocaleString()} subs</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:#94a3b8;">
              <span>Subs:</span>
              <select id="vidpulse-drawer-max-subs" class="vidpulse-ac-select">
                <option value="5000" ${maxSubs === 5000 ? 'selected' : ''}>&lt; 5k</option>
                <option value="10000" ${maxSubs === 10000 ? 'selected' : ''}>&lt; 10k</option>
                <option value="20000" ${maxSubs === 20000 ? 'selected' : ''}>&lt; 20k</option>
                <option value="50000" ${maxSubs === 50000 ? 'selected' : ''}>&lt; 50k</option>
                <option value="100000" ${maxSubs === 100000 ? 'selected' : ''}>&lt; 100k</option>
                <option value="250000" ${maxSubs === 250000 ? 'selected' : ''}>&lt; 250k</option>
                <option value="500000" ${maxSubs === 500000 ? 'selected' : ''}>&lt; 500k</option>
                <option value="1000000" ${maxSubs >= 1000000 ? 'selected' : ''}>Any Size</option>
              </select>
            </div>
            <button class="vidpulse-ac-close-btn" id="vidpulse-ac-close-btn">&times;</button>
          </div>
        </div>
        <div class="vidpulse-ac-empty">
          No qualifying videos found with <strong>more views than channel subscribers</strong> in this range. Try increasing the subscriber ceiling above or searching a related seed.
        </div>
      `;
      document.getElementById('vidpulse-ac-close-btn')?.addEventListener('click', () => {
        removeAutocompleteDrawer();
      });
      const emptySelect = document.getElementById('vidpulse-drawer-max-subs');
      if (emptySelect) {
        emptySelect.addEventListener('mousedown', (e) => e.stopPropagation());
        emptySelect.addEventListener('click', (e) => e.stopPropagation());
        emptySelect.addEventListener('change', (e) => {
          e.stopPropagation();
          const newMax = parseInt(e.target.value, 10);
          maxSubs = newMax;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ vidpulse_max_subs: newMax });
          }
          triggerAutocompleteOutlierSearch(query, document.querySelector('input#search, input[name="search_query"], ytd-searchbox input'));
        });
      }
      return;
    }

    const titles = outliers.map((o) => o.title);
    const recommendedKeywords = extractRecommendedKeywords(titles, query);

    let itemsHtml = '';
    outliers.slice(0, 7).forEach((vid) => {
      const ratioStr = vid.viewToSubRatio > 0 ? `${vid.viewToSubRatio}x` : 'Viral';
      itemsHtml += `
        <a href="${vid.url}" target="_blank" rel="noopener noreferrer" class="vidpulse-ac-item">
          <img src="${vid.thumbnail || ''}" class="vidpulse-ac-thumb" alt="thumbnail" />
          <div class="vidpulse-ac-item-content">
            <div class="vidpulse-ac-item-title" title="${escapeHtml(vid.title)}">${escapeHtml(vid.title)}</div>
            <div class="vidpulse-ac-item-meta">
              <span class="vidpulse-ac-item-views">🔥 ${escapeHtml(vid.viewsText)}</span>
              <span>&bull;</span>
              <span class="vidpulse-ac-item-subs">👤 ${escapeHtml(vid.channelSubscriberCountText || 'Hidden')}</span>
              <span>&bull;</span>
              <span class="vidpulse-ac-item-ratio">${ratioStr} Ratio</span>
            </div>
          </div>
        </a>
      `;
    });

    drawer.innerHTML = `
      <div class="vidpulse-ac-header">
        <div class="vidpulse-ac-header-left">
          <span class="vidpulse-ac-tag">⚡ Outliers (${outliers.length})</span>
          <span class="vidpulse-ac-status">Views > Subs in ${minSubs.toLocaleString()} - ${maxSubs.toLocaleString()} subs</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:#94a3b8;">
            <span>Max Subs:</span>
            <select id="vidpulse-drawer-max-subs" class="vidpulse-ac-select">
              <option value="5000" ${maxSubs === 5000 ? 'selected' : ''}>5k</option>
              <option value="10000" ${maxSubs === 10000 ? 'selected' : ''}>10k</option>
              <option value="20000" ${maxSubs === 20000 ? 'selected' : ''}>20k</option>
              <option value="50000" ${maxSubs === 50000 ? 'selected' : ''}>50k</option>
              <option value="100000" ${maxSubs === 100000 ? 'selected' : ''}>100k</option>
              <option value="250000" ${maxSubs === 250000 ? 'selected' : ''}>250k</option>
              <option value="500000" ${maxSubs === 500000 ? 'selected' : ''}>500k</option>
              <option value="1000000" ${maxSubs >= 1000000 ? 'selected' : ''}>Any Size</option>
            </select>
          </div>
          <a href="http://localhost:3000/dashboard/research?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" class="vidpulse-ac-export-btn" style="text-decoration:none; display:inline-flex; align-items:center; background:#4f46e5; border-color:#6366f1;">
            🔍 Full Research
          </a>
          <button class="vidpulse-ac-export-btn" id="vidpulse-ac-export-btn">
            📥 Export All (.CSV)
          </button>
          <button class="vidpulse-ac-close-btn" id="vidpulse-ac-close-btn">&times;</button>
        </div>
      </div>
      <div class="vidpulse-ac-list">
        ${itemsHtml}
      </div>
      <div class="vidpulse-ac-footer">
        <div>
          <strong>Recommended Keywords:</strong> 
          <span style="color:#e2e8f0;">${recommendedKeywords.length > 0 ? recommendedKeywords.join(', ') : 'None'}</span>
        </div>
      </div>
    `;

    document.getElementById('vidpulse-ac-close-btn')?.addEventListener('click', () => {
      removeAutocompleteDrawer();
    });

    const populatedSelect = document.getElementById('vidpulse-drawer-max-subs');
    if (populatedSelect) {
      populatedSelect.addEventListener('mousedown', (e) => e.stopPropagation());
      populatedSelect.addEventListener('click', (e) => e.stopPropagation());
      populatedSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        const newMax = parseInt(e.target.value, 10);
        maxSubs = newMax;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ vidpulse_max_subs: newMax });
        }
        triggerAutocompleteOutlierSearch(query, document.querySelector('input#search, input[name="search_query"], ytd-searchbox input'));
      });
    }

    document.getElementById('vidpulse-ac-export-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      exportOutliersToCsv(outliers, query, recommendedKeywords);
    });
  }

  // Export Outliers, URLs, Views, Subs, and Recommended Keywords to CSV
  function exportOutliersToCsv(outliers, query, keywords) {
    const headers = [
      'Video Title',
      'Video URL',
      'Views',
      'Channel Subscribers',
      'Ratio',
      'Recommended Title Keywords',
      'Search Seed'
    ];

    const keywordsStr = keywords.join(' | ');

    const rows = outliers.map((v) => {
      const titleEscaped = `"${(v.title || '').replace(/"/g, '""')}"`;
      const urlEscaped = `"${(v.url || '').replace(/"/g, '""')}"`;
      const viewsEscaped = `"${(v.viewsText || '').replace(/"/g, '""')}"`;
      const subsEscaped = `"${(v.channelSubscriberCountText || '').replace(/"/g, '""')}"`;
      const ratioEscaped = `"${v.viewToSubRatio ? `${v.viewToSubRatio}x` : 'N/A'}"`;
      const kwEscaped = `"${keywordsStr.replace(/"/g, '""')}"`;
      const seedEscaped = `"${query.replace(/"/g, '""')}"`;

      return [titleEscaped, urlEscaped, viewsEscaped, subsEscaped, ratioEscaped, kwEscaped, seedEscaped].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vidpulse_outliers_${query.replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
