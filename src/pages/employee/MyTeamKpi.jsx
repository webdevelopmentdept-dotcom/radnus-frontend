import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");
const headers = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const pctColor = (pct) =>
  pct >= 100 ? "#16a34a" : pct >= 75 ? "#2563eb" : pct >= 50 ? "#d97706" : "#dc2626";

export default function MyTeamKpi() {
  const [members, setMembers] = useState([]);
  const [rows, setRows] = useState([]);
  const [empId, setEmpId] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null);

  // daily logs of the member opened in the modal
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

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

  const openView = async (r) => {
    setView(r); setLogs([]); setLogFrom(""); setLogTo("");
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/kpi-leader/team-logs/${r._id}`, headers());
      setLogs(res.data.logs || []);
    } catch { setLogs([]); }
    setLogsLoading(false);
  };

  const shown = rows.filter(r => tab === "all" || r.status === "active");

  const th = { textAlign: "left", padding: "12px", fontSize: 12, color: "#6b7280", textTransform: "uppercase" };
  const td = { padding: "12px", borderTop: "1px solid #f1f5f9", fontSize: 14 };
  const dateInput = { padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", width: "100%" };

  // ── modal data (date filter applies to both the log list and the running totals) ──
  const kpiItems = view?.month_version_id?.kpi_items || [];
  const effFrom = logFrom || logTo;
  const effTo = logTo || logFrom;
  const filteredLogs = logs.filter(l =>
    (!effFrom || l.log_date >= effFrom) && (!effTo || l.log_date <= effTo)
  );
  const logsByDate = filteredLogs.reduce((acc, l) => {
    (acc[l.log_date] = acc[l.log_date] || []).push(l);
    return acc;
  }, {});
  const totals = filteredLogs
    .filter(l => !l.isDeleted)
    .reduce((acc, l) => { acc[l.kpi_item_id] = (acc[l.kpi_item_id] || 0) + l.value; return acc; }, {});

  const pcts = kpiItems.map(item => Math.min(Math.round(((totals[item._id] || 0) / item.target) * 100), 100));
  const avgPct = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
  const avgColor = pctColor(avgPct);

  return (
    <EmployeeLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>My Team KPI</h2>
        <p style={{ color: "#6b7280" }}>KPI assignments, daily logs and progress of your team members (view only).</p>

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
                        <button onClick={() => openView(r)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {view && (
          <div onClick={() => setView(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: "min(980px, 94vw)", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ marginTop: 0 }}>{view.employee_id?.name} · {view.period}</h3>

              {/* KPI targets */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>KPI</th><th style={th}>Target</th><th style={th}>Weight</th><th style={th}>Frequency</th></tr></thead>
                <tbody>
                  {kpiItems.map((k, i) => (
                    <tr key={i}>
                      <td style={td}>{k.kpi_name}</td>
                      <td style={td}>{k.target} {k.unit}</td>
                      <td style={td}>{k.weight}%</td>
                      <td style={td}>{k.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Date filter */}
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                <b style={{ fontSize: 14 }}>Filter logs by date</b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginTop: 8, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280" }}>From</label>
                    <input type="date" style={dateInput} value={logFrom} onChange={e => setLogFrom(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280" }}>To</label>
                    <input type="date" style={dateInput} value={logTo} onChange={e => setLogTo(e.target.value)} />
                  </div>
                  <button
                    onClick={() => { setLogFrom(""); setLogTo(""); }}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                  >Clear</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 18 }}>
                {/* Running totals */}
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, alignSelf: "start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <b style={{ fontSize: 14 }}>Running Totals</b>
                    {kpiItems.length > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: avgColor, background: `${avgColor}15`, padding: "3px 10px", borderRadius: 99 }}>
                        Avg: {avgPct}%
                      </span>
                    )}
                  </div>
                  {logsLoading ? (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Loading...</div>
                  ) : kpiItems.length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: 13 }}>No KPI items</div>
                  ) : kpiItems.map((item, i) => {
                    const total = totals[item._id] || 0;
                    const pct = pcts[i];
                    const color = pctColor(pct);
                    return (
                      <div key={item._id || i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                            {item.kpi_name}
                            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "1px 6px", borderRadius: 4 }}>Wt: {item.weight}%</span>
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: "nowrap" }}>{total} / {item.target} {item.unit}</span>
                        </div>
                        <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
                        </div>
                        <div style={{ marginTop: 3, fontSize: 11, color, fontWeight: 600, textAlign: "right" }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>

                {/* Daily logs */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <b style={{ fontSize: 14 }}>
                      Daily Logs
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#6b7280" }}>({filteredLogs.length} entries)</span>
                    </b>
                  </div>

                  {logsLoading ? (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Loading logs...</div>
                  ) : filteredLogs.length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>
                      No logs found{logFrom || logTo ? " in selected date range" : ""}.
                    </div>
                  ) : Object.keys(logsByDate).sort((a, b) => b.localeCompare(a)).map(date => (
                    <div key={date} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
                        {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        <span style={{ fontWeight: 400, color: "#9ca3af" }}> — {logsByDate[date].length} {logsByDate[date].length === 1 ? "entry" : "entries"}</span>
                      </div>
                      {logsByDate[date].map(log => (
                        <div key={log._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, border: "1px solid #e5e7eb", opacity: log.isDeleted ? 0.7 : 1 }}>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 13, flexShrink: 0 }}>{log.value}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>
                                {log.kpi_name} — <span style={{ color: "#2563eb" }}>{log.value} {log.unit}</span>
                                {log.isEdited && !log.isDeleted && (
                                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#d97706", padding: "1px 7px", borderRadius: 99, border: "1px solid #fde68a" }}>Edited</span>
                                )}
                                {log.isDeleted && (
                                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "1px 7px", borderRadius: 99, border: "1px solid #fecaca" }}>
                                    Deleted{log.deletedAt ? ` on ${new Date(log.deletedAt).toLocaleDateString("en-IN")}` : ""}
                                  </span>
                                )}
                              </div>
                              {log.note && <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{log.note}</div>}
                              {log.extra_fields && Object.keys(log.extra_fields).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5, paddingTop: 5, borderTop: "1px dashed #e5e7eb" }}>
                                  {Object.entries(log.extra_fields).map(([key, val]) => (
                                    val ? (
                                      <span key={key} style={{ fontSize: 11, background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 99, border: "1px solid #e5e7eb", fontWeight: 600 }}>
                                        {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}: {val}
                                      </span>
                                    ) : null
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0, textAlign: "right" }}>
                            {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

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