import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Users, CheckCircle2, AlertTriangle, XCircle, Download } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// KPI Cycle tab — employee-wise 3-month cycles (replaces the calendar "Quarterly KPI" tab)
//   • A cycle starts in the employee's first KPI month, runs 3 months, needs 150% combined.
//   • When the 3rd month is reviewed the cycle is final and the next cycle starts.
// Backend: GET /performance-reviews/kpi-compliance  (see performanceReviewRoutes.js)
// ─────────────────────────────────────────────────────────────────────────────

const MIN_PER_MONTH = 50;
const RULE_TIP = "Each 3-month cycle needs a combined 150% (50% per month). The cycle starts from the employee's first KPI month.";

const STATUS = {
  compliant:     { label: "Compliant",     color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", rank: 3, tip: "Cycle total is 150% or more." },
  at_risk:       { label: "At Risk",       color: "#d97706", bg: "#fffbeb", border: "#fde68a", rank: 1, tip: "Below 150% so far, but pending months can still recover it." },
  non_compliant: { label: "Non-Compliant", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", rank: 0, tip: "Cannot reach 150% in this cycle." },
  exempt:        { label: "Exempt",        color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", rank: 4, tip: "Joining month is exempt. KPI starts from the 2nd month." },
  not_started:   { label: "No KPI yet",    color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", rank: 5, tip: "No KPI review has been finalized for this employee yet." },
};

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "compliant", label: "Compliant" },
  { value: "at_risk", label: "At Risk" },
  { value: "non_compliant", label: "Non-Compliant" },
  { value: "no_cycle", label: "Exempt / No KPI yet" },
];

const SORTS = [
  { value: "name", label: "Name A–Z" },
  { value: "status", label: "Needs attention first" },
  { value: "total_desc", label: "Total: High → Low" },
  { value: "total_asc", label: "Total: Low → High" },
];

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};

const fmtJoined = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const noCycleNote = (state) =>
  state === "exempt" ? "Joining month – KPI starts next month" : "No KPI reviewed yet";

// pick the cycle to show for an employee, given the selected view
const pickCycle = (row, view) => {
  if (!row.cycles?.length) return null;
  if (view === "current") return row.cycles[row.current_index] || null;
  if (view === "previous") return row.current_index > 0 ? row.cycles[row.current_index - 1] : null;
  return row.cycles.find(c => c.index === Number(view)) || null;
};

// ── small pieces ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.not_started;
  return (
    <span title={`${s.tip}\n${RULE_TIP}`} style={{ display: "inline-block", background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap", cursor: "help" }}>
      {s.label}
    </span>
  );
}

function MonthCell({ m }) {
  if (!m) return <span style={{ color: "#d1d5db" }}>—</span>;
  const box = { display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px", borderRadius: 8, minWidth: 68 };
  if (m.state === "reviewed") {
    const ok = m.score >= MIN_PER_MONTH;
    return (
      <div style={{ ...box, background: ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}` }} title={ok ? "50% or above" : "Below 50%"}>
        <span style={{ fontWeight: 800, fontSize: 14, color: ok ? "#16a34a" : "#dc2626" }}>{m.score}%</span>
        <span style={{ fontSize: 10, color: "#6b7280" }}>{m.label}</span>
      </div>
    );
  }
  const pending = m.state === "pending";
  return (
    <div style={{ ...box, background: "#f9fafb", border: `1px dashed ${pending ? "#fcd34d" : "#d1d5db"}` }}>
      <span style={{ fontWeight: 700, fontSize: 12, color: pending ? "#b45309" : "#9ca3af" }}>{pending ? "Pending" : "Upcoming"}</span>
      <span style={{ fontSize: 10, color: "#6b7280" }}>{m.label}</span>
    </div>
  );
}

function TotalBar({ achieved, required, color }) {
  const max = required * 2;                          // bar scale: 2 x target (300%)
  const fill = Math.min((achieved / max) * 100, 100);
  const marker = (required / max) * 100;             // the 150% line
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color }}>{achieved}%</span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>target {required}%</span>
      </div>
      <div style={{ position: "relative", background: "#f3f4f6", height: 8, borderRadius: 99 }}>
        <div style={{ width: `${fill}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }} />
        <div title={`${required}% target`} style={{ position: "absolute", left: `${marker}%`, top: -4, bottom: -4, width: 2, background: "#374151", borderRadius: 2 }} />
      </div>
    </div>
  );
}

function CycleCell({ cycle }) {
  if (!cycle) return <span style={{ color: "#d1d5db" }}>—</span>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Cycle {cycle.index}</span>
        <span title={cycle.closed ? "All 3 months reviewed – status is final" : "Cycle still running – status can change"}
          style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: cycle.closed ? "#f3f4f6" : "#eff6ff", color: cycle.closed ? "#4b5563" : "#2563eb" }}>
          {cycle.closed ? "Final" : "Running"}
        </span>
      </div>
      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{cycle.start_label} – {cycle.end_label}</p>
    </div>
  );
}

