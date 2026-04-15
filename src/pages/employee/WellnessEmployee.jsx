import { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  Heart, Calendar, Clock, CheckCircle, XCircle,
  Plus, Star, AlertCircle, Send, RefreshCw,
  Brain, Wind, Smile, Users, Phone,
  ClipboardList, Hourglass, BarChart2,
  Shield, MonitorSmartphone, Building2,
  ChevronRight
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SESSION_TYPES = [
  { value: "counseling",      label: "1-on-1 Counseling",          desc: "Confidential session with certified mental health professional", icon: Brain },
  { value: "mindful_monday",  label: "Mindful Monday",             desc: "Guided meditation / yoga session every Monday morning",         icon: Wind },
  { value: "stress_workshop", label: "Stress Management Workshop", desc: "Practical sessions on mindfulness and emotional intelligence",   icon: Smile },
  { value: "family_support",  label: "Family Support",             desc: "Counseling extended to immediate family members",               icon: Users },
  { value: "helpline",        label: "Emotional Helpline",         desc: "24/7 support line for anxiety, depression, or burnout",         icon: Phone },
];

const STATUS_CONFIG = {
  requested: { label: "Requested", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Clock },
  approved:  { label: "Approved",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: CheckCircle },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: XCircle },
};

const today = new Date().toISOString().split("T")[0];

