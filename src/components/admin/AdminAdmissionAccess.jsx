import React, { useState, useEffect } from "react";
import { API, adminHeaders } from "../admission/admissionShared";

// Same pattern as Adminloanaccess.jsx: Telecaller + Report toggles per employee
export default function AdminAdmissionAccess() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append("search", search);
      if (department) p.append("department", department);
      const res = await fetch(`${API}/api/admin-admission/access/employees?${p.toString()}`, { headers: adminHeaders() });
      const json = await res.json();
      if (json.success) setEmployees(json.data || []);
    } catch (e) { console.error("LOAD EMPLOYEES", e); } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search, department]);

  const toggle = async (emp, field, path) => {
    const next = !emp[field];
    setEmployees((p) => p.map((e) => (e._id === emp._id ? { ...e, [field]: next } : e)));
    setSavingId(emp._id);
    try {
      const res = await fetch(`${API}/api/admin-admission/access/${emp._id}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ enabled: next }),
      });
      const json = await res.json();
      if (!json.success) throw new Error("failed");
    } catch {
      setEmployees((p) => p.map((e) => (e._id === emp._id ? { ...e, [field]: !next } : e)));
    } finally {
      setSavingId(null);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const Switch = ({ on, busy, onClick }) => (
    <button className={`ala-switch ${on ? "on" : "off"}`} disabled={busy} onClick={onClick}>
      <span className="ala-switch-thumb" />
    </button>
  );

  return (
    <div className="ala-root">
      <style>{`
        .ala-root { --border:#E4E7EE; --text:#101828; --muted:#64748B; --bg:#F6F7FB; --accent:#0F9D80;
          --primary:#2A3EB1; --primary-soft:#EEF1FD; font-family:"Inter","Segoe UI",system-ui,sans-serif; color:var(--text); }
        .ala-filters { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
        .ala-filters input, .ala-filters select { padding:9px 14px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:#fff; min-width:200px; }
        .ala-card { background:#fff; border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(16,24,40,.06); }
        .ala-row, .ala-header-row { display:grid; grid-template-columns:2fr 1.4fr 120px 120px; gap:12px; align-items:center; padding:14px 20px; }
        .ala-row { border-bottom:1px solid var(--border); } .ala-row:last-child { border-bottom:none; } .ala-row:hover { background:var(--bg); }
        .ala-header-row { padding:10px 20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); background:var(--bg); border-bottom:1px solid var(--border); }
        .ala-row > :nth-child(n+3), .ala-header-row > :nth-child(n+3) { justify-self:center; text-align:center; }
        .ala-name { font-weight:700; font-size:14px; } .ala-sub { font-size:12px; color:var(--muted); margin-top:2px; }
        .ala-chip { font-size:12px; font-weight:600; color:var(--primary); background:var(--primary-soft); padding:4px 10px; border-radius:20px; width:fit-content; }
        .ala-switch { width:44px; height:24px; border-radius:30px; border:none; cursor:pointer; position:relative; transition:background .2s; }
        .ala-switch.on { background:var(--accent); } .ala-switch.off { background:#CBD5E1; } .ala-switch:disabled { opacity:.6; cursor:not-allowed; }
        .ala-switch-thumb { position:absolute; top:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.25); }
        .ala-switch.on .ala-switch-thumb { left:23px; } .ala-switch.off .ala-switch-thumb { left:3px; }
        @media (max-width:700px) { .ala-row, .ala-header-row { grid-template-columns:1.6fr 70px 70px; } .ala-row > :nth-child(2), .ala-header-row > :nth-child(2) { display:none; } }
      `}</style>

      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Admission — Access Control</h4>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
        <b>Telecaller</b>: can create admissions and record payments for their own students.{" "}
        <b>Report</b>: read-only view of all admissions with Excel export.
      </p>

      <div className="ala-filters">
        <input placeholder="Search employee name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="ala-card">
        <div className="ala-header-row"><div>Employee</div><div>Department</div><div>Telecaller</div><div>Report</div></div>
        {loading && employees.length === 0 && <div style={{ padding: 24, color: "var(--muted)" }}>Loading…</div>}
        {employees.map((emp) => (
          <div className="ala-row" key={emp._id}>
            <div><div className="ala-name">{emp.name}</div><div className="ala-sub">{emp.email}</div></div>
            <div>{emp.department ? <span className="ala-chip">{emp.department}</span> : "—"}</div>
            <Switch on={!!emp.canManageAdmission} busy={savingId === emp._id} onClick={() => toggle(emp, "canManageAdmission", "")} />
            <Switch on={!!emp.admissionReportAccess} busy={savingId === emp._id} onClick={() => toggle(emp, "admissionReportAccess", "/report-access")} />
          </div>
        ))}
        {!loading && employees.length === 0 && <div style={{ padding: 24, color: "var(--muted)" }}>No employees found.</div>}
      </div>
    </div>
  );
}