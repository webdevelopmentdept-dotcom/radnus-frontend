import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Filter, RefreshCw, Edit3, Save, Download, CalendarCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const pad  = (n) => String(n).padStart(2, "0");
const fmt  = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];

const STATUS_META = {
  present:  { label: "Present",  color: "#16a34a", bg: "#dcfce7" },
  absent:   { label: "Absent",   color: "#dc2626", bg: "#fee2e2" },
  late:     { label: "Late",     color: "#d97706", bg: "#fef9c3" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#f5f3ff" },
  leave:    { label: "On Leave", color: "#0891b2", bg: "#e0f2fe" },
  holiday:  { label: "Holiday",  color: "#be185d", bg: "#fce7f3" },
  weekend:  { label: "Weekend",  color: "#94a3b8", bg: "#f1f5f9" },
};

/* ── HR Mark Modal ── */
function HRMarkModal({ employee, date, existing, onSave, onClose }) {
  const [form, setForm] = useState({
    status:   existing?.status   || "present",
    checkIn:  existing?.checkIn  ? new Date(existing.checkIn).toTimeString().slice(0,5)  : "09:45",
    checkOut: existing?.checkOut ? new Date(existing.checkOut).toTimeString().slice(0,5) : "19:00",
    shift:    existing?.shift    || "General (9:45 AM – 7:00 PM)",
    remark:   existing?.remark   || "",
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
      onSave("success", `✅ ${employee.name} — attendance marked!`);
    } catch (err) {
      onSave("error", err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const inp = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f9fafb",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:"90%", maxWidth:460, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h5 style={{ margin:0, fontWeight:800 }}>Mark Attendance</h5>
            <p style={{ margin:0, fontSize:12, color:"#6b7280", marginTop:2 }}>
              {employee.name} · {employee.employee_code} · {fmtD(date)}
            </p>
          </div>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18, color:"#6b7280" }}>×</button>
        </div>

        {/* Status pills */}
        <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>Status</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:16 }}>
          {Object.entries(STATUS_META).filter(([k]) => !["weekend","holiday"].includes(k)).map(([k, m]) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))} style={{
              padding:"5px 13px", borderRadius:20,
              border: `2px solid ${form.status===k ? m.color : "#e5e7eb"}`,
              background: form.status===k ? m.bg : "#fff",
              color: form.status===k ? m.color : "#6b7280",
              fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit",
            }}>{m.label}</button>
          ))}
        </div>

        {/* Time */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          {[["checkIn","Check In"],["checkOut","Check Out"]].map(([key, label]) => (
            <div key={key}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>{label}</label>
              <input type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Shift</label>
          <input value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} style={inp} />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>HR Remark</label>
          <textarea rows={2} placeholder="Optional..." value={form.remark}
            onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
            style={{ ...inp, resize:"vertical" }} />
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1.5px solid #e5e7eb", background:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ flex:2, padding:"10px 0", borderRadius:10, background:"#111827", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <Save size={14}/>{saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   DAILY TAB
════════════════════════════════════ */
function DailyTab() {
  const [date,         setDate]         = useState(todayStr());
  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [markModal,    setMarkModal]    = useState(null);
  const [toast,        setToast]        = useState(null);

  useEffect(() => { fetchData(); }, [date]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/daily?date=${date}`, { headers: authHeader() });
      setData(res.data?.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(r => {
    const matchS = !search || (r.employee?.name||"").toLowerCase().includes(search.toLowerCase()) || (r.employee?.employee_code||"").toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === "all" || r.status === statusFilter;
    return matchS && matchF;
  });

  const summary = {
    total:   data.length,
    present: data.filter(r => r.status === "present").length,
    absent:  data.filter(r => r.status === "absent").length,
    late:    data.filter(r => r.status === "late").length,
    leave:   data.filter(r => r.status === "leave").length,
  };

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", top:20, right:24, zIndex:9999, background: toast.type==="error"?"#ef4444":"#16a34a", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
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

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Total",    value: summary.total,   color:"#111827", bg:"#f1f5f9", border:"#e2e8f0" },
          { label:"Present",  value: summary.present, color:"#16a34a", bg:"#dcfce7", border:"#bbf7d0" },
          { label:"Absent",   value: summary.absent,  color:"#dc2626", bg:"#fee2e2", border:"#fecaca" },
          { label:"Late",     value: summary.late,    color:"#d97706", bg:"#fef9c3", border:"#fde68a" },
          { label:"On Leave", value: summary.leave,   color:"#0891b2", bg:"#e0f2fe", border:"#bae6fd" },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:c.color }}>{c.value}</div>
            <div style={{ fontSize:11, fontWeight:700, color:c.color, opacity:0.8, marginTop:2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", marginBottom:14, border:"1px solid #e5e7eb", display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"7px 12px" }}>
          <CalendarCheck size={13} color="#111827"/>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border:"none", background:"transparent", fontSize:13, fontWeight:700, outline:"none", fontFamily:"inherit", color:"#111827" }} />
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"7px 12px", flex:1, minWidth:160 }}>
          <Search size={13} color="#9ca3af"/>
          <input placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border:"none", background:"transparent", fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }} />
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"7px 12px" }}>
          <Filter size={13} color="#9ca3af"/>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ border:"none", background:"transparent", fontSize:13, outline:"none", fontFamily:"inherit", fontWeight:600 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k,m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>

        <button onClick={fetchData} style={{ background:"#111827", border:"none", borderRadius:9, padding:"7px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontWeight:700, fontSize:13, color:"#fff", fontFamily:"inherit" }}>
          <RefreshCw size={13}/>Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:800, fontSize:14, color:"#111827" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </span>
          <span style={{ fontSize:12, color:"#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}><div className="spinner-border text-dark" role="status"/></div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Employee","Code","Dept","Status","Check In","Check Out","Work Hrs","Method","Action"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.4px", whiteSpace:"nowrap", borderBottom:"2px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign:"center", padding:"44px 0", color:"#d1d5db" }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📋</div>No records found
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const meta = STATUS_META[r.status] || STATUS_META.absent;
                  const hrs  = r.checkIn && r.checkOut
                    ? (() => { const d=(new Date(r.checkOut)-new Date(r.checkIn))/3600000; return `${Math.floor(d)}h ${pad(Math.round((d%1)*60))}m`; })()
                    : r.checkIn ? "In progress" : "—";
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 14px", color:"#9ca3af", fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, background:"#111827", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12, flexShrink:0 }}>
                            {(r.employee?.name||"?").charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, color:"#111827" }}>{r.employee?.name || "—"}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{r.employee?.designation || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"10px 14px", color:"#6b7280", fontSize:12, fontWeight:600 }}>{r.employee?.employee_code || "—"}</td>
                      <td style={{ padding:"10px 14px", color:"#6b7280" }}>{r.employee?.department || "—"}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ background:meta.bg, color:meta.color, padding:"3px 10px", borderRadius:20, fontWeight:800, fontSize:11 }}>{meta.label}</span>
                      </td>
                      <td style={{ padding:"10px 14px", color:"#16a34a", fontWeight:700 }}>{fmt(r.checkIn)}</td>
                      <td style={{ padding:"10px 14px", color:"#dc2626", fontWeight:700 }}>{fmt(r.checkOut)}</td>
                      <td style={{ padding:"10px 14px", color:"#2563eb", fontWeight:700 }}>{hrs}</td>
                      <td style={{ padding:"10px 14px", color:"#6b7280", textTransform:"capitalize", fontSize:12 }}>{r.method || "—"}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <button onClick={() => setMarkModal({ employee: r.employee, existing: r.checkIn ? r : null })}
                          style={{ background:"#111827", color:"#fff", border:"none", borderRadius:8, padding:"5px 11px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:4 }}>
                          <Edit3 size={11}/>{r.checkIn ? "Edit" : "Mark"}
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

/* ════════════════════════════════════
   MONTHLY TAB
════════════════════════════════════ */
function MonthlyTab() {
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast,     setToast]     = useState(null);

  useEffect(() => { fetchData(); }, [year, month]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/monthly-report?year=${year}&month=${month}`, { headers: authHeader() });
      setData(res.data?.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/export?year=${year}&month=${month}`,
        { headers: authHeader(), responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Attendance_${month}_${year}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("success", "📥 Excel exported!");
    } catch { showToast("error", "Export failed"); }
    finally { setExporting(false); }
  };

  const totalPresent  = data.reduce((s,r) => s + (r.present||0), 0);
  const totalAbsent   = data.reduce((s,r) => s + (r.absent||0), 0);
  const totalLate     = data.reduce((s,r) => s + (r.late||0), 0);
  const avgAttendance = data.length ? Math.round(data.reduce((s,r) => s + (r.attendance_pct||0), 0) / data.length) : 0;

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", top:20, right:24, zIndex:9999, background: toast.type==="error"?"#ef4444":"#16a34a", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Employees",      value: data.length,        color:"#111827", bg:"#f1f5f9", border:"#e2e8f0" },
          { label:"Total Present",  value: totalPresent,       color:"#16a34a", bg:"#dcfce7", border:"#bbf7d0" },
          { label:"Total Absent",   value: totalAbsent,        color:"#dc2626", bg:"#fee2e2", border:"#fecaca" },
          { label:"Total Late",     value: totalLate,          color:"#d97706", bg:"#fef9c3", border:"#fde68a" },
          { label:"Avg Attendance", value: `${avgAttendance}%`,color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:c.color }}>{c.value}</div>
            <div style={{ fontSize:11, fontWeight:700, color:c.color, opacity:0.8, marginTop:2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", marginBottom:14, border:"1px solid #e5e7eb", display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"7px 12px" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Month:</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ border:"none", background:"transparent", fontSize:13, fontWeight:600, outline:"none", fontFamily:"inherit" }}>
            {Array.from({length:12},(_,i) => (
              <option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString("en-IN",{month:"long"})}</option>
            ))}
          </select>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"7px 12px" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Year:</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ border:"none", background:"transparent", fontSize:13, fontWeight:600, outline:"none", fontFamily:"inherit" }}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button onClick={fetchData} style={{ background:"#111827", border:"none", borderRadius:9, padding:"7px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontWeight:700, fontSize:13, color:"#fff", fontFamily:"inherit" }}>
          <RefreshCw size={13}/>Refresh
        </button>

        <button onClick={handleExport} disabled={exporting} style={{ background:"#16a34a", border:"none", borderRadius:9, padding:"7px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontWeight:700, fontSize:13, color:"#fff", fontFamily:"inherit", marginLeft:"auto" }}>
          <Download size={13}/>{exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontWeight:800, fontSize:14, color:"#111827" }}>
            {new Date(year, month-1).toLocaleString("en-IN",{month:"long"})} {year} — Summary
          </span>
          <span style={{ fontSize:12, color:"#9ca3af" }}>{data.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}><div className="spinner-border text-dark" role="status"/></div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Employee","Code","Dept","Work Days","Present","Late","Half Day","On Leave","Absent","Avg Hrs","Attendance %"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.4px", whiteSpace:"nowrap", borderBottom:"2px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign:"center", padding:"44px 0", color:"#d1d5db" }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📊</div>No data for this period
                  </td></tr>
                ) : data.map((r, i) => {
                  const pct    = r.attendance_pct || 0;
                  const pctClr = pct>=90?"#16a34a":pct>=75?"#d97706":"#dc2626";
                  const pctBg  = pct>=90?"#dcfce7":pct>=75?"#fef9c3":"#fee2e2";
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 14px", color:"#9ca3af", fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, background:"#111827", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12, flexShrink:0 }}>
                            {(r.name||"?").charAt(0)}
                          </div>
                          <span style={{ fontWeight:700, color:"#111827" }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"10px 14px", color:"#6b7280", fontSize:12 }}>{r.employee_code}</td>
                      <td style={{ padding:"10px 14px", color:"#6b7280" }}>{r.department}</td>
                      <td style={{ padding:"10px 14px", fontWeight:700 }}>{r.work_days}</td>
                      <td style={{ padding:"10px 14px" }}><span style={{ color:"#16a34a", fontWeight:800 }}>{r.present}</span></td>
                      <td style={{ padding:"10px 14px" }}><span style={{ color:"#d97706", fontWeight:800 }}>{r.late}</span></td>
                      <td style={{ padding:"10px 14px" }}><span style={{ color:"#7c3aed", fontWeight:800 }}>{r.half_day}</span></td>
                      <td style={{ padding:"10px 14px" }}><span style={{ color:"#0891b2", fontWeight:800 }}>{r.on_leave}</span></td>
                      <td style={{ padding:"10px 14px" }}><span style={{ color:"#dc2626", fontWeight:800 }}>{r.absent}</span></td>
                      <td style={{ padding:"10px 14px", color:"#2563eb", fontWeight:700 }}>{r.avg_work_hours}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <div style={{ flex:1, height:5, background:"#e5e7eb", borderRadius:3, minWidth:50 }}>
                            <div style={{ width:`${pct}%`, height:"100%", background:pctClr, borderRadius:3 }}/>
                          </div>
                          <span style={{ background:pctBg, color:pctClr, padding:"2px 9px", borderRadius:20, fontWeight:800, fontSize:11, whiteSpace:"nowrap" }}>{pct}%</span>
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

/* ════════════════════════════════════
   MAIN PAGE — Daily + Monthly tabs
════════════════════════════════════ */
export default function HRAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");

  const TABS = [
    { id:"daily",   label:"📅 Daily Attendance"  },
    { id:"monthly", label:"📊 Monthly Report"     },
  ];

  return (
    <div style={{ padding:"20px 24px", background:"#f4f6fb", minHeight:"100vh" }}>
      {/* Page header */}
      <div style={{ marginBottom:20 }}>
        <h4 style={{ fontWeight:800, color:"#111827", margin:0, fontSize:18 }}>Attendance Management</h4>
        <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>View, manage and export employee attendance</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20, background:"#fff", borderRadius:10, padding:4, border:"1px solid #e5e7eb", width:"fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:"8px 20px", borderRadius:8, border:"none", fontFamily:"inherit",
            fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s",
            background: activeTab===t.id ? "#111827" : "transparent",
            color:       activeTab===t.id ? "#fff"    : "#6b7280",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "daily"   && <DailyTab />}
      {activeTab === "monthly" && <MonthlyTab />}
    </div>
  );
}