import React, { useState, useEffect } from "react";
import LoanModeToggle, { useLoanMode } from "./LoanModeToggle";

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

// ── Followup helpers ───────────────────────────────────────────────────────
// Stage keys: IN_PROGRESS | WITH_FOLLOWUP | NOT_SANCTIONED | SANCTIONED
const getStageKey = (c) => {
  const st = c.followup?.status;
  if (st === "COMPLETED") return "SANCTIONED";
  if (st === "PENDING") {
    return c.followup?.loanSanctioned?.value === "NO" ? "NOT_SANCTIONED" : "WITH_FOLLOWUP";
  }
  return "IN_PROGRESS";
};

const STAGE_LABEL = {
  WITH_FOLLOWUP: "With Followup",
  NOT_SANCTIONED: "Not Sanctioned",
  SANCTIONED: "Sanctioned",
};

const STEP_TEXT = { COMPLETED: "Completed", NOT_COMPLETED: "Not Completed" };

const stepDotClass = (state) =>
  state === "COMPLETED" ? "ok" : state === "NOT_COMPLETED" ? "bad" : "na";

const sanctionDotClass = (value) =>
  value === "YES" ? "ok" : value === "NO" ? "bad" : "na";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

// Timeline of everything the Followup team did on a lead (latest value per step).
const buildTimeline = (fu) => {
  const ev = [];
  const push = (date, icon, text, sub) => {
    if (date) ev.push({ date: new Date(date), icon, text, sub: sub || "" });
  };

  push(fu.handedOverAt, "📤", "Handed over to Followup team");

  if (fu.assignedTo?.employeeId) {
    push(fu.assignedTo.assignedAt, "🎯", `Taken by ${fu.assignedTo.name || "employee"}`);
  }

  [
    { label: "DIC Office", s: fu.dicOffice },
    { label: "Bank Process", s: fu.bank },
  ].forEach(({ label, s }) => {
    if (!s?.state) return;
    push(
      s.updatedAt,
      s.state === "COMPLETED" ? "✅" : "❌",
      `${label}: ${STEP_TEXT[s.state]}`,
      `${s.updatedByName || ""}${s.state === "NOT_COMPLETED" && s.reason ? ` — ${s.reason}` : ""}`
    );
  });

  if (fu.loanSanctioned?.value) {
    push(
      fu.loanSanctioned.updatedAt,
      fu.loanSanctioned.value === "YES" ? "🏁" : "❌",
      `Loan Sanctioned: ${fu.loanSanctioned.value === "YES" ? "Yes" : "No"}`,
      fu.loanSanctioned.updatedByName || ""
    );
  }

  return ev.sort((a, b) => a.date - b.date);
};

