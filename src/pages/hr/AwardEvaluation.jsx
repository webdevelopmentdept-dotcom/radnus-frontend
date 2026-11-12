// src/pages/hr/AwardEvaluation.jsx  (Phase 2 screen)
// Talks to /api/award-results. Evaluate, enter manual scores, override, finalize.
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Play, RefreshCw, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/award-results`;
const REWARDS_API = `${import.meta.env.VITE_API_BASE_URL}/api/rewards`;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", red: "#b91c1c", amber: "#b45309" };

const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";
const label = (k) => String(k).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const fmt = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 });

const btn = (kind = "ghost") => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
  fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${kind === "primary" ? C.blue : C.border}`,
  background: kind === "primary" ? C.blue : kind === "danger" ? "#fef2f2" : "#fff",
  color: kind === "primary" ? "#fff" : kind === "danger" ? C.red : C.text,
});
const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, background: "#f9fafb" };
const td = { padding: "12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "top" };

function Pill({ children, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color, background: bg }}>{children}</span>;
}

export default function AwardEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [manual, setManual] = useState({});          // "entityKey|metric" -> typed value
  const [ov, setOv] = useState(null);                // override dialog
  const [confirmFinal, setConfirmFinal] = useState(false);

  const notify = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/${id}`);
      setData(r.data.data); setManual({}); setError("");
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, okMsg) => {
    try { setBusy(true); await fn(); if (okMsg) notify(okMsg); await load(); return true; }
    catch (e) { notify(errMsg(e), "error"); return false; }
    finally { setBusy(false); }
  };

  const evaluate = () => run(() => axios.post(`${API}/${id}/evaluate`), "Evaluation done");

  const saveManual = () => {
    const scores = Object.entries(manual).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => {
      const [entity_key, metric_key] = k.split("|");
      return { entity_key, metric_key, value: Number(v) };
    });
    if (!scores.length) return;
    run(() => axios.put(`${API}/${id}/manual-scores`, { scores }), "Manual scores saved");
  };

  const submitOverride = async () => {
    const body = { entity_key: ov.row.entity_key, action: ov.action, reason: ov.reason };
    if (ov.action === "set_rank") body.rank = ov.rank;
    try {
      setBusy(true);
      await axios.post(`${API}/${id}/override`, body);
      setOv(null); notify("Override saved"); await load();
    } catch (e) { setOv((o) => ({ ...o, error: errMsg(e) })); }
    finally { setBusy(false); }
  };

  const finalize = async () => {
    setConfirmFinal(false);
    await run(() => axios.post(`${API}/${id}/finalize`), "Results finalized");
  };

  const createRewards = async () => {
    try {
      setBusy(true);
      const r = await axios.post(`${REWARDS_API}/awards/${id}/generate`);
      const d = r.data.data;
      notify(`${d.created} reward entries created${d.over_budget ? ". Over budget!" : ""}`, d.over_budget ? "error" : "success");
      setTimeout(() => navigate("/hr/dashboard/recognition/rewards-register"), 1200);
    } catch (e) { notify(errMsg(e), "error"); }
    finally { setBusy(false); }
  };

  if (loading && !data) return <p style={{ padding: 32, color: C.sub }}>Loading...</p>;
  if (error && !data) return (
    <div style={{ padding: 32 }}>
      <p style={{ color: C.red }}><AlertCircle size={16} style={{ verticalAlign: -3 }} /> {error}</p>
      <button style={btn()} onClick={() => navigate("/hr/dashboard/recognition/award-config")}>Back</button>
    </div>
  );

  const { award, locked, evaluated, manual_metrics = [], ranked = [], not_ranked = [] } = data;
  const limit = award.winners?.mode === "all_qualifying" ? Infinity : award.winners?.count || 0;
  const dirty = Object.values(manual).filter((v) => v !== "").length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1250 }}>
      {toast && (
        <div role="status" style={{
          position: "fixed", top: 20, right: 20, zIndex: 80, padding: "10px 16px", borderRadius: 8, color: "#fff", fontSize: 13,
          background: toast.type === "error" ? C.red : C.green
        }}>{toast.msg}</div>
      )}

      <button style={{ ...btn(), marginBottom: 14 }} onClick={() => navigate("/hr/dashboard/recognition/award-config")}>
        <ArrowLeft size={14} /> Award configuration
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{award.name}</h1>
          <p style={{ margin: "6px 0 0", color: C.sub, fontSize: 13 }}>
            Evaluation. Status: <b>{award.status}</b>
            {award.winners?.mode === "top_n" ? ` · Top ${award.winners.count} win` : " · All who qualify win"}
            {award.participation === "team" ? " · Team award" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!locked && (
            <button style={btn("primary")} disabled={busy} onClick={evaluate}>
              {evaluated ? <RefreshCw size={14} /> : <Play size={14} />} {evaluated ? "Re-evaluate" : "Run evaluation"}
            </button>
          )}
          {!locked && evaluated && (
            <button style={btn()} disabled={busy} onClick={() => setConfirmFinal(true)}><Lock size={14} /> Finalize results</button>
          )}
          {locked && (
            <button style={btn("primary")} disabled={busy} onClick={createRewards}>Create reward entries</button>
          )}
        </div>
      </div>

      {locked && (
        <p style={{ marginTop: 16, padding: "10px 14px", background: "#ecfdf5", color: C.green, borderRadius: 8, fontSize: 13 }}>
          <CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> Results are finalized. They can no longer be changed.
        </p>
      )}

      {!evaluated ? (
        <div style={{ marginTop: 24, padding: 40, textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 12, color: C.sub }}>
          Not evaluated yet. Click <b>Run evaluation</b> to rank employees using KPI, attendance and the other metrics.
        </div>
      ) : (
        <>
          {/* ── ranked ── */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Ranking ({ranked.length} eligible)</h2>
            {manual_metrics.length > 0 && !locked && (
              <button style={btn("primary")} disabled={busy || !dirty} onClick={saveManual}>Save manual scores{dirty ? ` (${dirty})` : ""}</button>
            )}
          </div>
          <div style={{ marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
            {ranked.length === 0 ? (
              <p style={{ padding: 28, textAlign: "center", color: C.sub, margin: 0 }}>Nobody is eligible yet. See the reasons below.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead><tr>
                  <th style={th}>Rank</th><th style={th}>Name</th><th style={th}>Score</th><th style={th}>Metrics</th>
                  {manual_metrics.length > 0 && <th style={th}>Manual (0-100)</th>}
                  {!locked && <th style={th}>Actions</th>}
                </tr></thead>
                <tbody>
                  {ranked.map((r) => {
                    const win = r.final_rank != null && r.final_rank <= limit;
                    return (
                      <tr key={r.entity_key} style={{ background: win ? "#f0fdf4" : "transparent" }}>
                        <td style={td}>
                          <b style={{ fontSize: 16 }}>{r.final_rank ?? "-"}</b>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                            {win && <Pill color={C.green} bg="#dcfce7">Winner</Pill>}
                            {r.tied && !r.override?.final_rank && <Pill color={C.amber} bg="#fffbeb">Tie</Pill>}
                            {r.override?.final_rank != null && <Pill color="#6d28d9" bg="#f5f3ff">Override</Pill>}
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ fontWeight: 700 }}>{r.entity_name}</div>
                          <div style={{ color: C.sub, fontSize: 12 }}>{r.employee_code} {r.department && `· ${r.department}`}</div>
                          {r.override?.reason && <div style={{ color: "#6d28d9", fontSize: 12, marginTop: 4 }}>Reason: {r.override.reason} ({r.override.by})</div>}
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>{fmt(r.weighted_score)}</td>
                        <td style={td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {r.metric_values.map((m) => (
                              <span key={m.metric_key} style={{ fontSize: 12, color: m.missing ? C.red : C.text }}>
                                {label(m.metric_key)} ({m.weight}%): {m.missing ? "no data" : `${fmt(m.raw)} → ${fmt(m.score)}`}
                              </span>
                            ))}
                          </div>
                        </td>
                        {manual_metrics.length > 0 && (
                          <td style={td}>
                            {manual_metrics.map((k) => {
                              const key = `${r.entity_key}|${k}`;
                              return (
                                <label key={k} style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 4 }}>
                                  {label(k)}
                                  <input type="number" min="0" max="100" disabled={locked}
                                    value={manual[key] ?? r.manual_scores?.[k] ?? ""}
                                    onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                                    style={{ display: "block", width: 80, padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 6 }} />
                                </label>
                              );
                            })}
                          </td>
                        )}
                        {!locked && (
                          <td style={td}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button style={btn()} onClick={() => setOv({ row: r, action: "set_rank", rank: r.final_rank || 1, reason: "", error: "" })}>Set rank</button>
                              <button style={btn("danger")} onClick={() => setOv({ row: r, action: "disqualify", reason: "", error: "" })}>Disqualify</button>
                              {r.override?.reason && <button style={btn()} onClick={() => setOv({ row: r, action: "clear", reason: "", error: "" })}>Undo</button>}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── not ranked ── */}
          <h2 style={{ margin: "28px 0 10px", fontSize: 16 }}>Not ranked ({not_ranked.length})</h2>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
            {not_ranked.length === 0 ? (
              <p style={{ padding: 20, color: C.sub, margin: 0, fontSize: 13 }}>Everyone is eligible.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead><tr><th style={th}>Name</th><th style={th}>Why not ranked</th></tr></thead>
                <tbody>
                  {not_ranked.map((r) => (
                    <tr key={r.entity_key}>
                      <td style={td}><b>{r.entity_name}</b><div style={{ color: C.sub, fontSize: 12 }}>{r.department}</div></td>
                      <td style={{ ...td, color: C.red }}>
                        {r.override?.disqualified ? `Disqualified by committee: ${r.override.reason}` : r.eligibility.reasons.join(" | ") || "-"}
                        {!locked && r.override?.disqualified && (
                          <button style={{ ...btn(), marginLeft: 10 }} onClick={() => setOv({ row: r, action: "clear", reason: "", error: "" })}>Undo</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── override dialog ── */}
      {ov && (
        <div onMouseDown={(e) => e.target === e.currentTarget && setOv(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 70 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 22, width: 420, maxWidth: "92vw" }}>
            <h3 style={{ margin: "0 0 4px" }}>
              {ov.action === "set_rank" ? "Set rank" : ov.action === "disqualify" ? "Disqualify" : "Undo override"} · {ov.row.entity_name}
            </h3>
            {ov.action === "set_rank" && (
              <label style={{ display: "block", marginTop: 12, fontSize: 13 }}>Final rank
                <input type="number" min="1" value={ov.rank} onChange={(e) => setOv({ ...ov, rank: e.target.value })}
                  style={{ display: "block", width: 100, padding: "7px 10px", marginTop: 4, border: `1px solid ${C.border}`, borderRadius: 6 }} />
              </label>
            )}
            {ov.action !== "clear" && (
              <label style={{ display: "block", marginTop: 12, fontSize: 13 }}>Reason (required, min 10 characters)
                <textarea rows={3} value={ov.reason} onChange={(e) => setOv({ ...ov, reason: e.target.value })}
                  style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 8, marginTop: 4, border: `1px solid ${C.border}`, borderRadius: 6 }} />
              </label>
            )}
            {ov.error && <p style={{ color: C.red, fontSize: 13, margin: "10px 0 0" }}>{ov.error}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button style={btn()} onClick={() => setOv(null)}>Cancel</button>
              <button style={btn("primary")} disabled={busy} onClick={submitOverride}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── finalize confirm ── */}
      {confirmFinal && (
        <div onMouseDown={(e) => e.target === e.currentTarget && setConfirmFinal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 70 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 22, width: 420, maxWidth: "92vw" }}>
            <h3 style={{ margin: "0 0 8px" }}>Finalize results?</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.sub }}>The ranking will be frozen. You will not be able to re-evaluate, enter scores or override after this.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button style={btn()} onClick={() => setConfirmFinal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={finalize}>Yes, finalize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}