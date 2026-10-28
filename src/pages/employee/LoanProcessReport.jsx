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
const STEP_TEXT = { COMPLETED: "Completed", NOT_COMPLETED: "Not Completed" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState("");
  const [followupFilter, setFollowupFilter] = useState("");

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

  const displayedCustomers = customers
    .filter((c) => (staffFilter ? (c.staffId?._id || c.staffId) === staffFilter : true))
    .filter((c) =>
      search ? (c.customerName || "").toLowerCase().includes(search.toLowerCase()) : true
    )
    .filter((c) => {
      if (!applicationFilter) return true;
      const ownerId = c.application?.assignedTo?.employeeId;
      if (applicationFilter === "NOT_TAKEN") return !ownerId && c.application?.status !== "COMPLETED";
      return String(ownerId || "") === applicationFilter;
    })
    .filter((c) => {
      if (!followupFilter) return true;
      const inFollowup = c.followup?.status && c.followup.status !== "NONE";
      const ownerId = c.followup?.assignedTo?.employeeId;
      if (followupFilter === "UNASSIGNED") return inFollowup && !ownerId;
      return String(ownerId || "") === followupFilter;
    })
    .filter((c) => {
      if (!dateFrom && !dateTo) return true;
      if (!c.loanDate) return false;
      const d = new Date(c.loanDate);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });

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
        `}</style>

        <div className="lpr-header-row">
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: 16 }}>Loan Process Report</h4>
            <p style={{ color: "var(--lp-text-muted)", fontSize: 12.5, marginBottom: 0 }}>
              Customer details + process checklist status — read-only.
            </p>
          </div>
        </div>

        {/* ── Per-employee summary (leaderboard style, collapsed by default) ── */}
        <div className="lpr-summary-card">
          <div className="lpr-summary-header" onClick={() => setSummaryOpen((v) => !v)}>
            <div>
              <div className="lpr-section-title" style={{ marginBottom: 2 }}>Employee-wise Summary</div>
              <div style={{ fontSize: 11.5, color: "var(--lp-text-muted)" }}>Ranked by revenue</div>
            </div>
            <span className="lpr-summary-chevron">{summaryOpen ? "▲" : "▼"}</span>
          </div>

           {summaryOpen && (
            <>
            <div style={{ display: "flex", gap: 8, margin: "4px 0 14px", flexWrap: "wrap" }}>
              {[
                ["telecaller", `Telecallers (${staffBreakdown.length})`],
                ["application", `Application Team (${applicationBreakdown.length})`],
                ["followup", `Followup Team (${followupBreakdown.length})`],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSummaryTab(k)}
                  style={{
                    padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: "1px solid var(--lp-border)",
                    background: summaryTab === k ? "#2a3eb1" : "var(--lp-bg)",
                    color: summaryTab === k ? "#fff" : "var(--lp-text-muted)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

          {summaryOpen && (
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
                <table className="lpr-summary-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Employee</th><th>Leads Taken</th><th>In Progress</th>
                      <th>Sanctioned</th><th>Not Sanctioned</th><th>Sanction %</th><th>Sanctioned Loan Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followupBreakdown.length === 0 && (
                      <tr><td colSpan={8} style={{ color: "var(--lp-text-muted)" }}>No followup leads taken yet.</td></tr>
                    )}
                    {followupBreakdown.map((s, i) => (
                      <tr key={s._id}>
                        <td><span className={`lpr-rank-badge ${i === 0 ? "gold" : ""}`}>{i + 1}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.taken}</td>
                        <td>{s.inProgress}</td>
                        <td>{s.sanctioned}</td>
                        <td>{s.notSanctioned}</td>
                        <td>{s.sanctionRate}%</td>
                        <td>{formatRupee(s.sanctionedValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option value="">All Telecallers</option>
            {staffBreakdown.map((s) => (
              <option key={s._id} value={s._id}>{s.staffName}</option>
            ))}
          </select>
          <select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)}>
            <option value="">All Application Employees</option>
            <option value="NOT_TAKEN">Application not taken</option>
            {applicationStaffOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select value={followupFilter} onChange={(e) => setFollowupFilter(e.target.value)}>
            <option value="">All Followup Employees</option>
            <option value="UNASSIGNED">Unassigned (Followup)</option>
            {followupStaffOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
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
          <button type="button" className="lpr-export-btn" onClick={handleExportExcel} disabled={exporting}>
            {exporting ? "Exporting…" : "⬇ Export Excel"}
          </button>
        </div>

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
                        : c.followup.loanSanctioned?.value === "NO"
                          ? " · Not sanctioned"
                          : " · in progress"}
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
                        <div className="lpr-info-item">
                          <b>DIC Office</b>
                          {STEP_TEXT[c.followup.dicOffice?.state] || "Not updated"}
                          {c.followup.dicOffice?.state === "NOT_COMPLETED" && c.followup.dicOffice?.reason ? ` — ${c.followup.dicOffice.reason}` : ""}
                        </div>
                        <div className="lpr-info-item">
                          <b>Bank Process</b>
                          {STEP_TEXT[c.followup.bank?.state] || "Not updated"}
                          {c.followup.bank?.state === "NOT_COMPLETED" && c.followup.bank?.reason ? ` — ${c.followup.bank.reason}` : ""}
                        </div>
                        <div className="lpr-info-item">
                          <b>Loan Sanctioned</b>
                          {c.followup.loanSanctioned?.value === "YES" ? "Yes" : c.followup.loanSanctioned?.value === "NO" ? "No" : "Not updated"}
                          {c.followup.loanSanctioned?.updatedByName ? ` · by ${c.followup.loanSanctioned.updatedByName}` : ""}
                        </div>
                        <div className="lpr-info-item"><b>Completed on</b>{c.followup.status === "COMPLETED" ? fmtDate(c.followup.completedAt) : "—"}</div>
                      </div>
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