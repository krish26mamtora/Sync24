"use client";

import { useEffect, useState } from "react";

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
      <button type="button" className="push-button subscribed" disabled>
        <NotificationIcon />
        <span>Subscribed</span>
      </button>
    );
  }

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