function EmployeeCell({ row, size = 36 }) {
  const initial = row.name?.charAt(0) || "?";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initial}</div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{row.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{[row.employeeId, row.designation].filter(x => x && x !== "—").join(" · ")}</p>
      </div>
    </div>
  );
}

function SummaryCards({ counts, noCycle }) {
  const items = [
    { label: "Employees", value: counts.total, icon: <Users size={20} color="#2563eb" />, color: "#2563eb", bg: "#eff6ff", sub: noCycle ? `${noCycle} without a cycle` : "" },
    { label: "Compliant", value: counts.compliant, icon: <CheckCircle2 size={20} color="#16a34a" />, color: "#16a34a", bg: "#f0fdf4" },
    { label: "At Risk", value: counts.at_risk, icon: <AlertTriangle size={20} color="#d97706" />, color: "#d97706", bg: "#fffbeb" },
    { label: "Non-Compliant", value: counts.non_compliant, icon: <XCircle size={20} color="#dc2626" />, color: "#dc2626", bg: "#fef2f2" },
  ];
  return (
    <div className="sc-4" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
      {items.map(s => (
        <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
            {s.sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{s.sub}</p>}
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
        </div>
      ))}
    </div>
  );
}

// ── main body (presentational — takes rows from the API) ─────────────────────
export function KpiCycleBody({ rows, initialView = "current" }) {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [view, setView] = useState(initialView);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const departments = useMemo(() => ["All", ...[...new Set(rows.map(r => r.department).filter(d => d && d !== "—"))].sort()], [rows]);
  const maxCycles = useMemo(() => rows.reduce((m, r) => Math.max(m, r.cycles?.length || 0), 0), [rows]);
  const viewOptions = useMemo(() => [
    { value: "current", label: "Current cycle" },
    { value: "previous", label: "Previous cycle" },
    ...Array.from({ length: maxCycles }, (_, i) => ({ value: String(i + 1), label: `Cycle ${i + 1}` })),
  ], [maxCycles]);
  const viewLabel = viewOptions.find(o => o.value === view)?.label || "Current cycle";

  // rows for the selected cycle view + department + search (before the status filter, so cards show the full split)
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(r => dept === "All" || r.department === dept)
      .filter(r => !q || r.name?.toLowerCase().includes(q) || r.employeeId?.toLowerCase().includes(q))
      .map(row => {
        const cycle = pickCycle(row, view);
        return { row, cycle, status: cycle ? cycle.status : row.state, total: cycle ? cycle.achieved : -1 };
      })
      // past cycles only make sense for employees who have that cycle
      .filter(i => view === "current" || i.cycle);
  }, [rows, dept, search, view]);

  const counts = useMemo(() => {
    const c = { total: base.length, compliant: 0, at_risk: 0, non_compliant: 0 };
    base.forEach(i => { if (c[i.status] !== undefined) c[i.status] += 1; });
    return c;
  }, [base]);
  const noCycle = base.filter(i => !i.cycle).length;

  const items = useMemo(() => {
    let list = base.filter(i => {
      if (statusFilter === "all") return true;
      if (statusFilter === "no_cycle") return !i.cycle;
      return i.status === statusFilter;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "status") return (STATUS[a.status]?.rank ?? 9) - (STATUS[b.status]?.rank ?? 9) || a.row.name.localeCompare(b.row.name);
      if (sortBy === "total_desc") return b.total - a.total;
      if (sortBy === "total_asc") return a.total - b.total;
      return a.row.name.localeCompare(b.row.name);
    });
    return list;
  }, [base, statusFilter, sortBy]);

  const hasFilters = search || dept !== "All" || statusFilter !== "all";
  const clearFilters = () => { setSearch(""); setDept("All"); setStatusFilter("all"); };

  const exportExcel = () => {
    const data = items.map(({ row, cycle, status }) => {
      const m = cycle?.months || [];
      return {
        "Employee ID": row.employeeId,
        "Name": row.name,
        "Department": row.department,
        "Joined": row.joined_on || "",
        "Cycle": cycle ? `Cycle ${cycle.index}` : "",
        "Cycle Period": cycle ? `${cycle.start_label} – ${cycle.end_label}` : "",
        "Month 1": m[0]?.label || "", "Month 1 Score (%)": m[0]?.score ?? "",
        "Month 2": m[1]?.label || "", "Month 2 Score (%)": m[1]?.score ?? "",
        "Month 3": m[2]?.label || "", "Month 3 Score (%)": m[2]?.score ?? "",
        "Cycle Total (%)": cycle ? cycle.achieved : "",
        "Required (%)": cycle ? cycle.required : "",
        "Status": STATUS[status]?.label || status,
        "Cycle State": cycle ? (cycle.closed ? "Final" : "Running") : "",
        "Note": cycle ? cycle.note : noCycleNote(row.state),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI Cycles");
    XLSX.writeFile(wb, `KPI_Cycles_${viewLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <>
      <SummaryCards counts={counts} noCycle={noCycle} />

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <div className="rp-filter-grid" style={{ display: "grid", gap: 14, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or employee ID..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} style={inputStyle}>{departments.map(d => <option key={d}>{d}</option>)}</select>
          </div>
          <div>
            <label style={labelStyle}>Cycle</label>
            <select value={view} onChange={e => setView(e.target.value)} style={inputStyle}>
              {viewOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
              {STATUS_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
              {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 12, flexWrap: "wrap" }}>
          {hasFilters
            ? <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>✕ Clear Filters</button>
            : <span />}
          <button onClick={exportExcel} disabled={!items.length}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: items.length ? "#2563eb" : "#9ca3af", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: items.length ? "pointer" : "not-allowed" }}>
            <Download size={15} /> Export {viewLabel}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
            <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>
              {view !== "current" ? `No employees have a ${viewLabel.toLowerCase()} yet` : "No employees found"}
            </p>
          </div>
        ) : (
          <>
            <div className="rp-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Dept", "Joined", "Cycle", "Month 1", "Month 2", "Month 3", "Cycle Total", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ row, cycle, status }, i) => {
                    const meta = STATUS[status] || STATUS.not_started;
                    return (
                      <tr key={row._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "12px 16px" }}><EmployeeCell row={row} /></td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontSize: 13 }}>{row.department}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13, whiteSpace: "nowrap" }}>{fmtJoined(row.joined_on)}</td>
                        <td style={{ padding: "12px 16px" }}><CycleCell cycle={cycle} /></td>
                        {[0, 1, 2].map(k => <td key={k} style={{ padding: "12px 10px" }}><MonthCell m={cycle?.months[k]} /></td>)}
                        <td style={{ padding: "12px 16px" }}>
                          {cycle ? <TotalBar achieved={cycle.achieved} required={cycle.required} color={meta.color} /> : <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={status} />
                          <p style={{ margin: "5px 0 0", fontSize: 11, color: "#6b7280", maxWidth: 200 }}>{cycle ? cycle.note : noCycleNote(row.state)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="rp-card-list">
              {items.map(({ row, cycle, status }) => {
                const meta = STATUS[status] || STATUS.not_started;
                return (
                  <div key={row._id} style={{ border: `1px solid ${meta.border}`, borderRadius: 10, padding: 14, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                      <EmployeeCell row={row} />
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{row.department} · Joined {fmtJoined(row.joined_on)}</span>
                      <CycleCell cycle={cycle} />
                    </div>
                    {cycle && (
                      <>
                        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 12 }}>
                          {cycle.months.map((m, k) => <MonthCell key={k} m={m} />)}
                        </div>
                        <TotalBar achieved={cycle.achieved} required={cycle.required} color={meta.color} />
                      </>
                    )}
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}>{cycle ? cycle.note : noCycleNote(row.state)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {items.length > 0 && (
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#9ca3af" }}>
          Showing {items.length} of {base.length} employees · dark line on the bar marks the 150% target
        </p>
      )}
    </>
  );
}

// ── data-fetching wrapper: this is what you render in the tab ────────────────
// endpoint: use the same URL style as the other calls in Performancereports.jsx
//   e.g. `${API_BASE}/api/performance-reviews/kpi-compliance`
export default function KpiCycleView({ endpoint }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    axios.get(endpoint)
      .then(res => setRows(res.data?.data || []))
      .catch(err => setError(err.response?.data?.message || err.message || "Could not load KPI cycles"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [endpoint]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontWeight: 600 }}>Loading KPI cycles…</div>;
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 14, border: "1px solid #fecaca" }}>
        <p style={{ margin: "0 0 12px", color: "#dc2626", fontWeight: 700 }}>{error}</p>
        <button onClick={load} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </div>
    );
  }
  return <KpiCycleBody rows={rows} />;
}