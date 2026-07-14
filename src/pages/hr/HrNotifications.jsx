import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  leave: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  attendance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  employee: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  ),
  general: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  checkAll: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 6 9 17 4 12"/><polyline points="23 6 12 17"/>
    </svg>
  ),
  send: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

const TYPE_META = {
  leave:      { label: "Leave",      color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", icon: "leave"      },
  attendance: { label: "Attendance", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "attendance" },
  employee:   { label: "Employee",   color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", icon: "employee"   },
  document:   { label: "Document",   color: "#047857", bg: "#f0fdf4", border: "#bbf7d0", icon: "document"   },
  system:     { label: "System",     color: "#374151", bg: "#f9fafb", border: "#e5e7eb", icon: "system"     },
};
const DEFAULT_META = { label: "General", color: "#374151", bg: "#f9fafb", border: "#e5e7eb", icon: "general" };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getHrId() {
  const hrUserRaw = localStorage.getItem("hrUser");
  if (hrUserRaw) {
    try {
      const obj = JSON.parse(hrUserRaw);
      const id = obj?._id || obj?.id || obj?.hrId || obj?.userId || obj?.empId;
      if (id) return String(id);
    } catch (_) {}
  }
  const hrId = localStorage.getItem("hrId");
  if (hrId && hrId !== "undefined" && hrId !== "null" && hrId.trim() !== "") return hrId.trim();
  const token = localStorage.getItem("hrToken");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload?._id || payload?.id || payload?.hrId || payload?.userId;
      if (id) return String(id);
    } catch (_) {}
  }
  const jsonKeys = ["user", "hr", "employee", "authUser", "loggedInUser", "currentUser", "userData", "auth"];
  for (const key of jsonKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        const id = obj?._id || obj?.id || obj?.hrId || obj?.userId || obj?.empId;
        if (id) return String(id);
      } catch (_) {}
    }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key);
    if (val && /^[a-f0-9]{24}$/i.test(val.trim())) return val.trim();
    if (val && val.startsWith("{")) {
      try {
        const obj = JSON.parse(val);
        const id = obj?._id || obj?.id || obj?.hrId || obj?.userId;
        if (id && String(id).length >= 10) return String(id);
      } catch (_) {}
    }
  }
  return null;
}

// புதுசு — active employees மட்டும் வரும்
// puthusu — approved + active employees rendume varum
async function fetchAllEmployees(apiBase) {
  try {
    const res = await axios.get(`${apiBase}/api/hr/employees`);
    const data = res.data?.data || res.data || [];
    const arr = Array.isArray(data) ? data : [];
    // approved + active status employees mattum filter pannu
    return arr.filter(emp => emp.status === "approved" || emp.status === "active");
  } catch (_) {
    return [];
  }
}

