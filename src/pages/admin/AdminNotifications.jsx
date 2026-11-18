import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPE_ICON = {
  admin_award: "🏆",
  admin_connect: "🛠️",
  admin_lead: "📈",
  admin_applicant: "🎓",
  admin_admission: "📝",
  general: "🔔",
};

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
});

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 172800) return "yesterday";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/notifications/admin/all`, authHeaders());
      if (data?.success) {
        setItems(data.data || []);
        setUnread(data.unreadCount || 0);
      }
    } catch (_) {
            // not logged in as admin → same behaviour as AdminDashboard
      if (_?.response?.status === 401 || _?.response?.status === 403) window.location.replace("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const ping = () => window.dispatchEvent(new Event("admin-notifications-updated"));

  const markAll = async () => {
    try {
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/admin`, {}, authHeaders());
      await load();
      ping();
    } catch (_) {}
  };

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await axios.put(`${API_BASE}/api/notifications/admin/${n._id}/read`, {}, authHeaders());
        setItems((p) => p.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
        ping();
      } catch (_) {}
    }
    if (n.link) navigate(n.link);
  };

  const shown = tab === "unread" ? items.filter((n) => !n.isRead) : items;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 16px", paddingRight: 56 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700 }}>Notifications</h4>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{unread} unread</div>
        </div>
        <button
          onClick={markAll}
          disabled={!unread}
          style={{
            background: unread ? "#4f46e5" : "#c7d2fe", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600,
            cursor: unread ? "pointer" : "default",
          }}
        >
          Mark all as read
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["all", "All"], ["unread", "Unread"]].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              border: "1px solid #e5e7eb", borderRadius: 20, padding: "5px 14px", fontSize: 13,
              background: tab === k ? "#111827" : "#fff", color: tab === k ? "#fff" : "#374151", cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>
      ) : shown.length === 0 ? (
        <div style={{ padding: 50, textAlign: "center", color: "#6b7280", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          🎉 You're all caught up
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((n) => (
            <div
              key={n._id}
              onClick={() => open(n)}
              style={{
                display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
                background: n.isRead ? "#fff" : "#eef2ff",
                border: `1px solid ${n.isRead ? "#e5e7eb" : "#c7d2fe"}`,
                borderRadius: 12, padding: "12px 14px",
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {TYPE_ICON[n.type] || "🔔"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.isRead ? 600 : 700, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
              </div>
              {!n.isRead && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4f46e5", marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}