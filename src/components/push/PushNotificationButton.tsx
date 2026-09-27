"use client";

import { useEffect, useState } from "react";

type PushStatus =
  | "checking"
  | "idle"
  | "loading"
  | "unsubscribing"
  | "enabled"
  | "denied"
  | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function NotificationIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 8C18 5.79 16.21 4 14 4H10C7.79 4 6 5.79 6 8V12C6 13.1 5.55 14.16 4.76 14.95L4 15.7V17H20V15.7L19.24 14.95C18.45 14.16 18 13.1 18 12V8Z"
        fill="white"
      />

      <path
        d="M9 20C9.5 21.1 10.55 21.75 12 21.75C13.45 21.75 14.5 21.1 15 20H9Z"
        fill="white"
      />
    </svg>
  );
}

export default function PushNotificationButton() {
  const [status, setStatus] = useState<PushStatus>("checking");

  // Check existing subscription when component mounts
  useEffect(() => {
    async function checkSubscription() {
      try {
        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          setStatus("error");
          return;
        }

        const permission = Notification.permission;

        if (permission === "denied") {
          setStatus("denied");
          return;
        }

        const registration =
          await navigator.serviceWorker.getRegistration("/sw.js");

        if (!registration) {
          setStatus("idle");
          return;
        }

        const subscription = await registration.pushManager.getSubscription();

        setStatus(subscription ? "enabled" : "idle");
      } catch (error) {
        console.error("[PUSH] Failed to check subscription:", error);
        setStatus("error");
      }
    }

    checkSubscription();
  }, []);

  // Subscribe to push notifications
  async function enableNotifications() {
    try {
      setStatus("loading");

      console.log("[PUSH] Starting subscription...");

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers are not supported.");
      }

      if (!("PushManager" in window)) {
        throw new Error("Push notifications are not supported.");
      }

      if (!("Notification" in window)) {
        throw new Error("Notifications are not supported.");
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error("VAPID public key is missing.");
      }

      // 1. Request notification permission
      console.log("[PUSH] Requesting permission...");

      const permission = await Notification.requestPermission();

      console.log("[PUSH] Permission:", permission);

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      // 2. Register service worker
      console.log("[PUSH] Registering service worker...");

      await navigator.serviceWorker.register("/sw.js");

      // 3. Wait for service worker to become active
      console.log("[PUSH] Waiting for service worker...");

      const registration = await navigator.serviceWorker.ready;

      console.log("[PUSH] Service worker ready.");

      // 4. Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // 5. Create subscription if one doesn't exist
      if (!subscription) {
        console.log("[PUSH] Creating new subscription...");

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      console.log("[PUSH] Subscription obtained.");

      // 6. Save subscription in Supabase
      console.log("[PUSH] Saving subscription to backend...");

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save subscription.");
      }

      console.log("[PUSH] Successfully subscribed:", result);

      setStatus("enabled");
    } catch (error) {
      console.error("[PUSH] Subscription failed:", error);

      setStatus("error");
    }
  }

  // Unsubscribe from push notifications
  async function disableNotifications() {
    try {
      setStatus("unsubscribing");

      console.log("[PUSH] Starting unsubscribe...");

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers are not supported.");
      }

      // 1. Get active service worker
      const registration = await navigator.serviceWorker.ready;

      // 2. Get existing subscription
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("[PUSH] No active subscription found.");

        setStatus("idle");
        return;
      }

      const endpoint = subscription.endpoint;

      // 3. Remove subscription from Supabase
      console.log("[PUSH] Removing subscription from backend...");

      const response = await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to remove subscription from database.",
        );
      }

      console.log("[PUSH] Database subscription removed.");

      // 4. Remove subscription from browser
      console.log("[PUSH] Unsubscribing from browser...");

      const unsubscribed = await subscription.unsubscribe();

      if (!unsubscribed) {
        throw new Error("Browser could not remove the subscription.");
      }

      console.log("[PUSH] Browser subscription removed.");

      // 5. Update UI
      setStatus("idle");

      console.log("[PUSH] Successfully unsubscribed.");
    } catch (error) {
      console.error("[PUSH] Unsubscribe failed:", error);

      setStatus("error");
    }
  }

  // Hide button while checking subscription
  if (status === "checking") {
    return null;
  }

  // Subscribed or unsubscribing state
  if (status === "enabled" || status === "unsubscribing") {
    return (
      <button
        type="button"
        className="push-button subscribed"
        onClick={disableNotifications}
        disabled={status === "unsubscribing"}
      >
        <NotificationIcon />

        <span>
          {status === "unsubscribing" ? "Unsubscribing..." : "Unsubscribe"}
        </span>
      </button>
    );
  }

  // Subscribe, denied, or error state
  return (
    <button
      type="button"
      className="push-button"
      onClick={enableNotifications}
      disabled={status === "loading"}
    >
      <NotificationIcon />

      <span>
        {status === "loading"
          ? "Subscribing..."
          : status === "denied"
            ? "Notifications blocked"
            : status === "error"
              ? "Try again"
              : "Subscribe"}
      </span>
    </button>
  );
}
