import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  RefreshCw, Eye, CheckCircle, XCircle, Mail, AlertTriangle,
  Calendar, Clock, FileText, Palmtree, Info, Search, Download,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Tag, X,
  ChevronRight, Users, Hourglass, BadgeCheck, Ban
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("hrToken") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/* ─── CSS ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .hr-root {
    font-family: 'Geist', sans-serif;
    background: #f5f5f0;
    min-height: 100vh;
    padding: 20px 16px 100px 16px;
  }
  @media (min-width: 640px) { .hr-root { padding: 24px 24px 100px 24px; } }

  /* ── Header ── */
  .hr-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hr-title { font-size: 22px; font-weight: 800; color: #0a0a0a; letter-spacing: -0.8px; line-height: 1.1; }
  .hr-subtitle { font-size: 13px; color: #888; margin-top: 4px; font-weight: 400; }
  .hr-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 14px; border-radius: 8px; font-size: 12px;
    font-weight: 600; cursor: pointer; font-family: 'Geist', sans-serif;
    border: none; transition: all 0.15s; white-space: nowrap; letter-spacing: -0.1px;
  }
  .btn:hover { filter: brightness(0.92); transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn-dark { background: #0a0a0a; color: #fff; }
  .btn-outline { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; }
  .btn-outline:hover { background: #f9fafb; filter: none; }
  .btn-green { background: #dcfce7; color: #16a34a; }
  .btn-red { background: #fee2e2; color: #dc2626; }
  .btn-sm { padding: 6px 10px; font-size: 11px; }

  /* ── Stat cards ── */
  .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
  @media (min-width: 640px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }

  .stat-card {
    background: #fff;
    border: 2px solid transparent;
    border-radius: 14px;
    padding: 16px 14px;
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .stat-card.active { border-color: currentColor; }
  .stat-count { font-size: 28px; font-weight: 800; line-height: 1; font-family: 'Geist Mono', monospace; letter-spacing: -1.5px; }
  .stat-label { font-size: 11px; font-weight: 600; margin-top: 6px; opacity: 0.7; letter-spacing: 0.3px; text-transform: uppercase; }

  /* ── Toolbar ── */
  .toolbar {
    display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
  }
  .search-wrap {
    flex: 1; min-width: 180px; position: relative;
  }
  .search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aaa; }
  .search-input {
    width: 100%; padding: 9px 12px 9px 34px;
    border: 1.5px solid #e5e7eb; border-radius: 9px;
    font-size: 13px; outline: none; font-family: 'Geist', sans-serif;
    color: #111; background: #fff; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: #0a0a0a; }
  .search-input::placeholder { color: #bbb; }

  /* ── Pending banner ── */
  .pending-banner {
    display: flex; align-items: center; gap: 9px;
    background: #fffbeb; border: 1.5px solid #fde68a;
    border-radius: 10px; padding: 11px 14px; margin-bottom: 16px;
    font-size: 13px; font-weight: 600; color: #92400e;
  }

  /* ── Leave Cards ── */
  .leave-card {
    background: #fff; border: 1.5px solid #ebebeb;
    border-radius: 14px; padding: 16px; transition: box-shadow 0.15s;
  }
  .leave-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  .card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .avatar {
    width: 38px; height: 38px; border-radius: 10px;
    background: #0a0a0a; display: flex; align-items: center;
    justify-content: center; color: #fff; font-weight: 800;
    font-size: 15px; flex-shrink: 0; letter-spacing: -0.5px;
  }
  .emp-name { font-weight: 700; font-size: 14px; color: #0a0a0a; }
  .emp-dept { font-size: 11px; color: #9ca3af; margin-top: 1px; }

  .status-pill {
    font-size: 10px; font-weight: 700; padding: 3px 10px;
    border-radius: 20px; white-space: nowrap; letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .card-meta {
    display: flex; flex-wrap: wrap; gap: 10px;
    font-size: 12px; margin-bottom: 8px;
  }
  .meta-item { display: flex; align-items: center; gap: 4px; font-weight: 500; color: #555; }
  .meta-item.bold { font-weight: 700; color: #0a0a0a; }

  .reason-block {
    background: #f8f8f6; border-radius: 8px;
    padding: 9px 12px; margin-bottom: 10px;
    font-size: 12px; color: #555; display: flex;
    align-items: flex-start; gap: 6px; line-height: 1.5;
  }
  .hr-note {
    font-size: 12px; color: #2563eb; font-weight: 600;
    display: flex; align-items: flex-start; gap: 5px;
    margin-bottom: 10px; line-height: 1.5;
  }

  .card-footer {
    display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 8px;
    padding-top: 10px; border-top: 1px solid #f0f0f0;
  }
  .applied-date { font-size: 11px; color: #bbb; }
  .card-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 16px; backdrop-filter: blur(4px);
  }
  .modal-box {
    background: #fff; border-radius: 18px; width: 100%; max-width: 460px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18); max-height: 90vh; overflow-y: auto;
    animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 20px 0;
  }
  .modal-title { font-size: 15px; font-weight: 800; color: #0a0a0a; letter-spacing: -0.3px; }
  .modal-close {
    width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9;
    border: none; cursor: pointer; font-size: 18px; color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-body { padding: 16px 20px; }
  .modal-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 8px 0; border-bottom: 1px solid #f5f5f5; gap: 12px;
  }
  .modal-row:last-child { border-bottom: none; }
  .modal-label { font-size: 12px; color: #9ca3af; font-weight: 600; flex-shrink: 0; }
  .modal-val { font-size: 13px; font-weight: 700; text-align: right; word-break: break-word; }
  .modal-footer { padding: 0 20px 20px; }
  .remark-textarea {
    width: 100%; padding: 9px 12px; border: 1.5px solid #e5e7eb;
    border-radius: 8px; font-size: 13px; outline: none;
    font-family: 'Geist', sans-serif; resize: vertical;
    margin-bottom: 12px; color: #111;
  }
  .remark-textarea:focus { border-color: #0a0a0a; }
  .modal-actions { display: flex; gap: 8px; }

  /* ── Manage Leave Types ── */
  .manage-section {
    background: #fff; border: 1.5px solid #ebebeb; border-radius: 14px;
    margin-top: 24px; margin-bottom: 40px; overflow: hidden;
  }
  .manage-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 18px; border-bottom: 1.5px solid #f0f0f0; cursor: pointer;
  }
  .manage-title { font-size: 14px; font-weight: 700; color: #0a0a0a; display: flex; align-items: center; gap: 8px; }
  .manage-body { padding: 16px 18px; }
  .leave-type-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f5f5f0; border: 1.5px solid #e8e8e3;
    border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; color: #374151;
  }
  .chip-del {
    background: none; border: none; cursor: pointer;
    color: #dc2626; display: flex; align-items: center;
    padding: 0; transition: opacity 0.15s;
  }
  .chip-del:hover { opacity: 0.7; }
  .add-type-row {
    display: flex; gap: 8px; margin-top: 14px; align-items: center;
    padding-right: 70px;
  }
  .add-type-input {
    flex: 1; padding: 9px 12px; border: 1.5px solid #e5e7eb;
    border-radius: 8px; font-size: 13px; outline: none;
    font-family: 'Geist', sans-serif; color: #111;
  }
  .add-type-input:focus { border-color: #0a0a0a; }

  /* ── Toast ── */
  .toast {
    position: fixed; top: 16px; right: 16px; left: 16px;
    z-index: 9999; padding: 12px 16px; border-radius: 10px;
    font-weight: 700; font-size: 13px; text-align: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18); color: #fff;
    animation: toastIn 0.2s ease; font-family: 'Geist', sans-serif;
  }
  @keyframes toastIn { from { opacity:0; transform:translateY(-6px);} to { opacity:1; transform:translateY(0);} }

  /* ── Empty ── */
  .empty-state {
    background: #fff; border: 1.5px solid #ebebeb;
    border-radius: 14px; padding: 56px 0; text-align: center;
  }
  .empty-icon { display: flex; justify-content: center; margin-bottom: 12px; }
  .empty-text { font-size: 14px; font-weight: 600; color: #ccc; }

  /* ── Spinner ── */
  .spinner {
    width: 30px; height: 30px; border: 3px solid #e5e7eb;
    border-top-color: #0a0a0a; border-radius: 50%;
    animation: spin 0.7s linear infinite; margin: 0 auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .no-results { text-align: center; padding: 40px 0; color: #bbb; font-size: 13px; font-weight: 500; }

  /* ── Divider ── */
  .section-label {
    font-size: 11px; font-weight: 700; color: #bbb;
    letter-spacing: 0.8px; text-transform: uppercase;
    margin-bottom: 10px; margin-top: 4px;
  }
`;

/* ─── Stat Config ─── */
const STAT_CONFIG = [
  { key: "pending",  label: "Pending",  color: "#d97706", bg: "#fef9c3", border: "#fde68a", Icon: Hourglass },
  { key: "approved", label: "Approved", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", Icon: BadgeCheck },
  { key: "rejected", label: "Rejected", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", Icon: Ban },
  { key: "all",      label: "Total",    color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", Icon: Users },
];

const statusMeta = (status) => {
  if (status === "approved") return { color: "#16a34a", bg: "#dcfce7" };
  if (status === "rejected") return { color: "#dc2626", bg: "#fee2e2" };
  return { color: "#d97706", bg: "#fef9c3" };
};

/* ─── Export CSV ─── */
function exportCSV(leaves) {
  const headers = ["Employee", "Department", "Leave Type", "From", "To", "Days", "Reason", "Status", "HR Remark", "Applied On"];
  const rows = leaves.map(l => {
    // FIX 3: half day check
    const days = l.is_half_day ? 0.5 : Math.floor((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1;
    return [
      l.employee_name, l.department, l.leave_type,
      fmtD(l.from_date), fmtD(l.to_date), days,
      `"${(l.reason || "").replace(/"/g, '""')}"`,
      l.status, `"${(l.hr_remark || "").replace(/"/g, '""')}"`,
      fmtD(l.createdAt),
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leave-requests-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Leave Modal ─── */
function LeaveModal({ leave, onAction, onClose }) {
  const [remark, setRemark] = useState(leave.hr_remark || "");
  const [loading, setLoading] = useState(null);

  const handle = async (action) => {
    setLoading(action);
    try {
      await axios.put(
        `${API_BASE}/api/leave-requests/${leave._id}/${action}`,
        { hr_remark: remark },
        { headers: authHeader() }
      );
      onAction("success", `Leave ${action}d for ${leave.employee_name}`);
    } catch (err) {
      onAction("error", err.response?.data?.message || "Failed");
    } finally { setLoading(null); }
  };

  // FIX 2: half day check in modal
  const days = leave.is_half_day ? 0.5 : Math.floor((new Date(leave.to_date) - new Date(leave.from_date)) / 86400000) + 1;
  const { color: sc, bg: sb } = statusMeta(leave.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Leave Details</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f8f6", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
              {(leave.employee_name || "?").charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#0a0a0a" }}>{leave.employee_name}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{leave.department}</div>
            </div>
            <span className="status-pill" style={{ background: sb, color: sc }}>{leave.status?.toUpperCase() || "PENDING"}</span>
          </div>

          {[
            ["Leave Type",  leave.leave_type],
            ["From",        fmtD(leave.from_date)],
            ["To",          fmtD(leave.to_date)],
            ["Duration",    `${days} day${days !== 1 ? "s" : ""}`],
            ...(leave.is_half_day ? [["Session", leave.session === "morning" ? "🌅 Morning (First half)" : "🌤️ Afternoon (Second half)"]] : []),
            ["Reason",      leave.reason],
            ["Applied On",  fmtD(leave.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="modal-row">
              <span className="modal-label">{label}</span>
              <span className="modal-val">{value}</span>
            </div>
          ))}

          {leave.hr_remark && (
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 12px", marginTop: 10, fontSize: 13, color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 7 }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              HR Note: {leave.hr_remark}
            </div>
          )}
        </div>

        {(leave.status === "pending" || leave.status === "rejected") && (
          <div className="modal-footer">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>HR Remark (optional)</label>
            <textarea
              rows={2}
              placeholder="Add a note..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className="remark-textarea"
            />
            <div className="modal-actions">
              <button
                className="btn btn-red"
                style={{ flex: 1 }}
                onClick={() => handle("reject")}
                disabled={!!loading}
              >
                <XCircle size={13} />{loading === "reject" ? "Rejecting..." : "Reject"}
              </button>
              <button
                className="btn btn-dark"
                style={{ flex: 2 }}
                onClick={() => handle("approve")}
                disabled={!!loading}
              >
                <CheckCircle size={13} />{loading === "approve" ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Manage Leave Types ─── */
function ManageLeaveTypes({ showToast }) {
  const [open, setOpen]           = useState(false);
  const [types, setTypes]         = useState([]);
  const [newType, setNewType]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open) fetchTypes(); }, [open]);

  const fetchTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/hr/settings/leave-types`, { headers: authHeader() });
      setTypes(res.data?.data || res.data || []);
    } catch { showToast("error", "Failed to load leave types"); }
  };

  const addType = async () => {
    const name = newType.trim();
    if (!name) return;
    if (types.some(t => (t.name || t) === name)) return showToast("error", "Already exists");
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/hr/settings/leave-types`, { name }, { headers: authHeader() });
      setNewType("");
      fetchTypes();
      showToast("success", `"${name}" added`);
    } catch (err) { showToast("error", err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const deleteType = async (id, name) => {
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE}/api/hr/settings/leave-types/${id}`, { headers: authHeader() });
      fetchTypes();
      showToast("success", `"${name}" removed`);
    } catch (err) { showToast("error", err.response?.data?.message || "Failed"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="manage-section">
      <div className="manage-header" onClick={() => setOpen(o => !o)}>
        <span className="manage-title">
          <Tag size={15} color="#6b7280" /> Manage Leave Types
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {types.length > 0 && open && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{types.length} types</span>
          )}
          <ChevronRight size={15} color="#9ca3af" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>

      {open && (
        <div className="manage-body">
          {types.length === 0 ? (
            <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "16px 0" }}>No leave types found</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {types.map((t) => {
                const id   = t._id || t.id || t.name || t;
                const name = t.name || t;
                return (
                  <span key={id} className="leave-type-chip">
                    {name}
                    <button
                      className="chip-del"
                      onClick={() => deleteType(id, name)}
                      disabled={deleting === id}
                      title="Delete"
                    >
                      {deleting === id
                        ? <span style={{ fontSize: 10 }}>...</span>
                        : <Trash2 size={11} />}
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="add-type-row">
            <input
              ref={inputRef}
              className="add-type-input"
              placeholder="New leave type name..."
              value={newType}
              onChange={e => setNewType(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addType()}
            />
            <button
              className="btn btn-dark btn-sm"
              onClick={addType}
              disabled={loading || !newType.trim()}
            >
              <Plus size={12} />{loading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN ─── */
export default function HRLeaveRequests() {
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("pending");
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState("newest");

  useEffect(() => { fetchLeaves(); }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/leave-requests`, { headers: authHeader() });
      setLeaves(res.data?.data || []);
    } catch { showToast("error", "Failed to load leave requests"); }
    finally { setLoading(false); }
  };

  const quickAction = async (id, action, name) => {
    try {
      await axios.put(`${API_BASE}/api/leave-requests/${id}/${action}`, {}, { headers: authHeader() });
      showToast(action === "approve" ? "success" : "error", `Leave ${action}d for ${name}`);
      fetchLeaves();
    } catch { showToast("error", `Failed to ${action}`); }
  };

  const counts = {
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    all:      leaves.length,
  };

  const filtered = leaves
    .filter(l => filter === "all" || l.status === filter)
    .filter(l => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (l.employee_name || "").toLowerCase().includes(q) ||
        (l.department    || "").toLowerCase().includes(q) ||
        (l.leave_type    || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt), db = new Date(b.createdAt);
      return sort === "newest" ? db - da : da - db;
    });

  const toggleSort = () => setSort(s => s === "newest" ? "oldest" : "newest");

  return (
    <div className="hr-root">
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div
          className="toast"
          style={{ background: toast.type === "error" ? "#ef4444" : "#16a34a" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <LeaveModal
          leave={modal}
          onAction={(type, msg) => { setModal(null); showToast(type, msg); fetchLeaves(); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="hr-header">
        <div>
          <div className="hr-title">Leave Requests</div>
          <div className="hr-subtitle">Review and manage employee leave applications</div>
        </div>
        <div className="hr-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => exportCSV(filtered)}
            title="Export visible rows as CSV"
          >
            <Download size={13} /> Export
          </button>
          <button className="btn btn-dark" onClick={fetchLeaves}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_CONFIG.map(({ key, label, color, bg, border, Icon }) => (
          <button
            key={key}
            className={`stat-card${filter === key ? " active" : ""}`}
            style={{
              color,
              background: filter === key ? bg : "#fff",
              borderColor: filter === key ? border : "transparent",
            }}
            onClick={() => setFilter(key)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-count">{counts[key]}</div>
              <Icon size={16} style={{ opacity: 0.5, marginTop: 4 }} />
            </div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </div>

      {/* Pending banner */}
      {counts.pending > 0 && (
        <div className="pending-banner">
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {counts.pending} leave request{counts.pending > 1 ? "s" : ""} waiting for your approval
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={13} />
          <input
            className="search-input"
            placeholder="Search by name, department, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button className="btn btn-outline" onClick={toggleSort} title="Toggle sort order">
          {sort === "newest"
            ? <><ArrowDown size={13} /> Newest</>
            : <><ArrowUp size={13} /> Oldest</>}
        </button>
      </div>

      {/* Results label */}
      <div className="section-label">
        {filtered.length} {filter !== "all" ? filter : ""} request{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Palmtree size={36} color="#e5e7eb" />
          </div>
          <div className="empty-text">
            {search ? `No results for "${search}"` : `No ${filter !== "all" ? filter : ""} leave requests`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((l, i) => {
            const { color: sc, bg: sb } = statusMeta(l.status);
            // FIX 1: half day check in leave card
            const days = l.is_half_day ? 0.5 : Math.floor((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1;

            return (
              <div key={l._id || i} className="leave-card">
                <div className="card-top">
                  <div className="avatar">{(l.employee_name || "?").charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="emp-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.employee_name || "—"}</div>
                    <div className="emp-dept">{l.department || "—"}</div>
                  </div>
                  <span className="status-pill" style={{ background: sb, color: sc }}>
                    {l.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                <div className="card-meta">
                  <span className="meta-item bold">
                    <FileText size={11} /> {l.leave_type}
                  </span>
                  <span className="meta-item">
                    <Calendar size={11} /> {fmtD(l.from_date)} → {fmtD(l.to_date)}
                  </span>
                  <span className="meta-item">
                    <Clock size={11} /> {days} day{days !== 1 ? "s" : ""}
                  </span>
                </div>

                {l.reason && (
                  <div className="reason-block">
                    <FileText size={11} style={{ flexShrink: 0, marginTop: 2, color: "#aaa" }} />
                    <span>{l.reason}</span>
                  </div>
                )}

                {l.hr_remark && (
                  <div className="hr-note">
                    <Info size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                    HR Note: {l.hr_remark}
                  </div>
                )}

                <div className="card-footer">
                  <span className="applied-date">Applied: {fmtD(l.createdAt)}</span>
                  <div className="card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setModal(l)}>
                      <Eye size={11} /> View
                    </button>
                    {l.status === "pending" && (
  <>
    <button
      className="btn btn-green btn-sm"
      onClick={() => quickAction(l._id, "approve", l.employee_name)}
    >
      <CheckCircle size={11} /> Approve
    </button>
    <button
      className="btn btn-red btn-sm"
      onClick={() => quickAction(l._id, "reject", l.employee_name)}
    >
      <XCircle size={11} /> Reject
    </button>
  </>
)}
{l.status === "rejected" && (
  <button
    className="btn btn-green btn-sm"
    onClick={() => quickAction(l._id, "approve", l.employee_name)}
  >
    <CheckCircle size={11} /> Re-approve
  </button>
)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Leave Types */}
      <ManageLeaveTypes showToast={showToast} />
    </div>
  );
}