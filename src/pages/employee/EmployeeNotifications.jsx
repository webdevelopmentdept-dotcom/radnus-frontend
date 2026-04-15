import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPE_META = {
  hr:         { label: "HR",         color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "🏢" },
  attendance: { label: "Attendance", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "📅" },
  leave:      { label: "Leave",      color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff", icon: "🌴" },
  salary:     { label: "Salary",     color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", icon: "💰" },
  system:     { label: "System",     color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "⚙️" },
  announcement: { label: "Announcement", color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4", icon: "📢" },
};

const DEFAULT_META = { label: "General", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "🔔" };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");
  const [markingAll,    setMarkingAll]    = useState(false);

  const empId = localStorage.getItem("employeeId");

  useEffect(() => {
    if (!empId) { window.location.href = "/login"; return; }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/notifications/${empId}`);
      const data = res.data?.data || res.data || [];
      // Sort: unread first, then by date
      setNotifications(
        [...data].sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      );
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) { console.log(e); }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/${empId}`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) { console.log(e); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter types available from actual data
  const availableTypes = ["all", ...new Set(notifications.map(n => n.type).filter(Boolean))];

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.type === filter);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <EmployeeLayout>
      <style>{`
        .notif-page { background: #f4f6fb; min-height: 100vh; }

        /* Header */
        .notif-header {
          background: #fff; padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          position: sticky; top: 0; z-index: 50;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        @media (min-width: 768px) { .notif-header { padding: 14px 28px; } }

        /* Content */
        .notif-content { padding: 14px; max-width: 800px; margin: 0 auto; }
        @media (min-width: 768px) { .notif-content { padding: 24px 28px; } }

        /* Summary cards */
        .notif-summary {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 16px;
        }
        @media (min-width: 576px) { .notif-summary { gap: 14px; margin-bottom: 20px; } }

        .notif-sum-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 14px 12px; text-align: center;
        }
        .notif-sum-card .val {
          font-size: 24px; font-weight: 800; line-height: 1;
        }
        .notif-sum-card .lbl {
          font-size: 11px; color: #9ca3af; font-weight: 500;
          margin-top: 4px; text-transform: uppercase; letter-spacing: 0.4px;
        }

        /* Filter chips */
        .notif-filters {
          display: flex; gap: 8px; overflow-x: auto;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
          margin-bottom: 14px; padding-bottom: 2px;
        }
        .notif-filters::-webkit-scrollbar { display: none; }

        .notif-chip {
          border: 1.5px solid #e5e7eb; background: #fff;
          padding: 6px 14px; border-radius: 99px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          white-space: nowrap; flex-shrink: 0;
          transition: all 0.15s; color: #6b7280;
          display: flex; align-items: center; gap: 5px;
        }
        .notif-chip.active {
          background: #2563eb; border-color: #2563eb;
          color: #fff;
        }
        .notif-chip:hover:not(.active) { border-color: #2563eb; color: #2563eb; }

        /* Mark all btn */
        .notif-mark-all {
          border: 1.5px solid #2563eb; background: #fff; color: #2563eb;
          padding: 7px 14px; border-radius: 8px; font-size: 12px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          white-space: nowrap; font-family: inherit;
        }
        .notif-mark-all:hover { background: #eff6ff; }
        .notif-mark-all:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Notification item */
        .notif-item {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 14px 16px;
          display: flex; gap: 12px; align-items: flex-start;
          transition: all 0.18s; cursor: pointer;
          margin-bottom: 8px;
        }
        .notif-item.unread {
          border-left: 3px solid #2563eb;
          background: #fafcff;
        }
        .notif-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); }

        .notif-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }

        .notif-body { flex: 1; min-width: 0; }
        .notif-title {
          font-size: 13px; font-weight: 700; color: #111827;
          margin: 0 0 3px; line-height: 1.4;
        }
        .notif-item.unread .notif-title { color: #1d4ed8; }
        .notif-msg {
          font-size: 12px; color: #6b7280; margin: 0 0 6px;
          line-height: 1.5;
        }
        .notif-footer {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .notif-time { font-size: 11px; color: #9ca3af; font-weight: 500; }
        .notif-type-badge {
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          border-radius: 99px; letter-spacing: 0.3px;
        }

        .notif-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #2563eb; flex-shrink: 0; margin-top: 6px;
        }

        /* Empty state */
        .notif-empty {
          text-align: center; padding: 60px 20px;
          background: #fff; border-radius: 14px;
          border: 1px solid #e5e7eb;
        }
      `}</style>

      <div className="notif-page">

        {/* Header */}
        <header className="notif-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Notifications</div>
            {unreadCount > 0 && (
              <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>
                {unreadCount} unread
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="notif-mark-all"
              onClick={markAllRead}
              disabled={markingAll}
              style={{ marginLeft: "auto" }}
            >
              {markingAll ? "Marking..." : "✓ Mark all read"}
            </button>
          )}
        </header>

        <div className="notif-content">

          {/* Summary cards */}
          <div className="notif-summary">
            {[
              { val: notifications.length,                     lbl: "Total",   color: "#111827" },
              { val: unreadCount,                              lbl: "Unread",  color: "#2563eb" },
              { val: notifications.length - unreadCount,       lbl: "Read",    color: "#16a34a" },
            ].map((s, i) => (
              <div key={i} className="notif-sum-card">
                <div className="val" style={{ color: s.color }}>{s.val}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div className="notif-filters" style={{ flex: 1 }}>
              {availableTypes.map(type => {
                const meta = TYPE_META[type] || DEFAULT_META;
                const count = type === "all"
                  ? notifications.length
                  : notifications.filter(n => n.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`notif-chip ${filter === type ? "active" : ""}`}
                  >
                    {type !== "all" && <span>{meta.icon}</span>}
                    {type === "all" ? "All" : meta.label}
                    <span style={{
                      background: filter === type ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                      color: filter === type ? "#fff" : "#374151",
                      borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification List */}
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                No notifications
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((notif) => {
                const meta = TYPE_META[notif.type] || DEFAULT_META;
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif._id}
                    className={`notif-item ${isUnread ? "unread" : ""}`}
                    onClick={() => isUnread && markAsRead(notif._id)}
                  >
                    {/* Icon */}
                    <div className="notif-icon-wrap" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.icon}
                    </div>

                    {/* Body */}
                    <div className="notif-body">
                      <p className="notif-title">{notif.title || "Notification"}</p>
                      <p className="notif-msg">{notif.message}</p>
                      <div className="notif-footer">
                        <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                        <span className="notif-type-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                        {isUnread && (
                          <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600 }}>
                            • Tap to mark read
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && <div className="notif-dot" />}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </EmployeeLayout>
  );
}