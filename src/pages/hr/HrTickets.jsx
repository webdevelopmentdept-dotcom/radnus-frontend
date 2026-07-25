import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  RefreshCw, Search, X, Clock, User, Building2, Tag, Calendar,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("hrToken") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_COLOR = {
  open: { bg: "#eef1fd", color: "#3d5af1" },
  "in-progress": { bg: "#fff7ed", color: "#ea580c" },
  resolved: { bg: "#f0fdf4", color: "#16a34a" },
  closed: { bg: "#f3f4f6", color: "#6b7280" },
};

const PRIORITY_COLOR = {
  low: "#16a34a",
  medium: "#ea580c",
  high: "#dc2626",
  critical: "#991b1b",
};

// Grid template used for both header and body rows — keep these in sync
const GRID_COLS = "140px minmax(180px,1.6fr) 140px 140px 100px 110px 110px";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
  .ht-root { font-family: 'Geist', sans-serif; background: #f5f5f0; min-height: 100vh; padding: 20px 16px 100px; box-sizing: border-box; }
  .ht-root *, .ht-root *::before, .ht-root *::after { box-sizing: border-box; }
  .ht-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
  .ht-title { font-size: 22px; font-weight: 800; color:#0a0a0a; }
  .ht-subtitle { font-size: 13px; color:#888; margin-top:4px; }
  .ht-search { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid #e5e7eb; border-radius:10px; padding:8px 12px; min-width:240px; }
  .ht-search input { border:none; outline:none; font-size:13px; font-family:'Geist',sans-serif; width:100%; background:transparent; }
  .ht-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:#0a0a0a; color:#fff; font-family:'Geist',sans-serif; }
  .ht-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow-x:auto; }
  .ht-table { min-width: 900px; }
  .ht-row { display:grid; grid-template-columns: ${GRID_COLS}; align-items:center; }
  .ht-head { background:#fafaf8; border-bottom:1px solid #eee; }
  .ht-head .ht-cell { font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#888; font-weight:700; padding:12px 14px; }
  .ht-body-row { border-bottom:1px solid #f1f1f1; cursor:pointer; }
  .ht-body-row:last-child { border-bottom:none; }
  .ht-body-row:hover { background:#faf9f6; }
  .ht-cell { padding:12px 14px; font-size:13px; color:#0a0a0a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ht-badge { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; display:inline-block; }
  .ht-empty { padding:40px; text-align:center; color:#888; }
  .ht-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; justify-content:flex-end; z-index:9999; }
  .ht-drawer { background:#fff; width:420px; max-width:100%; height:100%; overflow-y:auto; padding:22px; }
  .ht-drawer-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .ht-field { margin-bottom:14px; }
  .ht-label { font-size:11px; text-transform:uppercase; color:#999; margin-bottom:4px; display:flex; align-items:center; gap:6px; }
  .ht-value { font-size:14px; color:#0a0a0a; font-weight:600; }
  .ht-select, .ht-textarea { width:100%; padding:10px; border-radius:8px; border:1.5px solid #e5e7eb; font-family:'Geist',sans-serif; font-size:13px; background:#fff; }
  .ht-textarea { min-height:80px; margin-top:8px; resize:vertical; }
  .ht-log-item { background:#fafaf8; border-radius:8px; padding:10px; margin-bottom:8px; font-size:12px; }
`;

export default function HrTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("open");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/hr/tickets`, { headers: authHeader() });
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const openTicket = async (t) => {
    setSelected(t);
    setDetail(null);
    try {
      const res = await axios.get(`${API_BASE}/api/hr/tickets/${t._id || t.id}`, { headers: authHeader() });
      setDetail(res.data);
      setStatus(res.data.status || "open");
      setNote("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load ticket detail");
    }
  };

  const updateStatus = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await axios.patch(
        `${API_BASE}/api/hr/tickets/${selected._id || selected.id}`,
        { status, note },
        { headers: authHeader() }
      );
      await loadTickets();
      openTicket(selected);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.ticket_no?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.emp_name?.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="ht-root">
      <style>{STYLES}</style>

      <div className="ht-header">
        <div>
          <div className="ht-title">Support Tickets</div>
          <div className="ht-subtitle">Tickets raised by employees on the IT support portal</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div className="ht-search">
            <Search size={14} color="#999" />
            <input
              placeholder="Search ticket, employee, dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="ht-btn" onClick={loadTickets}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="ht-card">
        <div className="ht-table">
          <div className="ht-row ht-head">
            <div className="ht-cell">Ticket No</div>
            <div className="ht-cell">Subject</div>
            <div className="ht-cell">Employee</div>
            <div className="ht-cell">Department</div>
            <div className="ht-cell">Priority</div>
            <div className="ht-cell">Status</div>
            <div className="ht-cell">Created</div>
          </div>

          {loading ? (
            <div className="ht-empty">Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="ht-empty">No tickets found.</div>
          ) : (
            filtered.map((t) => (
              <div
                key={t._id || t.id}
                className="ht-row ht-body-row"
                onClick={() => openTicket(t)}
              >
                <div className="ht-cell" style={{ fontFamily: "monospace", fontWeight: 700, color: "#3d5af1" }}>
                  {t.ticket_no}
                </div>
                <div className="ht-cell" title={t.subject}>{t.subject}</div>
                <div className="ht-cell">{t.emp_name || "—"}</div>
                <div className="ht-cell">{t.department || "—"}</div>
                <div className="ht-cell">
                  <span className="ht-badge" style={{ background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority] }}>
                    {t.priority}
                  </span>
                </div>
                <div className="ht-cell">
                  <span className="ht-badge" style={{ background: STATUS_COLOR[t.status]?.bg, color: STATUS_COLOR[t.status]?.color }}>
                    {t.status}
                  </span>
                </div>
                <div className="ht-cell" style={{ color: "#888", fontSize: 12 }}>
                  {fmtD(t.created_at || t.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="ht-overlay" onClick={() => setSelected(null)}>
          <div className="ht-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ht-drawer-head">
              <div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>{selected.ticket_no}</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{selected.subject}</div>
              </div>
              <X size={20} style={{ cursor: "pointer" }} onClick={() => setSelected(null)} />
            </div>

            {!detail ? (
              <div style={{ color: "#888", fontSize: 13 }}>Loading...</div>
            ) : (
              <>
                <div className="ht-field">
                  <div className="ht-label"><User size={12} /> Employee</div>
                  <div className="ht-value">{detail.emp_name || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{detail.emp_email}</div>
                </div>

                <div className="ht-field">
                  <div className="ht-label"><Building2 size={12} /> Department</div>
                  <div className="ht-value">{detail.department || "—"}</div>
                </div>

                <div className="ht-field">
                  <div className="ht-label"><Tag size={12} /> Category</div>
                  <div className="ht-value">{detail.category || "—"}</div>
                </div>

                <div className="ht-field">
                  <div className="ht-label"><Calendar size={12} /> Created</div>
                  <div className="ht-value" style={{ fontWeight: 400, fontSize: 13 }}>
                    {detail.created_at ? new Date(detail.created_at).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="ht-field">
                  <div className="ht-label">Description</div>
                  <div style={{ background: "#fafaf8", padding: 10, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                    {detail.description || "No description"}
                  </div>
                </div>

                <div className="ht-field">
                  <div className="ht-label"><Clock size={12} /> Activity</div>
                  {(detail.logs || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: "#999" }}>No updates yet.</div>
                  ) : (
                    detail.logs.map((log, i) => (
                      <div key={i} className="ht-log-item">
                        <strong style={{ textTransform: "uppercase", fontSize: 11, color: "#3d5af1" }}>{log.status}</strong>
                        <div>{log.note}</div>
                        <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>
                          {new Date(log.date).toLocaleString()} — {log.by}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="ht-field">
                  <div className="ht-label">Update Status</div>
                  <select className="ht-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <textarea
                    className="ht-textarea"
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button
                    className="ht-btn"
                    style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                    disabled={saving}
                    onClick={updateStatus}
                  >
                    {saving ? "Updating..." : "Update Ticket"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}