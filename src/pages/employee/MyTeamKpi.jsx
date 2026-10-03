import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");
const headers = () => ({ headers: { Authorization: `Bearer ${token()}` } });

export default function MyTeamKpi() {
  const [members, setMembers] = useState([]);
  const [rows, setRows] = useState([]);
  const [empId, setEmpId] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null);

  const load = async (employeeId = "") => {
    setLoading(true); setError("");
    try {
      const q = employeeId ? `?employeeId=${employeeId}` : "";
      const res = await axios.get(`${API_BASE}/api/kpi-leader/team-assignments${q}`, headers());
      setMembers(res.data.members || []);
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter(r => tab === "all" || r.status === "active");

  const th = { textAlign: "left", padding: "12px", fontSize: 12, color: "#6b7280", textTransform: "uppercase" };
  const td = { padding: "12px", borderTop: "1px solid #f1f5f9", fontSize: 14 };

  return (
    <EmployeeLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>My Team KPI</h2>
        <p style={{ color: "#6b7280" }}>Your team members-oda KPI assignments (view only).</p>

        <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
          <select
            value={empId}
            onChange={e => { setEmpId(e.target.value); load(e.target.value); }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 240 }}
          >
            <option value="">All team members ({members.length})</option>
            {members.map(m => <option key={m._id} value={m._id}>{m.name} · {m.department}</option>)}
          </select>
          {["all", "active"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", cursor: "pointer",
              background: tab === t ? "#3d5af1" : "#fff", color: tab === t ? "#fff" : "#111",
            }}>{t === "all" ? "All" : "Active"}</button>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflowX: "auto" }}>
          {loading ? <div style={{ padding: 20 }}>Loading...</div>
            : error ? <div style={{ padding: 20, color: "#dc2626" }}>{error}</div>
            : shown.length === 0 ? <div style={{ padding: 20, color: "#6b7280" }}>No assignments found.</div>
            : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>S.No</th><th style={th}>Employee</th><th style={th}>Department</th>
                    <th style={th}>Template</th><th style={th}>Period</th><th style={th}>Status</th><th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={r._id}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}><b>{r.employee_id?.name}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{r.employee_id?.email}</div></td>
                      <td style={td}>{r.employee_id?.department}</td>
                      <td style={td}>{r.template_id?.template_name}<div style={{ fontSize: 12, color: "#6b7280" }}>{r.template_id?.role}</div></td>
                      <td style={td}>{r.period}</td>
                      <td style={td}>{r.status}</td>
                      <td style={td}>
                        <button onClick={() => setView(r)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {view && (
          <div onClick={() => setView(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: "min(640px, 94vw)", maxHeight: "88vh", overflowY: "auto" }}>
              <h3 style={{ marginTop: 0 }}>{view.employee_id?.name} · {view.period}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>KPI</th><th style={th}>Target</th><th style={th}>Weight</th><th style={th}>Frequency</th></tr></thead>
                <tbody>
                  {(view.month_version_id?.kpi_items || []).map((k, i) => (
                    <tr key={i}>
                      <td style={td}>{k.kpi_name}</td>
                      <td style={td}>{k.target} {k.unit}</td>
                      <td style={td}>{k.weight}%</td>
                      <td style={td}>{k.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <button onClick={() => setView(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}