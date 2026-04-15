// pages/hr/dashboard/performance/OkrDashboard.jsx — FULL UPDATED VERSION
// Key change: Added "Department OKRs" tab showing OKR objectives + KR progress

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users, Award, BarChart2, Building2,
  ChevronDown, ChevronUp, CheckCircle,
  Clock, AlertCircle, TrendingUp, Download
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getRatingInfo = (score) => {
  if (score >= 90) return { label: "Outstanding",          color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff" };
  if (score >= 60) return { label: "Meets Expectations",   color: "#d97706", bg: "#fffbeb" };
  if (score >= 45) return { label: "Needs Improvement",    color: "#ea580c", bg: "#fff7ed" };
  return              { label: "Unsatisfactory",           color: "#dc2626", bg: "#fef2f2" };
};

const getProgressColor = (pct) => {
  if (pct >= 100) return "#16a34a";
  if (pct >= 75)  return "#2563eb";
  if (pct >= 50)  return "#d97706";
  return "#dc2626";
};

const STATUS_CONFIG = {
  finalized     : { label: "Finalized",      color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
  self_submitted: { label: "Self Submitted", color: "#2563eb", bg: "#eff6ff", icon: "📋" },
  in_progress   : { label: "In Progress",    color: "#d97706", bg: "#fffbeb", icon: "⏳" },
  assigned      : { label: "Assigned",       color: "#6b7280", bg: "#f3f4f6", icon: "📌" },
  not_started   : { label: "Not Started",    color: "#9ca3af", bg: "#f9fafb", icon: "⬜" },
};

const STYLES = `
  .okr-page { padding: 28px 32px; }
  .okr-header { flex-direction: row; align-items: flex-start; }
  .okr-stats { grid-template-columns: repeat(5, 1fr); }
  .okr-filter-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; }
  .okr-table-wrap { display: block !important; }
  .okr-card-list  { display: none  !important; }
  .okr-dept-grid  { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .okr-obj-grid   { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  .okr-expand-grid { grid-template-columns: 1fr 1fr; }

  @media (max-width: 1024px) {
    .okr-stats { grid-template-columns: repeat(3, 1fr) !important; }
  }
  @media (max-width: 768px) {
    .okr-page { padding: 16px; }
    .okr-header { flex-direction: column !important; gap: 12px; }
    .okr-header-btn { width: 100%; justify-content: center; }
    .okr-stats { grid-template-columns: repeat(2, 1fr) !important; }
    .okr-filter-grid { grid-template-columns: 1fr !important; }
    .okr-table-wrap { display: none  !important; }
    .okr-card-list  { display: flex  !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
    .okr-dept-grid  { grid-template-columns: 1fr 1fr !important; }
    .okr-obj-grid   { grid-template-columns: 1fr !important; }
    .okr-expand-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .okr-stats { grid-template-columns: 1fr !important; }
    .okr-dept-grid { grid-template-columns: 1fr !important; }
  }
`;

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const strokeW = 8;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const { color } = getRatingInfo(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color }}>{score}%</span>
      </div>
    </div>
  );
}

// ── KPI Progress Bar ─────────────────────────────────────────────────────────
function KpiProgressBar({ kpi }) {
  const color = getProgressColor(kpi.pct);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", flex: 1 }}>{kpi.kpi_name}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
          {kpi.actual_value !== null ? `${kpi.actual_value} / ${kpi.target} ${kpi.unit}` : "—"}
        </span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${kpi.pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>{kpi.weight}% weight · {kpi.frequency}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{kpi.pct}%</span>
      </div>
    </div>
  );
}

