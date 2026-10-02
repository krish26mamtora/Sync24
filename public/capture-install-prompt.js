window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.__sync24InstallPrompt = event;
  window.dispatchEvent(new Event("sync24installprompt"));
});