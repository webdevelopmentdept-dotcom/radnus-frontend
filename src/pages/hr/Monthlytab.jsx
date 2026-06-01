import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search, RefreshCw, Download, X,
  Eye, CheckCircle, AlertCircle, Activity,
} from "lucide-react";

// ─── Import shared utilities from HRAttendancePage ───────────────────────────
import {
  API_BASE, authHeader, pad, fmt, fmtD,
  STATUS_META, S, fmtMins,
  StatStrip,
} from "./Hrattendancepage";

// ═══════════════════════════════════════════
//  EMPLOYEE MONTH DETAIL MODAL
// ═══════════════════════════════════════════
function EmployeeMonthModal({ employee, year, month, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const monthName = new Date(year, month - 1).toLocaleString("en-IN", { month: "long" });
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (!employee?._id) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/api/attendance/monthly/${employee._id}?year=${year}&month=${month}`, { headers: authHeader() })
      .then((res) => {
        const raw = res.data?.data || [];
        const daysInMonth = new Date(year, month, 0).getDate();
        const filled = [];
        let presentCount = 0, lateCount = 0, absentCount = 0, otCount = 0, leaveCount = 0, halfCount = 0;

        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr   = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayOfWeek = new Date(`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}T12:00:00`).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const rec       = raw.find((r) => r.date === dateStr);

          if (isWeekend) { filled.push({ date: dateStr, dayOfWeek, status: "weekend", isWeekend: true }); continue; }

          if (rec) {
            let firstIn = rec.first_in || rec.checkIn || null;
            let lastOut = rec.last_out || rec.checkOut || null;
            if (!firstIn && rec.punches?.length) {
              const ins = rec.punches.filter(p => p.type === "in").sort((a, b) => new Date(a.time) - new Date(b.time));
              firstIn = ins[0]?.time || null;
            }
            if (!lastOut && rec.punches?.length) {
              const outs = rec.punches.filter(p => p.type === "out").sort((a, b) => new Date(b.time) - new Date(a.time));
              lastOut = outs[0]?.time || null;
            }
            let workHrs = "—";
            if (rec.work_hours && typeof rec.work_hours === "number" && rec.work_hours > 0) {
              const h = Math.floor(rec.work_hours);
              const m = Math.round((rec.work_hours - h) * 60);
              workHrs = `${h}h ${pad(m)}m`;
            } else if (firstIn && lastOut) {
              const diff = (new Date(lastOut) - new Date(firstIn)) / 3600000;
              workHrs = `${Math.floor(diff)}h ${pad(Math.round((diff % 1) * 60))}m`;
            } else if (firstIn && !lastOut) {
              workHrs = "Ongoing";
            }
            if (rec.status === "present" || rec.status === "late") presentCount++;
            if (rec.status === "late" || (rec.late_minutes || 0) > 0) lateCount++;
            else if (rec.status === "leave")    leaveCount++;
            else if (rec.status === "half_day") halfCount++;
            else if (rec.status === "absent")   absentCount++;
            if ((rec.overtime_minutes || 0) > 0) otCount++;
            filled.push({ date: dateStr, dayOfWeek, status: rec.status, firstIn, lastOut, workHrs, lateMin: rec.late_minutes || 0, otMin: rec.overtime_minutes || 0, remark: rec.remark || "" });
          } else {
            absentCount++;
            filled.push({ date: dateStr, dayOfWeek, status: "absent", firstIn: null, lastOut: null, workHrs: "—", lateMin: 0, otMin: 0 });
          }
        }
        setSummary({ presentCount, lateCount, absentCount, otCount, leaveCount, halfCount });
        setRecords(filled);
      })
      .catch(() => { setRecords([]); setSummary(null); })
      .finally(() => setLoading(false));
  }, [employee?._id, year, month]);

  const statusStyle = (status) => {
    const map = {
      present:  { color: "#16a34a", bg: "#dcfce7", label: "Present"  },
      late:     { color: "#d97706", bg: "#fef9c3", label: "Late"     },
      absent:   { color: "#dc2626", bg: "#fee2e2", label: "Absent"   },
      half_day: { color: "#7c3aed", bg: "#f5f3ff", label: "Half Day" },
      leave:    { color: "#0891b2", bg: "#e0f2fe", label: "On Leave" },
      weekend:  { color: "#94a3b8", bg: "#f1f5f9", label: "Weekend"  },
      holiday:  { color: "#be185d", bg: "#fce7f3", label: "Holiday"  },
    };
    return map[status] || map.absent;
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 10000 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 820, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,0.18)", pointerEvents: "all" }}>

          {/* Header */}
          <div style={{ background: "#111827", borderRadius: "16px 16px 0 0", padding: "18px 22px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {(employee?.name || "?").charAt(0)}
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{employee?.name || "—"}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{employee?.employeeId || "—"} · {employee?.department || "—"}</div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 1, fontWeight: 600 }}>📅 {monthName} {year} — Full Month Report</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "#374151", border: "none", width: 30, height: 30, borderRadius: 7, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
            {summary && (
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                {[
                  { label: "Present",  value: summary.presentCount, color: "#4ade80" },
                  { label: "Late",     value: summary.lateCount,    color: "#fbbf24" },
                  { label: "Absent",   value: summary.absentCount,  color: "#f87171" },
                  { label: "Leave",    value: summary.leaveCount,   color: "#38bdf8" },
                  { label: "Half Day", value: summary.halfCount,    color: "#a78bfa" },
                  { label: "OT Days",  value: summary.otCount,      color: "#34d399" },
                ].map(c => (
                  <div key={c.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.value}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>Loading attendance data...</div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>No records found for this month.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>
                      {["Date", "Day", "Status", "Check In", "Check Out", "Work Hrs", "Late", "Overtime"].map(h => (
                        <th key={h} style={S.tableHead}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row, idx) => {
                      const st    = statusStyle(row.status);
                      const isWkd = row.isWeekend;
                      return (
                        <tr key={idx}
                          style={{ background: isWkd ? "#f8fafc" : "transparent", opacity: isWkd ? 0.5 : 1 }}
                          onMouseEnter={e => { if (!isWkd) e.currentTarget.style.background = "#f9fafb"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isWkd ? "#f8fafc" : "transparent"; }}>
                          <td style={{ ...S.tableCell, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                          <td style={{ ...S.tableCell, color: "#6b7280", fontSize: 12 }}>{DAY_NAMES[row.dayOfWeek]}</td>
                          <td style={S.tableCell}><span style={S.pill(st.color, st.bg)}>{st.label}</span></td>
                          <td style={{ ...S.tableCell, fontWeight: 700, color: "#16a34a", fontFamily: "monospace" }}>
                            {row.firstIn ? new Date(row.firstIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ ...S.tableCell, fontWeight: 700, fontFamily: "monospace" }}>
                            {row.lastOut
                              ? <span style={{ color: "#dc2626" }}>{new Date(row.lastOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              : row.firstIn
                                ? <span style={{ color: "#f59e0b", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><AlertCircle size={11} /> No Out</span>
                                : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ ...S.tableCell, color: "#2563eb", fontWeight: 700 }}>{row.workHrs || "—"}</td>
                          <td style={S.tableCell}>
                            {row.lateMin > 0 ? <span style={{ background: "#fef9c3", color: "#d97706", padding: "2px 8px", borderRadius: 10, fontWeight: 700, fontSize: 11 }}>{fmtMins(row.lateMin)}</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={S.tableCell}>
                            {row.otMin > 0 ? <span style={{ background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: 10, fontWeight: 700, fontSize: 11 }}>{fmtMins(row.otMin)}</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 22px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", background: "#fafafa", borderRadius: "0 0 16px 16px", flexShrink: 0 }}>
            <button onClick={onClose} style={{ ...S.actionBtn(true), padding: "9px 24px", borderRadius: 8, fontSize: 13 }}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  MONTHLY TAB  (default export)
// ═══════════════════════════════════════════
export default function MonthlyTab() {
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(new Date().getMonth() + 1);
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState("name");
  const [sortDir,    setSortDir]    = useState("asc");
  const [toast,      setToast]      = useState(null);
  const [monthModal, setMonthModal] = useState(null);

  
  useEffect(() => { fetchData(); }, [year, month]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [monthlyRes, approvedRes] = await Promise.all([
        axios.get(`${API_BASE}/api/attendance/monthly-report?year=${year}&month=${month}`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/hr/approved`, { headers: authHeader() }).catch(() => ({ data: [] })),
      ]);
      const monthlyData  = monthlyRes.data?.data || [];
      const approvedList = Array.isArray(approvedRes.data) ? approvedRes.data : (approvedRes.data?.data || []);
      const monthlyIds   = new Set(monthlyData.map(r => r._id || r.employee_id).filter(Boolean));
      const approvedNotInMonthly = approvedList
        .filter(emp => !monthlyIds.has(emp._id))
        .map(emp => ({
          _id: emp._id, name: emp.name, employeeId: emp.employeeId || emp.employee_id || emp.empId || "",
          employee_code: emp.employeeId || emp.employee_id || emp.empId || "",
          department: emp.department || emp.dept || "", designation: emp.designation || emp.role || "",
          work_days: 0, present: 0, late: 0, half_day: 0, on_leave: 0, absent: 0,
          overtime_days: 0, avg_work_hours: "—", avg_work_hours_num: 0,
          total_late_minutes: 0, attendance_pct: 0, _fromApproved: true,
        }));
      setData([...monthlyData, ...approvedNotInMonthly]);
    } catch {
      showToast("error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // ── Export all employees ────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/attendance/export?year=${year}&month=${month}`,
        { headers: authHeader(), responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Attendance_${month}_${year}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("success", "Excel exported!");
    } catch { showToast("error", "Export failed"); }
    finally { setExporting(false); }
  };

  // ── Export single employee ──────────────────────────────────────────────────
  const handleEmployeeExport = async (employeeId, employeeName) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/attendance/export?year=${year}&month=${month}&employee_id=${employeeId}`,
        { headers: authHeader(), responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${employeeName}_Attendance_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("success", `${employeeName} — downloaded!`);
    } catch {
      showToast("error", "Download failed");
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = data
    .filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || (r.employeeId || r.employee_code || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const totalPresent  = data.reduce((s, r) => s + (r.present       || 0), 0);
  const totalAbsent   = data.reduce((s, r) => s + (r.absent        || 0), 0);
  const totalLate     = data.reduce((s, r) => s + (r.late          || 0), 0);
  const totalOT       = data.reduce((s, r) => s + (r.overtime_days || 0), 0);
  const avgAttendance = data.length ? Math.round(data.reduce((s, r) => s + (r.attendance_pct || 0), 0) / data.length) : 0;

  const monthlyStats = [
    { label: "Employees",      value: data.length,         color: "#111827" },
    { label: "Total Present",  value: totalPresent,        color: "#16a34a" },
    { label: "Total Absent",   value: totalAbsent,         color: "#dc2626" },
    { label: "Total Late",     value: totalLate,           color: "#d97706" },
    { label: "OT Days",        value: totalOT,             color: "#047857" },
    { label: "Avg Attendance", value: `${avgAttendance}%`, color: "#2563eb" },
  ];

  const SortTh = ({ label, k }) => (
    <th onClick={() => toggleSort(k)} style={{ ...S.tableHead, cursor: "pointer", userSelect: "none", color: sortKey === k ? "#111827" : "#9ca3af" }}>
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 7 }}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle size={14} />}{toast.msg}
        </div>
      )}

      {monthModal && (
        <EmployeeMonthModal employee={monthModal.employee} year={year} month={month} onClose={() => setMonthModal(null)} />
      )}

      {/* Stat Strip */}
      <StatStrip stats={monthlyStats} activeFlag={null} onFlagClick={() => {}} />

      {/* Filters */}
      <div style={S.filterWrap}>
        <div style={S.filterInput}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>Month</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...S.input, fontWeight: 600 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("en-IN", { month: "long" })}</option>
            ))}
          </select>
        </div>
        <div style={S.filterInput}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>Year</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...S.input, fontWeight: 600 }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ ...S.filterInput, flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} style={S.input} />
        </div>
        <button onClick={fetchData} style={{ ...S.actionBtn(true), padding: "7px 14px", borderRadius: 8, fontSize: 13 }}>
          <RefreshCw size={12} />Refresh
        </button>
        <button onClick={handleExport} disabled={exporting} style={{ ...S.actionBtn(true), padding: "7px 14px", borderRadius: 8, fontSize: 13, background: "#16a34a", marginLeft: "auto" }}>
          <Download size={12} />{exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long" })} {year} — Summary
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}><div className="spinner-border text-dark" role="status" /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={S.tableHead}>#</th>
                  <SortTh label="Employee"    k="name" />
                  {/* ✅ FIX: Code column header — shows employee code text only */}
                  <SortTh label="Code"        k="employeeId" />
                  {/* ✅ FIX: Dept column header — shows department badge */}
                  <SortTh label="Dept"        k="department" />
                  <SortTh label="Work Days"   k="work_days" />
                  <SortTh label="Present"     k="present" />
                  <SortTh label="Late"        k="late" />
                  <SortTh label="Half Day"    k="half_day" />
                  <SortTh label="On Leave"    k="on_leave" />
                  <SortTh label="Absent"      k="absent" />
                  <SortTh label="OT Days"     k="overtime_days" />
                  <SortTh label="Avg Hrs"     k="avg_work_hours_num" />
                  <SortTh label="Attendance%" k="attendance_pct" />
                  <th style={S.tableHead}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                      <Activity size={32} color="#e5e7eb" />
                      <span style={{ fontSize: 13 }}>No data for this period</span>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const pct    = r.attendance_pct || 0;
                  const pctClr = pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
                  const pctBg  = pct >= 90 ? "#dcfce7" : pct >= 75 ? "#fef9c3" : "#fee2e2";
                  const isEven = i % 2 === 0;
                  return (
                    <tr key={i}
                      style={{ background: isEven ? "#fafafa" : "#fff", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                      onMouseLeave={e => e.currentTarget.style.background = isEven ? "#fafafa" : "#fff"}>

                      {/* # */}
                      <td style={{ ...S.tableCell, color: "#c4c9d4", fontWeight: 600, width: 36, textAlign: "center" }}>{i + 1}</td>

                      {/* Employee — name + avatar only, no code sub-text to avoid duplication */}
                      <td style={S.tableCell}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0, letterSpacing: 0.5 }}>
                            {(r.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, lineHeight: 1.3 }}>{r.name}</div>
                        </div>
                      </td>

                      {/* ✅ FIX: Code column — employee code as plain text (EMP-021 style) */}
                      <td style={{ ...S.tableCell, color: "#6b7280", fontWeight: 600, fontSize: 12, fontFamily: "monospace" }}>
                        {r.employeeId || r.employee_code || "—"}
                      </td>

                      {/* ✅ FIX: Dept column — department badge (was wrongly in Code column before) */}
                      <td style={S.tableCell}>
                        {r.department
                          ? <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap", border: "1px solid #e2e8f0" }}>{r.department}</span>
                          : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>

                      {/* Work Days */}
                      <td style={{ ...S.tableCell, fontWeight: 700, color: "#374151", textAlign: "center" }}>{r.work_days}</td>

                      {/* Present */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        <span style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{r.present}</span>
                      </td>

                      {/* Late */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        {r.late > 0 ? (
                          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ background: "#fef9c3", color: "#d97706", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, border: "1px solid #fde68a" }}>{r.late}</span>
                            {r.total_late_minutes > 0 && <span style={{ fontSize: 10, color: "#b45309", fontWeight: 600 }}>{fmtMins(r.total_late_minutes)}</span>}
                          </div>
                        ) : <span style={{ color: "#d1d5db", fontSize: 18 }}>·</span>}
                      </td>

                      {/* Half Day */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        {r.half_day > 0
                          ? <span style={{ background: "#f5f3ff", color: "#7c3aed", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{r.half_day}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 18 }}>·</span>}
                      </td>

                      {/* On Leave */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        {r.on_leave > 0
                          ? <span style={{ background: "#e0f2fe", color: "#0891b2", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{r.on_leave}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 18 }}>·</span>}
                      </td>

                      {/* Absent */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        {r.absent > 0
                          ? <span style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{r.absent}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 18 }}>·</span>}
                      </td>

                      {/* OT Days */}
                      <td style={{ ...S.tableCell, textAlign: "center" }}>
                        {r.overtime_days > 0
                          ? <span style={{ background: "#ecfdf5", color: "#047857", fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{r.overtime_days}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 18 }}>·</span>}
                      </td>

                      {/* Avg Hrs */}
                      <td style={{ ...S.tableCell, color: "#2563eb", fontWeight: 700, textAlign: "center" }}>{r.avg_work_hours || "—"}</td>

                      {/* Attendance % */}
                      <td style={{ ...S.tableCell, minWidth: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pctClr, borderRadius: 3, transition: "width 0.4s ease" }} />
                          </div>
                          <span style={{ ...S.pill(pctClr, pctBg), minWidth: 44, justifyContent: "center" }}>{pct}%</span>
                        </div>
                      </td>

                      {/* Details — View + Download */}
                      <td style={{ ...S.tableCell, textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                          <button
                            onClick={() => setMonthModal({ employee: { _id: r._id, name: r.name, employeeId: r.employeeId || r.employee_code || "", department: r.department || "" } })}
                            style={S.actionBtn(false)}>
                            <Eye size={11} /> View
                          </button>
                          <button
                            onClick={() => handleEmployeeExport(r._id, r.name)}
                            title={`Download ${r.name}'s attendance`}
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 7, cursor: "pointer",
                              border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a",
                              flexShrink: 0,
                            }}>
                            <Download size={13} />
                          </button>
                        </div>
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