// ── OKR Objective Card (Department Goals tab) ────────────────────────────────
function OkrObjectiveCard({ okr }) {
  const [open, setOpen] = useState(false);
  const score = okr.objective_score || 0;
  const { color, bg, label } = getRatingInfo(score);
  const krs = okr.key_results || [];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14, wordBreak: "break-word" }}>{okr.title}</p>
            <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 12 }}>
              {okr.department} · {okr.quarter} {okr.year}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color }}>{score}%</p>
            <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{label}</span>
          </div>
        </div>
        {/* Objective progress bar */}
        <div style={{ marginTop: 10, background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99 }}/>
        </div>
      </div>

      {/* Key Results */}
      <div style={{ padding: "12px 18px" }}>
        {(open ? krs : krs.slice(0, 2)).map((kr, i) => {
          const pct = kr.progress_pct || 0;
          const c   = getProgressColor(pct);
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", flex: 1 }}>{kr.title}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>
                  {kr.current_value} / {kr.target} {kr.unit}
                </span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 99 }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                {kr.linked_kpi_name
                  ? <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600 }}>↔ KPI: {kr.linked_kpi_name}</span>
                  : <span style={{ fontSize: 10, color: "#9ca3af" }}>No KPI linked</span>}
                <span style={{ fontSize: 10, fontWeight: 700, color: c }}>{pct}%</span>
              </div>
            </div>
          );
        })}
        {krs.length > 2 && (
          <button onClick={() => setOpen(o => !o)}
            style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {open ? "▲ Show less" : `▼ +${krs.length - 2} more KRs`}
          </button>
        )}
        {krs.length === 0 && (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>No Key Results added yet</p>
        )}
      </div>
    </div>
  );
}

