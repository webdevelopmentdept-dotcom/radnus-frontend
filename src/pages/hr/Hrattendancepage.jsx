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

// ─── MonthlyTab import ────────────────────────────────────────────────────────
import MonthlyTab from "./Monthlytab";

// ═══════════════════════════════════════════
//  SHARED CONSTANTS (exported for MonthlyTab)
// ═══════════════════════════════════════════
export const API_BASE    = import.meta.env.VITE_API_BASE_URL;
export const getToken    = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
export const authHeader  = () => ({ Authorization: `Bearer ${getToken()}` });
export const pad         = (n) => String(n).padStart(2, "0");
export const fmt         = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
export const fmtD        = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const todayStr    = () => new Date().toISOString().split("T")[0];

// export const SHIFT_END_HOUR   = 19;
// export const SHIFT_END_MINUTE = 0;
// export const SHIFT_END_TOTAL  = SHIFT_END_HOUR * 60 + SHIFT_END_MINUTE;

export const STATUS_META = {
  present:  { label: "Present",  color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  absent:   { label: "Absent",   color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
  late:     { label: "Late",     color: "#d97706", bg: "#fef9c3", border: "#fde68a" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff" },
  leave:    { label: "On Leave", color: "#0891b2", bg: "#e0f2fe", border: "#bae6fd" },
  holiday:  { label: "Holiday",  color: "#be185d", bg: "#fce7f3", border: "#f9a8d4" },
  weekend:  { label: "Weekend",  color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" },
};

// ─── Punch helpers (exported) ─────────────────────────────────────────────────
export const getFirstIn = (r) => {
  if (r.punches?.length) {
    const first = r.punches.find(p => p.type === "in");
    return first?.time || null;
  }
  return r.checkIn || r.first_in || null;
};

export const getLastOut = (r) => {
  if (r.punches?.length) {
    const sorted = [...r.punches].sort((a, b) => new Date(a.time) - new Date(b.time));
    const outs = sorted.filter(p => p.type === "out");
    if (!outs.length) return null;
    const lastOutTime = outs[outs.length - 1].time;
    const firstIn = r.punches.find(p => p.type === "in")?.time;
    if (firstIn && new Date(lastOutTime).getTime() === new Date(firstIn).getTime()) return null;
    return lastOutTime;
  }
  return r.checkOut || r.last_out || null;
};

export const hasMissingOut = (r, dateStr) => {
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);
  if (!firstIn) return false;
  if (lastOut)  return false;
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return new Date().getHours() >= 20;
  return true;
};

// ─── Time calculations (exported) ────────────────────────────────────────────
// export const SHIFT_START_TOTAL = 10 * 60;
// export const LUNCH_START_TOTAL = 13 * 60 + 30;
// export const LUNCH_END_TOTAL   = 14 * 60 + 30;

// export const calcLateMinutes = (checkIn) => {
//   if (!checkIn) return 0;
//   const d     = new Date(checkIn);
//   const total = d.getHours() * 60 + d.getMinutes();
//   if (total >= LUNCH_START_TOTAL && total <= LUNCH_END_TOTAL) return 0;
//   return Math.max(total - SHIFT_START_TOTAL, 0);
// };

// export const calcEarlyOut = (checkOut) => {
//   if (!checkOut) return 0;
//   const d = new Date(checkOut);
//   const total = d.getHours() * 60 + d.getMinutes();
//   return Math.max(SHIFT_END_TOTAL - total, 0);
// };

// export const calcOvertime = (checkOut) => {
//   if (!checkOut) return 0;
//   const d = new Date(checkOut);
//   const total = d.getHours() * 60 + d.getMinutes();
//   return Math.max(total - SHIFT_END_TOTAL, 0);
// };

export const LUNCH_START_TOTAL = 13 * 60 + 30;
export const LUNCH_END_TOTAL   = 14 * 60 + 30;

// Parse shift string → start minutes  e.g. "General (10:00 – 19:00)" → 600


const DEFAULT_SHIFT_START = 10 * 60;
const DEFAULT_SHIFT_END   = 19 * 60;

// shift object { start: "10:00", end: "19:00" } → minutes
export const parseShiftMins = (shift) => {
  if (shift?.start && shift?.end) {
    const [sh, sm] = shift.start.split(":").map(Number);
    const [eh, em] = shift.end.split(":").map(Number);
    return { startMins: sh * 60 + sm, endMins: eh * 60 + em };
  }
  return { startMins: DEFAULT_SHIFT_START, endMins: DEFAULT_SHIFT_END };
};

export const calcLateMinutes = (checkIn, shiftStartMins = DEFAULT_SHIFT_START) => {
  if (!checkIn) return 0;
  const total = new Date(checkIn).getHours() * 60 + new Date(checkIn).getMinutes();
  if (total >= LUNCH_START_TOTAL && total <= LUNCH_END_TOTAL) return 0;
  return Math.max(total - shiftStartMins, 0);
};

export const calcEarlyOut = (checkOut, shiftEndMins = DEFAULT_SHIFT_END) => {
  if (!checkOut) return 0;
  const total = new Date(checkOut).getHours() * 60 + new Date(checkOut).getMinutes();
  return Math.max(shiftEndMins - total, 0);
};

export const calcOvertime = (checkOut, shiftEndMins = DEFAULT_SHIFT_END) => {
  if (!checkOut) return 0;
  const total = new Date(checkOut).getHours() * 60 + new Date(checkOut).getMinutes();
  return Math.max(total - shiftEndMins, 0);
};

export const fmtMins = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

export const workHrsFromPunches = (r) => {
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);
  if (!firstIn) return "—";
  if (!lastOut) return (
    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}>
      <AlertCircle size={11} /> No Out
    </span>
  );
  const diffMs = new Date(lastOut) - new Date(firstIn);
  if (diffMs <= 0) return "—";
  const totalMins = Math.round(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${pad(m)}m`;
};

// ─── Shared styles (exported) ─────────────────────────────────────────────────
export const S = {
  card: {
    background: "#fff",
    border: "1px solid #e8eaed",
    borderRadius: 10,
    overflow: "hidden",
  },
  pill: (color, bg) => ({
    display: "inline-flex", alignItems: "center",
    padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    color, background: bg,
  }),
  actionBtn: (primary) => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 11px", borderRadius: 7,
    fontSize: 11, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    border: primary ? "none" : "1px solid #e5e7eb",
    background: primary ? "#111827" : "#f9fafb",
    color: primary ? "#fff" : "#374151",
  }),
  filterWrap: {
    background: "#fff",
    border: "1px solid #e8eaed",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  filterInput: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#f7f8fa",
    border: "1px solid #e8eaed",
    borderRadius: 8,
    padding: "6px 11px",
  },
  input: {
    border: "none", background: "transparent",
    fontSize: 13, outline: "none",
    fontFamily: "inherit", color: "#111827",
  },
  tableHead: {
    padding: "9px 14px", textAlign: "left",
    fontSize: 11, fontWeight: 700,
    color: "#9ca3af", textTransform: "uppercase",
    letterSpacing: "0.5px", whiteSpace: "nowrap",
    borderBottom: "1px solid #e8eaed",
    background: "#fafafa",
  },
  tableCell: {
    padding: "0 14px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 13,
    height: 56,
    verticalAlign: "middle",
  },
};

// ═══════════════════════════════════════════
//  STAT STRIP (exported)
// ═══════════════════════════════════════════
export function StatStrip({ stats, activeFlag, onFlagClick }) {
  return (
    <div style={{ ...S.card, display: "flex", marginBottom: 16 }}>
      {stats.map((c, idx) => {
        const isActive = c.flag && activeFlag === c.flag;
        return (
          <div
            key={c.label}
            onClick={() => c.flag && onFlagClick(c.flag)}
            style={{
              flex: 1,
              padding: "14px 8px",
              textAlign: "center",
              borderRight: idx < stats.length - 1 ? "1px solid #f3f4f6" : "none",
              cursor: c.flag ? "pointer" : "default",
              background: isActive ? "#f7f8fa" : "transparent",
              transition: "background 0.15s",
              position: "relative",
            }}
          >
            {isActive && (
              <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, background: c.color, borderRadius: "2px 2px 0 0" }} />
            )}
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#adb5bd", marginTop: 4, lineHeight: 1.3, whiteSpace: "nowrap" }}>{c.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
//  PUNCH TIMELINE (exported)
// ═══════════════════════════════════════════
export function PunchTimeline({ punches }) {
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
                {isIn ? <LogIn size={12} color={color} /> : <LogOut size={12} color={color} />}
                <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase" }}>
                  {isIn ? "Punch In" : "Punch Out"}
                </span>
                {p.method && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>· {p.method}</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{fmt(p.time)}</span>
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
  const displayStatus = record?.status === "late" ? "present" : record?.status;
  const meta = STATUS_META[displayStatus] || STATUS_META.absent;
  const firstIn  = getFirstIn(record);
  const lastOut  = getLastOut(record);
  const punches  = record?.punches || (
    [
      record?.checkIn  ? { type: "in",  time: record.checkIn,  method: record.method || "Manual" } : null,
      record?.checkOut ? { type: "out", time: record.checkOut, method: record.method || "Manual" } : null,
    ].filter(Boolean)
  );

  const { startMins, endMins } = parseShiftMins(emp?.shift);
const lateMinutes  = calcLateMinutes(firstIn, startMins);
const earlyOutMins = (firstIn && lastOut) ? calcEarlyOut(lastOut, endMins) : 0;
const overtimeMins = calcOvertime(lastOut, endMins);
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || "#111827" }}>{value}</span>
    </div>
  );

  const StatBox = ({ label, value, color, bg }) => (
    <div style={{ background: bg || "#f8fafc", borderRadius: 8, padding: "10px 8px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#111827" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: color || "#6b7280", opacity: 0.85, marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 9998 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 95vw)", background: "#fff", zIndex: 9999, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#111827", padding: "18px 20px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                {(emp?.name || "?").charAt(0)}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{emp?.name || "—"}</div>
                <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                  {emp?.employeeId || emp?.employee_code || "—"} · {emp?.department || "—"}
                </div>
                <div style={{ color: "#6b7280", fontSize: 11, marginTop: 1 }}>{emp?.designation || ""}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#374151", border: "none", width: 30, height: 30, borderRadius: 7, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ ...S.pill(meta.color, meta.bg) }}>{meta.label}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>{fmtD(date)}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

          {/* Time Summary */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <Timer size={11} /> Time Summary
            </div>
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: "2px 12px" }}>
              <Row
  label="Shift"
  value={
    emp?.shift?.start
      ? `${emp.shift.start} – ${emp.shift.end}`
      : "10:00 – 19:00"
  }
  valueColor="#6b7280"
/>
              <Row label="First In"     value={fmt(firstIn) || "—"} valueColor="#16a34a" />
              <Row label="Last Out"     value={lastOut ? fmt(lastOut) : missingPunch ? "Pending" : "—"} valueColor={lastOut ? "#dc2626" : "#f59e0b"} />
              <Row label="Work Hours"   value={workHrs()} valueColor="#2563eb" />
              {punches.length > 0 && <Row label="Total Punches" value={`${punches.length} punches`} valueColor="#6b7280" />}
              {record?.remark && <div style={{ padding: "8px 0", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Remark: {record.remark}</div>}
            </div>
          </div>

          {/* Punch History */}
          {punches.length > 0 && (() => {
            const LUNCH_START = 13 * 60 + 30;
            const LUNCH_END   = 14 * 60 + 30;

            const normalPunches = punches.filter(p => {
              const t = new Date(p.time);
              const m = t.getHours() * 60 + t.getMinutes();
              return !(m >= LUNCH_START && m <= LUNCH_END);
            });

            const breakPunches = punches.filter(p => {
              const t = new Date(p.time);
              const m = t.getHours() * 60 + t.getMinutes();
              return m >= LUNCH_START && m <= LUNCH_END;
            });

            return (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Activity size={11} /> Punch History ({normalPunches.length})
                  </div>
                  <PunchTimeline punches={normalPunches.length ? normalPunches : punches} />
                </div>

                {breakPunches.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      🍽️ Break Time Punches ({breakPunches.length})
                    </div>
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 6 }}>
                      1:30 PM – 2:30 PM break window
                    </div>
                    <PunchTimeline punches={breakPunches} />
                  </div>
                )}
              </>
            );
          })()}

          {/* Flags */}
          {(lateMinutes > 0 || earlyOutMins > 0 || overtimeMins > 0 || missingPunch) && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Flag size={11} /> Flags
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lateMinutes > 0 && (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> Late Arrival</span>
                    <span style={{ fontSize: 13, color: "#d97706", fontWeight: 700 }}>{fmtMins(lateMinutes)}</span>
                  </div>
                )}
                {earlyOutMins > 0 && (
                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6b21a8", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><ArrowRightFromLine size={12} /> Early Out</span>
                    <span style={{ fontSize: 13, color: "#9333ea", fontWeight: 700 }}>{fmtMins(earlyOutMins)}</span>
                  </div>
                )}
                {overtimeMins > 0 && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Zap size={12} /> Overtime</span>
                    <span style={{ fontSize: 13, color: "#047857", fontWeight: 700 }}>{fmtMins(overtimeMins)}</span>
                  </div>
                )}
                {missingPunch && (
                  <div style={{ background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#9f1239", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} /> Missing Punch Out</span>
                    <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700 }}>No Out</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={11} /> {monthName} Summary
            </div>
            {loadingMonth ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>Loading...</div>
            ) : monthSummary ? (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[
                    { label: "Present",  value: monthSummary.present,  color: "#16a34a", bg: "#dcfce7" },
                    { label: "Absent",   value: monthSummary.absent,   color: "#dc2626", bg: "#fee2e2" },
                    { label: "Late",     value: monthSummary.late,     color: "#d97706", bg: "#fef9c3" },
                    { label: "On Leave", value: monthSummary.on_leave, color: "#0891b2", bg: "#e0f2fe" },
                  ].map(c => (
                    <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: "10px 8px", textAlign: "center", flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value ?? "—"}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: c.color, opacity: 0.85, marginTop: 3 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Attendance Rate</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626" }}>
                      {monthSummary.attendance_pct || 0}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3 }}>
                    <div style={{ width: `${monthSummary.attendance_pct || 0}%`, height: "100%", borderRadius: 3, background: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626", transition: "width 0.5s ease" }} />
                  </div>
                  {monthSummary.avg_work_hours && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 7 }}>
                      Avg work hours: <strong style={{ color: "#2563eb" }}>{monthSummary.avg_work_hours}</strong>
                    </div>
                  )}
                  {monthSummary.total_late_minutes > 0 && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
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
        <div style={{ padding: "12px 18px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...S.actionBtn(false), flex: 1, justifyContent: "center", padding: "9px 0", borderRadius: 8, fontSize: 13 }}>Close</button>
          <button onClick={() => { onClose(); onEdit(); }} style={{ ...S.actionBtn(true), flex: 2, justifyContent: "center", padding: "9px 0", borderRadius: 8, fontSize: 13 }}>
            <Edit3 size={13} />{firstIn ? "Edit Attendance" : "Mark Attendance"}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  SHIFT SELECTOR
// ═══════════════════════════════════════════


// ✅ இந்த entire commented block uncomment பண்ணு — ஆனா signature மாத்தணும்:

function ShiftInlineEditor({ empId, currentShift, onShiftSaved }) {
  const [editing, setEditing] = useState(false);
  const normalizeToHHMM = (t) => {
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{1}:\d{2}$/.test(t)) return "0" + t;
  return null;
};

const [startTime, setStartTime] = useState(normalizeToHHMM(currentShift?.start) || "10:00");
const [endTime,   setEndTime]   = useState(normalizeToHHMM(currentShift?.end)   || "19:00");
useEffect(() => {
    setStartTime(normalizeToHHMM(currentShift?.start) || "10:00");
    setEndTime(normalizeToHHMM(currentShift?.end)     || "19:00");
  }, [currentShift]);
  const [saving,    setSaving]    = useState(false);

 // இந்த entire handleSave மாத்து:
const handleSave = async () => {
  setSaving(true);
  try {
    const start24 = startTime || "10:00";
    const end24   = endTime   || "19:00";

    // console.log("Sending shift:", start24, end24); // debug-க்கு வேணும்னா வை

    await axios.put(
      `${API_BASE}/api/hr/employees/${empId}/shift`,
      { start: start24, end: end24 },
      { headers: authHeader() }
    );
    onShiftSaved({ start: start24, end: end24 });
    setEditing(false);
  } catch (err) {
    // இப்போ exact error message காட்டும்
    alert(err.response?.data?.message || "Shift save failed");
  } finally {
    setSaving(false);
  }
};

  const inp = {
    border: "1px solid #e5e7eb", borderRadius: 7,
    padding: "7px 10px", fontSize: 13,
    outline: "none", fontFamily: "inherit",
    background: "#f9fafb", width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Shift Timing</label>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)}
            style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
            Change
          </button>
        )}
      </div>

      {!editing ? (
        <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={13} color="#6b7280" />
          {startTime} – {endTime}
        </div>
      ) : (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 3 }}>Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 3 }}>End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setEditing(false)}
              style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: "6px 0", borderRadius: 7, background: "#111827", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? "Saving..." : "Save"}
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
  const noTimeStatus = ["absent", "leave", "holiday", "weekend"];
    const [currentShift, setCurrentShift] = useState(employee.shift);

    const [form, setForm] = useState({
  status:   existing?.status || "present",
  checkIn:  existingFirstIn ? new Date(existingFirstIn).toTimeString().slice(0, 5) : "10:00",
  checkOut: existingLastOut ? new Date(existingLastOut).toTimeString().slice(0, 5) : "",
  remark:   existing?.remark || "",
});

  const [saving, setSaving] = useState(false);
  const isNoTime = noTimeStatus.includes(form.status);

  const handle = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/attendance/hr-mark`, {
        employee_id: employee._id,
        date,
        status:   form.status,
        checkIn:  (!isNoTime && form.checkIn)  ? `${date}T${form.checkIn}:00`  : null,
        checkOut: (!isNoTime && form.checkOut) ? `${date}T${form.checkOut}:00` : null,
        remark:   form.remark,
      }, { headers: authHeader() });
      onSave("success", `${employee.name} — attendance marked!`);
    } catch (err) {
      onSave("error", err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const inp = {
    width: "100%", padding: "8px 11px",
    border: "1px solid #e5e7eb", borderRadius: 8,
    fontSize: 13, outline: "none",
    fontFamily: "inherit", background: "#f9fafb",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: "90%", maxWidth: 440, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Mark Attendance</h5>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {employee.name} · {employee.employeeId || employee.employee_code} · {fmtD(date)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 30, height: 30, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X size={14} />
          </button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 7 }}>Status</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {Object.entries(STATUS_META)
            .filter(([k]) => !["weekend", "holiday"].includes(k))
            .map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, status: k, checkIn: noTimeStatus.includes(k) ? "" : (f.checkIn || "10:00"), checkOut: noTimeStatus.includes(k) ? "" : (f.checkOut || "19:00") }))}
                style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${form.status === k ? m.color : "#e5e7eb"}`, background: form.status === k ? m.bg : "#fff", color: form.status === k ? m.color : "#6b7280", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {m.label}
              </button>
            ))}
        </div>

        {!isNoTime && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["checkIn", "Check In (First)"], ["checkOut", "Check Out (Last)"]].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
                <input type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
              </div>
            ))}
          </div>
        )}

  <ShiftInlineEditor
  empId={employee._id}
  currentShift={currentShift}
  onShiftSaved={(newShift) => {
    setCurrentShift(newShift);
    employee.shift = newShift;
  }}
/>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>HR Remark</label>
          <textarea rows={2} placeholder="Optional..." value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#374151" }}>Cancel</button>
          <button type="button" onClick={handle} disabled={saving} style={{ flex: 2, padding: "9px 0", borderRadius: 8, background: saving ? "#6b7280" : "#111827", color: "#fff", border: "none", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}>
            <Save size={13} />{saving ? "Saving..." : "Save Attendance"}
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
          employee: { _id: emp._id, name: emp.name, employeeId: emp.employeeId || emp.employee_id || emp.empId || "", department: emp.department || emp.dept || "", designation: emp.designation || emp.role || "" },
          status: "absent", punches: [], checkIn: null, checkOut: null, date, _fromApproved: true,
        }));
      setData([...attendanceData, ...approvedNotInAttendance]);
    } catch {
      showToast("error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const departments = ["all", ...new Set(data.map(r => r.employee?.department).filter(Boolean))];

 const enriched = data.map(r => {
  const { startMins, endMins } = parseShiftMins(r.employee?.shift);
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);
  return {
    ...r,
    _firstIn:     firstIn,
    _lastOut:     lastOut,
    checkOut:     r.checkOut || null,
    breakOut:     r.breakOut || null,
    breakIn:      r.breakIn  || null,
    breakLate:    r.breakLate || 0,
    lateMinutes:  calcLateMinutes(firstIn, startMins),
    earlyOutMins: firstIn && !lastOut ? 0 : calcEarlyOut(lastOut, endMins),
    overtimeMins: calcOvertime(lastOut, endMins),
    missingPunch: hasMissingOut(r, date),
    _shiftStart:  r.employee?.shift?.start || "10:00",
    _shiftEnd:    r.employee?.shift?.end   || "19:00",
  };
});

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

  const dailyStats = [
    { label: "Total",         value: s.total,        color: "#111827" },
    { label: "Present",       value: s.present,      color: "#16a34a" },
    { label: "Late",          value: s.late,         color: "#d97706", flag: "late" },
    { label: "Absent",        value: s.absent,       color: "#dc2626" },
    { label: "On Leave",      value: s.leave,        color: "#0891b2" },
    { label: "Half Day",      value: s.halfDay,      color: "#7c3aed" },
    { label: "Missing Punch", value: s.missingPunch, color: "#b91c1c", flag: "missing_punch" },
    { label: "Early Out",     value: s.earlyOut,     color: "#9333ea", flag: "early_out" },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 10001, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 7 }}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle size={14} />}{toast.msg}
        </div>
      )}

      {drawerRecord && (
        <EmployeeDrawer record={drawerRecord} date={date} onClose={() => setDrawerRecord(null)} onEdit={() => setMarkModal({ employee: drawerRecord.employee, existing: drawerRecord._firstIn ? drawerRecord : null })} />
      )}

      {markModal && (
        <HRMarkModal employee={markModal.employee} date={date} existing={markModal.existing} onSave={(type, msg) => { setMarkModal(null); showToast(type, msg); fetchData(); }} onClose={() => setMarkModal(null)} />
      )}

      <StatStrip stats={dailyStats} activeFlag={flagFilter} onFlagClick={(flag) => setFlagFilter(prev => prev === flag ? "all" : flag)} />

      {/* Filters */}
      <div style={S.filterWrap}>
        <div style={S.filterInput}>
          <CalendarCheck size={13} color="#9ca3af" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, fontWeight: 600 }} />
        </div>
        <div style={{ ...S.filterInput, flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)} style={S.input} />
        </div>
        <div style={S.filterInput}>
          <Filter size={13} color="#9ca3af" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...S.input, fontWeight: 600 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
        <div style={S.filterInput}>
          <Users size={13} color="#9ca3af" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ ...S.input, fontWeight: 600 }}>
            {departments.map(d => <option key={d} value={d}>{d === "all" ? "All Depts" : d}</option>)}
          </select>
        </div>
        <button onClick={fetchData} style={{ ...S.actionBtn(true), padding: "7px 14px", borderRadius: 8, fontSize: 13 }}>
          <RefreshCw size={12} />Refresh
        </button>
      </div>

      {/* Flag filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { id: "all",           label: "All",           icon: <Users size={11} /> },
          { id: "late",          label: "Late Arrivals", icon: <Clock size={11} /> },
          { id: "early_out",     label: "Early Out",     icon: <ArrowRightFromLine size={11} /> },
          { id: "missing_punch", label: "Missing Punch", icon: <AlertCircle size={11} /> },
        ].map(f => (
          <button key={f.id} onClick={() => setFlagFilter(f.id)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${flagFilter === f.id ? "#111827" : "#e5e7eb"}`, background: flagFilter === f.id ? "#111827" : "#fff", color: flagFilter === f.id ? "#fff" : "#6b7280", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {f.icon}{f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
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
                  {["#", "Employee", "Dept", "Status", "First In", "Check Out", "Work Hrs", "Break Out", "Break In", "Break Late", "Punches", "Flags", "Actions"].map(h => (
                    <th key={h} style={S.tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                      <Activity size={32} color="#e5e7eb" />
                      <span style={{ fontSize: 13 }}>No records found</span>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const displayStatus = r.status === "late" ? "present" : r.status;
                  const meta = STATUS_META[displayStatus] || STATUS_META.absent;
                  const hrs        = workHrsFromPunches(r);
                  const punchCount = r.punches?.length || (r.checkIn ? (r.checkOut ? 2 : 1) : 0);
                  const flags = [];
                  if (r.lateMinutes > 0)  flags.push({ label: `Late ${fmtMins(r.lateMinutes)}`,   color: "#d97706", bg: "#fef9c3" });
                  if (r.earlyOutMins > 0) flags.push({ label: `Early ${fmtMins(r.earlyOutMins)}`, color: "#9333ea", bg: "#faf5ff" });
                  if (r.missingPunch)     flags.push({ label: "No Out",                             color: "#b91c1c", bg: "#fff1f2" });


                  
                  return (
                    <tr key={i}
                      style={{ background: r.missingPunch ? "#fffbfb" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = r.missingPunch ? "#fffbfb" : "transparent"}>

                      <td style={{ ...S.tableCell, color: "#9ca3af", fontWeight: 600, width: 36 }}>{i + 1}</td>

                      <td style={S.tableCell}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {(r.employee?.name || "?").charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{r.employee?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.employee?.employeeId || r.employee?.employee_code || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ ...S.tableCell, color: "#6b7280" }}>{r.employee?.department || "—"}</td>

                      <td style={S.tableCell}>
                        <span style={S.pill(meta.color, meta.bg)}>{meta.label}</span>
                      </td>

                      <td style={{ ...S.tableCell, color: "#16a34a", fontWeight: 700, fontFamily: "monospace" }}>{fmt(r._firstIn)}</td>

                     <td style={{ ...S.tableCell, fontWeight: 700, fontFamily: "monospace" }}>
  {r.checkOut
    ? <span style={{ color: "#dc2626" }}>{fmt(r.checkOut)}</span>
    : r._firstIn
      ? <span style={{ color: "#f59e0b", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><AlertCircle size={11} /> Pending</span>
      : "—"}
</td>

                      <td style={{ ...S.tableCell, color: "#2563eb", fontWeight: 700 }}>{hrs}</td>
                      <td style={{ ...S.tableCell, fontWeight: 700, fontFamily: "monospace", color: "#0891b2" }}>
  {r.breakOut ? fmt(r.breakOut) : "—"}
</td>
<td style={{ ...S.tableCell, fontWeight: 700, fontFamily: "monospace", color: "#0891b2" }}>
  {r.breakIn ? fmt(r.breakIn) : "—"}
</td>
<td style={S.tableCell}>
  {r.breakLate > 0
    ? <span style={{ background: "#fef9c3", color: "#d97706", padding: "2px 8px", borderRadius: 10, fontWeight: 700, fontSize: 11 }}>{fmtMins(r.breakLate)}</span>
    : <span style={{ color: "#d1d5db" }}>—</span>}
</td>

                      <td style={S.tableCell}>
                        {punchCount > 0 ? (
                          <span style={{ background: punchCount > 2 ? "#eff6ff" : "#f1f5f9", color: punchCount > 2 ? "#2563eb" : "#6b7280", border: `1px solid ${punchCount > 2 ? "#bfdbfe" : "#e2e8f0"}`, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            {punchCount} {punchCount > 2 && <RefreshCw size={9} />}
                          </span>
                        ) : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>

                      <td style={S.tableCell}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {flags.length === 0
                            ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                            : flags.map((f, fi) => (
                              <span key={fi} style={{ background: f.bg, color: f.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{f.label}</span>
                            ))}
                        </div>
                      </td>

                      <td style={S.tableCell}>
  <div style={{ display: "flex", gap: 5 }}>
    <button onClick={() => setDrawerRecord(r)} style={S.actionBtn(false)}>
      <Eye size={11} />View
    </button>
    <button onClick={() => setMarkModal({ employee: r.employee, existing: r._firstIn ? r : null })} style={S.actionBtn(true)}>
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
//  MAIN PAGE
// ═══════════════════════════════════════════
export default function HRAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");

  const TABS = [
    { id: "daily",   label: "Daily Attendance", icon: <CalendarCheck size={14} /> },
    { id: "monthly", label: "Monthly Report",   icon: <Activity size={14} /> },
  ];

  return (
    <div style={{ padding: "20px 24px", background: "#f4f6fb", minHeight: "100vh" }}>

      <div style={{ marginBottom: 18 }}>
        <h4 style={{ fontWeight: 700, color: "#111827", margin: 0, fontSize: 17 }}>Attendance Management</h4>
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 3, margin: "3px 0 0" }}>View, manage and export employee attendance</p>
      </div>

      <div style={{ display: "flex", gap: 3, marginBottom: 18, background: "#fff", borderRadius: 9, padding: 3, border: "1px solid #e8eaed", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "7px 18px", borderRadius: 7, border: "none", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s", background: activeTab === t.id ? "#111827" : "transparent", color: activeTab === t.id ? "#fff" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "daily"   && <DailyTab />}
      {activeTab === "monthly" && <MonthlyTab />}
    </div>
  );
}