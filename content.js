(function () {
  "use strict";

  const SETTINGS_KEY = "replaceTitleSuffix";
  const MEDIA_FILTER_VALUE = "photo";
  const DEFAULT_SETTINGS = {
    replaceTitleSuffix: true
  };

  const RESERVED_PATHS = new Set([
    "about",
    "account",
    "compose",
    "download",
    "explore",
    "flow",
    "home",
    "i",
    "jobs",
    "login",
    "logout",
    "messages",
    "notifications",
    "privacy",
    "search",
    "settings",
    "share",
    "tos",
    "welcome"
  ]);

  let replaceTitleSuffix = DEFAULT_SETTINGS.replaceTitleSuffix;
  let titleObserver = null;
  let mediaTabObserver = null;
  let applyingTitle = false;
  let lastSeenUrl = window.location.href;
  let routeCheckTimer = null;
  let mediaTabClickTimer = null;
  let lastMediaMenuRevealUrl = "";
  let bypassNormalizationUrl = "";
  let programmaticPopstate = false;
  let normalizationSuspendedUntil = 0;

  function isProfileRootPath(pathname) {
    const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/);
    if (!match) {
      return false;
    }

    return !RESERVED_PATHS.has(match[1].toLowerCase());
  }

  function isProfileAllPath(pathname) {
    const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/all\/?$/);
    if (!match) {
      return false;
    }

    return !RESERVED_PATHS.has(match[1].toLowerCase());
  }

  function isProfileMediaPath(pathname) {
    const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/media\/?$/);
    if (!match) {
      return false;
    }

    return !RESERVED_PATHS.has(match[1].toLowerCase());
  }

  function normalizeXUrl(rawUrl) {
    const url = new URL(rawUrl, window.location.href);
    if (url.hostname !== "x.com") {
      return null;
    }

    if (isProfileRootPath(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/all`;
      return url.toString();
    }

    if (isProfileMediaPath(url.pathname) && url.searchParams.get("filter") !== MEDIA_FILTER_VALUE) {
      url.searchParams.set("filter", MEDIA_FILTER_VALUE);
      return url.toString();
    }

    return null;
  }

  function isPhotoMediaUrl(rawUrl) {
    const url = new URL(rawUrl, window.location.href);
    return url.hostname === "x.com" && isProfileMediaPath(url.pathname) && url.searchParams.get("filter") === MEDIA_FILTER_VALUE;
  }

  function redirectCurrentPageIfNeeded() {
    if (Date.now() < normalizationSuspendedUntil) {
      return;
    }

    if (bypassNormalizationUrl === window.location.href) {
      return;
    }

    const nextUrl = normalizeXUrl(window.location.href);
    if (!nextUrl) {
      return;
    }

    navigateWithinX(nextUrl);
  }

  function navigateWithinX(nextUrl) {
    try {
      const url = new URL(nextUrl);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      lastSeenUrl = window.location.href;
      programmaticPopstate = true;
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
      window.setTimeout(() => {
        programmaticPopstate = false;
      }, 0);
    } catch {
      window.location.replace(nextUrl);
    }
  }

  function isSelectedTab(anchor) {
    return anchor.getAttribute("aria-selected") === "true" || anchor.getAttribute("role") === "tab" && anchor.getAttribute("tabindex") === "0";
  }

  function selectPhotoMediaTabIfNeeded() {
    if (!isPhotoMediaUrl(window.location.href)) {
      lastMediaMenuRevealUrl = "";
      return;
    }

    const photoTab = document.querySelector('a[href*="/media?filter=photo"], a[href*="/media?filter=photos"]');
    if (photoTab) {
      if (!isSelectedTab(photoTab)) {
        photoTab.click();
      }

      return;
    }

    const currentMediaTab = document.querySelector(
      'a[href$="/media"], a[href*="/media?filter=video"], a[href*="/media?filter=videos"]'
    );
    if (!currentMediaTab || lastMediaMenuRevealUrl === window.location.href) {
      return;
    }

    lastMediaMenuRevealUrl = window.location.href;
    currentMediaTab.click();
    scheduleMediaTabSelection();
  }

  function scheduleMediaTabSelection() {
    if (mediaTabClickTimer !== null) {
      return;
    }

    mediaTabClickTimer = window.setTimeout(() => {
      mediaTabClickTimer = null;
      selectPhotoMediaTabIfNeeded();
    }, 250);
  }

  function rewriteTitle() {
    if (!replaceTitleSuffix || applyingTitle) {
      return;
    }

    const nextTitle = document.title.replace(/\s\/\sX$/, " / Twitter");
    if (nextTitle === document.title) {
      return;
    }

    applyingTitle = true;
    document.title = nextTitle;
    applyingTitle = false;
  }

  function installTitleObserver() {
    if (titleObserver || !document.documentElement) {
      return;
    }

    titleObserver = new MutationObserver(rewriteTitle);
    titleObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    rewriteTitle();
  }

  function installMediaTabObserver() {
    if (mediaTabObserver || !document.documentElement) {
      return;
    }

    mediaTabObserver = new MutationObserver(scheduleMediaTabSelection);
    mediaTabObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    scheduleMediaTabSelection();
  }

  function scheduleRouteCheck() {
    if (routeCheckTimer !== null) {
      return;
    }

    routeCheckTimer = window.setTimeout(() => {
      routeCheckTimer = null;
      redirectCurrentPageIfNeeded();
      scheduleMediaTabSelection();
      rewriteTitle();
    }, 100);
  }

  function checkForUrlChange() {
    if (lastSeenUrl === window.location.href) {
      return;
    }

    lastSeenUrl = window.location.href;
    if (
      bypassNormalizationUrl &&
      bypassNormalizationUrl !== window.location.href &&
      Date.now() >= normalizationSuspendedUntil
    ) {
      bypassNormalizationUrl = "";
    }

    scheduleRouteCheck();
  }

  function installRouteWatcher() {
    window.setInterval(checkForUrlChange, 250);
    window.addEventListener("x-user-all-routechange", () => {
      lastSeenUrl = window.location.href;
      scheduleRouteCheck();
    });
    window.addEventListener("focus", checkForUrlChange);
    window.addEventListener("pageshow", checkForUrlChange);
    window.addEventListener("popstate", () => {
      lastSeenUrl = window.location.href;
      if (!programmaticPopstate) {
        bypassNormalizationUrl = window.location.href;
        normalizationSuspendedUntil = Date.now() + 2000;
      }

      scheduleRouteCheck();
    });
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      replaceTitleSuffix = Boolean(items[SETTINGS_KEY]);
      rewriteTitle();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes[SETTINGS_KEY]) {
        return;
      }

      replaceTitleSuffix = Boolean(changes[SETTINGS_KEY].newValue);
      rewriteTitle();
    });
  }

  redirectCurrentPageIfNeeded();
  selectPhotoMediaTabIfNeeded();
  loadSettings();
  installRouteWatcher();
  window.addEventListener("DOMContentLoaded", () => {
    installTitleObserver();
    installMediaTabObserver();
    scheduleRouteCheck();
  });

  if (document.readyState !== "loading") {
    installTitleObserver();
    installMediaTabObserver();
    scheduleRouteCheck();
  }
})();
