import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail, Phone, FileText, CheckCircle, Clock,
  ExternalLink, Plus, TrendingUp, Star,
  Megaphone, Calendar, Edit3, Save, X, User
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ScoreArc({ score = 0 }) {
  const size = 110;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const color = score >= 75 ? "#00c896" : score >= 50 ? "#4f8ef7" : score >= 30 ? "#f0a500" : "#f45b5b";
  const label = score >= 90 ? "Outstanding" : score >= 75 ? "Exceeds" : score >= 60 ? "Meets Expectations" : score >= 45 ? "Needs Improvement" : "Below Target";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, fontFamily: "'Manrope',sans-serif", letterSpacing: "-1px" }}>{score}<span style={{ fontSize: 12 }}>%</span></span>
        <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.3px", textAlign: "center", lineHeight: 1.2, maxWidth: 60 }}>{label}</span>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [kpiScore, setKpiScore] = useState(null);
  const [kpiPeriod, setKpiPeriod] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [employeeGrade, setEmployeeGrade] = useState(null);
  const [impactAnnouncements, setImpactAnnouncements] = useState([]);

  useEffect(() => {
    const hideCrisp = () => {
      if (window.$crisp) window.$crisp.push(["do", "chat:hide"]);
    };
    hideCrisp();
    const retry = setTimeout(hideCrisp, 1500);
    return () => {
      clearTimeout(retry);
      if (window.$crisp) window.$crisp.push(["do", "chat:show"]);
    };
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("employeeId");
    if (!id) { window.location.href = "/login"; return; }
    fetchAll(id);
    const t = setInterval(() => fetchAll(id), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/employee/me/${id}`);
      try {
        const hrRes = await axios.get(`${API_BASE}/api/hr/employees`);
        const matched = hrRes.data.find(e => e._id === id);
        const mergedData = { ...res.data, employeeId: matched?.employeeId || res.data.employeeId };
        setEmployee(mergedData); setEditData(mergedData);
      } catch {
        setEmployee(res.data); setEditData(res.data);
      }

      try {
        const kr = await axios.get(`${API_BASE}/api/kpi-assignments/${id}`);
        if (kr.data.success && kr.data.data) {
          const assign = kr.data.data;
          setKpiPeriod(assign.period || "");

          let scoreSet = false;
          try {
            const prRes = await axios.get(`${API_BASE}/api/performance-reviews/${id}`);
            if (prRes.data.success && prRes.data.data?.length > 0) {
              const sorted = prRes.data.data
                .filter(r => r.status === "finalized" && r.final_score != null)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              if (sorted.length > 0) {
                setKpiScore(sorted[0].final_score);
                scoreSet = true;
              }
            }
          } catch (_) {}

          if (!scoreSet) {
            try {
              const saRes = await axios.get(`${API_BASE}/api/self-assessment/by-assignment/${assign._id}`);
              if (saRes.data.success && saRes.data.data) {
                const items = assign.template_id?.kpi_items || [];
                const map = {};
                saRes.data.data.items.forEach(i => { map[i.kpi_item_id] = i.self_value; });
                const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
                let total = 0;
                items.forEach(item => {
                  const val = map[item._id] || 0;
                  const pct = Math.min((val / item.target) * 100, 100);
                  const w = totalWeight === 0 ? (100 / items.length) : (item.weight || 0);
                  const divisor = totalWeight === 0 ? 100 : totalWeight;
                  total += pct * (w / divisor);
                });
                setKpiScore(Math.round(total));
              }
            } catch (_) {}
          }
        }
      } catch (_) {}

      try {
        const an = await axios.get(`${API_BASE}/api/announcements`);
        if (an.data.success) setAnnouncements(an.data.data?.slice(0, 3) || []);
      } catch (_) { }
      try {
        const gradeRes = await axios.get(`${API_BASE}/api/assign-grade/employee/${id}`);
        if (gradeRes.data.success && gradeRes.data.data) {
          setEmployeeGrade(gradeRes.data.data);
        }
      } catch (_) { }
      try {
        const ibRes = await axios.get(`${API_BASE}/api/impact-bonus/announcements`);
        if (ibRes.data.success) {
          setImpactAnnouncements(ibRes.data.data);
        }
      } catch (_) { }
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const handleEditToggle = () => { if (!employee) return; setEditData(JSON.parse(JSON.stringify(employee))); setIsEditing(true); };
  const handleCancel = () => setIsEditing(false);

  const handleDocReplace = async (index, file) => {
    const fd = new FormData(); fd.append("file", file); fd.append("docId", editData.documents[index]._id);
    const res = await axios.post(`${API_BASE}/api/employee/replace-doc`, fd);
    const d = [...editData.documents]; d[index] = res.data;
    setEditData(p => ({ ...p, documents: d })); setEmployee(p => ({ ...p, documents: d }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API_BASE}/api/employee/update-profile`, { employeeId: employee._id || employee.id, ...editData });
      const updated = await axios.get(`${API_BASE}/api/employee/me/${employee.id}`);
      setEmployee(updated.data); setEditData(updated.data); setIsEditing(false);
    } catch (err) { console.log(err); }
  };

  const handleChange = (e) => { const { name, value } = e.target; setEditData(p => ({ ...p, [name]: value })); };
  const handleDocChange = (i, f, v) => { const d = [...editData.documents]; d[i] = { ...d[i], [f]: v }; setEditData(p => ({ ...p, documents: d })); };
  const handleAddDoc = () => setEditData(p => ({ ...p, documents: [...p.documents, { docType: "New Document", fileUrl: "" }] }));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fc" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #eef0f4", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "s .7s linear infinite" }} />
      <style>{`@keyframes s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!employee) return null;

  const isApproved = employee.status === "approved" || employee.status === "active";
  const isRejected = employee.status === "rejected";
  const docs = (isEditing ? editData.documents : employee.documents) || [];

  const inp = {
    width: "100%", background: "#fff", border: "1.5px solid #e8eaf0", borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: "#1a1d2e", outline: "none",
    fontFamily: "'Manrope',sans-serif", transition: "border-color .15s"
  };

  const scoreColor = kpiScore === null ? "#c5cad8"
    : kpiScore >= 75 ? "#00c896" : kpiScore >= 50 ? "#4f8ef7"
      : kpiScore >= 30 ? "#f0a500" : "#f45b5b";

  const statusColor = isApproved ? "#00a875" : isRejected ? "#f45b5b" : "#d97706";
  const statusBg = isApproved ? "#f0fdf8" : isRejected ? "#fff1f2" : "#fffbeb";
  const statusBorder = isApproved ? "#a7f3d0" : isRejected ? "#fecaca" : "#fde68a";
  const statusLabel = isApproved ? "Active" : isRejected ? "Rejected" : "Pending";
  const statusEmoji = isApproved ? "✅" : isRejected ? "❌" : "⏳";

  const gradeStage = employeeGrade?.grade_id?.bgr_stage;
  const gradeColor  = gradeStage === "Build" ? "#059669" : gradeStage === "Grow" ? "#2563eb" : "#d97706";
  const gradeBg     = gradeStage === "Build" ? "#d1fae5" : gradeStage === "Grow" ? "#dbeafe" : "#fef3c7";
  const gradeBorder = gradeStage === "Build" ? "#6ee7b7" : gradeStage === "Grow" ? "#93c5fd" : "#fcd34d";

  return (
    <EmployeeLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── Reset & base ── */
        .emp-dash *, .emp-dash *::before, .emp-dash *::after {
          box-sizing: border-box;
        }
        .emp-dash {
          font-family: 'Manrope', sans-serif;
          background: #f7f8fc;
          min-height: 100vh;
          color: #1a1d2e;
          /* KEY FIX: prevent any child from causing horizontal scroll */
          overflow-x: hidden;
          width: 100%;
          max-width: 100%;
        }

        /* ── Topbar ── */
        .ed-topbar {
          background: #fff;
          border-bottom: 1px solid #eef0f6;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
          /* KEY FIX: padding accounts for sidebar hamburger on left */
          padding: 0 12px 0 60px;
          width: 100%;
          overflow: hidden;
        }
        .ed-topbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .ed-topbar-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .ed-topbar-name {
          font-size: 12px;
          font-weight: 700;
          color: #1a1d2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          max-width: 90px;
        }
        .ed-topbar-sub {
          font-size: 10px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        .ed-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          border: 1.5px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }
        /* hide pill text on very small screens */
        .ed-pill-text { display: none; }

        .ed-btn-primary {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px;
          background: #4f8ef7; border: none; color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Manrope', sans-serif; transition: background .15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .ed-btn-primary:hover { background: #3a7be8; }
        .ed-btn-outline {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 8px;
          background: #fff; border: 1.5px solid #e8eaf0; color: #374151;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Manrope', sans-serif; transition: all .15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .ed-btn-outline:hover { border-color: #4f8ef7; color: #4f8ef7; }

        /* topbar actions hidden on mobile, shown on desktop */
        .ed-topbar-actions { display: none; }

        /* ── Hero ── */
        .ed-hero {
          background: linear-gradient(120deg, #1a1d2e 0%, #252a45 60%, #1f2c4a 100%);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        .ed-hero::before {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(79,142,247,.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .ed-hero-profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
          margin-bottom: 14px;
          width: 100%;
          overflow: hidden;
        }
        .ed-avatar-wrap { position: relative; flex-shrink: 0; }
        .ed-avatar {
          width: 56px; height: 56px; border-radius: 50%;
          object-fit: cover; border: 2.5px solid rgba(255,255,255,.2);
          display: block;
        }
        .ed-avatar-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(0,0,0,.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .2s; cursor: pointer;
        }
        .ed-avatar-wrap:hover .ed-avatar-overlay { opacity: 1; }
        .ed-avatar-wrap input[type=file] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 5; border-radius: 50%;
        }
        .ed-hero-name-block {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .ed-hero-name {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1.2;
          /* KEY FIX: truncate long names */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ed-hero-role {
          margin: 0;
          font-size: 11px;
          color: rgba(255,255,255,.5);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* KEY FIX: chips — 2-column grid so they never overflow */
        .ed-hero-chips {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          position: relative;
          z-index: 1;
          margin-bottom: 12px;
          width: 100%;
        }
        /* 3rd chip (Mobile) spans full width so it's not orphaned */
        .ed-hero-chips .ed-chip:nth-child(3) {
          grid-column: 1 / -1;
        }
        .ed-chip {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 8px;
          padding: 7px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
        }
        .ed-chip-label {
          font-size: 9px;
          color: rgba(255,255,255,.35);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .ed-chip-val {
          font-size: 11px;
          color: rgba(255,255,255,.85);
          font-weight: 600;
          /* KEY FIX: truncate long values like emails */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* KEY FIX: status bar — stacks vertically on mobile */
        .ed-hero-status-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          padding: 12px 14px;
          position: relative;
          z-index: 1;
          width: 100%;
        }
        .ed-hero-status-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .ed-hero-status-text { flex: 1; min-width: 0; }
        .ed-hero-edit-btn { width: 100%; }
        .ed-hero-edit-btn > button,
        .ed-hero-edit-btn > div {
          width: 100%;
          justify-content: center;
        }

        /* ── Cards & layout ── */
        .ed-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #eef0f6;
          /* KEY FIX: never let card overflow its column */
          min-width: 0;
          overflow: hidden;
        }
        .ed-card-title {
          font-size: 11px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 1.2px;
          padding: 14px 14px 0; margin-bottom: 10px;
          display: flex; align-items: center; gap: 7px;
        }

        .ed-main {
          padding: 12px 12px 100px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          overflow: hidden;
        }

        /* KEY FIX: single column on mobile */
        .ed-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          width: 100%;
        }

        /* KEY FIX: single column docs on mobile */
        .ed-docs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          padding: 0 14px 14px;
        }

        .ed-doc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 10px;
          border: 1px solid #eef0f6; background: #fafbfd;
          transition: border-color .15s, box-shadow .15s;
          min-width: 0;
          overflow: hidden;
        }
        .ed-doc-item:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(79,142,247,.08); }

        .ed-ann-row {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 11px 14px; border-bottom: 1px solid #f4f5f8;
          transition: background .15s;
          min-width: 0;
          overflow: hidden;
        }
        .ed-ann-row:last-child { border-bottom: none; }
        .ed-ann-row:hover { background: #fafbfd; }

        .ed-info-pair {
          display: flex; flex-direction: column; gap: 2px;
          padding: 11px 14px; border-bottom: 1px solid #f4f5f8;
          min-width: 0;
        }
        .ed-info-pair:last-child { border-bottom: none; }
        .ed-info-label {
          font-size: 10px; color: #b0b8c9; font-weight: 700;
          text-transform: uppercase; letter-spacing: .5px;
          display: flex; align-items: center; gap: 4px;
        }
        .ed-info-value {
          font-size: 13px; color: #374151; font-weight: 600;
          /* KEY FIX: truncate long email/phone */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ed-view-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 9px; border-radius: 7px;
          background: #f0f4ff; border: 1px solid #c7d2fe; color: #4f8ef7;
          font-size: 11px; font-weight: 700; text-decoration: none;
          flex-shrink: 0; transition: all .15s; white-space: nowrap;
        }
        .ed-view-btn:hover { background: #4f8ef7; color: #fff; }

        /* KEY FIX: score wrap — flex row, arc shrinks on small screens */
        .ed-score-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        .ed-score-arc-wrap {
          flex-shrink: 0;
          transform: scale(0.82);
          transform-origin: left center;
        }
        .ed-score-num {
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Desktop overrides ── */
        @media (min-width: 768px) {
          .ed-topbar {
            padding: 0 28px;
            height: 60px;
          }
          .ed-topbar-name { font-size: 13px; max-width: none; }
          .ed-topbar-sub { font-size: 11px; }
          .ed-topbar-right { gap: 10px; }
          .ed-topbar-actions { display: flex; align-items: center; gap: 8px; }
          .ed-pill-text { display: inline; }
          .ed-status-pill { padding: 5px 10px; font-size: 11px; }

          .ed-hero { padding: 28px 32px; }
          .ed-hero-profile-row { margin-bottom: 20px; gap: 14px; }
          .ed-avatar { width: 68px; height: 68px; }
          .ed-hero-name { font-size: 22px; white-space: normal; }
          .ed-hero-role { font-size: 13px; white-space: normal; }

          /* desktop chips: 3 columns side by side */
          .ed-hero-chips { grid-template-columns: 1fr 1fr 1fr; }
          .ed-hero-chips .ed-chip:nth-child(3) { grid-column: auto; }
          .ed-chip-val { font-size: 12px; white-space: nowrap; }

          /* desktop status bar: horizontal */
          .ed-hero-status-bar { flex-direction: row; align-items: center; }
          .ed-hero-status-row { flex: 1; }
          .ed-hero-edit-btn { width: auto; }
          .ed-hero-edit-btn > button,
          .ed-hero-edit-btn > div { width: auto; }

          .ed-card-title { padding: 18px 20px 0; margin-bottom: 14px; }
          .ed-ann-row { padding: 12px 20px; gap: 11px; }
          .ed-info-pair { padding: 11px 20px; }
          .ed-info-value { white-space: normal; }

          .ed-main { padding: 20px 28px 32px; gap: 16px; }
          .ed-grid-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
          .ed-docs-grid {
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 10px;
            padding: 0 20px 20px;
          }
          .ed-doc-item { padding: 12px 14px; gap: 11px; }

          .ed-score-arc-wrap { transform: scale(1); }
          .ed-score-num { font-size: 30px; }
        }
      `}</style>

      <div className="emp-dash">

        {/* ── Topbar ── */}
        <div className="ed-topbar">
          <div className="ed-topbar-left">
            <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "2px solid #eef0f6", flexShrink: 0 }}>
              <img
                src={employee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=e8f0fe&color=4f8ef7&size=36`}
                alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <p className="ed-topbar-name">{employee.name}</p>
              <p className="ed-topbar-sub">{employee.designation} · {employee.department}</p>
            </div>
          </div>
          <div className="ed-topbar-right">
            <span className="ed-status-pill" style={{ background: statusBg, color: statusColor, borderColor: statusBorder }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
              <span className="ed-pill-text">{statusLabel}</span>
            </span>
            <span className="ed-topbar-actions">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="ed-btn-primary"><Save size={13} /> Save</button>
                  <button onClick={handleCancel} className="ed-btn-outline"><X size={13} /> Cancel</button>
                </>
              ) : (
                <button onClick={e => { e.preventDefault(); handleEditToggle(); }} className="ed-btn-outline">
                  <Edit3 size={13} /> Edit Profile
                </button>
              )}
            </span>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <div className="ed-hero">
          <div className="ed-hero-profile-row">
            <div className="ed-avatar-wrap">
              <img
                src={employee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=252a45&color=7fa8f7&size=72`}
                alt="profile" className="ed-avatar"
              />
              <div className="ed-avatar-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              {isEditing && (
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  const fd = new FormData(); fd.append("file", file); fd.append("employeeId", employee.id);
                  await axios.post(`${API_BASE}/api/employee/upload-profile`, fd);
                  const r = await axios.get(`${API_BASE}/api/employee/me/${employee.id}`);
                  setEmployee(r.data);
                }} />
              )}
            </div>

            <div className="ed-hero-name-block">
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    style={{ ...inp, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.22)", color: "#fff", fontSize: 14 }}
                    name="name" value={editData.name || ""} onChange={handleChange} placeholder="Full Name"
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input
                      style={{ ...inp, flex: 1, minWidth: 90, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.18)", color: "#fff", fontSize: 12 }}
                      name="designation" value={editData.designation || ""} onChange={handleChange} placeholder="Designation"
                    />
                    <input
                      style={{ ...inp, flex: 1, minWidth: 90, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.18)", color: "#fff", fontSize: 12 }}
                      name="department" value={editData.department || ""} onChange={handleChange} placeholder="Department"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="ed-hero-name">{employee.name}</p>
                  <p className="ed-hero-role">{employee.designation} · {employee.department}</p>
                </>
              )}
            </div>
          </div>

          {/* Chips — 2-col grid, 3rd chip spans full width */}
          <div className="ed-hero-chips">
            {[
              { label: "Employee ID", value: employee.employeeId || "—" },
              { label: "Email",       value: employee.email },
              { label: "Mobile",      value: employee.mobile || "—" },
            ].map((s, i) => (
              <div key={i} className="ed-chip">
                <span className="ed-chip-label">{s.label}</span>
                <span className="ed-chip-val" title={s.value}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Status bar — vertical on mobile, horizontal on desktop */}
          <div className="ed-hero-status-bar">
            <div className="ed-hero-status-row">
              <span style={{ fontSize: 20, flexShrink: 0 }}>{statusEmoji}</span>
              <div className="ed-hero-status-text" style={{ marginLeft: 10 }}>
                <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 800, color: statusColor }}>
                  {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,.35)", lineHeight: 1.4 }}>
                  {isApproved ? "Your documents have been verified by HR" : isRejected ? (employee.remarks || "Documents rejected by HR") : "HR is reviewing your documents"}
                </p>
              </div>
            </div>
            <span className="ed-hero-edit-btn">
              {isEditing ? (
                <div style={{ display: "flex", gap: 6, width: "100%" }}>
                  <button onClick={handleSave} className="ed-btn-primary" style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: 12 }}>
                    <Save size={12} /> Save
                  </button>
                  <button onClick={handleCancel} className="ed-btn-outline" style={{ flex: 1, justifyContent: "center", padding: "8px 10px", fontSize: 12, background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={e => { e.preventDefault(); handleEditToggle(); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "8px 13px", borderRadius: 8, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.22)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>
                  <Edit3 size={12} /> Edit Profile
                </button>
              )}
            </span>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="ed-main">

          <div className="ed-grid-2">

            {/* Score Card */}
            <div className="ed-card" style={{ padding: "14px" }}>
              <p className="ed-card-title" style={{ padding: 0, marginBottom: 12 }}>
                <TrendingUp size={12} /> Performance Score
              </p>
              {kpiScore === null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2.5px dashed #e8eaf0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Star size={16} color="#d1d5db" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>No KPIs Assigned</p>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: "#c5cad8" }}>HR will assign your KPIs soon</p>
                    <a href="/employee/performance" style={{ fontSize: 12, color: "#4f8ef7", fontWeight: 700, textDecoration: "none" }}>View Performance →</a>
                  </div>
                </div>
              ) : (
                <div className="ed-score-wrap">
                  <div className="ed-score-arc-wrap">
                    <ScoreArc score={kpiScore} />
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b0b8c9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>Overall Score</p>
                    <p className="ed-score-num" style={{ margin: "0 0 5px", color: scoreColor }}>
                      {kpiScore}<span style={{ fontSize: 13, letterSpacing: 0 }}>%</span>
                    </p>
                    {kpiPeriod && (
                      <span style={{ background: "#f0f4ff", color: "#4f8ef7", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, border: "1px solid #c7d2fe", fontFamily: "'JetBrains Mono',monospace", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kpiPeriod}</span>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <a href="/employee/performance" style={{ fontSize: 12, color: "#4f8ef7", fontWeight: 700, textDecoration: "none" }}>View Full Report →</a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Announcements Card */}
            <div className="ed-card" style={{ overflow: "hidden" }}>
              <p className="ed-card-title"><Megaphone size={12} /> Announcements</p>
              {impactAnnouncements.map((ib, i) => (
                <div key={`ib-${i}`} className="ed-ann-row">
                  <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 8, background: "#ecfdf5", border: "1px solid #6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🏆</div>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#059669", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🎉 Innovation Announced!</p>
                    <p style={{ margin: "0 0 1px", fontSize: 12, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>{ib.title}</p>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>👤 {ib.employee_name || ib.message?.split('·')[0]?.trim() || ""}</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      {ib.bonus_amount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: 99, border: "1px solid #6ee7b7" }}>
                          ₹{ib.bonus_amount.toLocaleString("en-IN")} Bonus
                        </span>
                      )}
                      {ib.total_score > 0 && (
                        <span style={{ fontSize: 10, color: "#b0b8c9", fontWeight: 600 }}>Score: {ib.total_score}/100</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && impactAnnouncements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 14px 20px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f7f8fc", border: "1px solid #eef0f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Megaphone size={15} color="#d1d5db" />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "#c5cad8" }}>No announcements right now</p>
                </div>
              ) : (
                announcements.map((ann, i) => (
                  <div key={i} className="ed-ann-row">
                    <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📢</div>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.title}</p>
                      <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.message || ann.content}</p>
                      <span style={{ fontSize: 10, color: "#b0b8c9", display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar size={9} />
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grade Card */}
          {employeeGrade && (
            <div className="ed-card" style={{ padding: "14px" }}>
              <p className="ed-card-title" style={{ padding: 0, marginBottom: 14 }}>🏅 My Grade Level</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ background: "#1a1a2e", color: "#fff", borderRadius: 12, padding: "10px 18px", fontSize: 26, fontWeight: 900, letterSpacing: "-1px", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                  {employeeGrade.grade_id?.level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employeeGrade.grade_id?.designation}</p>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>📅 {employeeGrade.grade_id?.experience_range}</p>
                  <span style={{ background: gradeBg, color: gradeColor, border: `1px solid ${gradeBorder}`, fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>{gradeStage} Stage</span>
                </div>
              </div>
              {employeeGrade.grade_id?.core_responsibility && (
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "#374151", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", lineHeight: 1.6, borderLeft: `3px solid ${gradeColor}` }}>
                  {employeeGrade.grade_id.core_responsibility}
                </p>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="ed-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 0", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <p className="ed-card-title" style={{ padding: 0, margin: 0 }}><FileText size={12} /> Uploaded Documents</p>
              {isEditing && (
                <button onClick={handleAddDoc} className="ed-btn-outline" style={{ fontSize: 11, padding: "5px 10px" }}>
                  <Plus size={12} /> Add Doc
                </button>
              )}
            </div>
            {docs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 14px", color: "#d1d5db" }}>
                <FileText size={28} style={{ display: "block", margin: "0 auto 8px", opacity: .4 }} />
                <p style={{ fontSize: 12, margin: 0 }}>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="ed-docs-grid">
                {docs.map((doc, index) => (
                  <div key={index} className="ed-doc-item">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0f4ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={13} color="#4f8ef7" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <input style={{ ...inp, fontSize: 12, padding: "6px 9px" }} value={doc.docType} onChange={e => handleDocChange(index, 'docType', e.target.value)} placeholder="Document Type" />
                          <input type="file" accept=".doc,.docx,image/*" style={{ fontSize: 11, color: "#9ca3af" }}
                            onChange={e => {
                              const file = e.target.files[0]; if (!file) return;
                              const ok = ["image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                              if (!ok.includes(file.type)) { alert("Only Image or DOC"); return; }
                              handleDocReplace(index, file);
                            }} />
                        </div>
                      ) : (
                        <>
                          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.docType}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>
                            {!doc.fileUrl ? "No File" : doc.fileUrl.endsWith(".pdf") ? "PDF" : /\.(jpg|jpeg|png)/i.test(doc.fileUrl) ? "Image" : "Document"}
                          </p>
                        </>
                      )}
                    </div>
                    {!isEditing && doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="ed-view-btn">
                        <ExternalLink size={10} /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact + Onboarding */}
          <div className="ed-grid-2">
            <div className="ed-card" style={{ overflow: "hidden" }}>
              <p className="ed-card-title"><User size={12} /> Contact Information</p>
              <div className="ed-info-pair">
                <span className="ed-info-label"><Mail size={10} /> Email Address</span>
                {isEditing ? <input style={inp} name="email" type="email" value={editData.email || ""} onChange={handleChange} /> : <span className="ed-info-value">{employee.email}</span>}
              </div>
              <div className="ed-info-pair">
                <span className="ed-info-label"><Phone size={10} /> Mobile Number</span>
                {isEditing ? <input style={inp} name="mobile" value={editData.mobile || ""} onChange={handleChange} /> : <span className="ed-info-value">{employee.mobile || "—"}</span>}
              </div>
            </div>
            <div className="ed-card" style={{ padding: "14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: statusBg, border: `1px solid ${statusBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{statusEmoji}</div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#b0b8c9", textTransform: "uppercase", letterSpacing: "0.6px" }}>Onboarding Status</p>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: statusColor }}>{isApproved ? "Approved" : isRejected ? "Rejected" : "Pending Review"}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>{isApproved ? "HR has verified your documents" : isRejected ? (employee.remarks || "Documents rejected by HR") : "HR is reviewing your documents"}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
}