"use client";

import { useState, useSyncExternalStore } from "react";

/*
 * Install-as-app button.
 *
 * - Chrome / Edge / Android / Samsung Internet: native install prompt.
 * - iOS: browser-managed Add to Home Screen flow.
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

let deferredPrompt: BeforeInstallPromptEvent | null =
  typeof window === "undefined" ? null : (window.__sync24InstallPrompt ?? null);

let appInstalled = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const mediaQuery = window.matchMedia("(display-mode: standalone)");

  mediaQuery.addEventListener("change", notify);

  return () => {
    listeners.delete(listener);
    mediaQuery.removeEventListener("change", notify);
  };
}

function getInstalledSnapshot(): boolean {
  if (typeof window === "undefined") return false;

  return (
    appInstalled ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getCanPromptSnapshot(): boolean {
  return deferredPrompt !== null;
}

function getSupportsInstallSnapshot(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;

  const isIOS =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return !isIOS && /chrome|chromium|edg|samsungbrowser/i.test(userAgent);
}

// Server snapshots prevent hydration mismatches.
const getServerSnapshot = () => false;

// Capture the native install prompt.
if (typeof window !== "undefined") {
  window.addEventListener("sync24installprompt", () => {
    deferredPrompt = window.__sync24InstallPrompt ?? null;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    appInstalled = true;
    deferredPrompt = null;
    window.__sync24InstallPrompt = undefined;
    notify();
  });
}

function isEmbeddedElectronBrowser(): boolean {
  return /electron/i.test(navigator.userAgent);
}

export default function InstallPWAButton() {
  const installed = useSyncExternalStore(
    subscribe,
    getInstalledSnapshot,
    getServerSnapshot,
  );

  const canPrompt = useSyncExternalStore(
    subscribe,
    getCanPromptSnapshot,
    getServerSnapshot,
  );

  const supportsInstall = useSyncExternalStore(
    subscribe,
    getSupportsInstallSnapshot,
    getServerSnapshot,
  );

  const [message, setMessage] = useState("");

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
        appInstalled = true;
        notify();
      }
    } catch (error) {
      console.error("[PWA] Install prompt failed", error);
      setMessage("The browser could not open the install prompt.");
    }
  }

  if (installed || (!supportsInstall && !canPrompt)) {
    return null;
  }

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
