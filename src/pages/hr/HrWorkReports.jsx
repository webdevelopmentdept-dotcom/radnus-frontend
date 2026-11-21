import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const shiftDate = (d, n) => new Date(new Date(d + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);

const scoreColor = (s) => (s == null ? "secondary" : s >= 75 ? "success" : s >= 50 ? "warning" : "danger");

function TrendChart({ data }) {
  if (!data.length) return null;
  const W = 640;
  const H = 190;
  const pad = 28;
  const bw = (W - pad * 2) / data.length;
  const dateStep = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;
  const showVals = data.length <= 14;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-100" style={{ maxHeight: 240 }} role="img" aria-label="Average score per day">
      {[0, 50, 100].map((v) => {
        const y = H - pad - ((H - pad * 2) * v) / 100;
        return (
          <g key={v}>
            <line x1={pad} x2={W - pad} y1={y} y2={y} stroke="#e3e7ee" strokeDasharray={v === 0 ? "0" : "4 4"} />
            <text x={2} y={y + 4} fontSize="11" fill="#8a94a4">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = d.avgScore == null ? 0 : ((H - pad * 2) * d.avgScore) / 100;
        const w = Math.min(bw * 0.6, 44);
        const x = pad + i * bw + (bw - w) / 2;
        const fill = d.avgScore == null ? "#e3e7ee" : d.avgScore >= 75 ? "#18a572" : d.avgScore >= 50 ? "#2556e8" : "#e0463d";
        return (
          <g key={d.date}>
            <rect x={x} y={H - pad - h} width={w} height={h} rx="4" fill={fill} />
            {showVals && (
              <text x={x + w / 2} y={H - pad - h - 5} fontSize="11" textAnchor="middle" fill="#5b6677">{d.avgScore ?? ""}</text>
            )}
            {i % dateStep === 0 && (
              <text x={x + w / 2} y={H - 9} fontSize="10.5" textAnchor="middle" fill="#8a94a4">{d.date.slice(5)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const STYLES = `
.wr{--ink:#18212f;--sub:#5b6677;--faint:#8a94a4;--line:#e3e7ee;--card:#fff;--brand:#2556e8;--brand-soft:#e9efff;
--ok:#0f7a55;--ok-bg:#e2f5ec;--warn:#92600a;--warn-bg:#fdf0d0;--bad:#b3261e;--bad-bg:#fde7e5;--mut:#475467;--mut-bg:#edf0f4;
padding:28px 32px 48px;max-width:1440px;color:var(--ink);font-size:14px}
.wr *{box-sizing:border-box}
.wr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.wr-head h1{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:0 0 4px}
.wr-head p{margin:0;color:var(--sub)}
.wr-card{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wr-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 16px;margin:20px 0 16px}
.wr-arrow{color:var(--faint)}
.wr .form-control,.wr .form-select{border-radius:8px;border-color:#d5dbe5;font-size:14px;min-height:38px;color:var(--ink)}
.wr .form-control:focus,.wr .form-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,86,232,.15)}
.wr .form-check-input:checked{background-color:var(--brand);border-color:var(--brand)}
.wr-seg{display:inline-flex;background:#edf0f5;border-radius:9px;padding:3px;gap:2px}
.wr-seg button{appearance:none;border:0;background:transparent;padding:6px 14px;font-size:13px;font-weight:600;color:var(--sub);border-radius:7px;cursor:pointer;white-space:nowrap}
.wr-seg button.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.14)}
.wr-btn{appearance:none;border:1px solid transparent;border-radius:8px;font-size:13.5px;font-weight:600;padding:9px 16px;line-height:1.3;cursor:pointer;white-space:nowrap;transition:background .15s}
.wr-btn:disabled{opacity:.55;cursor:not-allowed}
.wr-btn--ok{background:var(--ok);color:#fff}.wr-btn--ok:hover:not(:disabled){background:#0a6445}

.wr-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}
.wr-stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wr-stat span{display:block;color:var(--sub);font-size:12.5px;font-weight:500;margin-bottom:4px}
.wr-stat b{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.wr-card__head{padding:14px 20px;border-bottom:1px solid var(--line);font-size:15px;font-weight:700}
.wr-chart{padding:12px 16px 8px}
.wr+.x{display:none}
.wr-card+.wr-card,.wr-stats+.wr-card{margin-bottom:16px}

.wr-wrap{overflow-x:auto}
.wr-table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}
.wr-table th{background:#f8f9fc;color:var(--sub);font-size:12.5px;font-weight:600;padding:11px 14px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
.wr-table td{padding:13px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
.wr-table tbody tr:last-child td{border-bottom:0}
.wr-table tbody tr:hover td{background:#fafbfe}
.wr-table .c{text-align:center}
.wr-num{font-weight:600;font-variant-numeric:tabular-nums}
.wr-emp{display:flex;align-items:center;gap:12px}
.wr-av{width:36px;height:36px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none}
.wr-emp b{display:block;font-weight:600;line-height:1.3}
.wr-emp small{color:var(--faint);font-size:12.5px}
.wr-score{display:flex;align-items:center;gap:8px;min-width:130px}
.wr-bar{flex:1;height:6px;border-radius:3px;background:var(--mut-bg);overflow:hidden}
.wr-bar i{display:block;height:100%;border-radius:3px;background:#c3cad6}
.wr-bar i.success{background:#18a572}.wr-bar i.warning{background:#e8a317}.wr-bar i.danger{background:#e0463d}
.wr-pill{display:inline-flex;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px}
.wr-pill--warning{background:var(--warn-bg);color:var(--warn)}.wr-pill--danger{background:var(--bad-bg);color:var(--bad)}
.wr-zero{color:#c3cad6}
.wr-empty{padding:44px 20px;text-align:center;color:var(--faint)}

.wr-toast{position:fixed;top:20px;right:24px;z-index:2000;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(16,24,40,.18);border:1px solid}
.wr-toast--success{background:var(--ok-bg);color:var(--ok);border-color:#b7e3cf}
.wr-toast--danger{background:var(--bad-bg);color:var(--bad);border-color:#f4c1bd}

@media (max-width:1199.98px){.wr-stats{grid-template-columns:repeat(3,1fr)}}
@media (max-width:991.98px){.wr{padding:22px 20px 40px}}
@media (max-width:767.98px){
  .wr{padding:16px 12px 36px}
  .wr-head h1{font-size:22px}
  .wr-head .wr-btn{width:100%;min-height:42px}
  .wr-toolbar{padding:12px}
  .wr-seg{display:flex;width:100%}.wr-seg button{flex:1;padding:9px 4px}
  .wr-toolbar input[type=date]{flex:1;min-width:0;width:auto !important}
  .wr-toolbar .form-select{width:100% !important}
  .wr .form-control,.wr .form-select{font-size:16px;min-height:42px}
  .wr-stats{grid-template-columns:repeat(2,1fr);gap:10px}
  .wr-stat{padding:12px 14px}.wr-stat b{font-size:21px}
  .wr-stats .wr-stat:last-child:nth-child(odd){grid-column:1/-1}
  .wr-table{min-width:0}
  .wr-table thead{display:none}
  .wr-table,.wr-table tbody{display:block;width:100%}
  .wr-table tr{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;padding:14px;border-bottom:1px solid var(--line)}
  .wr-table tbody tr:last-child{border-bottom:0}
  .wr-table tr.wr-msg{display:block}
  .wr-table td{padding:0;border:0;display:block;text-align:left !important}
  .wr-table tbody tr:hover td{background:transparent}
  .wr-table td:first-child,.wr-table td.wr-wide{grid-column:1/-1}
  .wr-table td[data-label]::before{content:attr(data-label);display:block;color:var(--faint);font-size:11.5px;font-weight:500;margin-bottom:2px}
  .wr-toast{left:12px;right:12px;top:12px;text-align:center}
}
`;

export default function HrWorkReports() {
  const [to, setTo] = useState(todayIST());
  const [from, setFrom] = useState(shiftDate(todayIST(), -6));
  const [dept, setDept] = useState("");
  const [wfhOnly, setWfhOnly] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const say = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const params = { from, to, department: dept || undefined, wfh: wfhOnly ? "1" : undefined };

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/work/assignable`)
      .then((r) => setDepartments([...new Set((r.data.data || []).map((e) => e.department).filter(Boolean))].sort()))
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/api/work/summary`, { params });
      setData(r.data);
    } catch (e) {
      say("danger", e?.response?.data?.message || "Failed to load the report");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [from, to, dept, wfhOnly]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const r = await axios.get(`${API_BASE}/api/work/export`, { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `wfh-report-${from}-to-${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      say("danger", "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const setQuick = (days) => {
    const end = todayIST();
    setTo(end);
    setFrom(shiftDate(end, -(days - 1)));
  };

  const cards = data?.cards;
  const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const isQuick = (d) => to === todayIST() && from === shiftDate(to, -(d - 1));
  const avgTone = cards?.avgScore == null ? "var(--ink)" : cards.avgScore >= 75 ? "var(--ok)" : cards.avgScore >= 50 ? "var(--warn)" : "var(--bad)";

  return (
    <div className="wr">
      <style>{STYLES}</style>

      {toast && <div className={`wr-toast wr-toast--${toast.type}`} role="status">{toast.text}</div>}

      <div className="wr-head">
        <div>
          <h1>WFH Reports</h1>
          <p>Daily plan, EOD and score summary (maximum 31 days)</p>
        </div>
        <button className="wr-btn wr-btn--ok" disabled={exporting} onClick={exportExcel}>
          {exporting ? "Exporting..." : "⬇ Export Excel"}
        </button>
      </div>

      <div className="wr-card wr-toolbar">
        <div className="wr-seg">
          {[7, 14, 31].map((d) => (
            <button key={d} className={isQuick(d) ? "is-on" : ""} onClick={() => setQuick(d)}>{d} days</button>
          ))}
        </div>
        <input type="date" className="form-control form-control-sm w-auto" value={from} max={to}
          onChange={(e) => setFrom(e.target.value || from)} />
        <span className="wr-arrow">→</span>
        <input type="date" className="form-control form-control-sm w-auto" value={to} max={todayIST()}
          onChange={(e) => {
            const v = e.target.value || to;
            setTo(v);
            if (from > v) setFrom(v);
          }} />
        <select className="form-select form-select-sm w-auto" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 ps-0">
          <input className="form-check-input ms-0" type="checkbox" id="wrwfh" checked={wfhOnly} onChange={(e) => setWfhOnly(e.target.checked)} />
          <label className="form-check-label" htmlFor="wrwfh">WFH only</label>
        </div>
      </div>

      {cards && (
        <div className="wr-stats">
          {[
            ["Employees", cards.employees],
            ["Reports", cards.reports],
            ["EOD submitted", `${cards.eodRate}%`],
            ["Average score", cards.avgScore != null ? `${cards.avgScore}%` : "—"],
            ["Rework requested", cards.rework],
          ].map(([label, value]) => (
            <div key={label} className="wr-stat">
              <span>{label}</span>
              <b style={label === "Average score" ? { color: avgTone } : undefined}>{value}</b>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="wr-card">
          <div className="wr-card__head">Average score per day</div>
          <div className="wr-chart"><TrendChart data={data.trend} /></div>
        </div>
      )}

      <div className="wr-card">
        <div className="wr-wrap">
          <table className="wr-table">
            <thead>
              <tr>
                <th>Employee</th><th>Department</th><th className="c">Days</th><th className="c">WFH days</th><th className="c">Plans</th><th className="c">EODs</th>
                <th style={{ minWidth: 150 }}>Avg score</th><th className="c">Tasks done</th><th className="c">Accepted</th><th className="c">Rework</th><th className="c">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="wr-msg"><td colSpan={11}><div className="wr-empty">Loading...</div></td></tr>}
              {!loading && !data?.rows?.length && (
                <tr className="wr-msg"><td colSpan={11}><div className="wr-empty">No data for this range</div></td></tr>
              )}
              {!loading && data?.rows?.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="wr-emp">
                      <div className="wr-av">{initials(r.name)}</div>
                      <div>
                        <b>{r.name}</b>
                        <small>{r.employeeId}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Department" className="wr-wide">{r.department || "—"}</td>
                  <td data-label="Days" className="c wr-num">{r.days}</td>
                  <td data-label="WFH days" className="c wr-num">{r.wfhDays}</td>
                  <td data-label="Plans" className="c wr-num">{r.planDays}</td>
                  <td data-label="EODs" className="c wr-num">{r.eodDays}</td>
                  <td data-label="Avg score" className="wr-wide">
                    {r.avgScore != null ? (
                      <div className="wr-score">
                        <div className="wr-bar"><i className={scoreColor(r.avgScore)} style={{ width: `${r.avgScore}%` }} /></div>
                        <span className="wr-num">{r.avgScore}%</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td data-label="Tasks done" className="c wr-num">{r.completed}/{r.tasks}</td>
                  <td data-label="Accepted" className="c wr-num">{r.accepted}</td>
                  <td data-label="Rework" className="c">{r.rework > 0 ? <span className="wr-pill wr-pill--warning">{r.rework}</span> : <span className="wr-zero">0</span>}</td>
                  <td data-label="Overdue" className="c">{r.overdue > 0 ? <span className="wr-pill wr-pill--danger">{r.overdue}</span> : <span className="wr-zero">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}