export default function WellnessEmployee() {
  const [sessions, setSessions]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackForm, setFeedbackForm]   = useState({ feedback_score: 8, feedback_comment: "" });
  const [activeTab, setActiveTab]         = useState("upcoming");

  // ✅ Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [form, setForm] = useState({
    session_type: "",
    title: "",
    description: "",
    scheduled_date: today,
    scheduled_time: "10:00",
    mode: "virtual",
    employee_notes: "",
  });

  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/wellness/employee/${employeeId}`);
      setSessions(res.data.data || []);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBook = async () => {
    if (!form.session_type || !form.title || !form.scheduled_date)
      return showToast("Please fill all required fields", "error");
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/wellness`, { ...form, employee_id: employeeId });
      if (res.data.success) {
        showToast("Session booked successfully! HR will review and confirm.");
        setShowForm(false);
        setForm({ session_type: "", title: "", description: "", scheduled_date: today, scheduled_time: "10:00", mode: "virtual", employee_notes: "" });
        await fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to book session", "error");
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this session?")) return;
    try {
      await axios.delete(`${API_BASE}/api/wellness/${id}`);
      await fetchSessions();
    } catch {
      showToast("Failed to cancel", "error");
    }
  };

  const handleFeedback = async () => {
    if (!feedbackModal) return;
    try {
      await axios.put(`${API_BASE}/api/wellness/${feedbackModal._id}/feedback`, feedbackForm);
      showToast("Feedback submitted! Thank you.");
      setFeedbackModal(null);
      await fetchSessions();
    } catch { showToast("Failed to submit feedback", "error"); }
  };

  const upcomingSessions = sessions.filter(s => ["requested", "approved"].includes(s.status));
  const pastSessions     = sessions.filter(s => ["completed", "rejected", "cancelled"].includes(s.status));
  const displaySessions  = activeTab === "upcoming" ? upcomingSessions : pastSessions;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading Wellness...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <EmployeeLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: isMobile ? 16 : 24, left: isMobile ? 16 : "auto", zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? 20 : 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>Rate Your Session</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>{feedbackModal.title}</p>

            <label style={labelStyle}>Score (1–10) *</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => setFeedbackForm(f => ({ ...f, feedback_score: n }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: feedbackForm.feedback_score === n ? "2px solid #16a34a" : "1px solid #e5e7eb", background: feedbackForm.feedback_score === n ? "#f0fdf4" : "#fff", color: feedbackForm.feedback_score === n ? "#16a34a" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Comment (Optional)</label>
            <textarea
              value={feedbackForm.feedback_comment}
              onChange={e => setFeedbackForm(f => ({ ...f, feedback_comment: e.target.value }))}
              placeholder="How was your experience?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 20 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setFeedbackModal(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleFeedback} style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Submit Feedback</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Main wrapper — overflow hidden, full width */}
      <div style={{ padding: isMobile ? "16px" : "28px 32px", background: "#f4f6fb", minHeight: "100vh", overflowX: "hidden", boxSizing: "border-box", width: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10, width: "100%", boxSizing: "border-box" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Heart size={20} color="#16a34a" />
              <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1a1a2e" }}>My Wellness</h2>
            </div>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Radnus Care &amp; Value — Your mental health matters</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Plus size={16} /> Book a Session
          </button>
        </div>

        {/* Stats — 2x2 on mobile, 4 cols on desktop */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Booked", value: sessions.length,                                                color: "#2563eb", bg: "#eff6ff", icon: ClipboardList },
            { label: "Upcoming",     value: upcomingSessions.length,                                        color: "#d97706", bg: "#fffbeb", icon: Hourglass },
            { label: "Completed",    value: sessions.filter(s => s.status === "completed").length,          color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
            { label: "Avg Feedback", value: (() => { const f = sessions.filter(s => s.feedback_score); return f.length ? (f.reduce((a, b) => a + b.feedback_score, 0) / f.length).toFixed(1) + "/10" : "—"; })(), color: "#7c3aed", bg: "#f5f3ff", icon: BarChart2 },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb", minWidth: 0 }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={s.color} />
                  </div>
                  <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: s.color }}>{s.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Book Session Form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: isMobile ? 16 : 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={18} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>Book a Wellness Session</h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <XCircle size={18} />
              </button>
            </div>

            {/* Session Type Cards */}
            <label style={labelStyle}>Session Type *</label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 18 }}>
              {SESSION_TYPES.map(type => {
                const TypeIcon = type.icon;
                const selected = form.session_type === type.value;
                return (
                  <div key={type.value}
                    onClick={() => setForm(f => ({ ...f, session_type: type.value, title: type.label }))}
                    style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected ? "#16a34a" : "#e5e7eb"}`, background: selected ? "#f0fdf4" : "#fafafa", cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <TypeIcon size={15} color={selected ? "#16a34a" : "#6b7280"} />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: selected ? "#16a34a" : "#1f2937" }}>{type.label}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{type.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Form Fields */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Counseling Session" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mode</label>
                <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} style={inputStyle}>
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Preferred Date *</label>
                <input type="date" value={form.scheduled_date} min={today} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Preferred Time</label>
                <input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief about what you'd like to discuss..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Additional Notes (Confidential)</label>
              <textarea value={form.employee_notes} onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))}
                placeholder="Any specific concerns you'd like HR to know..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={16} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>All records are strictly confidential. No details shared with managers without your consent.</p>
            </div>

            <button onClick={handleBook} disabled={saving}
              style={{ width: "100%", padding: "13px 0", border: "none", borderRadius: 10, background: saving ? "#86efac" : "#16a34a", color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Send size={16} /> {saving ? "Booking..." : "Request Session"}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20, overflowX: "auto", maxWidth: "100%", boxSizing: "border-box", WebkitOverflowScrolling: "touch" }}>
          {[
            { id: "upcoming", label: `Upcoming (${upcomingSessions.length})`, icon: Hourglass },
            { id: "past",     label: `History (${pastSessions.length})`,      icon: ClipboardList },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeTab === tab.id ? "#16a34a" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0 }}>
                <TabIcon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sessions List */}
        {displaySessions.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <Heart size={48} color="#d1fae5" style={{ marginBottom: 12 }} />
            <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No sessions {activeTab === "upcoming" ? "upcoming" : "in history"}</h3>
            <p style={{ color: "#6b7280", fontSize: 14 }}>{activeTab === "upcoming" ? "Book a wellness session to get started!" : "Completed sessions will appear here."}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displaySessions.map(session => {
              const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.requested;
              const StatusIcon = cfg.icon;
              const typeObj = SESSION_TYPES.find(t => t.value === session.session_type);
              const typeLabel = typeObj?.label || session.session_type;
              const TypeIcon = typeObj?.icon || Heart;
              return (
                <div key={session._id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: isMobile ? "14px 16px" : "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>

                  {/* Session Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <TypeIcon size={20} color={cfg.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>{typeLabel}</p>
                      </div>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Session Details — 2 cols on mobile, 3 on desktop */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: "8px 16px", marginBottom: 12 }}>
                    {[
                      { label: "Date", value: new Date(session.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), icon: Calendar },
                      { label: "Time", value: session.scheduled_time || "—", icon: Clock },
                      { label: "Mode", value: session.mode === "virtual" ? "Virtual" : "In Person", icon: session.mode === "virtual" ? MonitorSmartphone : Building2 },
                    ].map((d, i) => {
                      const DIcon = d.icon;
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <DIcon size={11} color="#9ca3af" />
                            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{d.label}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#374151" }}>{d.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {session.hr_notes && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderLeft: "3px solid #2563eb", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#1e40af" }}><b>HR Note:</b> {session.hr_notes}</p>
                    </div>
                  )}

                  {session.feedback_score && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Star size={13} color="#15803d" />
                      <p style={{ margin: 0, fontSize: 12, color: "#15803d" }}>
                        Your feedback: <b>{session.feedback_score}/10</b>
                        {session.feedback_comment ? ` — "${session.feedback_comment}"` : ""}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {session.status === "completed" && !session.feedback_score && (
                      <button
                        onClick={() => { setFeedbackModal(session); setFeedbackForm({ feedback_score: 8, feedback_comment: "" }); }}
                        style={{ padding: "7px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Star size={13} /> Rate Session
                      </button>
                    )}
                    {["requested", "approved"].includes(session.status) && (
                      <button
                        onClick={() => handleCancel(session._id)}
                        style={{ padding: "7px 16px", border: "1px solid #fecaca", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Cards — stack on mobile */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 24 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Shield size={15} color="#16a34a" />
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>Confidentiality Policy</p>
            </div>
            {[
              "All records are strictly confidential",
              "No details shared with managers without consent",
              "Anonymous analytics only for tracking",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <CheckCircle size={14} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{t}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Phone size={15} color="#2563eb" />
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>Emergency Support</p>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151" }}>For immediate help, reach out:</p>
            {[
              "24/7 Helpline: iCall — 9152987821",
              "Vandrevala Foundation: 1860-2662-345",
              "HR Email: wellness@radnus.com",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                <ChevronRight size={12} color="#9ca3af" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{t}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13,
  color: "#1a1a2e",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};