export default function AdminLoanProcess() {
  const API = import.meta.env.VITE_API_BASE_URL;
  const [mode, setMode] = useLoanMode();
  const staffLabel = mode === "marketing" ? "Executive" : "Telecaller";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // ── Followup employees (for reassign + filter) ──
  const [followupStaff, setFollowupStaff] = useState([]);
  // "" = all | "UNASSIGNED" | <employeeId>   (can be pre-set from Analytics via ?followupStaff=<id>)
  const [followupStaffFilter, setFollowupStaffFilter] = useState(
    () => new URLSearchParams(window.location.search).get("followupStaff") || ""
  );

  // ── New filters: date range, scheme, sort ───────────────────────────────
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");

  // ── Stage chip filter (All / In Progress / With Followup / ...) ─────────
  const [stageFilter, setStageFilter] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (staffFilter) params.append("staffId", staffFilter);
      params.append("mode", mode);

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
      const res = await fetch(`${API}/api/admin-loan-process/meta/staff-list?mode=${mode}`);
      const data = await res.json();
      if (data.success) setStaffList(data.data || []);
    } catch (err) {
      console.error("STAFF LIST ERROR", err);
    }
  };

  const loadFollowupStaff = async () => {
    try {
      const res = await fetch(`${API}/api/admin-loan-process/meta/followup-staff`);
      const data = await res.json();
      if (data.success) setFollowupStaff(data.data || []);
    } catch (err) {
      console.error("FOLLOWUP STAFF ERROR", err);
    }
  };

  const reassignFollowup = async (customerId, employeeId) => {
    try {
      const res = await fetch(`${API}/api/admin-loan-process/${customerId}/followup-assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Couldn't reassign.");
        return;
      }
      setCustomers((prev) =>
        prev.map((x) =>
          x._id === customerId ? { ...x, followup: { ...x.followup, assignedTo: data.assignedTo } } : x
        )
      );
    } catch (err) {
      console.error("FOLLOWUP ASSIGN ERROR", err);
      alert("Network error — please try again.");
    }
  };

  useEffect(() => {
    setStaffFilter("");
    loadStaffList();
    loadFollowupStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 350); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, staffFilter, mode]);

  const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // ── Scheme dropdown options — derived from currently loaded customers ──
  const schemeOptions = Array.from(
    new Set(customers.map((c) => c.scheme).filter(Boolean))
  ).sort();

  // ── Apply followup employee + date range + scheme filter + sort on top of server-filtered list ──
  const baseCustomers = customers
    .filter((c) => {
      if (!followupStaffFilter) return true;
      const inFollowup = c.followup?.status && c.followup.status !== "NONE";
      const ownerId = c.followup?.assignedTo?.employeeId;
      if (followupStaffFilter === "UNASSIGNED") return inFollowup && !ownerId;
      return String(ownerId || "") === followupStaffFilter;
    })
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

  // ── Chip counts (based on the list before the chip filter is applied) ──
  const stageCounts = baseCustomers.reduce(
    (acc, c) => {
      acc[getStageKey(c)] += 1;
      return acc;
    },
    { IN_PROGRESS: 0, WITH_FOLLOWUP: 0, NOT_SANCTIONED: 0, SANCTIONED: 0 }
  );

  const displayedCustomers = stageFilter
    ? baseCustomers.filter((c) => getStageKey(c) === stageFilter)
    : baseCustomers;

  // ── Workload summary of the selected followup employee ──
  const selectedFollowupEmp =
    followupStaffFilter && followupStaffFilter !== "UNASSIGNED"
      ? followupStaff.find((s) => s._id === followupStaffFilter)
      : null;

  const workload = selectedFollowupEmp
    ? baseCustomers.reduce(
        (w, c) => {
          const st = getStageKey(c);
          w.taken += 1;
          if (st === "SANCTIONED") {
            w.sanctioned += 1;
            w.sanctionedValue += Number(c.loanValue || 0);
          } else {
            w.pending += 1;
            if (st === "NOT_SANCTIONED") w.notSanctioned += 1;
            if (c.followup?.dicOffice?.state !== "COMPLETED") w.dicPending += 1;
            if (c.followup?.bank?.state !== "COMPLETED") w.bankPending += 1;
          }
          return w;
        },
        { taken: 0, pending: 0, sanctioned: 0, notSanctioned: 0, dicPending: 0, bankPending: 0, sanctionedValue: 0 }
      )
    : null;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStaffFilter("");
    setFollowupStaffFilter("");
    setFromDate("");
    setToDate("");
    setSchemeFilter("");
    setSortOption("");
    setStageFilter("");
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
    params.append("mode", mode);

    window.open(`${API}/api/admin-loan-process/export/excel?${params.toString()}`, "_blank");
  };

  const CHIPS = [
    { key: "", label: "All", count: baseCustomers.length },
    { key: "IN_PROGRESS", label: "In Progress", count: stageCounts.IN_PROGRESS },
    { key: "WITH_FOLLOWUP", label: "With Followup", count: stageCounts.WITH_FOLLOWUP },
    { key: "NOT_SANCTIONED", label: "Not Sanctioned", count: stageCounts.NOT_SANCTIONED },
    { key: "SANCTIONED", label: "Sanctioned", count: stageCounts.SANCTIONED },
  ];

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
          --lp-warn: #8a6100;
          --lp-warn-soft: #fff4d6;
          --lp-danger: #b91c1c;
          --lp-danger-soft: #fee2e2;
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

        /* ── Selected followup employee workload ───────────────────────── */
        .alp-workload {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-left: 4px solid var(--lp-primary); border-radius: var(--lp-radius-md);
          padding: 12px 14px; margin-bottom: 14px;
        }
        .alp-workload-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .alp-workload-title span { font-weight: 500; color: var(--lp-text-muted); font-size: 12px; }
        .alp-workload-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
        .alp-wl-item { background: var(--lp-bg); border-radius: 8px; padding: 8px 10px; }
        .alp-wl-item b { display: block; font-size: 17px; line-height: 1.2; }
        .alp-wl-item span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--lp-text-muted); }
        .alp-wl-item.ok b { color: var(--lp-accent); }
        .alp-wl-item.warn b { color: var(--lp-warn); }
        .alp-wl-item.bad b { color: var(--lp-danger); }

        /* ── Stage chips ───────────────────────────────────────────────── */
        .alp-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .alp-chip {
          padding: 6px 12px; border: 1px solid var(--lp-border); border-radius: 20px;
          background: var(--lp-surface); font-size: 12.5px; font-weight: 600;
          color: var(--lp-text-muted); cursor: pointer;
        }
        .alp-chip b { margin-left: 4px; color: var(--lp-text); }
        .alp-chip:hover { background: var(--lp-primary-soft); }
        .alp-chip.active { background: var(--lp-primary); color: #fff; border-color: var(--lp-primary); }
        .alp-chip.active b { color: #fff; }

        .alp-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          overflow: hidden; margin-bottom: 8px;
        }
        .alp-row {
          display: grid; grid-template-columns: 2fr 0.9fr 1.3fr 1fr 1.2fr 1.1fr auto;
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
        .alp-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; text-align: center; }
        .alp-badge.done { background: var(--lp-accent-soft); color: var(--lp-accent); }
        .alp-badge.progress { background: var(--lp-primary-soft); color: var(--lp-primary); }
        .alp-badge.followup { background: var(--lp-warn-soft); color: var(--lp-warn); }
        .alp-badge.rejected { background: var(--lp-danger-soft); color: var(--lp-danger); }

        .alp-stage-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .alp-stage-by { font-size: 10.5px; font-weight: 600; color: var(--lp-text-muted); white-space: nowrap; }

        .alp-assign-chip { display: inline-block; margin-top: 3px; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #EEF1F6; color: var(--lp-text-muted); }
        .alp-assign-chip.on { background: var(--lp-accent-soft); color: var(--lp-accent); }
        .alp-fu-assign { display: flex; align-items: center; gap: 8px; font-size: 12.5px; margin-bottom: 10px; }
        .alp-fu-assign b { font-size: 11px; text-transform: uppercase; color: var(--lp-text-muted); }
        .alp-fu-assign select { padding: 5px 10px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm); font-size: 12.5px; background: var(--lp-surface); }

        /* ── Followup dots (DIC / Bank / Sanction) ─────────────────────── */
        .alp-dots { display: flex; gap: 10px; align-items: center; font-size: 10.5px; font-weight: 700; color: var(--lp-text-muted); }
        .alp-dot-item { display: flex; align-items: center; gap: 4px; cursor: help; }
        .alp-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .alp-dot.ok { background: var(--lp-accent); }
        .alp-dot.bad { background: #dc2626; }
        .alp-dot.na { background: #CBD5E1; }

        .alp-detail { padding: 12px 14px; border-top: 1px solid var(--lp-border); background: var(--lp-bg); }
        .alp-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--lp-text-muted); margin-bottom: 6px; }
        .alp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 6px 14px; margin-bottom: 12px; }
        .alp-info-item { font-size: 12.5px; }
        .alp-info-item b { display: block; font-size: 10.5px; color: var(--lp-text-muted); font-weight: 600; margin-bottom: 1px; }

        /* ── Followup status cards ─────────────────────────────────────── */
        .alp-fu-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .alp-fu-head .alp-section-title { margin-bottom: 0; }
        .alp-fu-meta { font-size: 11px; color: var(--lp-text-muted); }
        .alp-fu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .alp-fu-card { background: var(--lp-surface); border: 1px solid var(--lp-border); border-left: 4px solid #CBD5E1; border-radius: 10px; padding: 10px 12px; }
        .alp-fu-card.ok { border-left-color: var(--lp-accent); }
        .alp-fu-card.bad { border-left-color: #dc2626; }
        .alp-fu-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--lp-text-muted); margin-bottom: 4px; }
        .alp-fu-value { font-size: 14px; font-weight: 700; }
        .alp-fu-value.ok { color: var(--lp-accent); }
        .alp-fu-value.bad { color: var(--lp-danger); }
        .alp-fu-value.na { color: var(--lp-text-muted); }
        .alp-fu-reason { font-size: 12px; margin-top: 4px; }
        .alp-fu-by { font-size: 11px; color: var(--lp-text-muted); margin-top: 4px; }

        /* ── Followup timeline ─────────────────────────────────────────── */
        .alp-timeline { background: var(--lp-surface); border: 1px solid var(--lp-border); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
        .alp-tl-item { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px dashed var(--lp-border); font-size: 12.5px; }
        .alp-tl-item:last-child { border-bottom: none; }
        .alp-tl-icon { width: 22px; flex-shrink: 0; text-align: center; }
        .alp-tl-main { flex: 1; font-weight: 600; }
        .alp-tl-sub { font-size: 11.5px; color: var(--lp-text-muted); font-weight: 500; margin-top: 1px; }
        .alp-tl-date { font-size: 11px; color: var(--lp-text-muted); white-space: nowrap; }

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

        /* ── Header row ───────────────────────────────────────────────── */
        .alp-header-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
        }
      `}</style>

      <LoanModeToggle mode={mode} onChange={setMode} />

      <div className="alp-header-row">
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: 16 }}>Loan Process — Admin View</h4>
          <p style={{ color: "var(--lp-text-muted)", fontSize: 12.5, marginBottom: 0 }}>
            {mode === "marketing"
              ? "All marketing executives' customers across the Marketing department."
              : "All telecallers' customers across the BDE department."}
          </p>
        </div>
      </div>

      <div className="alp-filters">
        <input
          placeholder="Search customer name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All {staffLabel}s</option>
          {staffList.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* ── Followup employee filter ── */}
        <select value={followupStaffFilter} onChange={(e) => setFollowupStaffFilter(e.target.value)}>
          <option value="">All Followup Employees</option>
          <option value="UNASSIGNED">Unassigned (Followup)</option>
          {followupStaff.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
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

      {/* ── Selected followup employee: workload summary ── */}
      {workload && (
        <div className="alp-workload">
          <div className="alp-workload-title">
            🎯 {selectedFollowupEmp.name} <span>— Followup workload (for the filters applied)</span>
          </div>
          <div className="alp-workload-grid">
            <div className="alp-wl-item"><b>{workload.taken}</b><span>Leads Taken</span></div>
            <div className="alp-wl-item warn"><b>{workload.pending}</b><span>Pending</span></div>
            <div className="alp-wl-item warn"><b>{workload.dicPending}</b><span>DIC Pending</span></div>
            <div className="alp-wl-item warn"><b>{workload.bankPending}</b><span>Bank Pending</span></div>
            <div className="alp-wl-item ok"><b>{workload.sanctioned}</b><span>Sanctioned</span></div>
            <div className="alp-wl-item bad"><b>{workload.notSanctioned}</b><span>Not Sanctioned</span></div>
            <div className="alp-wl-item ok"><b>{formatRupee(workload.sanctionedValue)}</b><span>Sanctioned Value</span></div>
          </div>
        </div>
      )}

      {/* ── Stage summary chips ── */}
      <div className="alp-chips">
        {CHIPS.map((chip) => (
          <button
            key={chip.key || "all"}
            type="button"
            className={`alp-chip ${stageFilter === chip.key ? "active" : ""}`}
            onClick={() => setStageFilter(chip.key)}
          >
            {chip.label}<b>{chip.count}</b>
          </button>
        ))}
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

        const stageKey = getStageKey(c);
        const hasFollowup = stageKey !== "IN_PROGRESS";
        const fu = c.followup || {};
        const dic = fu.dicOffice || {};
        const bank = fu.bank || {};
        const sanc = fu.loanSanctioned || {};
        const owner = fu.assignedTo || {};

        const badgeClass =
          stageKey === "SANCTIONED" ? "done"
            : stageKey === "NOT_SANCTIONED" ? "rejected"
              : stageKey === "WITH_FOLLOWUP" ? "followup"
                : "progress";

        const dicTip = `DIC Office: ${STEP_TEXT[dic.state] || "Not updated"}${dic.state === "NOT_COMPLETED" && dic.reason ? ` — ${dic.reason}` : ""}`;
        const bankTip = `Bank Process: ${STEP_TEXT[bank.state] || "Not updated"}${bank.state === "NOT_COMPLETED" && bank.reason ? ` — ${bank.reason}` : ""}`;
        const sancTip = `Loan Sanctioned: ${sanc.value === "YES" ? "Yes" : sanc.value === "NO" ? "No" : "Not updated"}`;

        return (
          <div className="alp-card" key={c._id}>
            <div className="alp-row" onClick={() => setExpandedId(isOpen ? null : c._id)}>
              <div>
                <div className="alp-name">{c.customerName}</div>
                <div className="alp-sub">{c.contactNo} {c.mailId ? `· ${c.mailId}` : ""}</div>
                {hasFollowup && (
                  <div className={`alp-assign-chip ${owner.employeeId ? "on" : ""}`}>
                    {owner.employeeId
                      ? `🎯 Handled by ${owner.name}${owner.assignedAt ? ` · ${fmtDate(owner.assignedAt)}` : ""}`
                      : "Unassigned"}
                  </div>
                )}
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

              {/* Followup dots — DIC / Bank / Sanction (hover for reason) */}
              <div className="alp-dots">
                {hasFollowup && (
                  <>
                    <span className="alp-dot-item" title={dicTip}>
                      <span className={`alp-dot ${stepDotClass(dic.state)}`} />DIC
                    </span>
                    <span className="alp-dot-item" title={bankTip}>
                      <span className={`alp-dot ${stepDotClass(bank.state)}`} />Bank
                    </span>
                    <span className="alp-dot-item" title={sancTip}>
                      <span className={`alp-dot ${sanctionDotClass(sanc.value)}`} />Loan
                    </span>
                  </>
                )}
              </div>

              {/* One stage badge + who updated it */}
              <div className="alp-stage-wrap">
                <span className={`alp-badge ${badgeClass}`}>
                  {hasFollowup ? STAGE_LABEL[stageKey] : `${pct}%`}
                </span>
                {(stageKey === "SANCTIONED" || stageKey === "NOT_SANCTIONED") && sanc.updatedByName && (
                  <span className="alp-stage-by" title={`Updated by ${sanc.updatedByName}`}>
                    by {sanc.updatedByName} · {fmtDate(sanc.updatedAt)}
                  </span>
                )}
              </div>
              <span style={{ color: "var(--lp-text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div className="alp-detail">
                <div className="alp-section-title">Customer Details</div>
                <div className="alp-info-grid">
                  <div className="alp-info-item"><b>Business Type</b>{c.businessType || "—"}</div>
                  <div className="alp-info-item"><b>Business Sub-Type</b>{c.businessSubType || "—"}</div>

                  <div className="alp-info-item"><b>Scheme</b>{c.scheme || "—"}</div>
                  <div className="alp-info-item"><b>Loan Value</b>{c.loanValue ? `₹${c.loanValue}` : "—"}</div>
                  <div className="alp-info-item"><b>Contact No</b>{c.contactNo || "—"}</div>

                  <div className="alp-info-item"><b>Bank Name</b>{c.bankName || "—"}</div>
                  <div className="alp-info-item"><b>IFSC Code</b>{c.ifscCode || "—"}</div>
                  <div className="alp-info-item"><b>Communication Address</b>{c.communicationAddress || "—"}</div>
                  <div className="alp-info-item"><b>Unit Address</b>{c.unitAddress || "—"}</div>
                </div>

                {/* ── Followup Status (who / DIC / Bank / Sanction / timeline) ── */}
                {hasFollowup && (
                  <>
                    <div className="alp-fu-head">
                      <div className="alp-section-title">Followup Status</div>
                      <div className="alp-fu-meta">
                        Handed over: {fmtDate(fu.handedOverAt)}
                        {owner.assignedAt ? ` · Taken: ${fmtDate(owner.assignedAt)}` : ""}
                        {fu.completedAt ? ` · Completed: ${fmtDate(fu.completedAt)}` : ""}
                      </div>
                    </div>

                    <div className="alp-fu-assign">
                      <b>Handled by:</b>
                      {fu.status === "COMPLETED" ? (
                        <span>{owner.name || "—"}</span>
                      ) : (
                        <select
                          value={owner.employeeId || ""}
                          onChange={(e) => reassignFollowup(c._id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {followupStaff.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="alp-fu-grid">
                      {[
                        { title: "1. DIC Office", s: dic },
                        { title: "2. Bank Process", s: bank },
                      ].map(({ title, s }) => (
                        <div className={`alp-fu-card ${stepDotClass(s.state)}`} key={title}>
                          <div className="alp-fu-title">{title}</div>
                          <div className={`alp-fu-value ${stepDotClass(s.state)}`}>
                            {s.state === "COMPLETED" ? "✅ Completed" : s.state === "NOT_COMPLETED" ? "❌ Not Completed" : "— Not updated"}
                          </div>
                          {s.state === "NOT_COMPLETED" && s.reason && (
                            <div className="alp-fu-reason">📝 {s.reason}</div>
                          )}
                          {s.updatedByName && (
                            <div className="alp-fu-by">{s.updatedByName} · {fmtDate(s.updatedAt)}</div>
                          )}
                        </div>
                      ))}

                      <div className={`alp-fu-card ${sanctionDotClass(sanc.value)}`}>
                        <div className="alp-fu-title">3. Loan Sanctioned</div>
                        <div className={`alp-fu-value ${sanctionDotClass(sanc.value)}`}>
                          {sanc.value === "YES" ? "✅ Yes" : sanc.value === "NO" ? "❌ No" : "— Not updated"}
                        </div>
                        {sanc.updatedByName && (
                          <div className="alp-fu-by">{sanc.updatedByName} · {fmtDate(sanc.updatedAt)}</div>
                        )}
                      </div>
                    </div>

                    <div className="alp-section-title">Followup Timeline</div>
                    <div className="alp-timeline">
                      {buildTimeline(fu).map((e, i) => (
                        <div className="alp-tl-item" key={i}>
                          <div className="alp-tl-icon">{e.icon}</div>
                          <div className="alp-tl-main">
                            {e.text}
                            {e.sub && <div className="alp-tl-sub">{e.sub}</div>}
                          </div>
                          <div className="alp-tl-date">{e.date.toLocaleDateString("en-IN")}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="alp-section-title">Process Checklist</div>
                <div className="alp-checklist-grid">
                  {CHECKLIST_STAGES.map((stage) => (
                    <div key={stage.key}>
                      <label className="alp-stage-row alp-stage-row-readonly">
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