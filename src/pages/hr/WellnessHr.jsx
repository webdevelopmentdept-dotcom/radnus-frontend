import { useState, useEffect } from "react";
import axios from "axios";
import {
  Heart, CheckCircle, XCircle, Clock, Users,
  BarChart2, Star, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SESSION_TYPE_LABELS = {
  counseling:      "🧠 1-on-1 Counseling",
  mindful_monday:  "🧘 Mindful Monday",
  stress_workshop: "💆 Stress Workshop",
  family_support:  "👨‍👩‍👧 Family Support",
  helpline:        "📞 Helpline",
};

const STATUS_CONFIG = {
  requested: { label: "Requested", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  approved:  { label: "Approved",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  rejected:  { label: "Rejected",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };

export default function WellnessHr() {
  const [sessions, setSessions]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType,   setFilterType]   = useState("All");
  const [searchName,   setSearchName]   = useState("");
  const [expandedId,   setExpandedId]   = useState(null);
  const [actionModal,  setActionModal]  = useState(null); // { session, actionType }
  const [hrNotes, setHrNotes]           = useState("");

  const hrId = localStorage.getItem("hrId");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [sessRes, statsRes] = await Promise.all([


        
       axios.get(`${API_BASE}/api/wellnesshr/all`),
        axios.get(`${API_BASE}/api/wellnesshr/stats`)

      ]);
      if (sessRes.data.success)  setSessions(sessRes.data.data || []);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (session, status) => {
    try {
      await axios.put(`${API_BASE}/api/wellnesshr/${session._id}/status`, {
        status, hr_notes: hrNotes, reviewed_by: hrId
      });
      showToast(`Session ${status} successfully!`);
      setActionModal(null);
      setHrNotes("");
      await fetchAll();
    } catch { showToast("Action failed", "error"); }
  };

  const filtered = sessions.filter(s => {
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchType   = filterType   === "All" || s.session_type === filterType;
    const matchName   = !searchName.trim() || s.employee_id?.name?.toLowerCase().includes(searchName.toLowerCase());
    return matchStatus && matchType && matchName;
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading Wellness Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", background: "#f4f6fb", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>{toast.msg}</div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>
              {actionModal.actionType === "approved" ? "✅ Approve Session" : actionModal.actionType === "rejected" ? "❌ Reject Session" : "🏁 Mark Completed"}
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6b7280" }}>{actionModal.session.employee_id?.name} — {actionModal.session.title}</p>
            <label style={labelStyle}>HR Notes (Optional)</label>
            <textarea value={hrNotes} onChange={e => setHrNotes(e.target.value)}
              placeholder="Add any notes for the employee..." rows={3}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}/>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setActionModal(null); setHrNotes(""); }}
                style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleAction(actionModal.session, actionModal.actionType)}
                style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 8, background: actionModal.actionType === "rejected" ? "#dc2626" : "#16a34a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Confirm {actionModal.actionType === "approved" ? "Approval" : actionModal.actionType === "rejected" ? "Rejection" : "Completion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>🌿 Wellness Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Radnus Care & Value — Mental Wellness Program</p>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Sessions",  value: stats.total,      color: "#2563eb", bg: "#eff6ff", emoji: "📋" },
            { label: "Pending Review",  value: stats.requested,  color: "#d97706", bg: "#fffbeb", emoji: "⏳" },
            { label: "Approved",        value: stats.approved,   color: "#2563eb", bg: "#eff6ff", emoji: "✅" },
            { label: "Completed",       value: stats.completed,  color: "#16a34a", bg: "#f0fdf4", emoji: "🏁" },
            { label: "Avg Feedback",    value: stats.avgFeedback ? `${stats.avgFeedback}/10` : "—", color: "#7c3aed", bg: "#f5f3ff", emoji: "⭐" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e5e7eb" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Type Breakdown */}
      {stats?.byType?.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Session Type Distribution</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {stats.byType.map((t, i) => (
              <div key={i} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>{SESSION_TYPE_LABELS[t._id] || t._id}</span>
                <span style={{ marginLeft: 8, fontWeight: 800, color: "#2563eb" }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search by name..." style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
              <option value="All">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Session Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inputStyle}>
              <option value="All">All Types</option>
              {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
            <p style={{ color: "#6b7280", fontWeight: 600 }}>No sessions found</p>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Session Type", "Date & Time", "Mode", "Status", "Requested On", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.requested;
                  const isExpanded = expandedId === s._id;
                  return (
                    <>
                      <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 13 }}>
                              {s.employee_id?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{s.employee_id?.name || "—"}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{s.employee_id?.department || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{SESSION_TYPE_LABELS[s.session_type] || s.session_type}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: "#1f2937" }}>{new Date(s.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{s.scheduled_time || "—"}</p>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{s.mode === "virtual" ? "🖥️ Virtual" : "🏢 In Person"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{cfg.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280" }}>{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {s.status === "requested" && (
                              <>
                                <button onClick={() => setActionModal({ session: s, actionType: "approved" })}
                                  style={{ padding: "5px 12px", border: "none", borderRadius: 6, background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✅ Approve</button>
                                <button onClick={() => setActionModal({ session: s, actionType: "rejected" })}
                                  style={{ padding: "5px 12px", border: "none", borderRadius: 6, background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>❌ Reject</button>
                              </>
                            )}
                            {s.status === "approved" && (
                              <button onClick={() => setActionModal({ session: s, actionType: "completed" })}
                                style={{ padding: "5px 12px", border: "none", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🏁 Complete</button>
                            )}
                            <button onClick={() => setExpandedId(isExpanded ? null : s._id)}
                              style={{ padding: "5px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
                              {isExpanded ? "▲" : "▼"} Details
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${s._id}-exp`}>
                          <td colSpan={7} style={{ padding: "0 16px 16px", background: "#f8fafc" }}>
                            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 20px", marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                              <div>
                                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Description</p>
                                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{s.description || "—"}</p>
                              </div>
                              <div>
                                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Employee Notes (Confidential)</p>
                                <p style={{ margin: 0, fontSize: 13, color: "#374151", fontStyle: "italic" }}>{s.employee_notes || "—"}</p>
                              </div>
                              <div>
                                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>HR Notes</p>
                                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{s.hr_notes || "—"}</p>
                              </div>
                              {s.feedback_score && (
                                <div>
                                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Employee Feedback</p>
                                  <p style={{ margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 700 }}>⭐ {s.feedback_score}/10{s.feedback_comment ? ` — "${s.feedback_comment}"` : ""}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            <p style={{ textAlign: "center", padding: "14px 0", fontSize: 13, color: "#9ca3af" }}>Showing {filtered.length} of {sessions.length} sessions</p>
          </>
        )}
      </div>
    </div>
  );
}