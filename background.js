"use strict";

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

function isProfileRootPath(pathname) {
  const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/);
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
  const url = new URL(rawUrl);
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

function redirectTabIfNeeded(tabId, rawUrl) {
  const nextUrl = normalizeXUrl(rawUrl);
  if (!nextUrl) {
    return;
  }

  chrome.tabs.update(tabId, { url: nextUrl });
}

chrome.webNavigation.onCommitted.addListener(
  (details) => {
    if (details.frameId !== 0) {
      return;
    }

    redirectTabIfNeeded(details.tabId, details.url);
  },
  { url: [{ hostEquals: "x.com", schemes: ["https"] }] }
);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId !== 0) {
      return;
    }

    redirectTabIfNeeded(details.tabId, details.url);
  },
  { url: [{ hostEquals: "x.com", schemes: ["https"] }] }
);
