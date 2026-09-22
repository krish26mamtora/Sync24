"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationButton() {
  const [status, setStatus] = useState<
    "checking" | "idle" | "loading" | "enabled" | "denied" | "error"
  >("checking");

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

        if (subscription) {
          setStatus("enabled");
        } else {
          setStatus("idle");
        }
      } catch (error) {
        console.error("[PUSH] Failed to check subscription:", error);
        setStatus("error");
      }
    }

    checkSubscription();
  }, []);

  async function enableNotifications() {
    try {
      setStatus("loading");

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

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to save notification subscription.");
      }

      setStatus("enabled");
    } catch (error) {
      console.error("[PUSH] Failed:", error);
      setStatus("error");
    }
  }

  if (status === "checking") {
    return null;
  }

  if (status === "enabled") {
    return (
      <button type="button" disabled>
        🔔 Notifications enabled
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      disabled={status === "loading"}
    >
      {status === "loading"
        ? "Enabling..."
        : status === "denied"
          ? "Notifications blocked"
          : status === "error"
            ? "Try notifications again"
            : "🔔 Enable notifications"}
    </button>
  );
}
