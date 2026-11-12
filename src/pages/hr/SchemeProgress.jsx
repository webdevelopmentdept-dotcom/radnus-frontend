// src/pages/hr/SchemeProgress.jsx  (Phase 3) live progress of a qualifying-days scheme
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/award-results`;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", red: "#b91c1c" };
const SOURCE = { loan_incentive: "Loan incentive", sale_entries: "Incentive entries", daily_log: "Daily log" };
const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";

const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, background: "#f9fafb" };
const td = { padding: "12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" };
const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${C.border}`, background: "#fff", color: C.text };

function Pill({ children, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>;
}

export default function SchemeProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/${id}/scheme-progress`);
      setData(r.data.data); setError("");
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const changeSource = async (row, source) => {
    try {
      await axios.put(`${API}/${id}/scheme-source`, { employee_id: row.employee_id, source });
      notify("Source updated"); load();
    } catch (e) { notify(errMsg(e), "error"); }
  };

  if (loading && !data) return <p style={{ padding: 32, color: C.sub }}>Loading...</p>;
  if (error && !data) return (
    <div style={{ padding: 32 }}>
      <p style={{ color: C.red }}><AlertCircle size={16} style={{ verticalAlign: -3 }} /> {error}</p>
      <button style={btn} onClick={() => navigate("/hr/dashboard/recognition/award-config")}>Back</button>
    </div>
  );

  const { period, rule, summary, rows, forced_source } = data;
  const card = (label, value, color) => (
    <div style={{ flex: "1 1 150px", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", background: "#fff" }}>
      <div style={{ fontSize: 12, color: C.sub }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1250 }}>
      {toast && <div role="status" style={{ position: "fixed", top: 20, right: 20, zIndex: 80, padding: "10px 16px", borderRadius: 8, color: "#fff", fontSize: 13, background: toast.type === "error" ? C.red : C.green }}>{toast.msg}</div>}

      <button style={{ ...btn, marginBottom: 14 }} onClick={() => navigate("/hr/dashboard/recognition/award-config")}><ArrowLeft size={14} /> Award configuration</button>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Scheme progress</h1>
          <p style={{ margin: "6px 0 0", color: C.sub, fontSize: 13 }}>
            {rule.min_daily_value} or more a day, on {rule.days_required} days · {period.start} to {period.end} · today {period.today}
          </p>
        </div>
        <button style={btn} onClick={load} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "20px 0" }}>
        {card("Participants", summary.participants, C.text)}
        {card("Qualified", summary.qualified, C.green)}
        {card("Still on track", summary.on_track, C.blue)}
        {card("Cannot qualify now", summary.out, C.red)}
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead><tr>
            <th style={th}>Employee</th><th style={th}>Data source</th><th style={th}>Qualifying days</th>
            <th style={th}>Total</th><th style={th}>Today</th><th style={th}>Status</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const pct = rule.days_required ? Math.min(100, (r.qualifying_days / rule.days_required) * 100) : 0;
              return (
                <>
                  <tr key={r.employee_id} style={{ cursor: "pointer" }} onClick={() => setOpen(open === r.employee_id ? null : r.employee_id)}>
                    <td style={td}><b>{r.name}</b><div style={{ color: C.sub, fontSize: 12 }}>{r.code} {r.department && `· ${r.department}`}</div></td>
                                        <td style={td} onClick={(e) => e.stopPropagation()}>
                      {forced_source ? <span style={{ fontSize: 13 }}>{SOURCE[forced_source]}</span> : (
                        <select value={r.overridden ? r.source : "auto"} onChange={(e) => changeSource(r, e.target.value)}
                          style={{ padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }}>
                          <option value="auto">Auto ({SOURCE[r.auto_source]})</option>
                          {Object.entries(SOURCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={td}>
                      <b>{r.qualifying_days}</b> / {rule.days_required}
                      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, marginTop: 5, width: 130 }}>
                        <div style={{ height: 6, borderRadius: 4, width: `${pct}%`, background: r.qualified ? C.green : C.blue }} />
                      </div>
                    </td>
                    <td style={td}>{r.total}</td>
                    <td style={td}>{r.today_count}</td>
                    <td style={td}>
                      {r.qualified ? <Pill color={C.green} bg="#dcfce7">Qualified</Pill>
                        : r.can_still_qualify ? <Pill color={C.blue} bg="#eff6ff">On track · {r.remaining_days} days left</Pill>
                        : <Pill color={C.red} bg="#fef2f2">Cannot qualify</Pill>}
                    </td>
                  </tr>
                  {open === r.employee_id && (
                    <tr key={`${r.employee_id}-d`}><td colSpan={6} style={{ ...td, background: "#f9fafb" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {period.days.map((d) => {
                          const n = r.days[d] || 0;
                          const met = n > 0 && n >= rule.min_daily_value;
                          return (
                            <div key={d} title={`${d}: ${n}`} style={{ width: 34, textAlign: "center", padding: "4px 0", borderRadius: 6, fontSize: 11,
                              background: met ? "#dcfce7" : n > 0 ? "#fef9c3" : "#fff", border: `1px solid ${C.border}`, color: met ? C.green : C.sub }}>
                              <div style={{ fontSize: 10 }}>{d.slice(8)}</div><b>{n}</b>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: C.sub }}>Green = target met that day. Yellow = some, but below the daily minimum.</p>
                    </td></tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}