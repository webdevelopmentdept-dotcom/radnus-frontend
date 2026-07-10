import React, { useEffect, useState } from "react";
import {
  X, User, Mail, Phone, Building2, Briefcase,
  TrendingUp, Medal, FileText, ExternalLink,
  CheckCircle, Clock, GraduationCap, CreditCard, Loader2
} from "lucide-react";

// Documents worth showing on the profile drawer, in display order.
// isText → value stored as plain text in fileUrl (CGPA, PF/ESI numbers etc), not a file.
const PROFILE_DOC_TYPES = [
  { type: "Resume",           label: "Resume",              isText: false },
  { type: "10th Marksheet",   label: "10th Marksheet",      isText: false },
  { type: "12th Marksheet",   label: "12th Marksheet",      isText: false },
  { type: "UG Consolidated",  label: "UG Consolidated",     isText: false },
  { type: "PG Consolidated",  label: "PG Consolidated",     isText: false },
  { type: "CGPA",             label: "UG CGPA",             isText: true  },
  { type: "PG CGPA",          label: "PG CGPA",             isText: true  },
  { type: "Bank Passbook",    label: "Bank Passbook",       isText: false },
];

export default function ApplicantProfileDrawer({ employeeId, jobTitle, onClose, apiBase }) {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [kpiScore, setKpiScore] = useState(null);
  const [kpiPeriod, setKpiPeriod] = useState("");
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const empRes = await fetch(`${apiBase}/api/employee/me/${employeeId}`);
        const empData = await empRes.json();
        if (!cancelled) setEmployee(empData);
      } catch (_) {}

      try {
        const prRes = await fetch(`${apiBase}/api/performance-reviews/${employeeId}`);
        const prData = await prRes.json();
        let scoreSet = false;

        if (prData.success && prData.data?.length > 0) {
          const finalized = prData.data
            .filter(r => r.status === "finalized" && r.final_score != null)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          if (finalized.length > 0) {
            if (!cancelled) {
              setKpiScore(finalized[0].final_score);
              setKpiPeriod(finalized[0].period || "");
            }
            scoreSet = true;
          }
        }

        // ✅ NEW — No HR-finalized review yet → fall back to employee's
        // latest self-assessment (previous month's self-reported progress)
        if (!scoreSet) {
          try {
            const assignRes = await fetch(`${apiBase}/api/kpi-assignments/${employeeId}`);
            const assignData = await assignRes.json();
            if (assignData.success && assignData.data) {
              const assign = assignData.data;
              const saRes = await fetch(`${apiBase}/api/self-assessment/by-assignment/${assign._id}`);
              const saData = await saRes.json();
              if (saData.success && saData.data) {
                const items = assign.template_id?.kpi_items || [];
                const map = {};
                saData.data.items.forEach(i => { map[i.kpi_item_id] = i.self_value; });
                const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
                let total = 0;
                items.forEach(item => {
                  const val = map[item._id] || 0;
                  const pct = Math.min((val / item.target) * 100, 100);
                  const w = totalWeight === 0 ? (100 / items.length) : (item.weight || 0);
                  const divisor = totalWeight === 0 ? 100 : totalWeight;
                  total += pct * (w / divisor);
                });
                if (!cancelled) {
                  setKpiScore(Math.round(total));
                  setKpiPeriod(assign.period ? `${assign.period} (self-reported)` : "Self-reported");
                }
              }
            }
          } catch (_) {}
        }
      } catch (_) {}

      try {
        const gradeRes = await fetch(`${apiBase}/api/assign-grade/employee/${employeeId}`);
        const gradeData = await gradeRes.json();
        if (!cancelled && gradeData.success && gradeData.data) setGrade(gradeData.data);
      } catch (_) {}

      if (!cancelled) setLoading(false);
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [employeeId, apiBase]);

  const handleViewDoc = async (docId) => {
    const newTab = window.open("", "_blank");
    try {
      newTab.document.write('<p style="font-family:sans-serif;padding:20px;">Loading...</p>');
      const res = await fetch(`${apiBase}/api/employee/view-doc/${docId}`);
      const data = await res.json();
      if (data.url) newTab.location.href = data.url;
      else newTab.document.write('<p style="font-family:sans-serif;padding:20px;color:red;">Could not load document.</p>');
    } catch {
      newTab.document.write('<p style="font-family:sans-serif;padding:20px;color:red;">Failed to load document.</p>');
    }
  };

  const getDoc = (type) =>
    employee?.documents?.find(d => d.docType?.trim().toLowerCase() === type.toLowerCase()) || null;

  const scoreColor = kpiScore === null ? "#9ca3af" : kpiScore >= 75 ? "#059669" : kpiScore >= 50 ? "#2563eb" : kpiScore >= 30 ? "#d97706" : "#dc2626";

  return (
    <>
      <style>{`
        @keyframes apdSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes apdFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .apd-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.55); z-index: 2000; animation: apdFadeIn 0.15s ease; }
        .apd-drawer {
          position: fixed; top: 0; right: 0; height: 100vh; width: 100%; max-width: 440px;
          background: #f8fafc; z-index: 2001; box-shadow: -8px 0 40px rgba(0,0,0,0.25);
          animation: apdSlideIn 0.25s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column;
        }
        .apd-header {
          background: #0f172a; padding: 20px 22px; color: #fff; flex-shrink: 0;
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .apd-close { background: rgba(255,255,255,0.1); border: none; border-radius: 8px; width: 30px; height: 30px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .apd-close:hover { background: rgba(255,255,255,0.18); }
        .apd-body { flex: 1; overflow-y: auto; padding: 20px; }
        .apd-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
        .apd-section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
        .apd-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
        .apd-row:last-child { border-bottom: none; }
        .apd-row-label { font-size: 11px; color: #94a3b8; font-weight: 600; min-width: 90px; flex-shrink: 0; }
        .apd-row-value { font-size: 13px; color: #1e293b; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .apd-doc-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f1f5f9; gap: 10px; }
        .apd-doc-row:last-child { border-bottom: none; }
        .apd-doc-name { font-size: 12.5px; font-weight: 600; color: #334155; }
        .apd-doc-status-yes { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #059669; font-weight: 700; }
        .apd-doc-status-no { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #cbd5e1; font-weight: 600; }
        .apd-view-btn { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; }
        .apd-view-btn:hover { background: #2563eb; color: #fff; }
        .apd-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 60px 0; color: #94a3b8; font-size: 13px; font-weight: 600; }
        .apd-spin { animation: apdSpin 0.8s linear infinite; }
        @keyframes apdSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="apd-overlay" onClick={onClose} />
      <div className="apd-drawer">

        <div className="apd-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, flexShrink: 0
            }}>
              {employee?.name?.charAt(0) || "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {employee?.name || "Loading..."}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
                Applying for: {jobTitle || "—"}
              </p>
            </div>
          </div>
          <button className="apd-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="apd-body">
          {loading ? (
            <div className="apd-loading">
              <Loader2 size={16} className="apd-spin" /> Loading profile...
            </div>
          ) : !employee ? (
            <div className="apd-loading">Could not load profile.</div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="apd-section">
                <p className="apd-section-title"><User size={12} /> Basic Info</p>
                <div className="apd-row">
                  <span className="apd-row-label"><Mail size={11} style={{ marginRight: 4 }} />Email</span>
                  <span className="apd-row-value" title={employee.email}>{employee.email || "—"}</span>
                </div>
                <div className="apd-row">
                  <span className="apd-row-label"><Phone size={11} style={{ marginRight: 4 }} />Mobile</span>
                  <span className="apd-row-value">{employee.mobile || "—"}</span>
                </div>
                <div className="apd-row">
                  <span className="apd-row-label"><Building2 size={11} style={{ marginRight: 4 }} />Dept</span>
                  <span className="apd-row-value">{employee.department || "—"}</span>
                </div>
                <div className="apd-row">
                  <span className="apd-row-label"><Briefcase size={11} style={{ marginRight: 4 }} />Role</span>
                  <span className="apd-row-value">{employee.designation || "—"}</span>
                </div>
              </div>

              {/* Performance & Grade */}
              <div className="apd-section">
                <p className="apd-section-title"><TrendingUp size={12} /> Performance & Grade</p>
                <div className="apd-row">
                  <span className="apd-row-label">Score</span>
                  <span className="apd-row-value" style={{ color: scoreColor }}>
                    {kpiScore !== null ? `${kpiScore}%${kpiPeriod ? ` · ${kpiPeriod}` : ""}` : "No score yet"}
                  </span>
                </div>
                <div className="apd-row">
                  <span className="apd-row-label"><Medal size={11} style={{ marginRight: 4 }} />Grade</span>
                  <span className="apd-row-value">
                    {grade?.grade_id?.level ? `${grade.grade_id.level} (${grade.grade_id.bgr_stage || "—"})` : "Not assigned"}
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="apd-section">
                <p className="apd-section-title"><FileText size={12} /> Documents & Education</p>
                {PROFILE_DOC_TYPES.map(({ type, label, isText }) => {
                  const doc = getDoc(type);
                  return (
                    <div key={type} className="apd-doc-row">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="apd-doc-name" style={{ margin: 0 }}>{label}</p>
                        {doc
                          ? (isText
                              ? <span className="apd-doc-status-yes"><CheckCircle size={11} /> {doc.fileUrl}</span>
                              : <span className="apd-doc-status-yes"><CheckCircle size={11} /> Uploaded</span>)
                          : <span className="apd-doc-status-no"><Clock size={11} /> Not provided</span>
                        }
                      </div>
                      {doc && !isText && (
                        <button className="apd-view-btn" onClick={() => handleViewDoc(doc._id)}>
                          <ExternalLink size={11} /> View
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}