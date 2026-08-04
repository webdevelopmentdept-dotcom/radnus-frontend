import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Delete02Icon, UserMultiple02Icon, Search01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width:"100%", padding:"9px 12px", border:"1px solid #d1d5db",
  borderRadius:8, fontSize:13, color:"#1a1a2e", background:"#fff",
  boxSizing:"border-box", outline:"none",
};
const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 };

// 🆕 Year range for assignment period selection — independent of the plan's own period_year
const CURRENT_YEAR = new Date().getFullYear();
const ASSIGN_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ── Generate period options based on plan period_type + a chosen year ─────────
function getPeriodOptions(plan, year) {
  if (!plan) return [];
  const y     = year || plan.period_year || new Date().getFullYear();
  const ptype = plan.period_type || "Monthly";

  if (ptype === "Monthly") {
    const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.map((m, i) => ({ value: `${y}-${m}`, label: `${labels[i]} ${y}` }));
  }
  if (ptype === "Quarterly") {
    return ["Q1","Q2","Q3","Q4"].map(q => ({ value: `${y}-${q}`, label: `${q} ${y}` }));
  }
  if (ptype === "Half-Yearly") {
    return ["H1","H2"].map(h => ({ value: `${y}-${h}`, label: `${h} ${y}` }));
  }
  if (ptype === "Yearly") {
    return [{ value: `${y}`, label: `FY ${y}` }];
  }
  return [];
}

