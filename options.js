(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    replaceTitleSuffix: true
  };

  const checkbox = document.getElementById("replaceTitleSuffix");
  const status = document.getElementById("status");

  function setStatus(message) {
    status.textContent = message;
    window.setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = "";
      }
    }, 1200);
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    checkbox.checked = Boolean(items.replaceTitleSuffix);
  });

  checkbox.addEventListener("change", () => {
    chrome.storage.sync.set(
      { replaceTitleSuffix: checkbox.checked },
      () => setStatus("保存しました")
    );
  });
})();
