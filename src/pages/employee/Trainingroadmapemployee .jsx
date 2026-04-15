import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  BookOpen, Award, CheckCircle2, Clock, AlertTriangle,
  Target, GraduationCap, ChevronRight, Check, Star,
  Calendar, Layers, Info, RefreshCw, Zap, TrendingUp,
  FileText, Users, BarChart2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Global Styles ─────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  .tr-page { padding: 24px 28px; min-height: 100vh; background: #f4f6fb; font-family: 'Segoe UI', sans-serif; }

  @media (max-width: 768px) {
    .tr-page { padding: 14px !important; }
    .tr-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .tr-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
    .tr-tabs { flex-wrap: wrap !important; }
    .tr-tabs button { font-size: 11px !important; padding: 6px 10px !important; }
    .tr-cards-grid { grid-template-columns: 1fr !important; }
    .tr-roadmap-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
    .tr-table-wrap { overflow-x: auto !important; }
  }

  @media (max-width: 480px) {
    .tr-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .tr-tabs button { flex: 1 !important; justify-content: center !important; }
  }
`;

// ─── Constants ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  completed:   { label: "Completed",   color: "#10b981", bg: "#ecfdf5" },
  overdue:     { label: "Overdue",     color: "#ef4444", bg: "#fef2f2" },
  waived:      { label: "Waived",      color: "#8b5cf6", bg: "#f5f3ff" },
};

const TYPE_CONFIG = {
  induction:        { label: "Induction",       color: "#3b82f6" },
  job_role:         { label: "Job Role",         color: "#8b5cf6" },
  cross_functional: { label: "Cross-Functional", color: "#f59e0b" },
  culture:          { label: "Culture",          color: "#10b981" },
  refresher:        { label: "Refresher",        color: "#6b7280" },
  department:       { label: "Department",       color: "#ef4444" },
};

function getEmployeeId() {
  return (
    localStorage.getItem("employee_id") ||
    localStorage.getItem("employeeId")  ||
    localStorage.getItem("emp_id")      ||
    null
  );
}

// ─── Training Card ──────────────────────────────────────────────
function TrainingCard({ record, onStart }) {
  const st  = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
  const typ = TYPE_CONFIG[record.programId?.type] || TYPE_CONFIG.job_role;
  const isOverdue = record.dueDate && new Date(record.dueDate) < new Date() && record.status !== "completed";
  const prog = record.programId;

  return (
    <div style={{
      background: "#fff", borderRadius: 13, padding: "16px",
      borderLeft: `4px solid ${isOverdue ? "#ef4444" : st.color}`,
      boxShadow: "0 1px 4px rgba(0,0,0,.06)", height: "100%",
      boxSizing: "border-box",
    }}>
      {/* Top badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: typ.color, color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{typ.label}</span>
          <span style={{ background: isOverdue ? "#fef2f2" : st.bg, color: isOverdue ? "#ef4444" : st.color, border: `1px solid ${isOverdue ? "#ef4444" : st.color}33`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
            {isOverdue ? "Overdue" : st.label}
          </span>
          {record.certificationIssued && (
            <span style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
              <Award size={9} /> Certified
            </span>
          )}
        </div>
        {prog?.duration && <span style={{ fontSize: 11, color: "#9ca3af" }}>{prog.duration}</span>}
      </div>

      {/* Title */}
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#111827" }}>{prog?.title}</p>

      {/* Modules */}
      {prog?.modules?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {prog.modules.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9ca3af", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>{m}</span>
            </div>
          ))}
          {prog.modules.length > 3 && <span style={{ fontSize: 11, color: "#9ca3af" }}>+{prog.modules.length - 3} more topics</span>}
        </div>
      )}

      {/* Certification */}
      {prog?.certification && (
        <div style={{ background: "#fffbeb", borderRadius: 7, padding: "5px 10px", marginBottom: 8, border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 5 }}>
          <Award size={11} color="#92400e" />
          <p style={{ margin: 0, fontSize: 11, color: "#92400e" }}>{prog.certification}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: 11, color: "#6b7280", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {record.dueDate && (
            <span style={{ color: isOverdue ? "#ef4444" : "inherit", display: "flex", alignItems: "center", gap: 3 }}>
              <Calendar size={11} /> Due: {new Date(record.dueDate).toLocaleDateString("en-IN")}
            </span>
          )}
          {record.assessmentScore !== null && record.assessmentScore !== undefined && (
            <span style={{ color: record.assessmentScore >= 80 ? "#10b981" : "#ef4444" }}>
              Score: {record.assessmentScore}%
            </span>
          )}
        </div>
        {record.status === "pending" && (
          <button onClick={() => onStart(record._id)}
            style={{ padding: "5px 12px", border: "none", borderRadius: 7, background: "#3b82f6", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Start Training
          </button>
        )}
        {record.status === "in_progress" && (
          <span style={{ background: "#3b82f6", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>In Progress</span>
        )}
        {record.status === "completed" && (
          <CheckCircle2 size={16} color="#10b981" />
        )}
      </div>

      {/* Progress log */}
      {record.progressLog?.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 3px", color: "#9ca3af", fontSize: 11 }}>Latest update:</p>
          <p style={{ margin: 0, fontSize: 12 }}>{record.progressLog[record.progressLog.length - 1]?.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Employee Component ────────────────────────────────────
export default function TrainingRoadmapEmployee() {
  const [records, setRecords]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [activeTab, setActiveTab] = useState("my_trainings");

  const employeeId = getEmployeeId();

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!employeeId) { setError("session"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/training/my/${employeeId}`);
      setRecords(res.data.data || []);
      setStats(res.data.stats);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStart = async (recordId) => {
    try {
      await axios.put(`${API_BASE}/api/training/my/${recordId}/start`);
      showMsg("Training started! Good luck 🚀");
      fetchData();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <EmployeeLayout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </EmployeeLayout>
  );

  // ── Session ─────────────────────────────────────────────────
  if (error === "session") return (
    <EmployeeLayout>
      <div style={{ textAlign: "center", padding: 60 }}>
        <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
        <h5 style={{ color: "#6b7280" }}>Session expired. Please login again.</h5>
      </div>
    </EmployeeLayout>
  );

  if (error) return (
    <EmployeeLayout>
      <div style={{ margin: 16, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>{error}</div>
    </EmployeeLayout>
  );

  // ── Derived data ────────────────────────────────────────────
  const pending    = records.filter(r => r.status === "pending");
  const inProgress = records.filter(r => r.status === "in_progress");
  const completed  = records.filter(r => r.status === "completed");
  const overdue    = records.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "completed");
  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <EmployeeLayout>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,.2)", maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      <div className="tr-page">

        {/* ── Header ── */}
        <div className="tr-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>My Training Journey</h4>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Radnus Policy 3.15 — Job-Role Based Mandatory Training (RCA)</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={loading}
            style={{ padding: "8px 14px", border: "1.5px solid #e5e7eb", borderRadius: 9, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* ── Framework Banner ── */}
        <div style={{ background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", borderRadius: 13, padding: "14px 18px", marginBottom: 16, border: "1px solid #bfdbfe" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Your Learning Framework: Learn → Apply → Lead</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#374151" }}>
            <span><strong style={{ color: "#3b82f6" }}>Learn:</strong> Foundation & Skill Learning → Acquire job knowledge</span>
            <span><strong style={{ color: "#8b5cf6" }}>Apply:</strong> Real-world Implementation → Demonstrate proficiency</span>
            <span><strong style={{ color: "#10b981" }}>Lead:</strong> Coaching & Mentorship → Guide others</span>
          </div>
        </div>

        {/* ── Progress Overview ── */}
        {stats && (
          <div style={{ background: "#fff", borderRadius: 13, padding: "18px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>My Progress</p>
              <span style={{ fontWeight: 800, fontSize: 18, color: completionRate >= 95 ? "#10b981" : completionRate >= 60 ? "#f59e0b" : "#ef4444" }}>
                {completionRate}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 10, background: "#f3f4f6", borderRadius: 6, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, background: completionRate >= 95 ? "#10b981" : completionRate >= 60 ? "#f59e0b" : "#3b82f6", width: `${completionRate}%`, transition: "width .4s" }} />
            </div>
            {/* Stats grid */}
            <div className="tr-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {[
                { label: "Total",       value: stats.total,      color: "#111827", bg: "#f3f4f6" },
                { label: "Completed",   value: stats.completed,  color: "#10b981", bg: "#ecfdf5" },
                { label: "In Progress", value: stats.inProgress, color: "#3b82f6", bg: "#eff6ff" },
                { label: "Pending",     value: stats.pending,    color: "#6b7280", bg: "#f3f4f6" },
                { label: "Overdue",     value: overdue.length,   color: "#ef4444", bg: "#fef2f2" },
                { label: "Certified",   value: stats.certified,  color: "#f59e0b", bg: "#fffbeb" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 9, padding: "8px 10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Overdue Alert ── */}
        {overdue.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, color: "#991b1b" }}>
              You have <strong>{overdue.length} overdue training{overdue.length > 1 ? "s" : ""}</strong>. Please complete them immediately. Managers must confirm 100% training compliance before probation/promotion.
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tr-tabs" style={{ display: "flex", gap: 6, marginBottom: 16, background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid #e5e7eb", width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
          {[
            { key: "my_trainings", label: `All (${records.length})`,            icon: <BookOpen size={13} /> },
            { key: "pending",      label: `Pending (${pending.length})`,         icon: <Clock size={13} /> },
            { key: "in_progress",  label: `In Progress (${inProgress.length})`,  icon: <Zap size={13} /> },
            { key: "completed",    label: `Completed (${completed.length})`,     icon: <CheckCircle2 size={13} /> },
            { key: "roadmap",      label: "Training Roadmap",                    icon: <Layers size={13} /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: "8px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 12, background: activeTab === tab.key ? "#1a1a2e" : "transparent", color: activeTab === tab.key ? "#fff" : "#6b7280", transition: "all .2s", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══ MY TRAININGS ══ */}
        {activeTab === "my_trainings" && (
          records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
              <GraduationCap size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 4px", color: "#374151", fontWeight: 600 }}>No trainings assigned yet.</p>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>HR will assign trainings based on your role and department.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {records.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} />)}
            </div>
          )
        )}

        {/* ══ PENDING ══ */}
        {activeTab === "pending" && (
          pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
              <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "#6b7280" }}>No pending trainings! Great job.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {pending.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} />)}
            </div>
          )
        )}

        {/* ══ IN PROGRESS ══ */}
        {activeTab === "in_progress" && (
          inProgress.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
              <Clock size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "#6b7280" }}>No trainings in progress.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {inProgress.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} />)}
            </div>
          )
        )}

        {/* ══ COMPLETED ══ */}
        {activeTab === "completed" && (
          completed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb" }}>
              <BookOpen size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "#6b7280" }}>No trainings completed yet.</p>
            </div>
          ) : (
            <div>
              {/* Certificates earned */}
              {completed.filter(r => r.certificationIssued).length > 0 && (
                <div style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", borderRadius: 13, padding: "14px 18px", marginBottom: 14, border: "1px solid #fde68a" }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#92400e" }}>🏆 Certifications Earned</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {completed.filter(r => r.certificationIssued).map((r, i) => (
                      <span key={i} style={{ background: "#f59e0b", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                        <Award size={11} /> {r.programId?.certification || r.programId?.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {completed.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} />)}
              </div>
            </div>
          )
        )}

        {/* ══ ROADMAP ══ */}
        {activeTab === "roadmap" && (
          <div>
            <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
              <Info size={14} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: "#065f46", lineHeight: 1.6 }}>
                This is the standard Radnus training roadmap for all employees (L1–L6). Your assigned trainings depend on your role, level, and department. All trainings are tracked via Radnus Corporate Academy (RCA).
              </p>
            </div>

            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Job-Role Based Mandatory Training (L1–L6)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { level: "L1", label: "Intern / Trainee",       color: "#6b7280", duration: "7 Days",    cert: "RCA Foundation Certificate",          by: "HR & Culture",          modules: ["Company Induction", "Basic Communication", "Workplace Etiquette", "Radnus Culture"] },
                { level: "L2", label: "Executive",              color: "#3b82f6", duration: "1 Month",    cert: "RCA Role Certificate",                by: "Dept. Head + Trainer",  modules: ["Product & Service Training", "CRM & ERP Usage", "Customer Handling", "Basic Reporting"] },
                { level: "L3", label: "Senior Executive / AM",  color: "#8b5cf6", duration: "2 Months",   cert: "RCA Performance Certificate",         by: "L&D Team",              modules: ["Advanced Product Knowledge", "Dept SOP Training", "Team Coordination", "Basic Leadership"] },
                { level: "L4", label: "Manager / Sr. Manager",  color: "#f59e0b", duration: "3 Months",   cert: "RCA Leadership Readiness Badge",      by: "HR + L&D",              modules: ["Strategic Planning", "People Management", "Coaching & Mentoring", "Business Review"] },
                { level: "L5", label: "GM / AVP",               color: "#ef4444", duration: "3–6 Months", cert: "RCA Business Leadership Certificate", by: "CEO Office + External", modules: ["Business Growth Strategy", "Financial Awareness", "Data-driven Decision Making", "Leadership Communication"] },
                { level: "L6", label: "VP / Director / CXO",   color: "#10b981", duration: "6 Months",   cert: "RCA Executive Leadership Certificate", by: "CEO + Advisory Board",  modules: ["Vision Alignment", "Corporate Governance", "Digital Transformation", "Cross-Functional Leadership"] },
              ].map((r, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", borderLeft: `4px solid ${r.color}`, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                  <div className="tr-roadmap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ background: r.color, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{r.level}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{r.label}</p>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Duration: {r.duration} · By: {r.by}</p>
                      </div>
                    </div>
                    <div style={{ background: `${r.color}10`, borderRadius: 8, padding: "5px 12px", border: `1px solid ${r.color}33`, flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: r.color, display: "flex", alignItems: "center", gap: 4 }}>
                        <Award size={11} /> {r.cert}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {r.modules.map((m, j) => (
                      <span key={j} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Frequency Table */}
            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>Training Frequency & Review</p>
            <div className="tr-table-wrap" style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Training Type", "When", "Who Conducts"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Induction Training",            when: "On Joining",      by: "HR & L&D" },
                    { type: "Job Role Training",             when: "Within 30 Days",  by: "Department Trainer" },
                    { type: "Cross-Functional / Leadership", when: "Every 6 Months",  by: "L&D + HR" },
                    { type: "Culture & Engagement",          when: "Quarterly",       by: "Culture Team" },
                    { type: "Refresher Training",            when: "Annual",          by: "HR & L&D" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{r.type}</td>
                      <td style={{ padding: "10px 14px" }}><span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{r.when}</span></td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Governance note */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
              <Info size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: "#78350f", lineHeight: 1.6 }}>
                <strong>Training Governance:</strong> All trainings are tracked in RCA (Radnus Corporate Academy) via your dashboard. Your manager must ensure 100% training compliance before confirming probation or promotion.
              </p>
            </div>
          </div>
        )}

      </div>
    </EmployeeLayout>
  );
}