// ── Send Message Modal ────────────────────────────────────────────────────────
function SendMessageModal({ employees, onClose }) {
  const [selectedEmpId, setSelectedEmpId] = useState("all");
  const [msgTitle,      setMsgTitle]      = useState("");
  const [msgBody,       setMsgBody]       = useState("");
  const [sending,       setSending]       = useState(false);
  const [sendSuccess,   setSendSuccess]   = useState(false);
  const [sendError,     setSendError]     = useState("");

  const handleSend = async () => {
    setSendError("");
    if (!msgBody.trim()) { setSendError("Please enter a message."); return; }
    setSending(true);
    try {
      const employeeIds = selectedEmpId === "all" ? ["all"] : [selectedEmpId];
      await axios.post(`${API_BASE}/api/notifications/send-hr-message`, {
        employeeIds,
        title:   msgTitle.trim() || "HR Message",
        message: msgBody.trim(),
      });
      setSendSuccess(true);
      setMsgTitle("");
      setMsgBody("");
      setSelectedEmpId("all");
      setTimeout(() => { setSendSuccess(false); onClose(); }, 1800);
    } catch (e) {
      setSendError("Failed to send. Please try again.");
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-header-icon">{Icons.send}</div>
            <div>
              <div className="modal-title">Send Message</div>
              <div className="modal-sub">Notify employees directly</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">{Icons.close}</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          <div className="modal-field">
            <label className="modal-label">{Icons.users} Recipient</label>
            <select
              className="modal-select"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.name || emp.fullName || emp.employeeName || emp.email || emp._id}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">
              Title&nbsp;<span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              className="modal-input"
              type="text"
              placeholder="HR Message"
              value={msgTitle}
              onChange={e => setMsgTitle(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Message <span style={{ color: "#dc2626" }}>*</span></label>
            <textarea
              className="modal-textarea"
              placeholder="Type your message here..."
              value={msgBody}
              onChange={e => { setMsgBody(e.target.value); setSendError(""); }}
            />
          </div>

          {sendError   && <div className="modal-error">⚠ {sendError}</div>}
          {sendSuccess && <div className="modal-success">✓ Message sent successfully!</div>}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className="modal-btn-send"
            onClick={handleSend}
            disabled={sending || !msgBody.trim()}
          >
            {Icons.send}
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HrNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");
  const [markingAll,    setMarkingAll]    = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [employees,     setEmployees]     = useState([]);

  const hrId = getHrId();

  useEffect(() => {
    if (!hrId) { setLoading(false); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    fetchAllEmployees(API_BASE).then(setEmployees);
    return () => clearInterval(interval);
  }, [hrId]);

  const fetchNotifications = async () => {
    try {
      const res  = await axios.get(`${API_BASE}/api/notifications/hr/${hrId}`);
      const data = res.data?.data || res.data || [];
      setNotifications(
        [...data].sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      );
    } catch (e) { console.error("Fetch error:", e); }
    finally { setLoading(false); }
  };

  // ✅ Small helper — tells the layout (bell/toast) to refresh unread count instantly
  const notifyLayoutToRefresh = () => {
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      notifyLayoutToRefresh(); // ✅ bell/toast updates immediately
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/hr/${hrId}`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      notifyLayoutToRefresh(); // ✅ bell/toast updates immediately
    } catch (e) { console.error(e); }
    finally { setMarkingAll(false); }
  };

  const unreadCount    = notifications.filter(n => !n.isRead).length;
  const availableTypes = ["all", ...new Set(notifications.map(n => n.type).filter(Boolean))];
  const filtered       = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh" }}>
      <div style={{ width:28, height:28, border:"2.5px solid #e5e7eb", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin 0.75s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!hrId) return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"60vh", gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:"#111827" }}>Session expired</div>
      <div style={{ fontSize:12, color:"#9ca3af" }}>Please login again to continue.</div>
    </div>
  );

  return (
    <>
      <style>{`
        .hrn-wrap { background: #f8fafc; min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; }

        .hrn-header {
          background: #fff; border-bottom: 1px solid #e5e7eb;
          padding: 16px 24px; position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .hrn-header-left { display: flex; align-items: center; gap: 10px; }
        .hrn-header-icon { width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #1d4ed8; display: flex; align-items: center; justify-content: center; }
        .hrn-header-title { font-size: 15px; font-weight: 700; color: #111827; letter-spacing: -0.2px; }
        .hrn-header-sub   { font-size: 11px; color: #6b7280; margin-top: 1px; }
        .hrn-header-actions { display: flex; align-items: center; gap: 8px; }

        .hrn-btn-send-msg {
          display: flex; align-items: center; gap: 6px;
          background: #047857; color: #fff; border: none; border-radius: 7px;
          padding: 7px 13px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .hrn-btn-send-msg:hover { background: #065f46; }

        .hrn-btn-markall {
          display: flex; align-items: center; gap: 6px;
          background: #1d4ed8; color: #fff; border: none; border-radius: 7px;
          padding: 7px 13px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .hrn-btn-markall:hover    { background: #1e40af; }
        .hrn-btn-markall:disabled { opacity: 0.6; cursor: not-allowed; }

        .hrn-content { padding: 20px 24px; max-width: 900px; }

        .hrn-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .hrn-stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .hrn-stat-icon { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hrn-stat-val  { font-size: 22px; font-weight: 800; line-height: 1; }
        .hrn-stat-lbl  { font-size: 11px; color: #9ca3af; font-weight: 500; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

        .hrn-filter-bar { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-bottom: 16px; padding-bottom: 2px; }
        .hrn-filter-bar::-webkit-scrollbar { display: none; }
        .hrn-chip {
          display: flex; align-items: center; gap: 5px;
          border: 1.5px solid #e5e7eb; background: #fff;
          padding: 5px 12px; border-radius: 99px;
          font-size: 12px; font-weight: 600; color: #6b7280;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: all 0.15s; font-family: inherit;
        }
        .hrn-chip.active { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
        .hrn-chip:hover:not(.active) { border-color: #93c5fd; color: #1d4ed8; }
        .hrn-chip-count { background: #f3f4f6; color: #374151; border-radius: 99px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
        .hrn-chip.active .hrn-chip-count { background: rgba(255,255,255,0.25); color: #fff; }

        .hrn-item {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;
          margin-bottom: 8px; cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s; position: relative;
        }
        .hrn-item.unread { border-left: 3px solid #1d4ed8; background: #fafcff; }
        .hrn-item:hover  { box-shadow: 0 2px 12px rgba(0,0,0,0.07); border-color: #d1d5db; }
        .hrn-item-icon   { width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .hrn-item-body   { flex: 1; min-width: 0; }
        .hrn-item-title  { font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 3px; line-height: 1.4; }
        .hrn-item.unread .hrn-item-title { color: #1d4ed8; }
        .hrn-item-msg    { font-size: 12px; color: #6b7280; margin: 0 0 8px; line-height: 1.5; }
        .hrn-item-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .hrn-item-time   { font-size: 11px; color: #9ca3af; font-weight: 500; }
        .hrn-item-badge  { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; display: flex; align-items: center; gap: 4px; }
        .hrn-item-badge svg { width: 11px; height: 11px; }
        .hrn-unread-hint { font-size: 10px; color: #1d4ed8; font-weight: 600; }
        .hrn-unread-dot  { width: 7px; height: 7px; border-radius: 50%; background: #1d4ed8; flex-shrink: 0; margin-top: 7px; }

        .hrn-empty { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 56px 24px; text-align: center; }
        .hrn-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: #9ca3af; }
        .hrn-section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin: 16px 0 8px; padding-left: 2px; }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: mFadeIn 0.15s ease;
        }
        @keyframes mFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-box {
          background: #fff; border-radius: 14px;
          width: 100%; max-width: 460px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          animation: mSlideUp 0.2s ease;
          overflow: hidden;
        }
        @keyframes mSlideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
        }
        .modal-header-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: #f0fdf4; color: #047857;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .modal-title { font-size: 14px; font-weight: 700; color: #111827; }
        .modal-sub   { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .modal-close-btn {
          width: 30px; height: 30px; border-radius: 7px;
          border: 1px solid #e5e7eb; background: #f9fafb;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6b7280; transition: all 0.15s;
        }
        .modal-close-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }

        .modal-body   { padding: 18px 20px; display: flex; flex-direction: column; gap: 13px; }
        .modal-footer { padding: 14px 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 8px; }

        .modal-field  { display: flex; flex-direction: column; gap: 5px; }
        .modal-label  { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 5px; }

        .modal-select, .modal-input, .modal-textarea {
          width: 100%; box-sizing: border-box;
          border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 9px 12px; font-size: 13px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #111827; background: #f9fafb;
          outline: none; transition: border-color 0.15s, background 0.15s;
        }
        .modal-select:focus, .modal-input:focus, .modal-textarea:focus {
          border-color: #6ee7b7; background: #fff;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }
        .modal-textarea { min-height: 100px; resize: vertical; }

        .modal-error   { font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 7px; padding: 8px 12px; }
        .modal-success { font-size: 12px; color: #047857; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 7px; padding: 8px 12px; font-weight: 600; }

        .modal-btn-cancel {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: 1px solid #e5e7eb; background: #fff; color: #374151;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .modal-btn-cancel:hover    { background: #f3f4f6; }
        .modal-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

        .modal-btn-send {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: none; background: #047857; color: #fff;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .modal-btn-send:hover    { background: #065f46; }
        .modal-btn-send:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 600px) {
          .hrn-header  { padding: 12px 16px; }
          .hrn-content { padding: 14px 16px; }
          .hrn-stats   { gap: 8px; }
          .hrn-stat    { padding: 12px 10px; gap: 8px; }
          .hrn-stat-val { font-size: 18px; }
          .btn-label   { display: none; }
        }
      `}</style>

      <div className="hrn-wrap">

        {/* ── Header ── */}
        <header className="hrn-header">
          <div className="hrn-header-left">
            <div className="hrn-header-icon">{Icons.bell}</div>
            <div>
              <div className="hrn-header-title">Notifications</div>
              <div className="hrn-header-sub">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up"}
              </div>
            </div>
          </div>

          <div className="hrn-header-actions">
            {/* ✅ Send Message button */}
            <button className="hrn-btn-send-msg" onClick={() => setShowModal(true)}>
              {Icons.send}
              <span className="btn-label">Send Message</span>
            </button>

            {unreadCount > 0 && (
              <button className="hrn-btn-markall" onClick={markAllRead} disabled={markingAll}>
                {Icons.checkAll}
                <span className="btn-label">{markingAll ? "Marking..." : "Mark all read"}</span>
              </button>
            )}
          </div>
        </header>

        <div className="hrn-content">

          {/* ── Stats ── */}
          <div className="hrn-stats">
            {[
              { val: notifications.length,               lbl: "Total",  iconBg: "#f3f4f6", iconColor: "#374151",
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
              { val: unreadCount,                        lbl: "Unread", iconBg: "#eff6ff", iconColor: "#1d4ed8",
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
              { val: notifications.length - unreadCount, lbl: "Read",   iconBg: "#f0fdf4", iconColor: "#16a34a",
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
            ].map((s, i) => (
              <div key={i} className="hrn-stat">
                <div className="hrn-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                <div>
                  <div className="hrn-stat-val" style={{ color: s.iconColor }}>{s.val}</div>
                  <div className="hrn-stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter Chips ── */}
          <div className="hrn-filter-bar">
            {availableTypes.map(type => {
              const meta  = TYPE_META[type] || DEFAULT_META;
              const count = type === "all" ? notifications.length : notifications.filter(n => n.type === type).length;
              return (
                <button key={type} onClick={() => setFilter(type)} className={`hrn-chip ${filter === type ? "active" : ""}`}>
                  {type !== "all" && (
                    <span style={{ color: filter === type ? "#fff" : meta.color }}>
                      {Icons[meta.icon] || Icons.general}
                    </span>
                  )}
                  {type === "all" ? "All" : meta.label}
                  <span className="hrn-chip-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── List ── */}
          {filtered.length === 0 ? (
            <div className="hrn-empty">
              <div className="hrn-empty-icon">{Icons.bell}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#374151", marginBottom:4 }}>No notifications</div>
              <div style={{ fontSize:12, color:"#9ca3af" }}>
                {filter === "all" ? "You're all caught up!" : `No ${filter} notifications found`}
              </div>
            </div>
          ) : (
            <div>
              {unreadCount > 0 && <div className="hrn-section-label">Unread — {unreadCount}</div>}
              {filtered.map((notif) => {
                const meta     = TYPE_META[notif.type] || DEFAULT_META;
                const isUnread = !notif.isRead;
                return (
                  <div key={notif._id} className={`hrn-item ${isUnread ? "unread" : ""}`}
                    onClick={() => isUnread && markAsRead(notif._id)}>
                    <div className="hrn-item-icon" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {Icons[meta.icon] || Icons.general}
                    </div>
                    <div className="hrn-item-body">
                      <p className="hrn-item-title">{notif.title || "Notification"}</p>
                      <p className="hrn-item-msg">{notif.message}</p>
                      <div className="hrn-item-footer">
                        <span className="hrn-item-time">{timeAgo(notif.createdAt)}</span>
                        <span className="hrn-item-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {Icons[meta.icon] || Icons.general}
                          {meta.label}
                        </span>
                        {isUnread && <span className="hrn-unread-hint">Click to mark as read</span>}
                      </div>
                    </div>
                    {isUnread && <div className="hrn-unread-dot" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modal */}
      {showModal && (
        <SendMessageModal
          employees={employees}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}