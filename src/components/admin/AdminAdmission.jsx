import React, { useState, useEffect } from "react";
import {
  API, adminHeaders, ADM_CSS, fmtMoney, StudentCard,
} from "../admission/admissionShared";

export default function AdminAdmission() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ status: "", search: "", from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMetrics = async () => {
    try {
      const res = await fetch(`${API}/api/admin-admission/metrics`, { headers: adminHeaders() });
      const json = await res.json();
      if (json.success) setMetrics(json.data);
    } catch (e) { console.error("ADMISSION METRICS", e); }
  };

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && p.append(k, v));
      const res = await fetch(`${API}/api/admin-admission/all?${p.toString()}`, { headers: adminHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load");
      setStudents(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []);
  useEffect(() => {
    const t = setTimeout(loadStudents, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="adm-root">
      <style>{ADM_CSS}</style>
      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Admission</h4>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
        Every telecaller's admissions — view, check documents and download the application PDF. Only the telecaller can edit.
      </p>

      {error && <div className="adm-alert error">{error}</div>}

      {metrics && (
        <>
          <div className="adm-stats">
            <div className="adm-stat"><div className="v">{metrics.completed + metrics.fullyCompleted}</div><div className="l">Applications · {metrics.drafts} drafts</div></div>
            <div className="adm-stat"><div className="v">{fmtMoney(metrics.totalFees)}</div><div className="l">Total fees</div></div>
            <div className="adm-stat"><div className="v" style={{ color: "var(--accent)" }}>{fmtMoney(metrics.collected)}</div><div className="l">Collected</div></div>
            <div className="adm-stat"><div className="v" style={{ color: "var(--danger)" }}>{fmtMoney(metrics.balance)}</div><div className="l">Balance · {metrics.fullyCompleted} fully paid</div></div>
          </div>

          {metrics.byTelecaller?.length > 0 && (
            <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="adm-table-wrap">
              <table className="adm-table" style={{ margin: 0 }}>
                <thead><tr><th>Telecaller</th><th>Applications</th><th>Total fees</th><th>Collected</th></tr></thead>
                <tbody>
                  {metrics.byTelecaller.map((t) => (
                    <tr key={t.name}><td style={{ fontWeight: 600 }}>{t.name}</td><td>{t.applications}</td><td>{fmtMoney(t.totalFees)}</td><td>{fmtMoney(t.collected)}</td></tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="adm-filters">
        <input placeholder="Search name, mobile, application no…" value={filters.search} onChange={(e) => set("search", e.target.value)} />
        <select value={filters.status} onChange={(e) => set("status", e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPLICATION_COMPLETED">Application Completed</option>
          <option value="FULLY_COMPLETED">Fully Completed</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} title="From" />
        <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} title="To" />
      </div>

      {students.length === 0 ? (
        <div className="adm-empty">{loading ? "Loading…" : "No admissions found."}</div>
      ) : (
        students.map((s) => (
          <StudentCard key={s._id} s={s} headers={adminHeaders} />
        ))
      )}
    </div>
  );
}