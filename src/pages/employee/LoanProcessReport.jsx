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

export default function LoanProcessReport() {
  const API = import.meta.env.VITE_API_BASE_URL;
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
  });

  const [customers, setCustomers] = useState([]);
  const [staffBreakdown, setStaffBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/loan-process/report`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setStaffBreakdown(data.staffBreakdown || []);
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

  const displayedCustomers = customers
    .filter((c) => (staffFilter ? (c.staffId?._id || c.staffId) === staffFilter : true))
    .filter((c) =>
      search ? (c.customerName || "").toLowerCase().includes(search.toLowerCase()) : true
    )
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
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (staffFilter) params.append("staffId", staffFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (search) params.append("search", search); // FIX: was missing, so name search never reached the export route

      const res = await fetch(`${API}/api/loan-process/report/export?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Export failed");

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
      alert("Excel export aagala, konjam nerathula try pannunga.");
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
            <table className="lpr-summary-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Applications</th>
                  <th>Revenue</th>
                  <th>Completed</th>
                  <th>Conv. %</th>
                </tr>
              </thead>
              <tbody>
                {staffBreakdown.length === 0 && (
                  <tr><td colSpan={6} style={{ color: "var(--lp-text-muted)" }}>No data yet.</td></tr>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    <div className="lpr-info-item"><b>Scheme</b>{c.scheme || "—"}</div>
                    <div className="lpr-info-item"><b>Loan Value</b>{c.loanValue ? formatRupee(c.loanValue) : "—"}</div>
                    <div className="lpr-info-item"><b>Contact No</b>{c.contactNo || "—"}</div>
                    <div className="lpr-info-item"><b>Mail ID</b>{c.mailId || "—"}</div>
                    <div className="lpr-info-item"><b>Bank Name</b>{c.bankName || "—"}</div>
                    <div className="lpr-info-item"><b>IFSC Code</b>{c.ifscCode || "—"}</div>
                    <div className="lpr-info-item"><b>Communication Address</b>{c.communicationAddress || "—"}</div>
                    <div className="lpr-info-item"><b>Unit Address</b>{c.unitAddress || "—"}</div>
                  </div>

                  <div className="lpr-section-title" style={{ marginTop: 16 }}>Process Checklist</div>
                  <div className="lpr-checklist-grid">
                    {CHECKLIST_STAGES.map((stage) => (
                      <div key={stage.key}>
                        <label className="lpr-stage-row">
                          <input
                            type="checkbox"
                            checked={!!c.checklist?.[stage.key]}
                            onChange={() => {}}
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