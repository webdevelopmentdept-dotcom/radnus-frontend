import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prev = useRef(null);

  // admin-role "employee" = Radnus Connect-only login → no notifications for them
  const limited = localStorage.getItem("admin-role") === "employee";

  useEffect(() => {
    if (limited) return;
    let alive = true;

    const load = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      try {
        const { data } = await axios.get(`${API_BASE}/api/notifications/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!alive || !data?.success) return;
        const n = data.unreadCount || 0;
        if (prev.current !== null && n > prev.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 4000);
        }
        prev.current = n;
        setUnread(n);
      } catch (_) {
        /* ignore – next poll will retry */
      }
    };

    load();
    const t = setInterval(load, 30000);
    window.addEventListener("admin-notifications-updated", load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("admin-notifications-updated", load);
    };
  }, [limited]);

  if (limited) return null;

  return (
    <>
      <style>{`
        @keyframes adminBellRing { 0%,100%{transform:rotate(0)} 20%{transform:rotate(14deg)} 40%{transform:rotate(-12deg)} 60%{transform:rotate(8deg)} 80%{transform:rotate(-6deg)} }
        .admin-bell-btn.ring svg { animation: adminBellRing 0.8s ease 3; transform-origin: 50% 0; }
      `}</style>
      <button
        type="button"
        className={`admin-bell-btn ${pulse ? "ring" : ""}`}
        onClick={() => navigate("/admin/notifications")}
        title={unread ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "Notifications"}
        style={{
          position: "fixed", top: 12, right: 22, zIndex: 1050,
          width: 42, height: 42, borderRadius: "50%",
          background: "#fff", color: "#111827",
          border: "1px solid #e5e7eb", boxShadow: "0 4px 14px rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, padding: "0 5px",
              borderRadius: 10, background: "#dc2626", color: "#fff",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </>
  );
}