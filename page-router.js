(function () {
  "use strict";

  const EVENT_NAME = "x-user-all-routechange";
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

  function isReservedProfileName(name) {
    return RESERVED_PATHS.has(name.toLowerCase());
  }

  function isProfileRootPath(pathname) {
    const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/);
    return Boolean(match && !isReservedProfileName(match[1]));
  }

  function isProfileMediaPath(pathname) {
    const match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/media\/?$/);
    return Boolean(match && !isReservedProfileName(match[1]));
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

  function notifyRouteChange() {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  function patchHistoryMethod(methodName) {
    const original = window.history[methodName];
    if (typeof original !== "function") {
      return;
    }

    window.history[methodName] = function patchedHistoryMethod() {
      if (arguments.length >= 3 && typeof arguments[2] === "string") {
        const nextUrl = normalizeXUrl(arguments[2]);
        if (nextUrl) {
          arguments[2] = nextUrl;
        }
      }

      const result = original.apply(this, arguments);
      notifyRouteChange();
      return result;
    };
  }

  function rewriteClickedLink(event) {
    const anchor = event.target && event.target.closest && event.target.closest("a[href]");
    if (!anchor) {
      return;
    }

    const nextUrl = normalizeXUrl(anchor.href);
    if (nextUrl) {
      anchor.href = nextUrl;
    }
  }

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  ["pointerdown", "mousedown", "mouseover", "touchstart", "focusin", "click"].forEach((eventName) => {
    window.addEventListener(eventName, rewriteClickedLink, true);
  });
  window.addEventListener("popstate", notifyRouteChange);
})();
