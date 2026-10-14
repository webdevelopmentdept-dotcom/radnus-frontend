// src/components/shared/PushNotificationManager.jsx
// Mount ONCE in App.jsx. It:
//  1. shows a small "Enable notifications" prompt on employee / HR pages,
//  2. silently (re)subscribes the device once permission is granted,
//  3. routes the SPA when a push popup is clicked.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isPushSupported, subscribeToPush, enablePush } from "../../utils/pushNotifications";

const DISMISS_KEY = "pushPromptDismissedAt";
const DISMISS_DAYS = 7;

function getHrId() {
  const raw = localStorage.getItem("hrUser");
  if (raw) {
    try {
      const o = JSON.parse(raw);
      const id = o?._id || o?.id || o?.hrId || o?.userId;
      if (id) return String(id);
    } catch (_) {}
  }
  const id = localStorage.getItem("hrId");
  if (id && id !== "undefined" && id !== "null" && id.trim() !== "") return id.trim();
  return null;
}

// Which logged-in area are we in?  → { role, userId } or null
function getContext(pathname) {
  const p = pathname.toLowerCase();
  if (p.startsWith("/hr") && p !== "/hr/login") {
    if ((localStorage.getItem("hrRole") || "hr") === "employee") return null; // same rule as HrDashboard
    const id = getHrId();
    return id ? { role: "hr", userId: id } : null;
  }
  if (
    p.startsWith("/employee") &&
    !["/employee/login", "/employee/forgot-password"].includes(p) &&
    !p.startsWith("/employee/reset-password")
  ) {
    const id = localStorage.getItem("employeeId");
    return id ? { role: "employee", userId: id } : null;
  }
  return null;
}

export default function PushNotificationManager() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const syncedRef = useRef("");
  const [permission, setPermission] = useState(
    isPushSupported() ? Notification.permission : "unsupported"
  );
  const [busy, setBusy] = useState(false);

  const ctx = getContext(pathname);
  const ctxKey = ctx ? `${ctx.role}:${ctx.userId}` : "";

  // Notification clicked while the site is already open → client-side navigate
  useEffect(() => {
    if (!isPushSupported()) return;
    const onMsg = (e) => {
      if (e.data?.type === "PUSH_NAVIGATE" && e.data.url) navigate(e.data.url);
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [navigate]);

  // Already allowed → make sure this device is registered for the current user
  useEffect(() => {
    if (!ctx || permission !== "granted" || syncedRef.current === ctxKey) return;
    syncedRef.current = ctxKey;
    subscribeToPush(ctx.role, ctx.userId).catch((e) => {
      syncedRef.current = "";
      console.log("push sync failed:", e);
    });
  }, [ctxKey, permission]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
  const recentlyDismissed = Date.now() - dismissedAt < DISMISS_DAYS * 86400000;

  if (!ctx || permission !== "default" || recentlyDismissed) return null;

  const onEnable = async () => {
    setBusy(true);
    try {
      setPermission(await enablePush(ctx.role, ctx.userId));
    } catch (e) {
      console.log(e);
    } finally {
      setBusy(false);
    }
  };

  const onLater = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setPermission("dismissed");
  };

  return (
    <div style={S.card} role="dialog" aria-label="Enable notifications">
      <div style={S.icon}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.title}>Turn on notifications</div>
        <div style={S.sub}>Get leave, salary &amp; HR alerts on your device — even when this tab is closed.</div>
        <div style={S.row}>
          <button style={S.primary} onClick={onEnable} disabled={busy}>
            {busy ? "Enabling…" : "Enable"}
          </button>
          <button style={S.ghost} onClick={onLater}>Not now</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  card: {
    position: "fixed", right: 20, bottom: 20, zIndex: 99999,
    width: "min(360px, calc(100vw - 32px))",
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "#fff", color: "#111827",
    border: "1px solid #e5e7eb", borderRadius: 14, padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.18)", fontFamily: "inherit",
  },
  icon: {
    width: 38, height: 38, borderRadius: 10, background: "#eef2ff",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
  },
  title: { fontWeight: 700, fontSize: 14 },
  sub: { fontSize: 12.5, color: "#6b7280", marginTop: 2, lineHeight: 1.4 },
  row: { display: "flex", gap: 8, marginTop: 10 },
  primary: {
    background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8,
    padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  ghost: {
    background: "transparent", color: "#6b7280", border: "none",
    padding: "7px 10px", fontSize: 13, cursor: "pointer",
  },
};