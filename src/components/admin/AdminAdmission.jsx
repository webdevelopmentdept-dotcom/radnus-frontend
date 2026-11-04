import React, { useState, useEffect } from "react";
import {
  API, adminHeaders, ADM_CSS, fmtMoney, StudentCard,
} from "../admission/admissionShared";

const EMPTY_FILTERS = { status: "", search: "", from: "", to: "", staffId: "" };

export default function AdminAdmission() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

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

  const downloadExcel = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && p.append(k, v));
      const res = await fetch(`${API}/api/admin-admission/export?${p.toString()}`, { headers: adminHeaders() });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admissions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Failed to download Excel");
    } finally {
      setExporting(false);
    }
  };

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
                  <thead><tr><th>Telecaller</th><th>Applications</th><th>Fully completed</th><th>Total fees</th><th>Collected</th></tr></thead>
                  <tbody>
                    {metrics.byTelecaller.map((t) => (
                      <tr
                        key={t.staffId || t.name}
                        onClick={() => set("staffId", filters.staffId === t.staffId ? "" : t.staffId)}
                        style={{
                          cursor: "pointer",
                          background: filters.staffId === t.staffId ? "rgba(42,62,177,0.08)" : undefined,
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.applications}</td>
                        <td>{t.fullyCompleted}</td>
                        <td>{fmtMoney(t.totalFees)}</td>
                        <td>{fmtMoney(t.collected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="adm-filters adm-filters-admin">
        <input className="f-search" placeholder="Search name, mobile, application no…" value={filters.search} onChange={(e) => set("search", e.target.value)} />
        <select value={filters.status} onChange={(e) => set("status", e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPLICATION_COMPLETED">Application Completed</option>
          <option value="FULLY_COMPLETED">Fully Completed</option>
        </select>
        <select value={filters.staffId} onChange={(e) => set("staffId", e.target.value)}>
          <option value="">All telecallers</option>
          {(metrics?.byTelecaller || []).map((t) => (
            <option key={t.staffId} value={t.staffId}>{t.name}</option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} title="From" />
        <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} title="To" />
        <button className="adm-excel-btn" onClick={downloadExcel} disabled={exporting}>
          {exporting ? "Preparing…" : "⬇ Excel"}
        </button>
      </div>

      <div className="adm-resultbar">
        <span>{loading ? "Loading…" : `${students.length} admission${students.length === 1 ? "" : "s"}`}</span>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters ✕</button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="adm-empty">{loading ? "Loading…" : "No admissions found."}</div>
      ) : (
        students.map((s) => (
          <StudentCard key={s._id} s={s} headers={adminHeaders} showBda />
        ))
      )}
    </div>
  );
}