// ── Employee Row (expandable) ─────────────────────────────────────────────────
function EmployeeRow({ row, idx, expanded, onToggle }) {
  const { label, color, bg } = getRatingInfo(row.okr_score);
  const statusCfg = STATUS_CONFIG[row.okr_status] || STATUS_CONFIG.not_started;

  return (
    <>
      <tr style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa", cursor: "pointer" }}
        onClick={onToggle}>
        <td style={{ padding: "14px 16px", color: "#9ca3af", fontWeight: 600, fontSize: 13 }}>{idx + 1}</td>
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 14, flexShrink: 0 }}>
              {row.employee.name?.charAt(0) || "?"}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{row.employee.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{row.employee.designation}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>{row.employee.department}</td>
        <td style={{ padding: "14px 16px" }}>
          <span style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: 12, color: "#374151" }}>{row.period}</span>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ScoreRing score={row.okr_score} size={52}/>
            <div>
              <span style={{ display: "block", fontWeight: 700, fontSize: 11, color, lineHeight: 1.2 }}>{label}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{row.targets_met}/{row.kpi_count} targets</span>
            </div>
          </div>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <span style={{ background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>
            {statusCfg.icon} {statusCfg.label}
          </span>
        </td>
        <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>{row.kpi_count} KPIs</td>
        <td style={{ padding: "14px 16px" }}>
          <button style={{ background: expanded ? "#f3f4f6" : "#eff6ff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: expanded ? "#374151" : "#2563eb", display: "flex", alignItems: "center", gap: 4 }}>
            {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: "0 16px 20px", background: "#f8fafc" }}>
            <div className="okr-expand-grid" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginTop: 8, display: "grid", gap: 20 }}>
              {/* Left: KPI Progress */}
              <div>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>KPI Progress — {row.template.name}</p>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6b7280" }}>{row.template.role} · {row.template.department}</p>
                {row.kpi_progress.map((kpi, i) => <KpiProgressBar key={i} kpi={kpi}/>)}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Overall KPI Score</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: getRatingInfo(row.okr_score).color }}>{row.okr_score}%</span>
                </div>
              </div>

              {/* Right: Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: row.self_assessment ? "#f0fdf4" : "#fffbeb", border: `1px solid ${row.self_assessment ? "#bbf7d0" : "#fde68a"}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {row.self_assessment ? <CheckCircle size={16} color="#16a34a"/> : <Clock size={16} color="#d97706"/>}
                    <span style={{ fontWeight: 700, fontSize: 13, color: row.self_assessment ? "#16a34a" : "#d97706" }}>
                      Self Assessment {row.self_assessment ? "Submitted" : "Pending"}
                    </span>
                  </div>
                  {row.self_assessment
                    ? <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                        Submitted: {new Date(row.self_assessment.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    : <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Employee hasn't submitted yet.</p>
                  }
                </div>

                {row.review ? (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Award size={16} color="#2563eb"/>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#2563eb" }}>Review Finalized</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: getRatingInfo(row.review.final_score).color }}>{row.review.final_score}%</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: getRatingInfo(row.review.final_score).color }}>{row.review.rating}</p>
                    {row.review.hr_comment && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 7, border: "1px solid #e5e7eb" }}>
                        <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>HR FEEDBACK</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#374151" }}>{row.review.hr_comment}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <AlertCircle size={16} color="#9ca3af"/>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#9ca3af" }}>Review Pending</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                      {row.self_assessment ? "Go to Performance Reviews to finalize." : "Waiting for self assessment first."}
                    </p>
                  </div>
                )}

                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 14 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Assignment Details</p>
                  {[
                    { label: "Period",      value: row.period },
                    { label: "Assigned On", value: new Date(row.assigned_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: "Template",    value: row.template.name },
                    { label: "KPI Count",   value: `${row.kpi_count} KPIs` },
                    { label: "Targets Met", value: `${row.targets_met} / ${row.kpi_count}` },
                  ].map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none", fontSize: 12 }}>
                      <span style={{ color: "#6b7280" }}>{d.label}</span>
                      <span style={{ fontWeight: 600, color: "#1f2937" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Employee Card (mobile) ────────────────────────────────────────────────────
function EmployeeCard({ row }) {
  const [open, setOpen] = useState(false);
  const { label, color, bg } = getRatingInfo(row.okr_score);
  const statusCfg = STATUS_CONFIG[row.okr_status] || STATUS_CONFIG.not_started;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color, fontSize: 15, flexShrink: 0 }}>
              {row.employee.name?.charAt(0) || "?"}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{row.employee.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{row.employee.designation} · {row.employee.department}</p>
            </div>
          </div>
          <span style={{ background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, padding: "4px 8px", borderRadius: 20, fontSize: 11 }}>
            {statusCfg.icon} {statusCfg.label}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px", fontSize: 12, marginBottom: 10 }}>
          <div>
            <span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>KPI Score</span>
            <p style={{ margin: "2px 0 0", fontWeight: 900, color, fontSize: 18 }}>{row.okr_score}%</p>
          </div>
          <div>
            <span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Period</span>
            <p style={{ margin: "2px 0 0" }}><span style={{ background: "#f3f4f6", padding: "2px 7px", borderRadius: 5, fontWeight: 600, fontSize: 11 }}>{row.period}</span></p>
          </div>
          <div>
            <span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Targets</span>
            <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#374151", fontSize: 13 }}>{row.targets_met}/{row.kpi_count}</p>
          </div>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ width: `${row.okr_score}%`, height: "100%", background: color, borderRadius: 99 }}/>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "14px 16px", background: "#f8fafc" }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>KPI Breakdown</p>
          {row.kpi_progress.map((kpi, i) => <KpiProgressBar key={i} kpi={kpi}/>)}
          {row.review && (
            <div style={{ marginTop: 12, background: "#eff6ff", borderRadius: 8, padding: "10px 12px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Final Review: {row.review.final_score}% — {row.review.rating}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OkrDashboard() {
  const [data, setData]               = useState([]);
  const [summary, setSummary]         = useState(null);
  const [deptSummary, setDeptSummary] = useState([]);
  const [objectives, setObjectives]   = useState([]); // ← Department OKRs
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab]     = useState("employees"); // ← Main tabs

  const [searchName, setSearchName]     = useState("");
  const [filterDept, setFilterDept]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [sortBy, setSortBy]             = useState("score_desc");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, okrRes] = await Promise.all([
        axios.get(`${API_BASE}/api/okr-dashboard`),
        axios.get(`${API_BASE}/api/okr?status=active`),
      ]);
      if (dashRes.data.success) {
        setData(dashRes.data.data);
        setSummary(dashRes.data.summary);
        setDeptSummary(dashRes.data.dept_summary);
      }
      if (okrRes.data.success) setObjectives(okrRes.data.data);
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const departments = useMemo(() => ["All", ...[...new Set(data.map(r => r.employee.department))].sort()], [data]);
  const periods     = useMemo(() => ["All", ...[...new Set(data.map(r => r.period))].sort((a, b) => b.localeCompare(a))], [data]);
  const statuses    = ["All", "finalized", "self_submitted", "in_progress", "assigned"];

  const filtered = useMemo(() => {
    let d = [...data];
    if (filterDept   !== "All") d = d.filter(r => r.employee.department === filterDept);
    if (filterStatus !== "All") d = d.filter(r => r.okr_status === filterStatus);
    if (filterPeriod !== "All") d = d.filter(r => r.period === filterPeriod);
    if (searchName.trim())      d = d.filter(r => r.employee.name.toLowerCase().includes(searchName.toLowerCase()));
    d.sort((a, b) => {
      if (sortBy === "score_desc") return b.okr_score - a.okr_score;
      if (sortBy === "score_asc")  return a.okr_score - b.okr_score;
      if (sortBy === "name")       return a.employee.name.localeCompare(b.employee.name);
      if (sortBy === "dept")       return a.employee.department.localeCompare(b.employee.department);
      return 0;
    });
    return d;
  }, [data, filterDept, filterStatus, filterPeriod, searchName, sortBy]);

  const hasFilters = filterDept !== "All" || filterStatus !== "All" || filterPeriod !== "All" || searchName;
  const clearFilters = () => { setFilterDept("All"); setFilterStatus("All"); setFilterPeriod("All"); setSearchName(""); };

  const exportExcel = () => {
    const rows = filtered.map((r, i) => ({
      "#": i + 1, "Employee": r.employee.name, "Designation": r.employee.designation,
      "Department": r.employee.department, "Period": r.period,
      "KPI Score (%)": r.okr_score, "Rating": getRatingInfo(r.okr_score).label,
      "Status": STATUS_CONFIG[r.okr_status]?.label || r.okr_status,
      "Targets Met": `${r.targets_met}/${r.kpi_count}`,
      "Final Score (%)": r.review?.final_score ?? "—",
      "HR Comment": r.review?.hr_comment ?? "—",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [4,22,20,16,14,14,22,16,12,14,40].map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, "OKR Dashboard");
    XLSX.writeFile(wb, `OKR_Dashboard_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
    showToast("Excel exported! ✅");
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading OKR Dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="okr-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.15)", fontWeight: 500, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="okr-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>OKR Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Department goals → KPI progress → Performance scores</p>
        </div>
        <button className="okr-header-btn" onClick={exportExcel} disabled={!filtered.length}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: filtered.length ? "#16a34a" : "#d1fae5", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: filtered.length ? "pointer" : "not-allowed" }}>
          <Download size={16}/> Export ({filtered.length})
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="okr-stats" style={{ display: "grid", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Employees", value: summary.total,        color: "#2563eb", bg: "#eff6ff", icon: <Users size={20} color="#2563eb"/> },
            { label: "Finalized",       value: summary.finalized,    color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle size={20} color="#16a34a"/> },
            { label: "Self Submitted",  value: summary.submitted,    color: "#2563eb", bg: "#eff6ff", icon: <BarChart2 size={20} color="#2563eb"/> },
            { label: "In Progress",     value: summary.in_progress,  color: "#d97706", bg: "#fffbeb", icon: <TrendingUp size={20} color="#d97706"/> },
            { label: "Avg KPI Score",   value: `${summary.avg_score}%`, color: getRatingInfo(summary.avg_score).color, bg: getRatingInfo(summary.avg_score).bg, icon: <Award size={20} color={getRatingInfo(summary.avg_score).color}/> },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 24, width: "fit-content" }}>
        {[
          { id: "employees",  label: `👥 Employee KPI Scores (${data.length})` },
          { id: "objectives", label: `🎯 Department OKRs (${objectives.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "8px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeTab === tab.id ? "#1a1a2e" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════
          TAB 1 — Employee KPI Scores
      ══════════════════════════ */}
      {activeTab === "employees" && (
        <>
          {/* Dept Summary */}
          {deptSummary.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px 24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Department Overview</p>
              <div className="okr-dept-grid" style={{ display: "grid", gap: 12 }}>
                {deptSummary.map((d, i) => {
                  const avgScore = d.avg_score ?? 0;
                  const { color, bg } = getRatingInfo(avgScore);
                  return (
                    <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Building2 size={14} color={color}/>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{d.department}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.employee_count} emp</span>
                      </div>
                      {d.avg_score !== null ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>Avg KPI Score</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color }}>{d.avg_score}%</span>
                          </div>
                          <div style={{ background: "#e5e7eb", borderRadius: 99, height: 6, overflow: "hidden" }}>
                            <div style={{ width: `${d.avg_score}%`, height: "100%", background: color, borderRadius: 99 }}/>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>No finalized reviews yet</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <div className="okr-filter-grid" style={{ display: "grid", gap: 14, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>Search Employee</label>
                <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search by name..." style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inputStyle}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
                  {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : STATUS_CONFIG[s]?.label || s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Period</label>
                <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={inputStyle}>
                  {periods.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
                  <option value="score_desc">Score: High → Low</option>
                  <option value="score_asc">Score: Low → High</option>
                  <option value="name">Name A–Z</option>
                  <option value="dept">Department</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} style={{ marginTop: 10, background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                ✕ Clear Filters ({filtered.length} showing)
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <p style={{ color: "#6b7280", fontWeight: 600 }}>No employees found</p>
                {hasFilters && <button onClick={clearFilters} style={{ marginTop: 8, background: "none", border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 16px", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Clear Filters</button>}
              </div>
            ) : (
              <>
                <div className="okr-table-wrap" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Employee", "Department", "Period", "KPI Score", "Status", "KPIs", ""].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row, i) => (
                        <EmployeeRow key={row.assignment_id} row={row} idx={i}
                          expanded={expandedRow === row.assignment_id}
                          onToggle={() => setExpandedRow(expandedRow === row.assignment_id ? null : row.assignment_id)}/>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="okr-card-list">
                  {filtered.map(row => <EmployeeCard key={row.assignment_id} row={row}/>)}
                </div>
              </>
            )}
          </div>
          {filtered.length > 0 && (
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#9ca3af" }}>
              Showing {filtered.length} of {data.length} employees
            </p>
          )}
        </>
      )}

      {/* ══════════════════════════
          TAB 2 — Department OKRs
      ══════════════════════════ */}
      {activeTab === "objectives" && (
        <>
          {objectives.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: "60px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No Department OKRs set yet</h3>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
                Create OKRs in OKR Setup and link them to KPI items. When employees submit KPIs, OKR progress updates automatically.
              </p>
              <a href="/hr/dashboard/performance/okr-setup"
                style={{ display: "inline-block", background: "#2563eb", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Go to OKR Setup →
              </a>
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
                  OKR progress updates automatically when employees submit KPI self assessments. KRs linked to KPI items show real-time progress.
                </p>
              </div>
              <div className="okr-obj-grid" style={{ display: "grid", gap: 20 }}>
                {objectives.map(okr => <OkrObjectiveCard key={okr._id} okr={okr}/>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}