(function () {
  "use strict";

  const EVENT_NAME = "x-user-all-routechange";

  function notifyRouteChange() {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  function patchHistoryMethod(methodName) {
    const original = window.history[methodName];
    if (typeof original !== "function") {
      return;
    }

    window.history[methodName] = function patchedHistoryMethod() {
      const result = original.apply(this, arguments);
      notifyRouteChange();
      return result;
    };
  }

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
})();
