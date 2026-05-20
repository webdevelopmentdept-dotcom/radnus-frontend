import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search, Filter, RefreshCw, Edit3, Save,
  Download, CalendarCheck, AlertTriangle, Clock,
  Users, X, Eye, ChevronRight, CheckCircle,
  AlertCircle, Timer, TrendingUp, Calendar,
  ArrowRightFromLine, Zap, Flag, Activity,
  CircleDot, MinusCircle, LogIn, LogOut,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken   = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const pad   = (n) => String(n).padStart(2, "0");
const fmt   = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];

const SHIFT_END_HOUR   = 19;
const SHIFT_END_MINUTE = 0;
const SHIFT_END_TOTAL  = SHIFT_END_HOUR * 60 + SHIFT_END_MINUTE;

const STATUS_META = {
  present:  { label: "Present",  color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  absent:   { label: "Absent",   color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
  late:     { label: "Late",     color: "#d97706", bg: "#fef9c3", border: "#fde68a" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff" },
  leave:    { label: "On Leave", color: "#0891b2", bg: "#e0f2fe", border: "#bae6fd" },
  holiday:  { label: "Holiday",  color: "#be185d", bg: "#fce7f3", border: "#f9a8d4" },
  weekend:  { label: "Weekend",  color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" },
};

// ─── Punch helpers ────────────────────────────────────────────────────────────
const getFirstIn = (r) => {
  if (r.punches?.length) {
    const first = r.punches.find(p => p.type === "in");
    return first?.time || null;
  }
  return r.checkIn || r.first_in || null;
};

const getLastOut = (r) => {
  if (r.punches?.length) {
    const sorted = [...r.punches].sort((a, b) => new Date(a.time) - new Date(b.time));
    const unique = sorted.filter((p, idx, arr) =>
      idx === 0 || new Date(p.time).getTime() !== new Date(arr[idx - 1].time).getTime()
    );
    const outs = unique.filter(p => p.type === "out");
    if (outs.length) return outs[outs.length - 1].time;
    return null;
  }
  return r.checkOut || r.last_out || null;
};

const hasMissingOut = (r, dateStr) => {
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);
  if (!firstIn) return false;
  if (lastOut)  return false;
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return new Date().getHours() >= 20;
  return true;
};

// ─── Time calculations ────────────────────────────────────────────────────────
const calcLateMinutes = (checkIn) => {
  if (!checkIn) return 0;
  const d = new Date(checkIn);
  const total = d.getHours() * 60 + d.getMinutes();
  
  // Only present window can have late minutes
  // 10:00 AM - 11:30 AM la vandha late illa
  // 11:30 ku mela = half day, late flag vendam
  return 0; // Half day ah irundha late show pannakoodathu
};

const calcEarlyOut = (checkOut) => {
  if (!checkOut) return 0;
  const d = new Date(checkOut);
  const total = d.getHours() * 60 + d.getMinutes();
  return Math.max(SHIFT_END_TOTAL - total, 0);
};

const calcOvertime = (checkOut) => {
  if (!checkOut) return 0;
  const d = new Date(checkOut);
  const total = d.getHours() * 60 + d.getMinutes();
  return Math.max(total - SHIFT_END_TOTAL, 0);
};

const fmtMins = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

const workHrsFromPunches = (r) => {
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);
  if (!firstIn) return "—";
  if (!lastOut) return (
    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}>
      <AlertCircle size={11} /> No Out
    </span>
  );
  if (r.work_hours && typeof r.work_hours === "string") return r.work_hours;
  if (r.work_hours && typeof r.work_hours === "number") {
    const h = Math.floor(r.work_hours);
    const m = Math.round((r.work_hours - h) * 60);
    return `${h}h ${pad(m)}m`;
  }
  const d = (new Date(lastOut) - new Date(firstIn)) / 3600000;
  return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
};

// ═══════════════════════════════════════════
//  PUNCH TIMELINE
// ═══════════════════════════════════════════
function PunchTimeline({ punches }) {
  if (!punches?.length) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af", fontSize: 13 }}>
        No punch records found
      </div>
    );
  }
  return (
    <div style={{ position: "relative", paddingLeft: 28 }}>
      <div style={{ position: "absolute", left: 10, top: 8, bottom: 8, width: 2, background: "#e5e7eb", borderRadius: 2 }} />
      {punches.map((p, idx) => {
        const isIn  = p.type === "in";
        const color = isIn ? "#16a34a" : "#dc2626";
        const bg    = isIn ? "#dcfce7" : "#fee2e2";
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: idx < punches.length - 1 ? 12 : 0 }}>
            <div style={{ position: "absolute", left: 5, width: 12, height: 12, borderRadius: "50%", background: color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${color}33` }} />
            <div style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 10, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isIn
                  ? <LogIn size={12} color={color} />
                  : <LogOut size={12} color={color} />}
                <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: "uppercase" }}>
                  {isIn ? "Punch In" : "Punch Out"}
                </span>
                {p.method && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>· {p.method}</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#111827", fontFamily: "monospace" }}>{fmt(p.time)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
//  EMPLOYEE DETAIL DRAWER
// ═══════════════════════════════════════════
function EmployeeDrawer({ record, date, onClose, onEdit }) {
  const [monthSummary, setMonthSummary] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const emp      = record?.employee;
  const meta     = STATUS_META[record?.status] || STATUS_META.absent;
  const firstIn  = getFirstIn(record);
  const lastOut  = getLastOut(record);
  const punches  = record?.punches || (
    [
      record?.checkIn  ? { type: "in",  time: record.checkIn,  method: record.method || "Manual" } : null,
      record?.checkOut ? { type: "out", time: record.checkOut, method: record.method || "Manual" } : null,
    ].filter(Boolean)
  );

  const lateMinutes  = calcLateMinutes(firstIn);
  const earlyOutMins = firstIn && !lastOut ? 0 : calcEarlyOut(lastOut);
  const overtimeMins = calcOvertime(lastOut);
  const missingPunch = hasMissingOut(record, date);

  const workHrs = () => {
    if (!firstIn) return "—";
    if (!lastOut) return "Ongoing";
    if (record.work_hours) return record.work_hours;
    const d = (new Date(lastOut) - new Date(firstIn)) / 3600000;
    return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
  };

  useEffect(() => {
    if (!emp?._id) return;
    const d = new Date(date);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    setLoadingMonth(true);
    axios.get(`${API_BASE}/api/attendance/monthly-report?year=${year}&month=${month}`, { headers: authHeader() })
      .then(res => {
        const allData = res.data?.data || [];
        const found = allData.find(r =>
          r._id === emp._id ||
          r.employee_id === emp._id ||
          r.employeeId === (emp.employeeId || emp.employee_code)
        );
        setMonthSummary(found || null);
      })
      .catch(() => setMonthSummary(null))
      .finally(() => setLoadingMonth(false));
  }, [emp?._id, date]);

  const monthName = new Date(date).toLocaleString("en-IN", { month: "long" });

  const Row = ({ label, value, valueColor }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || "#111827" }}>{value}</span>
    </div>
  );

  const StatBox = ({ label, value, color, bg }) => (
    <div style={{ background: bg || "#f8fafc", borderRadius: 10, padding: "12px 10px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: color || "#111827" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: color || "#6b7280", opacity: 0.85, marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9998 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 95vw)", background: "#fff", zIndex: 9999, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", borderRadius: "16px 0 0 16px", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#111827", padding: "20px 20px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {(emp?.name || "?").charAt(0)}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{emp?.name || "—"}</div>
                <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                  {emp?.employeeId || emp?.employee_code || "—"} · {emp?.department || "—"}
                </div>
                <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{emp?.designation || ""}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#374151", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ background: meta.bg, color: meta.color, padding: "4px 12px", borderRadius: 20, fontWeight: 800, fontSize: 12 }}>{meta.label}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>{fmtD(date)}</span>
            {record?.shift && <span style={{ color: "#6b7280", fontSize: 11, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {record.shift}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Time Summary */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <Timer size={12} /> Time Summary
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "4px 14px" }}>
              <Row label="First In"     value={fmt(firstIn) || "—"} valueColor="#16a34a" />
              <Row label="Last Out"     value={lastOut ? fmt(lastOut) : missingPunch ? "Pending" : "—"} valueColor={lastOut ? "#dc2626" : "#f59e0b"} />
              <Row label="Work Hours"   value={workHrs()} valueColor="#2563eb" />
              {punches.length > 0 && <Row label="Total Punches" value={`${punches.length} punches`} valueColor="#6b7280" />}
              {record?.remark && <div style={{ padding: "9px 0", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Remark: {record.remark}</div>}
            </div>
          </div>

          {/* Punch History */}
          {punches.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <Activity size={12} /> Punch History ({punches.length})
              </div>
              <PunchTimeline punches={punches} />
            </div>
          )}

          {/* Flags */}
          {(lateMinutes > 0 || earlyOutMins > 0 || overtimeMins > 0 || missingPunch) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <Flag size={12} /> Flags
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lateMinutes > 0 && (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Late Arrival</span>
                    <span style={{ fontSize: 13, color: "#d97706", fontWeight: 800 }}>{fmtMins(lateMinutes)}</span>
                  </div>
                )}
                {earlyOutMins > 0 && (
                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6b21a8", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><ArrowRightFromLine size={13} /> Early Out</span>
                    <span style={{ fontSize: 13, color: "#9333ea", fontWeight: 800 }}>{fmtMins(earlyOutMins)}</span>
                  </div>
                )}
                {overtimeMins > 0 && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Zap size={13} /> Overtime</span>
                    <span style={{ fontSize: 13, color: "#047857", fontWeight: 800 }}>{fmtMins(overtimeMins)}</span>
                  </div>
                )}
                {missingPunch && (
                  <div style={{ background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#9f1239", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={13} /> Missing Punch Out</span>
                    <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 800 }}>No Out</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={12} /> {monthName} Summary
            </div>
            {loadingMonth ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>Loading...</div>
            ) : monthSummary ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <StatBox label="Present"  value={monthSummary.present}  color="#16a34a" bg="#dcfce7" />
                  <StatBox label="Absent"   value={monthSummary.absent}   color="#dc2626" bg="#fee2e2" />
                  <StatBox label="Late"     value={monthSummary.late}     color="#d97706" bg="#fef9c3" />
                  <StatBox label="On Leave" value={monthSummary.on_leave} color="#0891b2" bg="#e0f2fe" />
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Attendance Rate</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626" }}>
                      {monthSummary.attendance_pct || 0}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                    <div style={{ width: `${monthSummary.attendance_pct || 0}%`, height: "100%", borderRadius: 3, background: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626", transition: "width 0.5s ease" }} />
                  </div>
                  {monthSummary.avg_work_hours && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                      Avg work hours: <strong style={{ color: "#2563eb" }}>{monthSummary.avg_work_hours}</strong>
                    </div>
                  )}
                  {monthSummary.total_late_minutes > 0 && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      Total late time: <strong style={{ color: "#d97706" }}>{fmtMins(monthSummary.total_late_minutes)}</strong>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af", fontSize: 13 }}>No monthly data available</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Close</button>
          <button onClick={() => { onClose(); onEdit(); }} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "#111827", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Edit3 size={14} />{firstIn ? "Edit Attendance" : "Mark Attendance"}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  SHIFT SELECTOR
// ═══════════════════════════════════════════
const DEFAULT_SHIFTS = [
  { _id: "s1", name: "General", startTime: "10:00", endTime: "19:00" },
  { _id: "s2", name: "Shift B", startTime: "09:30", endTime: "18:30" },
  { _id: "s3", name: "Shift C", startTime: "12:30", endTime: "20:30" },
];

function ShiftSelector({ value, onChange }) {
  const [shifts,     setShifts]     = useState(DEFAULT_SHIFTS);
  const [loading,    setLoading]    = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [customForm, setCustomForm] = useState({ name: "", startTime: "10:00", endTime: "19:00" });

  useEffect(() => { loadShifts(); }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/shifts`, { headers: authHeader() });
      const data = res.data?.data || res.data || [];
      if (data.length > 0) setShifts(data);
    } catch { } finally { setLoading(false); }
  };

  const shiftLabel = (s) => `${s.name} (${s.startTime} – ${s.endTime})`;

  const openEdit = (s, e) => {
    e.stopPropagation();
    setEditId(s._id);
    setCustomForm({ name: s.name, startTime: s.startTime, endTime: s.endTime });
    setShowCustom(true);
  };

  const openNew = () => {
    setEditId(null);
    setCustomForm({ name: "", startTime: "10:00", endTime: "19:00" });
    setShowCustom(true);
  };

  const saveShift = async () => {
    if (!customForm.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const res = await axios.put(`${API_BASE}/api/shifts/${editId}`, customForm, { headers: authHeader() });
        const updated = res.data?.data || res.data;
        setShifts(prev => prev.map(s => s._id === editId ? updated : s));
        onChange(shiftLabel(updated));
      } else {
        const res = await axios.post(`${API_BASE}/api/shifts`, customForm, { headers: authHeader() });
        const created = res.data?.data || res.data;
        setShifts(prev => [...prev, created]);
        onChange(shiftLabel(created));
      }
      setShowCustom(false);
      setEditId(null);
    } catch { alert("Failed to save shift"); }
    finally { setSaving(false); }
  };

  const deleteShift = async (s, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${s.name}" shift?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/shifts/${s._id}`, { headers: authHeader() });
      setShifts(prev => prev.filter(x => x._id !== s._id));
      if (value === shiftLabel(s)) onChange("");
    } catch { alert("Delete failed"); }
  };

  const inp2 = { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#f9fafb", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Shift</label>
        <button onClick={openNew} style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ Add New Shift</button>
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>Loading shifts...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: showCustom ? 10 : 0 }}>
          {shifts.map(s => {
            const label    = shiftLabel(s);
            const selected = value === label;
            return (
              <div key={s._id} onClick={() => onChange(label)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, cursor: "pointer", border: `2px solid ${selected ? "#111827" : "#e5e7eb"}`, background: selected ? "#111827" : "#f9fafb", transition: "all 0.15s" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected ? "#fff" : "#111827" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: selected ? "#9ca3af" : "#6b7280", marginTop: 1 }}>{s.startTime} – {s.endTime}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={(e) => openEdit(s, e)} style={{ background: selected ? "#374151" : "#e5e7eb", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: selected ? "#d1d5db" : "#374151", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                  <button onClick={(e) => deleteShift(s, e)} style={{ background: selected ? "#7f1d1d" : "#fee2e2", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: selected ? "#fca5a5" : "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>
                    <X size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showCustom && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#374151", marginBottom: 8 }}>{editId ? "Edit Shift" : "New Shift"}</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 3 }}>Shift Name</label>
            <input placeholder="e.g. Split Shift, Flexible..." value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))} style={inp2} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 3 }}>Start Time</label>
              <input type="time" value={customForm.startTime} onChange={e => setCustomForm(f => ({ ...f, startTime: e.target.value }))} style={inp2} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 3 }}>End Time</label>
              <input type="time" value={customForm.endTime} onChange={e => setCustomForm(f => ({ ...f, endTime: e.target.value }))} style={inp2} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowCustom(false); setEditId(null); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveShift} disabled={saving || !customForm.name.trim()} style={{ flex: 2, padding: "7px 0", borderRadius: 8, background: "#111827", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: !customForm.name.trim() ? 0.5 : 1 }}>
              {saving ? "Saving..." : editId ? "Update Shift" : "Save & Select"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  HR MARK MODAL
// ═══════════════════════════════════════════
function HRMarkModal({ employee, date, existing, onSave, onClose }) {
  const existingFirstIn = existing ? getFirstIn(existing) : null;
  const existingLastOut = existing ? getLastOut(existing) : null;

  const [form, setForm] = useState({
    status:   existing?.status || "present",
    checkIn:  existingFirstIn ? new Date(existingFirstIn).toTimeString().slice(0, 5) : "10:00",
    checkOut: existingLastOut ? new Date(existingLastOut).toTimeString().slice(0, 5) : "",
    shift:    existing?.shift  || "",
    remark:   existing?.remark || "",
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/attendance/hr-mark`, {
        employee_id: employee._id,
        date,
        status:   form.status,
        checkIn:  form.checkIn  ? `${date}T${form.checkIn}:00`  : null,
        checkOut: form.checkOut ? `${date}T${form.checkOut}:00` : null,
        shift:    form.shift,
        remark:   form.remark,
      }, { headers: authHeader() });
      onSave("success", `${employee.name} — attendance marked!`);
    } catch (err) {
      onSave("error", err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f9fafb" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 800 }}>Mark Attendance</h5>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {employee.name} · {employee.employeeId || employee.employee_code} · {fmtD(date)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={16} />
          </button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Status</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {Object.entries(STATUS_META).filter(([k]) => !["weekend", "holiday"].includes(k)).map(([k, m]) => (
            <button key={k} onClick={() => setForm(f => {
              const noTime = ["absent", "leave", "holiday", "weekend"].includes(k);
              return { ...f, status: k, checkIn: noTime ? "" : (f.checkIn || "10:00"), checkOut: noTime ? "" : (f.checkOut || "19:00") };
            })} style={{ padding: "5px 13px", borderRadius: 20, border: `2px solid ${form.status === k ? m.color : "#e5e7eb"}`, background: form.status === k ? m.bg : "#fff", color: form.status === k ? m.color : "#6b7280", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[["checkIn", "Check In (First)"], ["checkOut", "Check Out (Last)"]].map(([key, label]) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
              <input type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
            </div>
          ))}
        </div>

        <ShiftSelector value={form.shift} onChange={(val) => setForm(f => ({ ...f, shift: val }))} />

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>HR Remark</label>
          <textarea rows={2} placeholder="Optional..." value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "#111827", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Save size={14} />{saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  DAILY TAB
// ═══════════════════════════════════════════
function DailyTab() {
  const [date,         setDate]         = useState(todayStr());
  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter,   setDeptFilter]   = useState("all");
  const [flagFilter,   setFlagFilter]   = useState("all");
  const [markModal,    setMarkModal]    = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [toast,        setToast]        = useState(null);

  useEffect(() => { fetchData(); }, [date]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, approvedRes] = await Promise.all([
        axios.get(`${API_BASE}/api/attendance/daily?date=${date}`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/hr/approved`, { headers: authHeader() }).catch(() => ({ data: [] })),
      ]);

      const attendanceData = attendanceRes.data?.data || [];
      const approvedList   = Array.isArray(approvedRes.data) ? approvedRes.data : (approvedRes.data?.data || []);
      const attendanceIds  = new Set(attendanceData.map(r => r.employee?._id).filter(Boolean));

      const approvedNotInAttendance = approvedList
        .filter(emp => !attendanceIds.has(emp._id))
        .map(emp => ({
          employee: {
            _id:         emp._id,
            name:        emp.name,
            employeeId:  emp.employeeId || emp.employee_id || emp.empId || "",
            department:  emp.department || emp.dept || "",
            designation: emp.designation || emp.role || "",
          },
          status:        "absent",
          punches:       [],
          checkIn:       null,
          checkOut:      null,
          date,
          _fromApproved: true,
        }));

      setData([...attendanceData, ...approvedNotInAttendance]);
    } catch {
      showToast("error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const departments = ["all", ...new Set(data.map(r => r.employee?.department).filter(Boolean))];

  const enriched = data.map(r => ({
    ...r,
    _firstIn:     getFirstIn(r),
    _lastOut:     getLastOut(r),
    lateMinutes:  calcLateMinutes(getFirstIn(r)),
    earlyOutMins: getFirstIn(r) && !getLastOut(r) ? 0 : calcEarlyOut(getLastOut(r)),
    overtimeMins: calcOvertime(getLastOut(r)),
    missingPunch: hasMissingOut(r, date),
  }));

  const filtered = enriched.filter(r => {
    const matchS    = !search || (r.employee?.name || "").toLowerCase().includes(search.toLowerCase()) || (r.employee?.employeeId || r.employee?.employee_code || "").toLowerCase().includes(search.toLowerCase());
    const matchF    = statusFilter === "all" || r.status === statusFilter;
    const matchD    = deptFilter   === "all" || r.employee?.department === deptFilter;
    const matchFlag =
      flagFilter === "all"           ? true :
      flagFilter === "late"          ? r.lateMinutes > 0 :
      flagFilter === "early_out"     ? r.earlyOutMins > 0 :
      flagFilter === "overtime"      ? r.overtimeMins > 0 :
      flagFilter === "missing_punch" ? r.missingPunch : true;
    return matchS && matchF && matchD && matchFlag;
  });

  const s = {
    total:        data.length,
    present:      data.filter(r => r.status === "present").length,
    late:         data.filter(r => r.status === "late").length,
    absent:       data.filter(r => r.status === "absent").length,
    leave:        data.filter(r => r.status === "leave").length,
    halfDay:      data.filter(r => r.status === "half_day").length,
    missingPunch: enriched.filter(r => r.missingPunch).length,
    overtime:     enriched.filter(r => r.overtimeMins > 0).length,
    earlyOut:     enriched.filter(r => r.earlyOutMins > 0).length,
  };

  const SUMMARY = [
    { label: "Total",         value: s.total,        color: "#111827", bg: "#f1f5f9", border: "#e2e8f0", flag: "all",          icon: <Users size={13} /> },
    { label: "Present",       value: s.present,      color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", flag: "all",          icon: <CheckCircle size={13} /> },
    { label: "Late",          value: s.late,         color: "#d97706", bg: "#fef9c3", border: "#fde68a", flag: "late",         icon: <Clock size={13} /> },
    { label: "Absent",        value: s.absent,       color: "#dc2626", bg: "#fee2e2", border: "#fecaca", flag: "all",          icon: <MinusCircle size={13} /> },
    { label: "On Leave",      value: s.leave,        color: "#0891b2", bg: "#e0f2fe", border: "#bae6fd", flag: "all",          icon: <Calendar size={13} /> },
    { label: "Half Day",      value: s.halfDay,      color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff", flag: "all",          icon: <CircleDot size={13} /> },
    { label: "Missing Punch", value: s.missingPunch, color: "#b91c1c", bg: "#fff1f2", border: "#fda4af", flag: "missing_punch", icon: <AlertCircle size={13} /> },
    { label: "Overtime",      value: s.overtime,     color: "#047857", bg: "#ecfdf5", border: "#6ee7b7", flag: "overtime",     icon: <Zap size={13} /> },
    { label: "Early Out",     value: s.earlyOut,     color: "#9333ea", bg: "#faf5ff", border: "#d8b4fe", flag: "early_out",    icon: <ArrowRightFromLine size={13} /> },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 10001, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {drawerRecord && (
        <EmployeeDrawer
          record={drawerRecord}
          date={date}
          onClose={() => setDrawerRecord(null)}
          onEdit={() => setMarkModal({ employee: drawerRecord.employee, existing: drawerRecord._firstIn ? drawerRecord : null })}
        />
      )}

      {markModal && (
        <HRMarkModal
          employee={markModal.employee}
          date={date}
          existing={markModal.existing}
          onSave={(type, msg) => { setMarkModal(null); showToast(type, msg); fetchData(); }}
          onClose={() => setMarkModal(null)}
        />
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px,1fr))", gap: 10, marginBottom: 20 }}>
        {SUMMARY.map(c => (
          <div key={c.label}
            onClick={() => setFlagFilter(prev => prev === c.flag && c.flag !== "all" ? "all" : c.flag)}
            style={{ background: c.bg, border: `1.5px solid ${(flagFilter === c.flag && c.flag !== "all") ? c.color : c.border}`, borderRadius: 12, padding: "13px 14px", textAlign: "center", cursor: c.flag !== "all" ? "pointer" : "default", transition: "all 0.15s", boxShadow: (flagFilter === c.flag && c.flag !== "all") ? `0 0 0 2px ${c.color}33` : "none" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: c.color, opacity: 0.7 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: c.color, opacity: 0.8, marginTop: 4, lineHeight: 1.2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #e5e7eb", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <CalendarCheck size={13} color="#111827" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit", color: "#111827" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px", flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <Filter size={13} color="#9ca3af" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <Users size={13} color="#9ca3af" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }}>
            {departments.map(d => <option key={d} value={d}>{d === "all" ? "All Depts" : d}</option>)}
          </select>
        </div>
        <button onClick={fetchData} style={{ background: "#111827", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit" }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Flag filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { id: "all",           label: "All",            icon: <Users size={11} /> },
          { id: "late",          label: "Late Arrivals",  icon: <Clock size={11} /> },
          { id: "early_out",     label: "Early Out",      icon: <ArrowRightFromLine size={11} /> },
          { id: "overtime",      label: "Overtime",       icon: <Zap size={11} /> },
          { id: "missing_punch", label: "Missing Punch",  icon: <AlertCircle size={11} /> },
        ].map(f => (
          <button key={f.id} onClick={() => setFlagFilter(f.id)} style={{ padding: "5px 13px", borderRadius: 20, border: `1.5px solid ${flagFilter === f.id ? "#111827" : "#e5e7eb"}`, background: flagFilter === f.id ? "#111827" : "#fff", color: flagFilter === f.id ? "#fff" : "#6b7280", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {f.icon}{f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}><div className="spinner-border text-dark" role="status" /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Employee", "Dept", "Status", "First In", "Last Out", "Work Hrs", "Punches", "Flags", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: "44px 0", color: "#d1d5db" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Activity size={36} color="#e5e7eb" />
                      No records found
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const meta       = STATUS_META[r.status] || STATUS_META.absent;
                  const hrs        = workHrsFromPunches(r);
                  const punchCount = r.punches?.length || (r.checkIn ? (r.checkOut ? 2 : 1) : 0);
                  const flags = [];
                  if (r.lateMinutes > 0)  flags.push({ label: `Late ${fmtMins(r.lateMinutes)}`,   color: "#d97706", bg: "#fef9c3" });
                  if (r.earlyOutMins > 0) flags.push({ label: `Early ${fmtMins(r.earlyOutMins)}`, color: "#9333ea", bg: "#faf5ff" });
                  if (r.overtimeMins > 0) flags.push({ label: `OT ${fmtMins(r.overtimeMins)}`,    color: "#047857", bg: "#ecfdf5" });
                  if (r.missingPunch)     flags.push({ label: "No Out",                             color: "#b91c1c", bg: "#fff1f2" });

                  return (
                    <tr key={i}
                      style={{ borderBottom: "1px solid #f1f5f9", background: r.missingPunch ? "#fff9f9" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = r.missingPunch ? "#fff1f2" : "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = r.missingPunch ? "#fff9f9" : "transparent"}>

                      <td style={{ padding: "10px 14px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {(r.employee?.name || "?").charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{r.employee?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.employee?.employeeId || r.employee?.employee_code || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.employee?.department || "—"}</td>

                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 800, fontSize: 11 }}>{meta.label}</span>
                      </td>

                      <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: 700, fontFamily: "monospace" }}>{fmt(r._firstIn)}</td>

                      <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace" }}>
                        {r._lastOut
                          ? <span style={{ color: "#dc2626" }}>{fmt(r._lastOut)}</span>
                          : r._firstIn
                            ? <span style={{ color: "#f59e0b", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><AlertCircle size={11} /> Pending</span>
                            : "—"}
                      </td>

                      <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: 700 }}>{typeof hrs === "string" ? hrs : hrs}</td>

                      <td style={{ padding: "10px 14px" }}>
                        {punchCount > 0 ? (
                          <span style={{ background: punchCount > 2 ? "#eff6ff" : "#f1f5f9", color: punchCount > 2 ? "#2563eb" : "#6b7280", border: `1px solid ${punchCount > 2 ? "#bfdbfe" : "#e2e8f0"}`, padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {punchCount} {punchCount > 2 && <RefreshCw size={10} />}
                          </span>
                        ) : <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>}
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {flags.length === 0
                            ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                            : flags.map((f, fi) => (
                              <span key={fi} style={{ background: f.bg, color: f.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{f.label}</span>
                            ))}
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setDrawerRecord(r)} style={{ background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Eye size={11} />View
                          </button>
                          <button onClick={() => setMarkModal({ employee: r.employee, existing: r._firstIn ? r : null })} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Edit3 size={11} />{r._firstIn ? "Edit" : "Mark"}
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

// ═══════════════════════════════════════════
//  EMPLOYEE MONTH DETAIL MODAL  ← NEW
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
        let presentCount = 0, lateCount = 0, absentCount = 0,
            otCount = 0, leaveCount = 0, halfCount = 0;

        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr  = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayOfWeek = new Date(year, month - 1, d).getDay();
          const isWeekend = dayOfWeek === 0;

          const rec = raw.find((r) => r.date === dateStr);

          if (isWeekend) {
            filled.push({ date: dateStr, dayOfWeek, status: "weekend", isWeekend: true });
            continue;
          }

          if (rec) {
            // Resolve first_in / last_out
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

            // Work hours
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

            if      (rec.status === "present")  presentCount++;
            else if (rec.status === "late")     lateCount++;
            else if (rec.status === "leave")    leaveCount++;
            else if (rec.status === "half_day") halfCount++;
            else if (rec.status === "absent")   absentCount++;
            if ((rec.overtime_minutes || 0) > 0) otCount++;

            filled.push({
              date: dateStr, dayOfWeek, status: rec.status,
              firstIn, lastOut, workHrs,
              lateMin: rec.late_minutes     || 0,
              otMin:   rec.overtime_minutes || 0,
              remark:  rec.remark           || "",
            });
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10000, backdropFilter: "blur(2px)" }}
      />

      {/* Modal container */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.22)", pointerEvents: "all" }}>

          {/* ── Header ── */}
          <div style={{ background: "#111827", borderRadius: "20px 20px 0 0", padding: "20px 24px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
                  {(employee?.name || "?").charAt(0)}
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{employee?.name || "—"}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                    {employee?.employeeId || "—"} · {employee?.department || "—"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2, fontWeight: 700 }}>
                    📅 {monthName} {year} — Full Month Report
                  </div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "#374151", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={17} />
              </button>
            </div>

            {/* Summary chips */}
            {summary && (
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Present",  value: summary.presentCount, color: "#4ade80" },
                  { label: "Late",     value: summary.lateCount,    color: "#fbbf24" },
                  { label: "Absent",   value: summary.absentCount,  color: "#f87171" },
                  { label: "Leave",    value: summary.leaveCount,   color: "#38bdf8" },
                  { label: "Half Day", value: summary.halfCount,    color: "#a78bfa" },
                  { label: "OT Days",  value: summary.otCount,      color: "#34d399" },
                ].map(c => (
                  <div key={c.label} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 13px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: c.color }}>{c.value}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 14 }}>
                Loading attendance data...
              </div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 14 }}>
                No records found for this month.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                      {["Date", "Day", "Status", "Check In", "Check Out", "Work Hrs", "Late", "Overtime"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row, idx) => {
                      const st    = statusStyle(row.status);
                      const isWkd = row.isWeekend;
                      return (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #f1f5f9", background: isWkd ? "#f8fafc" : "transparent", opacity: isWkd ? 0.5 : 1 }}
                          onMouseEnter={e => { if (!isWkd) e.currentTarget.style.background = "#f8fafc"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isWkd ? "#f8fafc" : "transparent"; }}
                        >
                          {/* Date */}
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </td>

                          {/* Day */}
                          <td style={{ padding: "10px 14px", color: "#6b7280", fontWeight: 600, fontSize: 12 }}>
                            {DAY_NAMES[row.dayOfWeek]}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: st.bg, color: st.color, padding: "3px 11px", borderRadius: 20, fontWeight: 800, fontSize: 11, whiteSpace: "nowrap" }}>
                              {st.label}
                            </span>
                          </td>

                          {/* Check In */}
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#16a34a", fontFamily: "monospace", fontSize: 13 }}>
                            {row.firstIn
                              ? new Date(row.firstIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                              : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Check Out */}
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>
                            {row.lastOut
                              ? <span style={{ color: "#dc2626" }}>{new Date(row.lastOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              : row.firstIn
                                ? <span style={{ color: "#f59e0b", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><AlertCircle size={11} /> No Out</span>
                                : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Work Hrs */}
                          <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: 700 }}>
                            {row.workHrs || "—"}
                          </td>

                          {/* Late */}
                          <td style={{ padding: "10px 14px" }}>
                            {row.lateMin > 0
                              ? <span style={{ background: "#fef9c3", color: "#d97706", padding: "2px 9px", borderRadius: 10, fontWeight: 800, fontSize: 11 }}>{fmtMins(row.lateMin)}</span>
                              : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* Overtime */}
                          <td style={{ padding: "10px 14px" }}>
                            {row.otMin > 0
                              ? <span style={{ background: "#ecfdf5", color: "#047857", padding: "2px 9px", borderRadius: 10, fontWeight: 800, fontSize: 11 }}>{fmtMins(row.otMin)}</span>
                              : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", flexShrink: 0, background: "#fafafa", borderRadius: "0 0 20px 20px" }}>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, background: "#111827", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  MONTHLY TAB
// ═══════════════════════════════════════════
function MonthlyTab() {
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(new Date().getMonth() + 1);
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState("name");
  const [sortDir,    setSortDir]    = useState("asc");
  const [toast,      setToast]      = useState(null);
  const [monthModal, setMonthModal] = useState(null); // ← NEW

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
          _id:                emp._id,
          name:               emp.name,
          employeeId:         emp.employeeId || emp.employee_id || emp.empId || "",
          employee_code:      emp.employeeId || emp.employee_id || emp.empId || "",
          department:         emp.department || emp.dept || "",
          designation:        emp.designation || emp.role || "",
          work_days:          0,
          present:            0,
          late:               0,
          half_day:           0,
          on_leave:           0,
          absent:             0,
          overtime_days:      0,
          avg_work_hours:     "—",
          avg_work_hours_num: 0,
          total_late_minutes: 0,
          attendance_pct:     0,
          _fromApproved:      true,
        }));

      setData([...monthlyData, ...approvedNotInMonthly]);
    } catch {
      showToast("error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/export?year=${year}&month=${month}`, { headers: authHeader(), responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Attendance_${month}_${year}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("success", "Excel exported!");
    } catch { showToast("error", "Export failed"); }
    finally { setExporting(false); }
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

  const SortTh = ({ label, k }) => (
    <th onClick={() => toggleSort(k)} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: sortKey === k ? "#111827" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", borderBottom: "2px solid #e5e7eb", cursor: "pointer", userSelect: "none" }}>
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── NEW: Employee Month Modal ── */}
      {monthModal && (
        <EmployeeMonthModal
          employee={monthModal.employee}
          year={year}
          month={month}
          onClose={() => setMonthModal(null)}
        />
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Employees",      value: data.length,         color: "#111827", bg: "#f1f5f9", border: "#e2e8f0", icon: <Users size={14} /> },
          { label: "Total Present",  value: totalPresent,        color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <CheckCircle size={14} /> },
          { label: "Total Absent",   value: totalAbsent,         color: "#dc2626", bg: "#fee2e2", border: "#fecaca", icon: <MinusCircle size={14} /> },
          { label: "Total Late",     value: totalLate,           color: "#d97706", bg: "#fef9c3", border: "#fde68a", icon: <Clock size={14} /> },
          { label: "OT Days",        value: totalOT,             color: "#047857", bg: "#ecfdf5", border: "#6ee7b7", icon: <Zap size={14} /> },
          { label: "Avg Attendance", value: `${avgAttendance}%`, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: <Activity size={14} /> },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: c.color, opacity: 0.7 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.color, opacity: 0.8, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #e5e7eb", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Month:</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("en-IN", { month: "long" })}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Year:</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px", flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%" }} />
        </div>
        <button onClick={fetchData} style={{ background: "#111827", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit" }}>
          <RefreshCw size={13} />Refresh
        </button>
        <button onClick={handleExport} disabled={exporting} style={{ background: "#16a34a", border: "none", borderRadius: 9, padding: "7px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit", marginLeft: "auto" }}>
          <Download size={13} />{exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long" })} {year} — Summary
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}><div className="spinner-border text-dark" role="status" /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e5e7eb" }}>#</th>
                  <SortTh label="Employee"    k="name" />
                  <SortTh label="Code"        k="employeeId" />
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
                  {/* ── NEW column ── */}
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e5e7eb" }}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign: "center", padding: "44px 0", color: "#d1d5db" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Activity size={36} color="#e5e7eb" />
                      No data for this period
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const pct    = r.attendance_pct || 0;
                  const pctClr = pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
                  const pctBg  = pct >= 90 ? "#dcfce7" : pct >= 75 ? "#fef9c3" : "#fee2e2";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 14px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {(r.name || "?").charAt(0)}
                          </div>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{r.employeeId || r.employee_code || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.department}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.work_days}</td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#16a34a", fontWeight: 800 }}>{r.present}</span></td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: "#d97706", fontWeight: 800 }}>{r.late}</span>
                        {r.total_late_minutes > 0 && <div style={{ fontSize: 10, color: "#9ca3af" }}>{fmtMins(r.total_late_minutes)} total</div>}
                      </td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#7c3aed", fontWeight: 800 }}>{r.half_day}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#0891b2", fontWeight: 800 }}>{r.on_leave}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#dc2626", fontWeight: 800 }}>{r.absent}</span></td>
                      <td style={{ padding: "10px 14px" }}>
                        {r.overtime_days > 0
                          ? <span style={{ color: "#047857", fontWeight: 800 }}>{r.overtime_days} <span style={{ fontSize: 10, fontWeight: 500 }}>days</span></span>
                          : <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: 700 }}>{r.avg_work_hours}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 3, minWidth: 50 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pctClr, borderRadius: 3 }} />
                          </div>
                          <span style={{ background: pctBg, color: pctClr, padding: "2px 9px", borderRadius: 20, fontWeight: 800, fontSize: 11, whiteSpace: "nowrap" }}>{pct}%</span>
                        </div>
                      </td>

                      {/* ── NEW: View button ── */}
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={() => setMonthModal({
                            employee: {
                              _id:        r._id,
                              name:       r.name,
                              employeeId: r.employeeId || r.employee_code || "",
                              department: r.department || "",
                            }
                          })}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <Eye size={11} /> View
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

// ═══════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════
export default function HRAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");

  const TABS = [
    { id: "daily",   label: "Daily Attendance", icon: <CalendarCheck size={15} /> },
    { id: "monthly", label: "Monthly Report",   icon: <Activity size={15} /> },
  ];

  return (
    <div style={{ padding: "20px 24px", background: "#f4f6fb", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0, fontSize: 18 }}>Attendance Management</h4>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>View, manage and export employee attendance</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s", background: activeTab === t.id ? "#111827" : "transparent", color: activeTab === t.id ? "#fff" : "#6b7280", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "daily"   && <DailyTab />}
      {activeTab === "monthly" && <MonthlyTab />}
    </div>
  );
}