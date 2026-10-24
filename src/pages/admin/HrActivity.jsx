import React, { useEffect, useState, useCallback, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ---------------------------- UI helpers (display only) ---------------------------- */

const OID = /^[a-f0-9]{24}$/i;

const MODULE_LABELS = {
  HR_ACCOUNT: "HR Account",
  PAYROLL: "Payroll",
  LEAVE: "Leave",
  ATTENDANCE: "Attendance",
  ADVANCE: "Advance",
  KPI: "KPI",
  PERFORMANCE: "Performance",
  APPRAISAL: "Appraisal",
  AWARDS: "Awards",
  GRADING: "Grading",
  FEEDBACK: "Feedback",
  TRAINING: "Training",
  INCENTIVE: "Incentive",
  MASTERS: "Masters",
  POLICY: "Policy",
  ANNOUNCEMENT: "Announcement",
  WELLNESS: "Wellness",
  ENGAGEMENT: "Engagement",
  RETENTION: "Retention",
  LEADERSHIP: "Leadership",
  TICKETS: "Tickets",
  SETTINGS: "Settings",
  RECRUITMENT: "Recruitment",
  EMPLOYEE: "Employee",
  LOAN: "Loan",
  PRODUCTS: "Products",
};

const VERB_OPTIONS = [
  ["CREATE", "Created"],
  ["UPDATE", "Updated"],
  ["DELETE", "Deleted"],
  ["APPROVE", "Approved"],
  ["REJECT", "Rejected"],
  ["GENERATE", "Generated"],
  ["RELIEVE", "Relieved"],
  ["ACTIVATE", "Activated"],
  ["PUBLISH", "Published"],
];

const FIELD_LABELS = {
  employeeId: "Employee",
  employee_id: "Employee",
  empId: "Employee ID",
  basicSalary: "Basic Salary",
  fromDate: "From Date",
  toDate: "To Date",
  leaveType: "Leave Type",
  reason: "Reason",
  remarks: "Remarks",
  status: "Status",
  amount: "Amount",
  month: "Month",
  year: "Year",
  name: "Name",
  title: "Title",
  email: "Email",
  department: "Department",
  designation: "Designation",
};

const VERB_STYLE = {
  CREATE: { bg: "#e7f6ec", fg: "#17803d", label: "Created" },
  UPDATE: { bg: "#e7f0fe", fg: "#1d5fd1", label: "Updated" },
  DELETE: { bg: "#fdeaea", fg: "#c62828", label: "Deleted" },
  APPROVE: { bg: "#e7f6ec", fg: "#17803d", label: "Approved" },
  REAPPROVE: { bg: "#e7f6ec", fg: "#17803d", label: "Re-approved" },
  REJECT: { bg: "#fdeaea", fg: "#c62828", label: "Rejected" },
  RELIEVE: { bg: "#fff1e0", fg: "#b45309", label: "Relieved" },
  FIRE: { bg: "#fdeaea", fg: "#c62828", label: "Terminated" },
  GENERATE: { bg: "#efeafd", fg: "#5b3cc4", label: "Generated" },
  PUBLISH: { bg: "#efeafd", fg: "#5b3cc4", label: "Published" },
};

const titleCase = (s) =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const moduleLabel = (m) => MODULE_LABELS[m] || titleCase(m);
const fieldLabel = (k) => FIELD_LABELS[k] || titleCase(k);

// action = "<MODULE>_<VERB>"
const splitAction = (r) => {
  const action = String(r.action || "");
  const mod = r.entityType && action.startsWith(`${r.entityType}_`) ? r.entityType : action.split("_")[0];
  const verb = action.startsWith(`${mod}_`) ? action.slice(mod.length + 1) : action;
  return { mod, verb };
};

const verbStyle = (verb) =>
  VERB_STYLE[verb] || { bg: "#eef0f3", fg: "#475467", label: titleCase(verb) };

const fmtValue = (v) => {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
};

const isHiddenValue = (v) => typeof v === "string" && OID.test(v);

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#db2777", "#7c3aed", "#0d9488"];
const avatarColor = (s) => {
  let h = 0;
  for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const dayKey = (d) => new Date(d).toDateString();
const dayLabel = (d) => {
  const dt = new Date(d);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString()) return "Today";
  if (dt.toDateString() === y.toDateString()) return "Yesterday";
  return dt.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};
const timeOnly = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
const fullTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

const toInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const entityText = (r) => {
  if (r.entityName) return r.entityName;
  if (r.entityId && !OID.test(String(r.entityId))) return r.entityId;
  return "";
};

const activityText = (r) => r.remarks || titleCase(r.action);

/* ---------------------------------- Component ---------------------------------- */

export default function HrActivity() {
  const token = localStorage.getItem("adminToken");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ actorId: "", action: "", from: "", to: "", hideTest: false });

  // UI-only state
  const [modSel, setModSel] = useState("");
  const [verbSel, setVerbSel] = useState("");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ page, limit: 50 });
      Object.entries(f).forEach(([k, v]) => { if (v) qs.set(k, v); });
      const headers = { Authorization: `Bearer ${token}` };
      const [a, b] = await Promise.all([
        fetch(`${API_BASE}/api/admin/hr-activity?${qs}`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/hr-activity/summary?${qs}`, { headers }).then((r) => r.json()),
      ]);
      if (!a.success) throw new Error(a.msg || a.message || "Failed to load");
      setRows(a.data);
      setPages(a.pages || 1);
      setTotal(a.total || 0);
      setSummary(b.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, f, token]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => { setPage(1); setF((p) => ({ ...p, [k]: v })); };

  // module + action-type dropdowns feed the same `action` filter ("MODULE_VERB")
  const applyAction = (mod, verb) => {
    setModSel(mod);
    setVerbSel(verb);
    set("action", mod && verb ? `${mod}_${verb}` : mod || verb || "");
  };

  const quickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    setPage(1);
    setF((p) => ({ ...p, from: toInput(from), to: toInput(to) }));
  };

  const clearAll = () => {
    setModSel("");
    setVerbSel("");
    setSearch("");
    setPage(1);
    setF({ actorId: "", action: "", from: "", to: "", hideTest: false });
  };

  const hasFilters = f.actorId || f.action || f.from || f.to || f.hideTest || search;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // client-side display search on the current page only
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.actorName, r.actorEmail, r.remarks, r.action, r.entityName, r.entityType]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const grouped = useMemo(() => {
    const out = [];
    let last = "";
    visibleRows.forEach((r) => {
      const k = dayKey(r.createdAt);
      if (k !== last) { out.push({ type: "day", key: `d-${k}`, label: dayLabel(r.createdAt) }); last = k; }
      out.push({ type: "row", key: r._id, r });
    });
    return out;
  }, [visibleRows]);

  const activeHrs = summary.length;
  const topActor = summary[0];
  const limit = 50;
  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  const pageNumbers = useMemo(() => {
    const out = [];
    const s = Math.max(1, Math.min(page - 2, pages - 4));
    const e = Math.min(pages, s + 4);
    for (let i = s; i <= e; i++) out.push(i);
    return out;
  }, [page, pages]);

  return (
    <div className="container-fluid py-3 text-dark hra-wrap">
      <style>{css}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-0 text-dark">HR Activity</h4>
          <div className="text-muted small">Track what every HR account has done in the system</div>
        </div>
        <button className="btn btn-outline-secondary btn-sm hra-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <div className="hra-stat">
            <div className="hra-stat-label">Total Activities</div>
            <div className="hra-stat-value">{total}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="hra-stat">
            <div className="hra-stat-label">Active HR Accounts</div>
            <div className="hra-stat-value">{activeHrs}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="hra-stat">
            <div className="hra-stat-label">Most Active</div>
            <div className="hra-stat-value hra-stat-text">{topActor ? topActor.name : "—"}</div>
            {topActor && <div className="hra-stat-sub">{topActor.total} activities</div>}
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="hra-stat">
            <div className="hra-stat-label">Showing</div>
            <div className="hra-stat-value">{startIdx}–{endIdx}</div>
            <div className="hra-stat-sub">Page {page} of {pages}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card hra-card p-3 mb-3 bg-white text-dark">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small mb-1 hra-lbl">Who</label>
            <select className="form-select" value={f.actorId} onChange={(e) => set("actorId", e.target.value)}>
              <option value="">Everyone</option>
              {summary.map((s) => (
                <option key={s._id} value={s._id}>{s.name}{s.isTest ? " (TEST)" : ""} — {s.total}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-1 hra-lbl">Module</label>
            <select className="form-select" value={modSel} onChange={(e) => applyAction(e.target.value, verbSel)}>
              <option value="">All modules</option>
              {Object.entries(MODULE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-1 hra-lbl">Action</label>
            <select className="form-select" value={verbSel} onChange={(e) => applyAction(modSel, e.target.value)}>
              <option value="">All actions</option>
              {VERB_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-1 hra-lbl">Search (this page)</label>
            <input className="form-control" placeholder="Name, email, activity…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="col-md-2">
            <label className="form-label small mb-1 hra-lbl">From</label>
            <input type="date" className="form-control" value={f.from} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1 hra-lbl">To</label>
            <input type="date" className="form-control" value={f.to} onChange={(e) => set("to", e.target.value)} />
          </div>
          <div className="col-md-4 d-flex align-items-center gap-2 flex-wrap">
            <button type="button" className="hra-chip" onClick={() => quickRange(1)}>Today</button>
            <button type="button" className="hra-chip" onClick={() => quickRange(7)}>7 days</button>
            <button type="button" className="hra-chip" onClick={() => quickRange(30)}>30 days</button>
          </div>
          <div className="col-md-2">
            <div className="form-check form-switch mb-0">
              <input id="hideTest" type="checkbox" className="form-check-input" role="switch"
                checked={f.hideTest} onChange={(e) => set("hideTest", e.target.checked)} />
              <label htmlFor="hideTest" className="form-check-label small">Hide test HR</label>
            </div>
          </div>
          <div className="col-md-2 text-md-end">
            {hasFilters ? (
              <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={clearAll}>
                ✕ Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {/* Table */}
      <div className="card hra-card bg-white text-dark">
        <div className="table-responsive">
          <table className="table align-middle mb-0 hra-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Time</th>
                <th style={{ minWidth: 230 }}>Who</th>
                <th style={{ minWidth: 300 }}>Activity</th>
                <th style={{ minWidth: 170 }}>Record</th>
                <th style={{ width: 90 }} className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5"><div className="hra-skel" /></td>
                  </tr>
                ))
              ) : grouped.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    <div style={{ fontSize: 34, lineHeight: 1 }}>🗂️</div>
                    <div className="fw-semibold mt-2">No activity found</div>
                    <div className="small">Try changing or clearing the filters</div>
                  </td>
                </tr>
              ) : grouped.map((g) => {
                if (g.type === "day") {
                  return (
                    <tr key={g.key} className="hra-day">
                      <td colSpan="5">{g.label}</td>
                    </tr>
                  );
                }
                const r = g.r;
                const { mod, verb } = splitAction(r);
                const vs = verbStyle(verb);
                const ent = entityText(r);
                return (
                  <tr key={g.key} className="hra-row" onClick={() => setSelected(r)}>
                    <td className="text-nowrap" title={fullTime(r.createdAt)}>
                      <span className="fw-semibold">{timeOnly(r.createdAt)}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="hra-avatar" style={{ background: avatarColor(r.actorEmail || r.actorName) }}>
                          {initials(r.actorName)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-truncate">
                            {r.actorName}{" "}
                            {r.isTest && <span className="badge bg-warning text-dark ms-1">TEST</span>}
                          </div>
                          <div className="small text-muted text-truncate">
                            {r.actorRole && <span className="hra-role">{r.actorRole}</span>}
                            {r.actorEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-start gap-2">
                        <span className="hra-pill" style={{ background: vs.bg, color: vs.fg }}>{vs.label}</span>
                        <div>
                          <div className="fw-semibold">{activityText(r)}</div>
                          <div className="small text-muted">{moduleLabel(mod)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {ent ? <div className="fw-semibold">{ent}</div> : <div className="text-muted">—</div>}
                      <div className="small text-muted">{moduleLabel(r.entityType || mod)}</div>
                    </td>
                    <td className="text-end">
                      <button type="button" className="hra-view"
                        onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
          <span className="small text-muted">
            Showing {startIdx}–{endIdx} of {total}
          </span>
          <div className="d-flex align-items-center gap-1">
            <button className="btn btn-outline-secondary btn-sm hra-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ‹ Prev
            </button>
            {pageNumbers.map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={`btn btn-sm hra-btn ${n === page ? "btn-dark" : "btn-outline-secondary"}`}>
                {n}
              </button>
            ))}
            <button className="btn btn-outline-secondary btn-sm hra-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Details drawer */}
      {selected && <Drawer r={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ------------------------------- Details drawer ------------------------------- */

function Drawer({ r, onClose }) {
  const { mod, verb } = splitAction(r);
  const vs = verbStyle(verb);
  const ent = entityText(r);

  const body = r.meta?.body && typeof r.meta.body === "object" ? r.meta.body : {};
  const fields = Object.entries(body).filter(([, v]) => !isHiddenValue(v));

  const before = r.meta?.before;
  const after = r.meta?.after;
  const changes = [];
  if (before && typeof before === "object" && after && typeof after === "object") {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    keys.forEach((k) => {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changes.push([k, before[k], after[k]]);
      }
    });
  }

  return (
    <>
      <div className="hra-backdrop" onClick={onClose} />
      <aside className="hra-drawer">
        <div className="hra-drawer-head">
          <div>
            <span className="hra-pill" style={{ background: vs.bg, color: vs.fg }}>{vs.label}</span>
            <div className="fw-bold mt-2" style={{ fontSize: 17 }}>{activityText(r)}</div>
          </div>
          <button type="button" className="hra-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="hra-drawer-body">
          <div className="hra-section">Summary</div>
          <dl className="hra-dl">
            <dt>Done by</dt>
            <dd>
              <div className="fw-semibold">
                {r.actorName} {r.isTest && <span className="badge bg-warning text-dark">TEST</span>}
              </div>
              <div className="small text-muted">{r.actorRole ? `${r.actorRole.toUpperCase()} · ` : ""}{r.actorEmail}</div>
            </dd>
            <dt>When</dt>
            <dd>{fullTime(r.createdAt)}</dd>
            <dt>Module</dt>
            <dd>{moduleLabel(mod)}</dd>
            <dt>Record</dt>
            <dd>{ent || "—"}</dd>
          </dl>

          {changes.length > 0 && (
            <>
              <div className="hra-section">Changes</div>
              <div className="hra-changes">
                {changes.map(([k, a, b]) => (
                  <div key={k} className="hra-change">
                    <div className="small text-muted mb-1">{fieldLabel(k)}</div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="hra-old">{fmtValue(a)}</span>
                      <span className="text-muted">→</span>
                      <span className="hra-new">{fmtValue(b)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {fields.length > 0 && (
            <>
              <div className="hra-section">{changes.length > 0 ? "Submitted Information" : "Information"}</div>
              <dl className="hra-dl">
                {fields.map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt>{fieldLabel(k)}</dt>
                    <dd>{fmtValue(v)}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </>
          )}

          {changes.length === 0 && fields.length === 0 && (
            <div className="text-muted small mt-3">No additional details were recorded for this activity.</div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ----------------------------------- Styles ----------------------------------- */

const css = `
.hra-wrap { --hra-border:#e6e8ec; --hra-soft:#f6f7f9; }
.hra-card { border:1px solid var(--hra-border); border-radius:14px; box-shadow:0 1px 3px rgba(16,24,40,.05); overflow:hidden; }
.hra-card.p-3 { overflow:visible; }
.hra-lbl { color:#667085; font-weight:600; letter-spacing:.2px; }
.hra-btn { border-radius:8px; }

.hra-stat { background:#fff; border:1px solid var(--hra-border); border-radius:14px; padding:14px 16px; box-shadow:0 1px 3px rgba(16,24,40,.05); height:100%; }
.hra-stat-label { font-size:12px; color:#667085; font-weight:600; text-transform:uppercase; letter-spacing:.4px; }
.hra-stat-value { font-size:26px; font-weight:700; color:#101828; line-height:1.2; margin-top:4px; }
.hra-stat-text { font-size:18px; line-height:1.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hra-stat-sub { font-size:12px; color:#98a2b3; }

.hra-chip { border:1px solid var(--hra-border); background:#fff; color:#344054; border-radius:999px; padding:5px 14px; font-size:13px; font-weight:500; cursor:pointer; transition:.15s; }
.hra-chip:hover { background:#101828; color:#fff; border-color:#101828; }

.hra-table thead th { background:var(--hra-soft); font-size:12px; text-transform:uppercase; letter-spacing:.5px; color:#667085; font-weight:700; border-bottom:1px solid var(--hra-border); padding:12px 16px; white-space:nowrap; }
.hra-table tbody td { padding:12px 16px; border-bottom:1px solid #f0f1f4; vertical-align:middle; }
.hra-row { cursor:pointer; transition:background .12s; }
.hra-row:hover { background:#f9fafc; }
.hra-day td { background:#fbfbfd; font-size:12px; font-weight:700; color:#475467; text-transform:uppercase; letter-spacing:.5px; padding:8px 16px !important; border-bottom:1px solid #eef0f3 !important; }

.hra-avatar { width:36px; height:36px; border-radius:50%; color:#fff; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.hra-role { display:inline-block; background:#f2f4f7; border:1px solid var(--hra-border); color:#475467; border-radius:6px; padding:0 6px; margin-right:6px; font-size:11px; font-weight:600; text-transform:uppercase; }
.hra-pill { display:inline-block; border-radius:999px; padding:3px 11px; font-size:12px; font-weight:700; white-space:nowrap; }

.hra-view { border:1px solid var(--hra-border); background:#fff; color:#1d5fd1; border-radius:8px; padding:4px 12px; font-size:13px; font-weight:600; cursor:pointer; }
.hra-view:hover { background:#e7f0fe; }

.hra-skel { height:34px; border-radius:8px; background:linear-gradient(90deg,#f1f2f5 25%,#e8eaee 37%,#f1f2f5 63%); background-size:400% 100%; animation:hraShine 1.3s ease infinite; }
@keyframes hraShine { 0%{background-position:100% 50%} 100%{background-position:0 50%} }

.hra-backdrop { position:fixed; inset:0; background:rgba(16,24,40,.45); z-index:1040; animation:hraFade .15s ease; }
.hra-drawer { position:fixed; top:0; right:0; height:100vh; width:min(460px,100vw); background:#fff; z-index:1050; box-shadow:-8px 0 30px rgba(16,24,40,.18); display:flex; flex-direction:column; animation:hraSlide .2s ease; color:#101828; }
.hra-drawer-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:20px 22px; border-bottom:1px solid var(--hra-border); }
.hra-close { border:none; background:#f2f4f7; width:32px; height:32px; border-radius:50%; cursor:pointer; color:#475467; flex-shrink:0; }
.hra-close:hover { background:#e4e7ec; }
.hra-drawer-body { padding:6px 22px 28px; overflow-y:auto; flex:1; }
.hra-section { font-size:12px; font-weight:700; color:#667085; text-transform:uppercase; letter-spacing:.5px; margin:20px 0 8px; }
.hra-dl { display:grid; grid-template-columns:130px 1fr; gap:10px 12px; margin:0; font-size:14px; }
.hra-dl dt { color:#667085; font-weight:500; }
.hra-dl dd { margin:0; word-break:break-word; }
.hra-changes { display:flex; flex-direction:column; gap:10px; }
.hra-change { border:1px solid var(--hra-border); border-radius:10px; padding:10px 12px; background:#fcfcfd; }
.hra-old { background:#fdeaea; color:#c62828; text-decoration:line-through; border-radius:6px; padding:2px 8px; font-size:13px; }
.hra-new { background:#e7f6ec; color:#17803d; border-radius:6px; padding:2px 8px; font-size:13px; font-weight:600; }
@keyframes hraSlide { from{transform:translateX(30px);opacity:0} to{transform:none;opacity:1} }
@keyframes hraFade { from{opacity:0} to{opacity:1} }
`;