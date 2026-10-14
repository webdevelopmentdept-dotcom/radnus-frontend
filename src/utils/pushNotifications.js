// src/utils/pushNotifications.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getRegistration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/** Subscribe this browser and save the subscription for the logged-in user. */
export async function subscribeToPush(role, userId) {
  if (!isPushSupported() || Notification.permission !== "granted" || !userId) return false;

  const reg = await getRegistration();

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { data } = await axios.get(`${API_BASE}/api/notifications/push/public-key`);
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    } catch (err) {
      // stale subscription made with a different VAPID key → reset and retry once
      const old = await reg.pushManager.getSubscription();
      if (old) await old.unsubscribe();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    }
  }

  await axios.post(`${API_BASE}/api/notifications/push/subscribe`, {
    subscription: sub.toJSON(),
    recipient_id: String(userId),
    recipient_role: role,
  });
  return true;
}

/** Call on logout: removes ONLY this user's registration on this device
 *  (the same browser may still be registered as another identity, e.g. HR + employee). */
export async function unsubscribeFromPush(role, userId) {
  try {
    if (!isPushSupported() || !role || !userId) return;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await axios.post(`${API_BASE}/api/notifications/push/unsubscribe`, {
      endpoint: sub.endpoint,
      recipient_id: String(userId),
      recipient_role: role,
    });
  } catch (e) {
    console.log("unsubscribeFromPush:", e);
  }
}

/** Ask permission, subscribe, and show a confirmation popup. */
export async function enablePush(role, userId) {
  if (!isPushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  await subscribeToPush(role, userId);
  const reg = await getRegistration();
  reg.showNotification("Notifications enabled ✅", {
    body: "You'll now get Radnus alerts even when this tab is closed.",
    icon: "/favicon.ico",
  });
  return "granted";
}