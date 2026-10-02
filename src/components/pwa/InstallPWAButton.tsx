"use client";

import { useEffect, useState } from "react";

/*
 * Install-as-app button.
 *
 * - Chrome / Edge / Android / Samsung Internet: uses the `beforeinstallprompt`
 *   event to trigger the native install dialog.
 * Chromium browsers use `beforeinstallprompt` for the native install dialog.
 * iOS does not expose an API for triggering its Add to Home Screen flow.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __sync24InstallPrompt?: BeforeInstallPromptEvent;
  }
}

/*
 * The browser fires `beforeinstallprompt` once, early. If it fires before this
 * component mounts we'd miss it, so capture it at module level and let any
 * mounted component subscribe.
 */
let deferredPrompt: BeforeInstallPromptEvent | null =
  typeof window === "undefined" ? null : (window.__sync24InstallPrompt ?? null);
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("sync24installprompt", () => {
    deferredPrompt = window.__sync24InstallPrompt ?? null;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.__sync24InstallPrompt = undefined;
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function supportsNativeInstallPrompt(): boolean {
  const userAgent = navigator.userAgent;
  const isIOS =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return !isIOS && /chrome|chromium|edg|samsungbrowser/i.test(userAgent);
}

function isEmbeddedElectronBrowser(): boolean {
  return /electron/i.test(navigator.userAgent);
}

export default function InstallPWAButton() {
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [supportsInstall, setSupportsInstall] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInstalled(isStandalone());
    setSupportsInstall(supportsNativeInstallPrompt());
    setCanPrompt(deferredPrompt !== null);

    const sync = () => {
      setCanPrompt(deferredPrompt !== null);
      if (deferredPrompt) setMessage("");
      if (deferredPrompt === null && isStandalone()) setInstalled(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setCanPrompt(false);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) setInstalled(true);
    };

    listeners.add(sync);
    window.addEventListener("appinstalled", onInstalled);
    mediaQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      listeners.delete(sync);
      window.removeEventListener("appinstalled", onInstalled);
      mediaQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  async function handleClick() {
    const promptEvent = deferredPrompt;

    if (!promptEvent) {
      setMessage(
        isEmbeddedElectronBrowser()
          ? "The VS Code browser cannot install PWAs. Open Sync24 in Chrome or Edge."
          : "This browser has not made the native install prompt available for this page.",
      );
      return;
    }

    deferredPrompt = null;
    window.__sync24InstallPrompt = undefined;
    setMessage("");
    notify();

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        setInstalled(true);
      }
    } catch (error) {
      console.error("[PWA] Install prompt failed", error);
      setMessage("The browser could not open the install prompt.");
    }
  }

  if (installed || (!supportsInstall && !canPrompt)) return null;

  return (
    <span className="install-pwa">
      <button
        type="button"
        className="install-pwa-button"
        onClick={handleClick}
        aria-label="Install Sync24 app"
        title="Install Sync24 as an app"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        <span className="install-pwa-label">Install</span>
      </button>
      {message && (
        <span className="install-pwa-status" role="status" aria-live="polite">
          {message}
        </span>
      )}
    </span>
  );
}
