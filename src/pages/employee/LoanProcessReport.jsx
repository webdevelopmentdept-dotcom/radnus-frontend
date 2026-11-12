import React, { useState, useEffect } from "react";
import EmployeeLayout from "./EmployeeLayout";

// ── Static config — same stages as the main Loan Process module ────────────
const CHECKLIST_STAGES = [
  { key: "cibilVerification", label: "CIBIL Verification" },
  { key: "documentCollection", label: "Document Collection" },
  { key: "applicationProcess", label: "Application Process" },
  { key: "quotation", label: "Quotation" },
  { key: "auditorReference", label: "Auditor Reference" },
  { key: "documentPayment", label: "Document Payment" },
  { key: "finalisationVerification", label: "Finalisation & Verification" },
  { key: "finalSubmission", label: "Final Submission" },
  { key: "courier", label: "Courier" },
  { key: "completed", label: "Completed" },
];
const STEP_TEXT = { PENDING: "Pending", PROCESS: "Process", SANCTIONED: "Sanctioned", REJECTED: "Rejected", FORWARDED: "Forwarded", COMPLETED: "Completed", NOT_COMPLETED: "Not Completed" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
const stepTone = (s) =>
  s === "FORWARDED" || s === "SANCTIONED" || s === "COMPLETED" ? "ok"
    : s === "REJECTED" ? "bad"
      : s ? "warn" : "na";
const stepIcon = (s) => (stepTone(s) === "ok" ? "✅" : stepTone(s) === "bad" ? "❌" : s ? "⏳" : "↩️");

// ── Followup filter / summary options (same values as the Followup module) ──
const DIC_STATES = ["PENDING", "REJECTED", "FORWARDED", "NOT_COMPLETED", "COMPLETED"];
const BANK_STATES = ["PENDING", "PROCESS", "REJECTED", "NOT_COMPLETED", "COMPLETED"]; // SANCTIONED = lead completed, so not a "pending" bucket
const BANK_FILTER_STATES = ["PENDING", "PROCESS", "SANCTIONED", "REJECTED", "NOT_COMPLETED", "COMPLETED"];
const STUCK_OPTIONS = [3, 5, 10];

// Telecaller: first un-ticked stage = "current stage" ("completed" = every stage done)
const currentStageKey = (c) => {
  const open = CHECKLIST_STAGES.slice(0, -1).find((st) => !c.checklist?.[st.key]);
  return open ? open.key : "completed";
};

// Followup: days since the last DIC / Bank update (falls back to hand-over date)
const followupPendingDays = (c) => {
  const f = c.followup || {};
  const times = [f.dicOffice?.updatedAt, f.bank?.updatedAt, f.handedOverAt]
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  if (!times.length) return null;
  return Math.max(0, Math.floor((Date.now() - Math.max(...times)) / 86400000));
};

export default function LoanProcessReport() {
  const API = import.meta.env.VITE_API_BASE_URL;
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
  });

  const [customers, setCustomers] = useState([]);
  const [staffBreakdown, setStaffBreakdown] = useState([]);
  const [applicationBreakdown, setApplicationBreakdown] = useState([]);
  const [followupBreakdown, setFollowupBreakdown] = useState([]);
  const [followupUnassigned, setFollowupUnassigned] = useState(0);
  const [summaryTab, setSummaryTab] = useState("telecaller");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [applicationFilter, setApplicationFilter] = useState("");
  const [followupFilter, setFollowupFilter] = useState("");

  // ── Tab-wise filters ──
  const [tcStatus, setTcStatus] = useState("");     // telecaller: IN_PROGRESS | COMPLETED
  const [tcStage, setTcStage] = useState("");       // telecaller: current checklist stage key
  const [tcScheme, setTcScheme] = useState("");     // telecaller: scheme
  const [appStatus, setAppStatus] = useState("");   // application: NOT_TAKEN | IN_PROGRESS | COMPLETED
  const [fuStatus, setFuStatus] = useState("");     // followup: PENDING | COMPLETED
  const [fuDic, setFuDic] = useState("");           // followup: DIC Office state (NOT_SET = not started)
  const [fuBank, setFuBank] = useState("");         // followup: Bank state (NOT_SET = not started)
  const [fuStuck, setFuStuck] = useState("");       // followup: stuck for N+ days (3 / 5 / 10)

  const resetFilters = () => {
    setSearch(""); setDateFrom(""); setDateTo(""); setExpandedId(null);
    setStaffFilter(""); setTcStatus(""); setTcStage(""); setTcScheme("");
    setApplicationFilter(""); setAppStatus("");
    setFollowupFilter(""); setFuStatus(""); setFuDic(""); setFuBank(""); setFuStuck("");
  };
  // oru tab-oda filter innoru tab-ku leak aagaama, tab maarum bodhu ellaathaiyum reset
  const switchTab = (k) => {
    if (k === summaryTab) return;
    resetFilters();
    setSummaryTab(k);
  };

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/loan-process/report`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setStaffBreakdown(data.staffBreakdown || []);
        setApplicationBreakdown(data.applicationBreakdown || []);
        setFollowupBreakdown(data.followupBreakdown || []);
        setFollowupUnassigned(data.followupUnassigned || 0);
      } else {
        setError(data.message || "Report load aagala");
      }
    } catch (err) {
      console.error("LOAN PROCESS REPORT ERROR", err);
      setError("Report load aagala — network problem irukalam");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const applicationStaffOptions = Array.from(
    new Map(
      customers
        .filter((c) => c.application?.assignedTo?.employeeId)
        .map((c) => [String(c.application.assignedTo.employeeId), c.application.assignedTo.name])
    ).entries()
  );
  const followupStaffOptions = Array.from(
    new Map(
      customers
        .filter((c) => c.followup?.assignedTo?.employeeId)
        .map((c) => [String(c.followup.assignedTo.employeeId), c.followup.assignedTo.name])
    ).entries()
  );

  const schemeOptions = Array.from(new Set(customers.map((c) => c.scheme).filter(Boolean))).sort();

  // ── Common filters (search + date) — every tab ──
  const matchCommon = (c) => {
    if (search && !(c.customerName || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom || dateTo) {
      if (!c.loanDate) return false;
      const d = new Date(c.loanDate);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
    }
    return true;
  };

  // ── Followup helpers ──
  const inFollowup = (c) => c.followup?.status && c.followup.status !== "NONE";
  const matchFuOwner = (c) => {
    if (!followupFilter) return true;
    const ownerId = c.followup?.assignedTo?.employeeId;
    if (followupFilter === "UNASSIGNED") return !ownerId;
    return String(ownerId || "") === followupFilter;
  };
  const matchFuStuck = (c) => {
    if (!fuStuck) return true;
    if (c.followup?.status !== "PENDING") return false;
    const d = followupPendingDays(c);
    return d !== null && d >= Number(fuStuck);
  };
  const matchFuState = (c, step, want) =>
    !want || (c.followup?.[step]?.state || "") === (want === "NOT_SET" ? "" : want);

  const displayedCustomers = customers.filter(matchCommon).filter((c) => {
    // ── Telecaller tab ──
    if (summaryTab === "telecaller") {
      if (staffFilter && (c.staffId?._id || c.staffId) !== staffFilter) return false;
      if (tcStatus === "COMPLETED" && c.status !== "COMPLETED") return false;
      if (tcStatus === "IN_PROGRESS" && c.status === "COMPLETED") return false;
      if (tcStage && currentStageKey(c) !== tcStage) return false;
      if (tcScheme && c.scheme !== tcScheme) return false;
      return true;
    }
    // ── Application tab ──
    if (summaryTab === "application") {
      const ownerId = c.application?.assignedTo?.employeeId;
      const done = c.application?.status === "COMPLETED";
      if (applicationFilter && String(ownerId || "") !== applicationFilter) return false;
      if (appStatus === "COMPLETED" && !done) return false;
      if (appStatus === "IN_PROGRESS" && (!ownerId || done)) return false;
      if (appStatus === "NOT_TAKEN" && (ownerId || done)) return false;
      return true;
    }
    // ── Followup tab ──
    if (!inFollowup(c)) return false;
    if (!matchFuOwner(c)) return false;
    if (fuStatus && c.followup.status !== fuStatus) return false;
    if (!matchFuState(c, "dicOffice", fuDic)) return false;
    if (!matchFuState(c, "bank", fuBank)) return false;
    if (!matchFuStuck(c)) return false;
    return true;
  });

  // ── Followup summary cards: counts of PENDING leads (employee / date / search / stuck filters apply) ──
  const fuBase = customers.filter(
    (c) => inFollowup(c) && c.followup.status === "PENDING" && matchCommon(c) && matchFuOwner(c) && matchFuStuck(c)
  );
  const fuCount = (step, st) => fuBase.filter((c) => matchFuState(c, step, st)).length;
  const pickFuState = (kind, st) => {
    setFuStatus("PENDING");
    if (kind === "dic") setFuDic((v) => (v === st ? "" : st));
    else setFuBank((v) => (v === st ? "" : st));
  };

  const hasFilters = [search, dateFrom, dateTo, staffFilter, tcStatus, tcStage, tcScheme, applicationFilter,
    appStatus, followupFilter, fuStatus, fuDic, fuBank, fuStuck].some(Boolean);
  // ── Export current filtered list to Excel — needs the auth header, so a
  // plain window.open() won't work; fetch as a blob and trigger download ──
  const handleExportExcel = async () => {
    if (displayedCustomers.length === 0) {
      alert("No customers to export for the current filters.");
      return;
    }
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/loan-process/report/export`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        // exactly what's visible on screen (all filters applied)
        body: JSON.stringify({ ids: displayedCustomers.map((c) => c._id) }),
      });
      if (!res.ok) {
        let msg = "";
        try { msg = (await res.json()).message || ""; } catch { /* not json */ }
        throw new Error(`${res.status} ${msg}`.trim());
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loan-process-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("REPORT EXPORT ERROR", err);
      alert(`Excel export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <EmployeeLayout>
      <div className="lpr-root">
        <style>{`
          .lpr-root {
            --lp-bg: #F6F7FB;
            --lp-surface: #FFFFFF;
            --lp-border: #E4E7EE;
            --lp-text: #101828;
            --lp-text-muted: #64748B;
            --lp-primary: #2A3EB1;
            --lp-primary-soft: #EEF1FD;
            --lp-accent: #0F9D80;
            --lp-accent-soft: #E7F7F2;
            --lp-radius-lg: 16px;
            --lp-radius-md: 12px;
            --lp-radius-sm: 8px;
            --lp-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
            font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
            color: var(--lp-text);
          }
          .lpr-header-row {
            display: flex; align-items: flex-start; justify-content: space-between;
            gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
          }
          .lpr-summary-card {
            background: var(--lp-surface); border: 1px solid var(--lp-border);
            border-radius: var(--lp-radius-lg); box-shadow: var(--lp-shadow-sm);
            padding: 16px; margin-bottom: 16px; overflow-x: auto;
          }
          .lpr-summary-header {
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; user-select: none;
          }
          .lpr-summary-header:hover { opacity: 0.85; }
          .lpr-summary-chevron {
            color: var(--lp-text-muted); font-size: 12px; transition: transform 0.15s ease;
          }
                      .lpr-stat-title { font-size: 12px; font-weight: 700; color: var(--lp-text-muted); text-transform: uppercase; letter-spacing: .04em; margin: 6px 0; }
          .lpr-stat-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
          .lpr-stat {
            min-width: 112px; padding: 8px 14px; text-align: left; cursor: pointer;
            border: 1px solid var(--lp-border); border-radius: 10px; background: var(--lp-bg); color: var(--lp-text);
          }
          .lpr-stat b { display: block; font-size: 20px; line-height: 1.2; }
          .lpr-stat span { font-size: 12px; color: var(--lp-text-muted); }
          .lpr-stat:hover { border-color: var(--lp-primary); }
          .lpr-stat.active { border-color: var(--lp-primary); background: var(--lp-primary-soft); }
          .lpr-stat.active b, .lpr-stat.active span { color: var(--lp-primary); }
          .lpr-summary-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
          .lpr-summary-table th {
            text-align: left; padding: 8px 12px; color: var(--lp-text-muted);
            font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
            border-bottom: 1px solid var(--lp-border);
          }
          .lpr-summary-table td { padding: 8px 12px; border-bottom: 1px solid var(--lp-border); }
          .lpr-summary-table tr:last-child td { border-bottom: none; }
          .lpr-rank-badge {
            display: inline-flex; align-items: center; justify-content: center;
            width: 22px; height: 22px; border-radius: 50%; font-size: 11.5px; font-weight: 700;
            background: var(--lp-primary-soft); color: var(--lp-primary);
          }
          .lpr-rank-badge.gold { background: #FFF4D6; color: #B98900; }
          .lpr-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
          .lpr-filters input, .lpr-filters select {
            padding: 6px 10px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
            font-size: 13px; background: var(--lp-surface); min-width: 180px;
          }
          .lpr-export-btn {
            padding: 6px 12px; border: 1px solid var(--lp-accent); border-radius: var(--lp-radius-sm);
            font-size: 12.5px; font-weight: 700; background: var(--lp-accent-soft);
            color: var(--lp-accent); cursor: pointer;
          }
          .lpr-export-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .lpr-export-btn:hover:not(:disabled) { background: var(--lp-accent); color: #fff; }
          .lpr-card {
            background: var(--lp-surface); border: 1px solid var(--lp-border);
            border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
            overflow: hidden; margin-bottom: 8px;
          }
          .lpr-row {
            display: grid; grid-template-columns: 2fr 1fr 1fr auto;
            align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer;
          }
          .lpr-row:hover { background: var(--lp-bg); }
          .lpr-name { font-weight: 700; font-size: 14px; }
          .lpr-sub { font-size: 12px; color: var(--lp-text-muted); margin-top: 2px; }
          .lpr-staff-chip {
            font-size: 12px; font-weight: 600; color: var(--lp-primary);
            background: var(--lp-primary-soft); padding: 4px 10px; border-radius: 20px;
            width: fit-content;
          }
          .lpr-badge {
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; line-height: 1.5; padding: 4px 12px;
            border-radius: 20px; width: fit-content; white-space: nowrap; justify-self: end;
          }
          .lpr-badge.done { background: var(--lp-accent-soft); color: var(--lp-accent); }
          .lpr-badge.progress { background: var(--lp-primary-soft); color: var(--lp-primary); }
          .lpr-detail { padding: 14px 18px; border-top: 1px solid var(--lp-border); }
          .lpr-section-title { font-weight: 700; font-size: 12.5px; text-transform: uppercase;
            letter-spacing: 0.03em; color: var(--lp-text-muted); margin-bottom: 8px; }
          .lpr-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 16px; margin-bottom: 4px; }
          .lpr-info-item { font-size: 13px; }
          .lpr-info-item b { display: block; font-size: 11px; color: var(--lp-text-muted); font-weight: 600; }
          .lpr-checklist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
          .lpr-stage-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
          .lpr-stage-row input { accent-color: var(--lp-accent); }

          /* ── Followup cards + history timeline ── */
          .lpr-fu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin: 12px 0; }
          .lpr-fu-card { background: var(--lp-surface); border: 1px solid var(--lp-border); border-left: 4px solid #CBD5E1; border-radius: 10px; padding: 10px 12px; }
          .lpr-fu-card.ok { border-left-color: var(--lp-accent); }
          .lpr-fu-card.bad { border-left-color: #dc2626; }
          .lpr-fu-card.warn { border-left-color: #d49b00; }
          .lpr-fu-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--lp-text-muted); margin-bottom: 6px; }
          .lpr-fu-badge { display: inline-block; font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #EEF1F6; color: var(--lp-text-muted); }
          .lpr-fu-badge.ok { background: var(--lp-accent-soft); color: var(--lp-accent); }
          .lpr-fu-badge.bad { background: #fee2e2; color: #b91c1c; }
          .lpr-fu-badge.warn { background: #fff4d6; color: #8a6100; }
          .lpr-fu-reason { font-size: 12.5px; margin-top: 8px; padding: 6px 8px; background: var(--lp-bg); border-radius: 6px; }
          .lpr-fu-by { font-size: 11px; color: var(--lp-text-muted); margin-top: 6px; }

          .lpr-timeline { background: var(--lp-surface); border: 1px solid var(--lp-border); border-radius: 10px; padding: 6px 14px; margin-bottom: 4px; }
          .lpr-tl-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px dashed var(--lp-border); font-size: 13px; }
          .lpr-tl-item:last-child { border-bottom: none; }
          .lpr-tl-icon { width: 22px; flex-shrink: 0; text-align: center; }
          .lpr-tl-main { flex: 1; font-weight: 600; }
          .lpr-tl-sub { font-size: 12px; color: var(--lp-text-muted); font-weight: 500; margin-top: 2px; }
          .lpr-tl-date { font-size: 11.5px; color: var(--lp-text-muted); white-space: nowrap; }
        `}</style>

        <div className="lpr-header-row">
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: 16 }}>Loan Process Report</h4>
            <p style={{ color: "var(--lp-text-muted)", fontSize: 12.5, marginBottom: 0 }}>
              Customer details + process checklist status — read-only.
            </p>
          </div>
        </div>

        {/* ── Main tabs: Telecaller / Application / Followup ── */}
        <div style={{ display: "flex", gap: 8, margin: "0 0 12px", flexWrap: "wrap" }}>
          {[
            ["telecaller", `Telecallers (${staffBreakdown.length})`],
            ["application", `Application Team (${applicationBreakdown.length})`],
            ["followup", `Followup Team (${followupBreakdown.length})`],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => switchTab(k)}
              style={{
                padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                border: "1px solid var(--lp-border)",
                background: summaryTab === k ? "#2a3eb1" : "var(--lp-surface)",
                color: summaryTab === k ? "#fff" : "var(--lp-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Summary for the selected tab ── */}
        <div className="lpr-summary-card">
          <div className="lpr-summary-header" onClick={() => setSummaryOpen((v) => !v)}>
            <div>
              <div className="lpr-section-title" style={{ marginBottom: 2 }}>
                {summaryTab === "telecaller" ? "Telecaller Summary" : summaryTab === "application" ? "Application Team Summary" : "Followup Team Summary"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--lp-text-muted)" }}>
                {summaryTab === "telecaller" ? "Ranked by revenue" : summaryTab === "application" ? "Ranked by completed" : "Ranked by sanctioned · cards show pending leads — click a card to filter"}
              </div>
            </div>
            <span className="lpr-summary-chevron">{summaryOpen ? "▲" : "▼"}</span>
          </div>

          {summaryOpen && (
            <>

              {summaryTab === "telecaller" && (
                <table className="lpr-summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Applications</th>
                      <th>Revenue</th>
                      <th>Completed</th>
                      <th>Conv. %</th>
                      <th>Doc Payments</th>
                      <th>Doc Payment Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffBreakdown.length === 0 && (
                      <tr><td colSpan={8} style={{ color: "var(--lp-text-muted)" }}>No data yet.</td></tr>
                    )}
                    {staffBreakdown.map((s, i) => {
                      const conv = s.conversionRate ?? (s.applications ? Math.round((s.completedCount / s.applications) * 100) : 0);
                      return (
                        <tr key={s._id || s.staffName}>
                          <td><span className={`lpr-rank-badge ${i === 0 ? "gold" : ""}`}>{i + 1}</span></td>
                          <td style={{ fontWeight: 600 }}>{s.staffName || "Unknown"}</td>
                          <td>{s.applications}</td>
                          <td>{formatRupee(s.revenue)}</td>
                          <td>{s.completedCount}</td>
                          <td>{conv}%</td>
                          <td>{s.docPaymentCount || 0}</td>
                          <td>{formatRupee(s.docPaymentTotal || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {summaryTab === "application" && (
                <table className="lpr-summary-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Employee</th><th>Taken</th><th>In Progress</th>
                      <th>Completed</th><th>Completion %</th><th>Completed Loan Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationBreakdown.length === 0 && (
                      <tr><td colSpan={7} style={{ color: "var(--lp-text-muted)" }}>No applications taken yet.</td></tr>
                    )}
                    {applicationBreakdown.map((s, i) => (
                      <tr key={s._id}>
                        <td><span className={`lpr-rank-badge ${i === 0 ? "gold" : ""}`}>{i + 1}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.taken}</td>
                        <td>{s.inProgress}</td>
                        <td>{s.completed}</td>
                        <td>{s.completionRate}%</td>
                        <td>{formatRupee(s.completedValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {summaryTab === "followup" && (
                <>
                  {followupUnassigned > 0 && (
                    <div style={{ fontSize: 13, color: "var(--lp-text-muted)", marginBottom: 8 }}>
                      ⚠ {followupUnassigned} lead(s) are with the Followup team but not taken by anyone yet.
                    </div>
                  )}

                  <div className="lpr-stat-title">DIC Office — pending leads</div>
                  <div className="lpr-stat-grid">
                    {[["NOT_SET", "Not started"], ...DIC_STATES.map((st) => [st, STEP_TEXT[st]])].map(([st, label]) => (
                      <button
                        key={st}
                        type="button"
                        className={`lpr-stat ${fuDic === st ? "active" : ""}`}
                        onClick={() => pickFuState("dic", st)}
                      >
                        <b>{fuCount("dicOffice", st)}</b><span>{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="lpr-stat-title">Bank — pending leads</div>
                  <div className="lpr-stat-grid">
                    {[["NOT_SET", "Not started"], ...BANK_STATES.map((st) => [st, STEP_TEXT[st]])].map(([st, label]) => (
                      <button
                        key={st}
                        type="button"
                        className={`lpr-stat ${fuBank === st ? "active" : ""}`}
                        onClick={() => pickFuState("bank", st)}
                      >
                        <b>{fuCount("bank", st)}</b><span>{label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="lpr-summary-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Employee</th><th>Taken</th><th>Pending</th>
                          <th>DIC Pending</th><th>DIC Rejected</th><th>DIC Forwarded</th>
                          <th>Bank Pending</th><th>Bank Process</th><th>Bank Rejected</th>
                          <th>Completed</th><th>Sanction %</th><th>Sanctioned Loan Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {followupBreakdown.length === 0 && (
                          <tr><td colSpan={13} style={{ color: "var(--lp-text-muted)" }}>No followup leads taken yet.</td></tr>
                        )}
                        {followupBreakdown.map((s, i) => (
                          <tr key={s._id}>
                            <td><span className={`lpr-rank-badge ${i === 0 ? "gold" : ""}`}>{i + 1}</span></td>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td>{s.taken}</td>
                            <td>{s.pending}</td>
                            <td>{s.dicPending || 0}</td>
                            <td>{s.dicRejected || 0}</td>
                            <td>{s.dicForwarded || 0}</td>
                            <td>{s.bankPending || 0}</td>
                            <td>{s.bankProcess || 0}</td>
                            <td>{s.bankRejected || 0}</td>
                            <td>{s.sanctioned}</td>
                            <td>{s.sanctionRate}%</td>
                            <td>{formatRupee(s.sanctionedValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

                <div className="lpr-filters">
          <input
            placeholder="Search customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* ── Telecaller tab filters ── */}
          {summaryTab === "telecaller" && (
            <>
              <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                <option value="">All Telecallers</option>
                {staffBreakdown.map((s) => (
                  <option key={s._id} value={s._id}>{s.staffName}</option>
                ))}
              </select>
              <select value={tcStatus} onChange={(e) => setTcStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={tcStage} onChange={(e) => setTcStage(e.target.value)}>
                <option value="">Any current stage</option>
                {CHECKLIST_STAGES.slice(0, -1).map((st) => (
                  <option key={st.key} value={st.key}>At: {st.label}</option>
                ))}
                <option value="completed">All stages done</option>
              </select>
              <select value={tcScheme} onChange={(e) => setTcScheme(e.target.value)}>
                <option value="">All Schemes</option>
                {schemeOptions.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </>
          )}

          {/* ── Application tab filters ── */}
          {summaryTab === "application" && (
            <>
              <select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)}>
                <option value="">All Application Employees</option>
                {applicationStaffOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select value={appStatus} onChange={(e) => setAppStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="NOT_TAKEN">Not taken</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </>
          )}

          {/* ── Followup tab filters ── */}
          {summaryTab === "followup" && (
            <>
              <select value={followupFilter} onChange={(e) => setFollowupFilter(e.target.value)}>
                <option value="">All Followup Employees</option>
                <option value="UNASSIGNED">Unassigned (Followup)</option>
                {followupStaffOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select value={fuStatus} onChange={(e) => setFuStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed (Sanctioned)</option>
              </select>
              <select value={fuDic} onChange={(e) => setFuDic(e.target.value)}>
                <option value="">All DIC Office states</option>
                <option value="NOT_SET">DIC: Not started</option>
                {DIC_STATES.map((st) => (
                  <option key={st} value={st}>DIC: {STEP_TEXT[st]}</option>
                ))}
              </select>
              <select value={fuBank} onChange={(e) => setFuBank(e.target.value)}>
                <option value="">All Bank states</option>
                <option value="NOT_SET">Bank: Not started</option>
                {BANK_FILTER_STATES.map((st) => (
                  <option key={st} value={st}>Bank: {STEP_TEXT[st]}</option>
                ))}
              </select>
              <select value={fuStuck} onChange={(e) => setFuStuck(e.target.value)}>
                <option value="">Stuck: any time</option>
                {STUCK_OPTIONS.map((d) => (
                  <option key={d} value={d}>Stuck {d}+ days</option>
                ))}
              </select>
            </>
          )}

          {/* ── Common: dates (every tab) ── */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ minWidth: 140 }}
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ minWidth: 140 }}
            title="To date"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="lpr-export-btn"
              style={{ borderColor: "var(--lp-border)", background: "var(--lp-bg)", color: "var(--lp-text-muted)" }}
              onClick={() => { setDateFrom(""); setDateTo(""); }}
            >
              ✕ Clear dates
            </button>
          )}
          {hasFilters && (
            <button
              type="button"
              className="lpr-export-btn"
              style={{ borderColor: "var(--lp-border)", background: "var(--lp-bg)", color: "var(--lp-text-muted)" }}
              onClick={resetFilters}
            >
              ✕ Reset filters
            </button>
          )}
          <button type="button" className="lpr-export-btn" onClick={handleExportExcel} disabled={exporting}>
            {exporting ? "Exporting…" : "⬇ Export Excel"}
          </button>
        </div>

        {!loading && !error && (
          <div style={{ fontSize: 12.5, color: "var(--lp-text-muted)", marginBottom: 8 }}>
            {displayedCustomers.length} customer(s)
          </div>
        )}

        {error && <p style={{ color: "#DC2626" }}>{error}</p>}
        {loading && <p style={{ color: "var(--lp-text-muted)" }}>Loading…</p>}
        {!loading && displayedCustomers.length === 0 && !error && (
          <p style={{ color: "var(--lp-text-muted)" }}>No customers found.</p>
        )}

        {displayedCustomers.map((c) => {
          const total = CHECKLIST_STAGES.length;
          const doneCount = Object.values(c.checklist || {}).filter(Boolean).length;
          const pct = c.processPercent ?? Math.round((doneCount / total) * 100);
          const isOpen = expandedId === c._id;

          return (
            <div className="lpr-card" key={c._id}>
              <div className="lpr-row" onClick={() => setExpandedId(isOpen ? null : c._id)}>
                <div>
                  <div className="lpr-name">{c.customerName}</div>
                  <div className="lpr-sub">
                    {c.contactNo} {c.loanDate ? `· ${new Date(c.loanDate).toLocaleDateString()}` : ""}
                  </div>
                  {c.application?.assignedTo?.name && (
                    <div className="lpr-sub">
                      {c.application.status === "COMPLETED" ? "✅" : "📝"} Application: {c.application.assignedTo.name}
                      {c.application.status === "COMPLETED" && c.application.completedAt
                        ? ` · ${new Date(c.application.completedAt).toLocaleDateString()}`
                        : " (in progress)"}
                    </div>
                  )}
                  {c.followup?.status && c.followup.status !== "NONE" && (
                    <div className="lpr-sub">
                      {c.followup.status === "COMPLETED" ? "✅" : "📞"} Followup: {c.followup.assignedTo?.name || "Unassigned"}
                      {c.followup.status === "COMPLETED"
                         ? ` · Sanctioned ${fmtDate(c.followup.completedAt)}`
                        : ` · DIC: ${STEP_TEXT[c.followup.dicOffice?.state] || "—"} · Bank: ${STEP_TEXT[c.followup.bank?.state] || "—"} · ${followupPendingDays(c) ?? 0}d since update`}
                    </div>
                  )}
                </div>
                <div className="lpr-staff-chip">{c.staffId?.name || c.staffName || "Unknown"}</div>
                <span className={`lpr-badge ${c.status === "COMPLETED" ? "done" : "progress"}`}>
                  {c.status === "COMPLETED" ? "Completed" : `${pct}%`}
                </span>
                <span style={{ color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {isOpen && (
                <div className="lpr-detail">
                  <div className="lpr-section-title">Customer Details</div>
                  <div className="lpr-info-grid">
                    <div className="lpr-info-item"><b>Business Type</b>{c.businessType || "—"}</div>
                    <div className="lpr-info-item"><b>Business Sub-Type</b>{c.businessSubType || "—"}</div>

                    <div className="lpr-info-item"><b>Scheme</b>{c.scheme || "—"}</div>
                    <div className="lpr-info-item"><b>Loan Value</b>{c.loanValue ? formatRupee(c.loanValue) : "—"}</div>
                    <div className="lpr-info-item"><b>Contact No</b>{c.contactNo || "—"}</div>
                    <div className="lpr-info-item"><b>Mail ID</b>{c.mailId || "—"}</div>
                    <div className="lpr-info-item"><b>Application By</b>{c.application?.assignedTo?.name || "—"}</div>
                    <div className="lpr-info-item">
                      <b>Application Date</b>
                      {c.application?.status === "COMPLETED" && c.application?.completedAt
                        ? new Date(c.application.completedAt).toLocaleDateString() : "—"}
                    </div>
                    <div className="lpr-info-item"><b>Bank Name</b>{c.bankName || "—"}</div>
                    <div className="lpr-info-item"><b>IFSC Code</b>{c.ifscCode || "—"}</div>
                    <div className="lpr-info-item"><b>Communication Address</b>{c.communicationAddress || "—"}</div>
                    <div className="lpr-info-item"><b>Unit Address</b>{c.unitAddress || "—"}</div>
                    <div className="lpr-info-item"><b>Father Name</b>{c.fatherName || "—"}</div>
                    <div className="lpr-info-item"><b>Father Occupation</b>{c.fatherOccupation || "—"}</div>
                    <div className="lpr-info-item"><b>Marital Status</b>{c.maritalStatus || "—"}</div>
                    {c.maritalStatus === "Married" && (
                      <>
                        <div className="lpr-info-item"><b>Spouse Name</b>{c.spouseName || "—"}</div>
                        <div className="lpr-info-item"><b>Spouse Occupation</b>{c.spouseOccupation || "—"}</div>
                      </>
                    )}
                  </div>

                  {(c.application?.assignedTo?.employeeId || c.application?.status === "COMPLETED") && (
                    <>
                      <div className="lpr-section-title" style={{ marginTop: 16 }}>Application</div>
                      <div className="lpr-info-grid">
                        <div className="lpr-info-item"><b>Handled by</b>{c.application?.assignedTo?.name || "—"}</div>
                        <div className="lpr-info-item"><b>Taken on</b>{fmtDate(c.application?.assignedTo?.assignedAt)}</div>
                        <div className="lpr-info-item"><b>Status</b>{c.application?.status === "COMPLETED" ? "Completed" : "In progress"}</div>
                        <div className="lpr-info-item"><b>Completed on</b>{c.application?.status === "COMPLETED" ? fmtDate(c.application?.completedAt) : "—"}</div>
                      </div>
                    </>
                  )}

                  {c.followup?.status && c.followup.status !== "NONE" && (
                    <>
                      <div className="lpr-section-title" style={{ marginTop: 16 }}>Followup</div>
                      <div className="lpr-info-grid">
                        <div className="lpr-info-item"><b>Handed over</b>{fmtDate(c.followup.handedOverAt)}</div>
                        <div className="lpr-info-item"><b>Handled by</b>{c.followup.assignedTo?.name || "Unassigned"}</div>
                        <div className="lpr-info-item"><b>Taken on</b>{fmtDate(c.followup.assignedTo?.assignedAt)}</div>
                        <div className="lpr-info-item"><b>Completed on</b>{c.followup.status === "COMPLETED" ? fmtDate(c.followup.completedAt) : "—"}</div>
                      </div>

                      {/* DIC Office / Bank Process cards */}
                      <div className="lpr-fu-grid">
                        {[
                          { title: "1. DIC Office", s: c.followup.dicOffice },
                          { title: "2. Bank Process", s: c.followup.bank },
                        ].map(({ title, s }) => (
                          <div className={`lpr-fu-card ${stepTone(s?.state)}`} key={title}>
                            <div className="lpr-fu-title">{title}</div>
                            <div className={`lpr-fu-badge ${stepTone(s?.state)}`}>
                              {s?.state ? `${stepIcon(s.state)} ${STEP_TEXT[s.state]}` : "— Not updated"}
                            </div>
                            {s?.reason && <div className="lpr-fu-reason">📝 {s.reason}</div>}
                            {s?.updatedByName && (
                              <div className="lpr-fu-by">{s.updatedByName} · {fmtDateTime(s.updatedAt)}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* History timeline */}
                      {(c.followup.history || []).length > 0 && (
                        <>
                          <div className="lpr-section-title" style={{ marginTop: 14 }}>Followup History</div>
                          <div className="lpr-timeline">
                            {[...c.followup.history]
                              .sort((a, b) => new Date(a.at) - new Date(b.at))
                              .map((h, i) => (
                                <div className="lpr-tl-item" key={i}>
                                  <div className="lpr-tl-icon">{stepIcon(h.state)}</div>
                                  <div className="lpr-tl-main">
                                    {h.step === "dicOffice" ? "DIC Office" : "Bank Process"}: {h.state ? STEP_TEXT[h.state] : "Cleared"}
                                    <div className="lpr-tl-sub">
                                      {h.byName || "—"}{h.reason ? ` · 📝 ${h.reason}` : ""}
                                    </div>
                                  </div>
                                  <div className="lpr-tl-date">{fmtDateTime(h.at)}</div>
                                </div>
                              ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="lpr-section-title" style={{ marginTop: 16 }}>Process Checklist</div>
                  <div className="lpr-checklist-grid">
                    {CHECKLIST_STAGES.map((stage) => (
                      <div key={stage.key}>
                        <label className="lpr-stage-row">
                          <input
                            type="checkbox"
                            checked={!!c.checklist?.[stage.key]}
                            onChange={() => { }}
                            onClick={(e) => e.preventDefault()}
                          />
                          {stage.label}
                        </label>
                        {c.checklistRemarks?.[stage.key] && (
                          <div style={{ fontSize: 11, color: "var(--lp-text-muted)", marginLeft: 22, marginTop: -2 }}>
                            📝 {c.checklistRemarks[stage.key]}
                          </div>
                        )}
                        {c.checklistDates?.[stage.key] && (
                          <div style={{ fontSize: 11, color: "var(--lp-text-muted)", marginLeft: 22, marginTop: -2 }}>
                            📅 {new Date(c.checklistDates[stage.key]).toLocaleDateString()}
                          </div>
                        )}
                        {stage.key === "documentPayment" && c.checklistAmounts?.documentPayment != null && (
                          <div style={{ fontSize: 11, color: "var(--lp-text-muted)", marginLeft: 22, marginTop: -2 }}>
                            💰 ₹{Number(c.checklistAmounts.documentPayment).toLocaleString("en-IN")}
                          </div>
                        )}
                        {stage.key === "documentPayment" && c.documentPaymentExternal && (
                          <div style={{ fontSize: 11, color: "#b45309", marginLeft: 22, marginTop: -2 }}>
                            🏷 Done elsewhere · no incentive
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {c.reasonForPending && (
                    <div style={{ marginTop: 10, fontSize: 13 }}>
                      <b style={{ color: "var(--lp-text-muted)", fontSize: 11 }}>Reason for Pending: </b>
                      {c.reasonForPending}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EmployeeLayout>
  );
}