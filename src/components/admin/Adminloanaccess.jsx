import React, { useState, useEffect } from "react";

export default function AdminLoanAccess() {
  const API = import.meta.env.VITE_API_BASE_URL;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [savingId, setSavingId] = useState(null);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (department) params.append("department", department);

      const res = await fetch(`${API}/api/admin-loan-process/access/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) setEmployees(data.data || []);
    } catch (err) {
      console.error("LOAD EMPLOYEES ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadEmployees, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department]);

    const toggleHead = async (emp) => {
    const nextValue = !emp.isLoanProcessHead;

    // optimistic update — remote head off everyone, on for this one
    setEmployees((prev) =>
      prev.map((e) => ({
        ...e,
        isLoanProcessHead: e._id === emp._id ? nextValue : false,
      }))
    );
    setSavingId(emp._id);

    try {
      const res = await fetch(`${API}/api/admin-loan-process/access/${emp._id}/head`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHead: nextValue }),
      });
      const data = await res.json();
      if (!data.success) loadEmployees(); // just re-sync on failure
    } catch (err) {
      console.error("TOGGLE HEAD ERROR", err);
      loadEmployees();
    } finally {
      setSavingId(null);
    }
  };


  const toggleAccess = async (emp) => {
    const nextValue = !emp.canManageLoanProcess;

    // optimistic update
    setEmployees((prev) =>
      prev.map((e) => (e._id === emp._id ? { ...e, canManageLoanProcess: nextValue } : e))
    );
    setSavingId(emp._id);

    try {
      const res = await fetch(`${API}/api/admin-loan-process/access/${emp._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextValue }),
      });
      const data = await res.json();
      if (!data.success) {
        // revert on failure
        setEmployees((prev) =>
          prev.map((e) => (e._id === emp._id ? { ...e, canManageLoanProcess: !nextValue } : e))
        );
      }
    } catch (err) {
      console.error("TOGGLE ACCESS ERROR", err);
      setEmployees((prev) =>
        prev.map((e) => (e._id === emp._id ? { ...e, canManageLoanProcess: !nextValue } : e))
      );
    } finally {
      setSavingId(null);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  return (
    <div className="ala-root">
      <style>{`
        .ala-root {
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
        .ala-filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
        .ala-filters input, .ala-filters select {
          padding: 9px 14px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
          font-size: 14px; background: var(--lp-surface); min-width: 200px;
        }
        .ala-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-lg); box-shadow: var(--lp-shadow-sm); overflow: hidden;
        }
                .ala-row {
          display: grid; grid-template-columns: 2fr 1.4fr 1fr auto auto;
          align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--lp-border);
        }
        .ala-row:last-child { border-bottom: none; }
        .ala-row:hover { background: var(--lp-bg); }
        .ala-name { font-weight: 700; font-size: 14px; }
        .ala-sub { font-size: 12px; color: var(--lp-text-muted); margin-top: 2px; }
        .ala-dept-chip {
          font-size: 12px; font-weight: 600; color: var(--lp-primary);
          background: var(--lp-primary-soft); padding: 4px 10px; border-radius: 20px;
          display: inline-block; width: fit-content;
        }
        .ala-status { font-size: 12px; font-weight: 700; }
        .ala-status.on { color: var(--lp-accent); }
        .ala-status.off { color: var(--lp-text-muted); }
        .ala-switch {
          width: 44px; height: 24px; border-radius: 30px; border: none; cursor: pointer;
          position: relative; transition: background 0.2s; flex-shrink: 0;
        }
        .ala-switch.on { background: var(--lp-accent); }
        .ala-switch.off { background: #CBD5E1; }
        .ala-switch:disabled { opacity: 0.6; cursor: not-allowed; }
        .ala-switch-thumb {
          position: absolute; top: 3px; width: 18px; height: 18px; background: #fff;
          border-radius: 50%; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }
        .ala-switch.on .ala-switch-thumb { left: 23px; }
        .ala-switch.off .ala-switch-thumb { left: 3px; }
        .ala-header-row {
          display: grid; grid-template-columns: 2fr 1.4fr 1fr auto; gap: 12px; padding: 10px 20px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--lp-text-muted); border-bottom: 1px solid var(--lp-border); background: var(--lp-bg);
        }
      `}</style>

      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Loan Process — Access Control</h4>
      <p style={{ color: "var(--lp-text-muted)", fontSize: 14, marginBottom: 20 }}>
        Turn Loan Process access on for the telecallers who should use it. No department is auto-assigned —
        toggle each employee individually.
      </p>

      <div className="ala-filters">
        <input
          placeholder="Search employee name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="ala-card">
        <div className="ala-header-row">
          <div>Employee</div>
          <div>Department</div>
          <div>Access</div>
              <div>Head</div>
          <div></div>
        </div>

        {loading && <div style={{ padding: 20, color: "var(--lp-text-muted)" }}>Loading…</div>}
        {!loading && employees.length === 0 && (
          <div style={{ padding: 20, color: "var(--lp-text-muted)" }}>No employees found.</div>
        )}

        {employees.map((emp) => (
          <div className="ala-row" key={emp._id}>
            <div>
              <div className="ala-name">{emp.name}</div>
              <div className="ala-sub">{emp.email}</div>
            </div>
            <div>
              <span className="ala-dept-chip">{emp.department || "—"}</span>
            </div>
            <div className={`ala-status ${emp.canManageLoanProcess ? "on" : "off"}`}>
              {emp.canManageLoanProcess ? "Enabled" : "Disabled"}
            </div>
                        <button
              className={`ala-switch ${emp.canManageLoanProcess ? "on" : "off"}`}
              onClick={() => toggleAccess(emp)}
              disabled={savingId === emp._id}
              aria-label={`Toggle Loan Process access for ${emp.name}`}
            >
              <span className="ala-switch-thumb" />
            </button>
            <button
              className={`ala-switch ${emp.isLoanProcessHead ? "on" : "off"}`}
              onClick={() => toggleHead(emp)}
              disabled={savingId === emp._id || !emp.canManageLoanProcess}
              title={!emp.canManageLoanProcess ? "Module access venum head aaganum na" : ""}
              aria-label={`Set ${emp.name} as Loan Process Head`}
            >
              <span className="ala-switch-thumb" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}