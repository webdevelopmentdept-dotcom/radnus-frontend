import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";
import {
  API, empHeaders, ADM_CSS, fmtMoney, StudentCard, downloadFile,
} from "../../components/admission/admissionShared";

export default function AdmissionReport() {
  const [filters, setFilters] = useState({ status: "", paymentStatus: "", search: "", from: "", to: "" });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const qs = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && p.append(k, v));
    return p.toString();
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admission/report?${qs()}`, { headers: empHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load report");
      setData(json.data || []);
      setSummary(json.summary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await downloadFile(`${API}/api/admission/report/export?${qs()}`, "admissions.xlsx", empHeaders());
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <EmployeeLayout>
      <div className="adm-root adm-page container-fluid px-4 py-4">
        <style>{ADM_CSS}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <h4 style={{ fontWeight: 700, margin: 0 }}>Admission Report</h4>
          <button className="adm-btn primary" onClick={exportExcel} disabled={exporting || data.length === 0}>
            <Download size={15} /> {exporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>All admissions across telecallers (read-only).</p>

        {error && <div className="adm-alert error">{error}</div>}

        {summary && (
          <div className="adm-stats">
            <div className="adm-stat"><div className="v">{summary.completed + summary.fullyCompleted}</div><div className="l">Applications ({summary.drafts} drafts)</div></div>
            <div className="adm-stat"><div className="v">{fmtMoney(summary.totalFees)}</div><div className="l">Total fees</div></div>
            <div className="adm-stat"><div className="v" style={{ color: "var(--accent)" }}>{fmtMoney(summary.collected)}</div><div className="l">Collected</div></div>
            <div className="adm-stat"><div className="v" style={{ color: "var(--danger)" }}>{fmtMoney(summary.balance)}</div><div className="l">Balance · {summary.fullyCompleted} fully paid</div></div>
          </div>
        )}

        <div className="adm-filters">
          <input placeholder="Search name, mobile, application no…" value={filters.search} onChange={(e) => set("search", e.target.value)} />
          <select value={filters.status} onChange={(e) => set("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPLICATION_COMPLETED">Application Completed</option>
            <option value="FULLY_COMPLETED">Fully Completed</option>
          </select>
          <select value={filters.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value)}>
            <option value="">All payments</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} title="From" />
          <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} title="To" />
        </div>

        {data.length === 0 ? (
          <div className="adm-empty">{loading ? "Loading…" : "No admissions found."}</div>
        ) : (
          data.map((s) => <StudentCard key={s._id} s={s} headers={empHeaders} />)
        )}
      </div>
    </EmployeeLayout>
  );
}