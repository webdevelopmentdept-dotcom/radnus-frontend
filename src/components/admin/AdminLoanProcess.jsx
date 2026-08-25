import React, { useState, useEffect } from "react";

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

const DOC_FIELDS = [
  { key: "aadharCard", label: "Aadhar Card" },
  { key: "passportPhoto", label: "Passport Photo" },
  { key: "signature", label: "Signature" },
  { key: "study10th12th", label: "10th/12th" },
  { key: "community", label: "Community" },
  { key: "pancard", label: "Pancard" },
  { key: "rationCard", label: "Ration Card" },
  { key: "bankPassbook", label: "Bank Passbook" },
  { key: "gasBill", label: "Gas Bill" },
  { key: "ebBill", label: "EB Bill" },
];

export default function AdminLoanProcess() {
  const API = import.meta.env.VITE_API_BASE_URL;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // ── New filters: date range, scheme, sort ───────────────────────────────
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");

  // ── Metrics (always full grand total — independent of filters above) ──────
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // ── Staff breakdown table visibility (button toggle) ───────────────────
  const [showStaffTable, setShowStaffTable] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (staffFilter) params.append("staffId", staffFilter);

      const res = await fetch(`${API}/api/admin-loan-process/all?${params.toString()}`);
      const data = await res.json();
      if (data.success) setCustomers(data.data || []);
    } catch (err) {
      console.error("ADMIN LOAN LIST ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffList = async () => {
    try {
      const res = await fetch(`${API}/api/admin-loan-process/meta/staff-list`);
      const data = await res.json();
      if (data.success) setStaffList(data.data || []);
    } catch (err) {
      console.error("STAFF LIST ERROR", err);
    }
  };

  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch(`${API}/api/admin-loan-process/metrics`);
      const data = await res.json();
      if (data.success) setMetrics(data.data);
    } catch (err) {
      console.error("ADMIN LOAN METRICS ERROR", err);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadStaffList();
    loadMetrics(); // fetched once — always full grand total, not affected by search/filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 350); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, staffFilter]);

  const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // ── Scheme dropdown options — derived from currently loaded customers ──
  const schemeOptions = Array.from(
    new Set(customers.map((c) => c.scheme).filter(Boolean))
  ).sort();

  // ── Apply date range + scheme filter + sort on top of server-filtered list ──
  const displayedCustomers = customers
    .filter((c) => {
      if (!fromDate && !toDate) return true;
      if (!c.loanDate) return false;
      const d = new Date(c.loanDate);
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate && d > new Date(toDate + "T23:59:59")) return false;
      return true;
    })
    .filter((c) => (schemeFilter ? c.scheme === schemeFilter : true))
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.loanDate || 0) - new Date(a.loanDate || 0);
      }
      if (sortOption === "oldest") {
        return new Date(a.loanDate || 0) - new Date(b.loanDate || 0);
      }
      if (sortOption === "progress_desc") {
        const pa = a.processPercent ?? 0;
        const pb = b.processPercent ?? 0;
        return pb - pa;
      }
      return 0; // no sort — keep server order
    });

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStaffFilter("");
    setFromDate("");
    setToDate("");
    setSchemeFilter("");
    setSortOption("");
  };

  // ── Export current filtered list to Excel (backend generates the file) ──
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    if (staffFilter) params.append("staffId", staffFilter);
    if (schemeFilter) params.append("scheme", schemeFilter);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    window.open(`${API}/api/admin-loan-process/export/excel?${params.toString()}`, "_blank");
  };

  return (
    <div className="alp-root">
      <style>{`
        .alp-root {
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
        .alp-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .alp-filters input, .alp-filters select {
          padding: 6px 10px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
          font-size: 13px; background: var(--lp-surface); min-width: 150px;
        }
        .alp-reset-btn {
          padding: 6px 12px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
          font-size: 12.5px; font-weight: 700; background: var(--lp-surface);
          color: var(--lp-primary); cursor: pointer;
        }
        .alp-reset-btn:hover { background: var(--lp-primary-soft); }
        .alp-export-btn {
          padding: 6px 12px; border: 1px solid var(--lp-accent); border-radius: var(--lp-radius-sm);
          font-size: 12.5px; font-weight: 700; background: var(--lp-accent-soft);
          color: var(--lp-accent); cursor: pointer;
        }
        .alp-export-btn:hover { background: var(--lp-accent); color: #fff; }
        .alp-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          overflow: hidden; margin-bottom: 8px;
        }
        .alp-row {
          display: grid; grid-template-columns: 2fr 0.9fr 1.3fr 1fr 1fr auto;
          align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer;
        }
        .alp-row:hover { background: var(--lp-bg); }
        .alp-name { font-weight: 700; font-size: 13px; }
        .alp-sub { font-size: 11px; color: var(--lp-text-muted); margin-top: 1px; }
        .alp-date-col { font-size: 11.5px; color: var(--lp-primary); font-weight: 600; white-space: nowrap; }
        .alp-staff-chip {
          font-size: 11px; font-weight: 600; color: var(--lp-primary);
          background: var(--lp-primary-soft); padding: 3px 8px; border-radius: 20px;
          display: inline-block; width: fit-content;
        }
        .alp-progress-bar { height: 5px; background: var(--lp-border); border-radius: 4px; overflow: hidden; width: 100%; }
        .alp-progress-fill { height: 100%; background: var(--lp-accent); }
        .alp-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
        .alp-badge.done { background: var(--lp-accent-soft); color: var(--lp-accent); }
        .alp-badge.progress { background: var(--lp-primary-soft); color: var(--lp-primary); }
        .alp-detail { padding: 12px 14px; border-top: 1px solid var(--lp-border); background: var(--lp-bg); }
        .alp-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--lp-text-muted); margin-bottom: 6px; }
        .alp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 6px 14px; margin-bottom: 12px; }
        .alp-info-item { font-size: 12.5px; }
        .alp-info-item b { display: block; font-size: 10.5px; color: var(--lp-text-muted); font-weight: 600; margin-bottom: 1px; }
        .alp-checklist-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px 10px; }
        .alp-stage-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; font-size: 12.5px; border-radius: 6px; }
        .alp-stage-row:hover { background: rgba(0,0,0,0.03); }
        .alp-stage-row-readonly { cursor: default; }
        .alp-stage-row-readonly:hover { background: transparent; }
        .alp-stage-row-readonly input { cursor: default; accent-color: var(--lp-accent); opacity: 1; }
        @media (max-width: 900px) {
          .alp-checklist-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .alp-checklist-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .alp-stage-row input { width: 15px; height: 15px; cursor: pointer; accent-color: var(--lp-accent); }
        .alp-doc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; margin-top: 12px; }
        .alp-doc-chip {
          font-size: 11.5px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--lp-border);
          background: var(--lp-surface); display: flex; justify-content: space-between; align-items: center;
        }
        .alp-doc-chip.uploaded { border-color: var(--lp-accent); }
        .alp-doc-chip a { color: var(--lp-primary); font-weight: 600; text-decoration: none; font-size: 11px; }

        /* ── Metrics dashboard ─────────────────────────────────────────── */
        .alp-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px; margin-bottom: 16px;
        }
        .alp-metric-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          padding: 12px 14px;
        }
        .alp-metric-label {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--lp-text-muted); margin-bottom: 4px;
        }
        .alp-metric-value { font-size: 20px; font-weight: 800; color: var(--lp-text); line-height: 1.2; }
        .alp-metric-value.accent { color: var(--lp-accent); }
        .alp-metric-value.primary { color: var(--lp-primary); }

        /* ── Header row: title + staff breakdown toggle button ──────────── */
        .alp-header-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .alp-staff-toggle-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: var(--lp-radius-sm);
          border: 1px solid var(--lp-border); background: var(--lp-surface);
          color: var(--lp-primary); font-size: 12.5px; font-weight: 700;
          cursor: pointer; box-shadow: var(--lp-shadow-sm); white-space: nowrap;
          flex-shrink: 0;
        }
        .alp-staff-toggle-btn:hover { background: var(--lp-primary-soft); }
        .alp-staff-toggle-icon { font-size: 10px; transition: transform 0.15s ease; }

        .alp-staff-table-wrap {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          overflow: hidden; margin-top: 10px;
        }
        .alp-staff-table-wrap-top { margin-top: 0; margin-bottom: 16px; }
        .alp-staff-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .alp-staff-table th {
          text-align: left; padding: 8px 14px; background: var(--lp-bg);
          font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--lp-text-muted); font-weight: 700; border-bottom: 1px solid var(--lp-border);
        }
        .alp-staff-table td { padding: 8px 14px; border-bottom: 1px solid var(--lp-border); }
        .alp-staff-table tr:last-child td { border-bottom: none; }
      `}</style>

      <div className="alp-header-row">
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: 16 }}>Loan Process — Admin View</h4>
          <p style={{ color: "var(--lp-text-muted)", fontSize: 12.5, marginBottom: 0 }}>
            All telecallers' customers across the BDE department.
          </p>
        </div>

        {/* ── Staff breakdown toggle button — moved to top ── */}
        {metrics?.staffBreakdown && metrics.staffBreakdown.length > 0 && (
          <button
            type="button"
            className="alp-staff-toggle-btn"
            onClick={() => setShowStaffTable((v) => !v)}
          >
            <span>{showStaffTable ? "Hide" : "Show"} Telecaller-wise Breakdown</span>
            <span
              className="alp-staff-toggle-icon"
              style={{ transform: showStaffTable ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
          </button>
        )}
      </div>

      {showStaffTable && metrics?.staffBreakdown && metrics.staffBreakdown.length > 0 && (
        <div className="alp-staff-table-wrap alp-staff-table-wrap-top">
          <table className="alp-staff-table">
            <thead>
              <tr>
                <th>Telecaller</th>
                <th>Applications</th>
                <th>Revenue</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {metrics.staffBreakdown.map((s) => (
                <tr key={s._id || s.staffName}>
                  <td style={{ fontWeight: 600 }}>{s.staffName || "Unknown"}</td>
                  <td>{s.applications}</td>
                  <td>{formatRupee(s.revenue)}</td>
                  <td>{s.completedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════ METRICS DASHBOARD (always full grand total) ══════════════ */}
      {metricsLoading && !metrics && (
        <p style={{ color: "var(--lp-text-muted)", fontSize: 13 }}>Loading metrics…</p>
      )}

      {metrics && (
        <div className="alp-metrics-grid">
          <div className="alp-metric-card">
            <div className="alp-metric-label">Total Applications</div>
            <div className="alp-metric-value">{metrics.totalApplications}</div>
          </div>
          <div className="alp-metric-card">
            <div className="alp-metric-label">Total Revenue</div>
            <div className="alp-metric-value">{formatRupee(metrics.totalRevenue)}</div>
          </div>
          <div className="alp-metric-card">
            <div className="alp-metric-label">Completed Revenue</div>
            <div className="alp-metric-value accent">{formatRupee(metrics.completedRevenue)}</div>
          </div>
          <div className="alp-metric-card">
            <div className="alp-metric-label">Completed</div>
            <div className="alp-metric-value accent">{metrics.completedCount}</div>
          </div>
          <div className="alp-metric-card">
            <div className="alp-metric-label">In Progress</div>
            <div className="alp-metric-value primary">{metrics.inProgressCount}</div>
          </div>
          {/* <div className="alp-metric-card">
            <div className="alp-metric-label">Avg Progress</div>
            <div className="alp-metric-value">{metrics.avgProgress}%</div>
          </div> */}
          {/* <div className="alp-metric-card">
            <div className="alp-metric-label">Pending Reason</div>
            <div className="alp-metric-value">{metrics.pendingCount}</div>
          </div> */}
        </div>
      )}

      <div className="alp-filters">
        <input
          placeholder="Search customer name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All Telecallers</option>
          {staffList.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* ── Date range filter ── */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="From Date"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="To Date"
        />

        {/* ── Scheme filter ── */}
        <select value={schemeFilter} onChange={(e) => setSchemeFilter(e.target.value)}>
          <option value="">All Schemes</option>
          {schemeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* ── Sort option ── */}
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="">Sort: Default</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="progress_desc">Progress: High to Low</option>
        </select>

        {/* ── Reset all filters ── */}
        <button type="button" className="alp-reset-btn" onClick={clearAllFilters}>
          Reset Filters
        </button>

        {/* ── Export current filtered list to Excel ── */}
        <button type="button" className="alp-export-btn" onClick={handleExportExcel}>
          ⬇ Export Excel
        </button>
      </div>

      {loading && <p style={{ color: "var(--lp-text-muted)" }}>Loading…</p>}
      {!loading && displayedCustomers.length === 0 && (
        <p style={{ color: "var(--lp-text-muted)" }}>No customers found.</p>
      )}

      {displayedCustomers.map((c) => {
        const total = CHECKLIST_STAGES.length;
        const doneCount = Object.values(c.checklist || {}).filter(Boolean).length;
        const pct = c.processPercent ?? Math.round((doneCount / total) * 100);
        const isOpen = expandedId === c._id;

        return (
          <div className="alp-card" key={c._id}>
            <div className="alp-row" onClick={() => setExpandedId(isOpen ? null : c._id)}>
              <div>
                <div className="alp-name">{c.customerName}</div>
                <div className="alp-sub">{c.contactNo} {c.mailId ? `· ${c.mailId}` : ""}</div>
              </div>
              <div className="alp-date-col">
                📅 {c.loanDate ? new Date(c.loanDate).toLocaleDateString() : "—"}
              </div>
              <div className="alp-staff-chip">{c.staffId?.name || c.staffName || "Unknown"}</div>
              <div>
                <div className="alp-progress-bar">
                  <div className="alp-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className={`alp-badge ${c.status === "COMPLETED" ? "done" : "progress"}`}>
                {c.status === "COMPLETED" ? "Completed" : `${pct}%`}
              </span>
              <span style={{ color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div className="alp-detail">
                <div className="alp-section-title">Customer Details</div>
                <div className="alp-info-grid">
                  <div className="alp-info-item"><b>Business Type</b>{c.businessType || "—"}</div>
                  <div className="alp-info-item"><b>Scheme</b>{c.scheme || "—"}</div>
                  <div className="alp-info-item"><b>Loan Value</b>{c.loanValue ? `₹${c.loanValue}` : "—"}</div>
                  <div className="alp-info-item"><b>Contact No</b>{c.contactNo || "—"}</div>

                  <div className="alp-info-item"><b>Bank Name</b>{c.bankName || "—"}</div>
                  <div className="alp-info-item"><b>IFSC Code</b>{c.ifscCode || "—"}</div>
                  <div className="alp-info-item"><b>Communication Address</b>{c.communicationAddress || "—"}</div>
                  <div className="alp-info-item"><b>Unit Address</b>{c.unitAddress || "—"}</div>
                </div>

                                <div className="alp-section-title">Process Checklist</div>
                <div className="alp-checklist-grid">
                  {CHECKLIST_STAGES.map((stage) => (
                    <div key={stage.key}>
                      <label className="alp-stage-row alp-stage-row-readonly">
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

                <div className="alp-section-title" style={{ marginTop: 18 }}>Documents</div>
                <div className="alp-doc-grid">
                  {DOC_FIELDS.map((doc) => {
                    const d = c.documents?.[doc.key];
                    return (
                      <div className={`alp-doc-chip ${d?.status === "uploaded" ? "uploaded" : ""}`} key={doc.key}>
                        <span>{doc.label}</span>
                        {d?.status === "uploaded" ? (
                          <a href={d.url} target="_blank" rel="noreferrer">View</a>
                        ) : (
                          <span style={{ color: "var(--lp-text-muted)" }}>Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}