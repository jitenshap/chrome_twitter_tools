(function () {
  "use strict";

  const SETTINGS_KEY = "replaceTitleSuffix";
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
  let applyingTitle = false;
  let lastSeenUrl = window.location.href;
  let routeCheckTimer = null;

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

    if (isProfileMediaPath(url.pathname) && url.searchParams.get("filter") !== "all") {
      url.searchParams.set("filter", "all");
      return url.toString();
    }

    return null;
  }

  function redirectCurrentPageIfNeeded() {
    const nextUrl = normalizeXUrl(window.location.href);
    if (!nextUrl) {
      return;
    }

    window.location.replace(nextUrl);
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

  function scheduleRouteCheck() {
    if (routeCheckTimer !== null) {
      return;
    }

    routeCheckTimer = window.setTimeout(() => {
      routeCheckTimer = null;
      redirectCurrentPageIfNeeded();
      rewriteTitle();
    }, 0);
  }

  function checkForUrlChange() {
    if (lastSeenUrl === window.location.href) {
      return;
    }

    lastSeenUrl = window.location.href;
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
  loadSettings();
  installRouteWatcher();
  window.addEventListener("DOMContentLoaded", () => {
    installTitleObserver();
    scheduleRouteCheck();
  });

  if (document.readyState !== "loading") {
    installTitleObserver();
    scheduleRouteCheck();
  }
})();