// ══════════════════════════════════════════════════════════════════════════
// 🆕 SearchableSelect — type-to-search dropdown (combobox).
// Drop-in UI replacement for a plain <select>: pass `options` as
// [{ value, label, sublabel? }], current `value`, and `onChange(value)`.
// Pure UI component — does not touch any assignment/save logic.
// ══════════════════════════════════════════════════════════════════════════
function SearchableSelect({ options, value, onChange, placeholder = "Select...", disabled = false, emptyText = "No results" }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel || "").toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          ...inputStyle,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f8fafc" : "#fff",
          color: selected ? "#1a1a2e" : "#9ca3af",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#9ca3af" strokeWidth={2} />
      </div>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <HugeiconsIcon icon={Search01Icon} size={14} color="#9ca3af" strokeWidth={2} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#1a1a2e" }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ margin: 0, padding: "12px 14px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>{emptyText}</p>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  style={{
                    padding: "9px 14px", cursor: "pointer", fontSize: 13,
                    background: opt.value === value ? "#eff6ff" : "#fff",
                    color: opt.value === value ? "#1d4ed8" : "#1a1a2e",
                    fontWeight: opt.value === value ? 700 : 500,
                  }}
                  onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = "#fff"; }}
                >
                  <div>{opt.label}</div>
                  {opt.sublabel && (
                    <div style={{ fontSize: 11, color: opt.value === value ? "#60a5fa" : "#9ca3af", marginTop: 1 }}>{opt.sublabel}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncentiveAssign() {
  const [employees, setEmployees] = useState([]);
  const [plans,     setPlans]     = useState([]);
  const [assigned,  setAssigned]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  // form
  const [selEmp,  setSelEmp]  = useState("");
  const [selPlan, setSelPlan] = useState("");
  const [period,  setPeriod]  = useState("");
  const [selYear, setSelYear] = useState(CURRENT_YEAR); // 🆕 user-controlled year for this assignment

  // filters
  const [filterDept, setFilterDept] = useState("All");
  const [search,     setSearch]     = useState("");

  // 🆕 assignment mode: "department" (whole dept) | "employee" (specific person)
  const [assignMode, setAssignMode] = useState("department");
  const [bulkDept,   setBulkDept]   = useState("");
  const [bulkPlan,   setBulkPlan]   = useState("");
  const [bulkPeriod, setBulkPeriod] = useState("");
  const [bulkYear,   setBulkYear]   = useState(CURRENT_YEAR); // 🆕 user-controlled year for bulk assignment

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, planRes, assignRes] = await Promise.all([
        axios.get(`${API_BASE}/api/hr/employees`),
        axios.get(`${API_BASE}/api/incentive-plans`),
        axios.get(`${API_BASE}/api/incentive-assignments`),
      ]);
      const allEmps = empRes.data?.data || empRes.data || [];
      setEmployees(allEmps.filter(e => e.status === "active"));
      setPlans(planRes.data?.data   || planRes.data   || []);
      setAssigned(assignRes.data?.data || assignRes.data || []);
    } catch { showToast("Failed to load", "error"); }
    finally   { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const depts = useMemo(() => ["All", ...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  const filteredEmps = useMemo(() => employees.filter(e => {
    const matchDept = filterDept === "All" || e.department === filterDept;
    const matchName = !search.trim() || e.name?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchName;
  }), [employees, filterDept, search]);

  // selected plan object
  const selectedPlan = plans.find(p => p._id === selPlan);

  // 🆕 period options now driven by selected plan's cycle-type + the user-chosen year
  const periodOptions = useMemo(() => getPeriodOptions(selectedPlan, selYear), [selectedPlan, selYear]);

  // 🆕 bulk (whole department) selections
  const bulkSelectedPlan    = plans.find(p => p._id === bulkPlan);
  const bulkPeriodOptions   = useMemo(() => getPeriodOptions(bulkSelectedPlan, bulkYear), [bulkSelectedPlan, bulkYear]);
  const bulkDeptEmpCount    = useMemo(
    () => employees.filter(e => e.department === bulkDept).length,
    [employees, bulkDept]
  );

  // ── SearchableSelect option lists (UI only — no logic change) ──────────────
  const deptOptions = useMemo(
    () => depts.filter(d => d !== "All").map(d => ({ value: d, label: d })),
    [depts]
  );

  const planOptionsAll = useMemo(
    () => plans.map(p => ({
      value: p._id,
      label: p.name,
      sublabel: `${p.department} · ${p.period_type}`,
    })),
    [plans]
  );

  const empOptions = useMemo(
    () => filteredEmps.map(e => ({
      value: e._id,
      label: e.name,
      sublabel: `${e.department}${e.designation ? " · " + e.designation : ""}`,
    })),
    [filteredEmps]
  );

  // auto-fill plan when employee changes (match dept)
  const handleEmpChange = (empId) => {
    setSelEmp(empId);
    const emp   = employees.find(e => e._id === empId);
    const dPlan = plans.find(p => p.department === emp?.department);
    if (dPlan) { setSelPlan(dPlan._id); setPeriod(""); }
  };

  // reset period when plan changes
  const handlePlanChange = (planId) => {
    setSelPlan(planId);
    setPeriod("");
  };

  const handleAssign = async () => {
    if (!selEmp || !selPlan || !period) {
      showToast("Employee, plan & period are required", "error"); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/incentive-assignments`, {
        employee_id: selEmp,
        plan_id:     selPlan,
        cycle:       selectedPlan?.period_type || "Monthly", // ✅ use period_type from plan
        period,
      });
      showToast("Plan assigned ✅");
      setSelEmp(""); setSelPlan(""); setPeriod("");
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || "Assign failed";
      showToast(msg, "error");
    }
    finally { setSaving(false); }
  };

  // 🆕 Assign the SAME plan to EVERY active employee in a department
  const handleBulkAssign = async () => {
    if (!bulkDept || !bulkPlan || !bulkPeriod) {
      showToast("Department, plan & period are required", "error"); return;
    }
    const deptEmps = employees.filter(e => e.department === bulkDept);
    if (deptEmps.length === 0) {
      showToast("No active employees found in this department", "error"); return;
    }
    setSaving(true);
    try {
      const results = await Promise.allSettled(deptEmps.map(emp =>
        axios.post(`${API_BASE}/api/incentive-assignments`, {
          employee_id: emp._id,
          plan_id:     bulkPlan,
          cycle:       bulkSelectedPlan?.period_type || "Monthly",
          period:      bulkPeriod,
        })
      ));
      const okCount   = results.filter(r => r.status === "fulfilled").length;
      const failCount = results.length - okCount;
      showToast(
        failCount > 0
          ? `Assigned to ${okCount} employees, ${failCount} skipped (already assigned)`
          : `Assigned to all ${okCount} employees ✅`
      );
      setBulkDept(""); setBulkPlan(""); setBulkPeriod("");
      fetchAll();
    } catch {
      showToast("Bulk assign failed", "error");
    }
    finally { setSaving(false); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await axios.delete(`${API_BASE}/api/incentive-assignments/${id}`);
      showToast("Removed ✅"); fetchAll();
    } catch { showToast("Remove failed", "error"); }
  };

  return (
    <div style={{ padding:"28px 32px", fontFamily:"'Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6fb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:16, zIndex:9999, background:toast.type==="error"?"#ff4d4f":"#52c41a", color:"#fff", padding:"12px 20px", borderRadius:8, fontWeight:500, fontSize:14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>Assign Incentive Plans</h2>
        <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>
          Link employees to a department incentive plan for a specific period
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Assigned", value: assigned.length,                                                          color:"#2563eb" },
          { label:"Monthly",        value: assigned.filter(a => a.cycle==="Monthly").length,                         color:"#16a34a" },
          { label:"Quarterly",      value: assigned.filter(a => a.cycle==="Quarterly").length,                       color:"#d97706" },
          { label:"Employees",      value: new Set(assigned.map(a => a.employee_id?._id || a.employee_id)).size,     color:"#7c3aed" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:26, fontWeight:800, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Assign Form */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px", marginBottom:24 }}>
        <p style={{ margin:"0 0 16px", fontWeight:800, fontSize:15, color:"#1a1a2e" }}>➕ New Assignment</p>

        {/* 🆕 Mode Toggle */}
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          <button
            onClick={() => setAssignMode("department")}
            style={{
              padding:"9px 18px", borderRadius:8, border:"1.5px solid #1d4ed8", cursor:"pointer",
              background: assignMode === "department" ? "#1d4ed8" : "#fff",
              color:      assignMode === "department" ? "#fff"    : "#1d4ed8",
              fontWeight:700, fontSize:13,
            }}
          >
            🏢 Whole Department
          </button>
          <button
            onClick={() => setAssignMode("employee")}
            style={{
              padding:"9px 18px", borderRadius:8, border:"1.5px solid #1d4ed8", cursor:"pointer",
              background: assignMode === "employee" ? "#1d4ed8" : "#fff",
              color:      assignMode === "employee" ? "#fff"    : "#1d4ed8",
              fontWeight:700, fontSize:13,
            }}
          >
            👤 Specific Employee
          </button>
        </div>

        {assignMode === "department" ? (
          /* ══════════ 🆕 WHOLE DEPARTMENT MODE ══════════ */
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>
              <div>
                <label style={labelStyle}>Department *</label>
                {/* 🔍 searchable */}
                <SearchableSelect
                  options={deptOptions}
                  value={bulkDept}
                  onChange={(v) => setBulkDept(v)}
                  placeholder="Search department..."
                  emptyText="No department found"
                />
                {bulkDept && (
                  <p style={{ margin:"6px 0 0", fontSize:12, color:"#6b7280" }}>
                    {bulkDeptEmpCount} active employee{bulkDeptEmpCount !== 1 ? "s" : ""} in this department
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Incentive Plan *</label>
                {/* 🔍 searchable */}
                <SearchableSelect
                  options={planOptionsAll}
                  value={bulkPlan}
                  onChange={(v) => { setBulkPlan(v); setBulkPeriod(""); }}
                  placeholder="Search plan..."
                  emptyText="No plan found"
                />
              </div>

              <div>
                <label style={labelStyle}>Cycle</label>
                <input
                  value={bulkSelectedPlan?.period_type || "—"}
                  readOnly
                  style={{ ...inputStyle, background:"#f8fafc", color:"#6b7280", cursor:"not-allowed" }}
                />
              </div>

              {/* 🆕 Year — freely selectable, independent of the plan's own period_year */}
              <div>
                <label style={labelStyle}>Year *</label>
                <select
                  value={bulkYear}
                  onChange={e => { setBulkYear(Number(e.target.value)); setBulkPeriod(""); }}
                  style={inputStyle}
                  disabled={!bulkPlan}
                >
                  {ASSIGN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Period *</label>
                {bulkPeriodOptions.length > 0 ? (
                  <select value={bulkPeriod} onChange={e => setBulkPeriod(e.target.value)} style={inputStyle}>
                    <option value="">Select period...</option>
                    {bulkPeriodOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={bulkPeriod}
                    onChange={e => setBulkPeriod(e.target.value)}
                    placeholder={bulkPlan ? "Select a plan first" : "e.g. 2026-04"}
                    disabled={!bulkPlan}
                    style={{ ...inputStyle, background: !bulkPlan ? "#f8fafc" : "#fff", color: !bulkPlan ? "#9ca3af" : "#1a1a2e" }}
                  />
                )}
              </div>
            </div>

            <button
              onClick={handleBulkAssign}
              disabled={saving}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", background:saving?"#93c5fd":"#1d4ed8", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#fff" strokeWidth={2} />
              {saving ? "Assigning..." : `Assign to All ${bulkDeptEmpCount || ""} Department Employees`}
            </button>
          </>
        ) : (
          /* ══════════ EXISTING SPECIFIC EMPLOYEE MODE ══════════ */
          <>
        {/* Filter row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Filter by Department</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inputStyle}>
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type name..." style={inputStyle} />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>

          {/* Employee */}
          <div>
            <label style={labelStyle}>Employee *</label>
            {/* 🔍 searchable */}
            <SearchableSelect
              options={empOptions}
              value={selEmp}
              onChange={handleEmpChange}
              placeholder="Search employee..."
              emptyText="No employee found"
            />
          </div>

          {/* Plan */}
          <div>
            <label style={labelStyle}>Incentive Plan *</label>
            {/* 🔍 searchable */}
            <SearchableSelect
              options={planOptionsAll}
              value={selPlan}
              onChange={handlePlanChange}
              placeholder="Search plan..."
              emptyText="No plan found"
            />
          </div>

          {/* Cycle — read-only from plan */}
          <div>
            <label style={labelStyle}>Cycle</label>
            <input
              value={selectedPlan?.period_type || "—"}
              readOnly
              style={{ ...inputStyle, background:"#f8fafc", color:"#6b7280", cursor:"not-allowed" }}
            />
          </div>

          {/* 🆕 Year — freely selectable, independent of the plan's own period_year */}
          <div>
            <label style={labelStyle}>Year *</label>
            <select
              value={selYear}
              onChange={e => { setSelYear(Number(e.target.value)); setPeriod(""); }}
              style={inputStyle}
              disabled={!selPlan}
            >
              {ASSIGN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Period — smart dropdown */}
          <div>
            <label style={labelStyle}>Period *</label>
            {periodOptions.length > 0 ? (
              <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
                <option value="">Select period...</option>
                {periodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder={selPlan ? "Select a plan first" : "e.g. 2026-04"}
                disabled={!selPlan}
                style={{ ...inputStyle, background: !selPlan ? "#f8fafc" : "#fff", color: !selPlan ? "#9ca3af" : "#1a1a2e" }}
              />
            )}
          </div>
        </div>

        {/* Plan Preview — updated for kpi_configs */}
        {selectedPlan && (
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", marginBottom:16, border:"1px solid #e5e7eb" }}>
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>
              Plan Preview — {selectedPlan.name}
            </p>

            {/* KPI-Linked preview */}
            {selectedPlan.plan_type === "kpi_linked" && (
              <>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                  {(selectedPlan.kpi_configs || []).map((cfg, i) => (
                    <span key={i} style={{ background:"#eef2ff", color:"#4f46e5", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>
                      🎯 {cfg.kpi_name} · {cfg.rule_label || `target: ${cfg.target}`}
                    </span>
                  ))}
                  {(selectedPlan.kpi_configs || []).length === 0 && (
                    <span style={{ fontSize:12, color:"#9ca3af" }}>No KPIs configured</span>
                  )}
                </div>
                {selectedPlan.completion_reward_type !== "none" && (
                  <div style={{ background:"#fef9c3", borderRadius:7, padding:"6px 12px", fontSize:12, fontWeight:700, color:"#92400e", display:"inline-flex", alignItems:"center", gap:6 }}>
                    🏆 All-KPI Bonus:{" "}
                    {selectedPlan.completion_reward_type === "fixed"
                      ? `₹${Number(selectedPlan.completion_reward_value).toLocaleString("en-IN")}`
                      : `${selectedPlan.completion_reward_value}% of Salary`}
                    {selectedPlan.completion_reward_label ? ` · ${selectedPlan.completion_reward_label}` : ""}
                  </div>
                )}
              </>
            )}

            {/* Standalone preview */}
            {selectedPlan.plan_type === "standalone" && (
  <div>
    {/* புதுசு slabs இருந்தா அதை show பண்ணு */}
    {(selectedPlan.standalone_slabs || []).length > 0 ? (
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {selectedPlan.standalone_slabs.map((slab, i) => (
          <span key={i} style={{ background:"#f0fdf4", color:"#15803d",
            padding:"3px 10px", borderRadius:20, fontWeight:600,
            fontSize:12, border:"1px solid #86efac" }}>
            ₹{Number(slab.min_target).toLocaleString("en-IN")} →{" "}
            {slab.payout_type === "fixed"
              ? `₹${Number(slab.payout_value).toLocaleString("en-IN")}`
              : `${slab.payout_value}%`}
          </span>
        ))}
      </div>
    ) : (
      // Fallback — பழைய flat payout
      <div style={{ fontSize:13, color:"#374151", fontWeight:600 }}>
        💰 Payout:{" "}
        {selectedPlan.standalone_payout_type === "percentage"
          ? `${selectedPlan.standalone_payout_value}% of Salary`
          : `₹${Number(selectedPlan.standalone_payout_value).toLocaleString("en-IN")} Fixed`}
      </div>
    )}
  </div>
)}
          </div>
        )}

        <button onClick={handleAssign} disabled={saving} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", background:saving?"#93c5fd":"#1d4ed8", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#fff" strokeWidth={2} />
          {saving ? "Assigning..." : "Assign Plan"}
        </button>
          </>
        )}
      </div>

      {/* Assigned List */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:10 }}>
          <HugeiconsIcon icon={UserMultiple02Icon} size={18} color="#374151" strokeWidth={1.8} />
          <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#1a1a2e" }}>All Assignments</p>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#6b7280" }}>
            <div style={{ width:32, height:32, border:"4px solid #e5e7eb", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            Loading...
          </div>
        ) : assigned.length === 0 ? (
          <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📌</div>
            <p style={{ fontWeight:600 }}>No assignments yet</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Employee","Department","Plan","Type","Period","Assigned On",""].map(h => (
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap", fontSize:13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((a, i) => {
                  const plan = plans.find(p => p._id === (a.plan_id?._id || a.plan_id));
                  const isKpi = plan?.plan_type === "kpi_linked";
                  return (
                    <tr key={a._id} style={{ borderBottom:"1px solid #f3f4f6", background: i%2===0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding:"12px 16px", color:"#9ca3af", fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#2563eb", fontSize:13 }}>
                            {a.employee_id?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p style={{ margin:0, fontWeight:700, color:"#1a1a2e", fontSize:13 }}>{a.employee_id?.name || "—"}</p>
                            <p style={{ margin:0, fontSize:11, color:"#6b7280" }}>{a.employee_id?.designation || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:"#374151" }}>{a.employee_id?.department || "—"}</td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:"#374151" }}>{plan?.name || a.plan_id?.name || "—"}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:5, fontWeight:700, fontSize:12,
                          background: isKpi ? "#ede9fe" : "#fef9c3",
                          color:      isKpi ? "#7c3aed" : "#a16207" }}>
                          {isKpi ? "🔗 KPI" : "📋 Standalone"}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"3px 10px", borderRadius:5, fontWeight:700, fontSize:12 }}>
                          {a.period}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:13 }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <button onClick={() => handleRemove(a._id)} style={{ background:"#fef2f2", border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer" }}>
                          <HugeiconsIcon icon={Delete02Icon} size={14} color="#dc2626" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}