import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayStr = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

const emptyForm = { workMode: "wfh", wfhFrom: "", wfhTo: "", wfhDays: [], wfhReason: "" };

const STYLES = `
.wm{--ink:#18212f;--sub:#5b6677;--faint:#8a94a4;--line:#e3e7ee;--card:#fff;--brand:#2556e8;--brand-soft:#e9efff;
--ok:#0f7a55;--ok-bg:#e2f5ec;--warn:#92600a;--warn-bg:#fdf0d0;--bad:#b3261e;--bad-bg:#fde7e5;--info:#0b6b86;--info-bg:#def3f8;--mut:#475467;--mut-bg:#edf0f4;
padding:28px 32px 48px;max-width:1440px;color:var(--ink);font-size:14px}
.wm *{box-sizing:border-box}
.wm-head h1{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:0 0 4px}
.wm-head p{margin:0;color:var(--sub)}
.wm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,230px));gap:12px;margin:22px 0 18px}
.wm-stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wm-stat span{display:block;color:var(--sub);font-size:12.5px;font-weight:500;margin-bottom:4px}
.wm-stat b{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.wm-stat.brand b{color:var(--brand)}

.wm-card{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wm-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;margin-bottom:16px}
.wm-search{flex:1;min-width:220px;position:relative}
.wm-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--faint)}
.wm-search input{padding-left:38px}
.wm .form-control,.wm .form-select{border-radius:8px;border-color:#d5dbe5;font-size:14px;min-height:40px;color:var(--ink)}
.wm .form-control:focus,.wm .form-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,86,232,.15)}
.wm label.lbl{display:block;font-size:12px;font-weight:600;color:var(--sub);margin-bottom:5px}
.wm-seg{display:inline-flex;background:#edf0f5;border-radius:9px;padding:3px;gap:2px}
.wm-seg button{appearance:none;border:0;background:transparent;padding:7px 14px;font-size:13px;font-weight:600;color:var(--sub);border-radius:7px;cursor:pointer;white-space:nowrap}
.wm-seg button.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.14)}

.wm-btn{appearance:none;border:1px solid transparent;border-radius:8px;font-size:13px;font-weight:600;padding:7px 14px;line-height:1.3;cursor:pointer;transition:background .15s;white-space:nowrap}
.wm-btn:disabled{opacity:.55;cursor:not-allowed}
.wm-btn--primary{background:var(--brand);color:#fff}.wm-btn--primary:hover:not(:disabled){background:#1b45c4}
.wm-btn--ghost{background:#fff;border-color:#d5dbe5;color:var(--ink)}.wm-btn--ghost:hover{background:#f1f4f9}

.wm-pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;line-height:1.5;white-space:nowrap}
.wm-pill i{width:6px;height:6px;border-radius:50%;background:currentColor}
.wm-pill--brand{background:var(--brand-soft);color:var(--brand)}
.wm-pill--info{background:var(--info-bg);color:var(--info)}
.wm-pill--muted{background:var(--mut-bg);color:var(--mut)}
.wm-pill--line{background:#fff;color:var(--sub);border:1px solid var(--line);font-weight:500}

.wm-wrap{overflow-x:auto}
.wm-table{width:100%;border-collapse:separate;border-spacing:0}
.wm-table th{background:#f8f9fc;color:var(--sub);font-size:12.5px;font-weight:600;padding:11px 16px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
.wm-table th:first-child{border-radius:12px 0 0 0}.wm-table th:last-child{border-radius:0 12px 0 0}
.wm-table td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.wm-table tbody tr:last-child td{border-bottom:0}
.wm-table tbody tr:hover td{background:#fafbfe}
.wm-emp{display:flex;align-items:center;gap:12px;min-width:0}
.wm-av{width:38px;height:38px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none}
.wm-emp b{display:block;font-weight:600;line-height:1.3}
.wm-emp small{color:var(--faint);font-size:12.5px}
.wm-period{white-space:nowrap}
.wm-days{display:block;color:var(--faint);font-size:12px;margin-top:2px}
.wm-reason{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sub)}
.wm-dash{color:#c3cad6}
.wm-empty{padding:44px 20px;text-align:center;color:var(--faint)}
.wm-count{color:var(--faint);font-size:13px;padding:12px 16px;border-top:1px solid var(--line)}

.wm-modal{position:fixed;inset:0;z-index:1055;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}
.wm-dialog{background:#fff;border-radius:14px;width:100%;max-width:520px;box-shadow:0 24px 60px rgba(15,23,42,.3)}
.wm-dialog__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid var(--line)}
.wm-dialog__head h2{font-size:17px;font-weight:700;margin:0}
.wm-dialog__head h2 span{color:var(--sub);font-weight:500}
.wm-x{appearance:none;border:0;background:#f1f4f9;color:var(--sub);width:34px;height:34px;border-radius:8px;font-size:15px;cursor:pointer;flex:none}
.wm-x:hover{background:#e5e9f0;color:var(--ink)}
.wm-dialog__body{padding:20px 22px}
.wm-dialog__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--line);background:#fafbfd;border-radius:0 0 14px 14px}
.wm-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}
.wm-mode{appearance:none;border:1.5px solid #d5dbe5;background:#fff;border-radius:10px;padding:10px 6px;font-size:13px;font-weight:600;color:var(--sub);cursor:pointer;line-height:1.3}
.wm-mode:hover{border-color:#aebbd3}
.wm-mode.is-on{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}
.wm-dayrow{display:flex;flex-wrap:wrap;gap:6px}
.wm-day{appearance:none;border:1px solid #d5dbe5;background:#fff;color:var(--sub);font-size:13px;font-weight:600;border-radius:8px;padding:6px 12px;cursor:pointer}
.wm-day.is-on{background:var(--brand);border-color:var(--brand);color:#fff}

.wm-toast{position:fixed;top:20px;right:24px;z-index:2000;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(16,24,40,.18);border:1px solid}
.wm-toast--success{background:var(--ok-bg);color:var(--ok);border-color:#b7e3cf}
.wm-toast--danger{background:var(--bad-bg);color:var(--bad);border-color:#f4c1bd}

@media (max-width:991.98px){.wm{padding:22px 20px 40px}}
@media (max-width:767.98px){
  .wm{padding:16px 12px 36px}
  .wm-head h1{font-size:22px}
  .wm-stats{grid-template-columns:repeat(3,1fr);gap:8px}
  .wm-stat{padding:10px 12px}.wm-stat b{font-size:20px}.wm-stat span{font-size:11.5px}
  .wm-toolbar{padding:10px 12px}
  .wm-seg{display:flex;width:100%}.wm-seg button{flex:1;padding:9px 4px}
  .wm .form-control{font-size:16px;min-height:42px}
  /* table -> cards */
  .wm-table thead{display:none}
  .wm-table,.wm-table tbody,.wm-table tr,.wm-table td{display:block;width:100%}
  .wm-table tr{padding:14px 14px 12px;border-bottom:1px solid var(--line)}
  .wm-table tbody tr:last-child{border-bottom:0}
  .wm-table td{padding:0;border:0}
  .wm-table tbody tr:hover td{background:transparent}
  .wm-table td[data-label]{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:13.5px}
  .wm-table td[data-label]::before{content:attr(data-label);color:var(--faint);font-weight:500;flex:none}
  .wm-table td[data-label]>*,.wm-table td[data-label]{text-align:right}
  .wm-table td.wm-actions{padding-top:10px}
  .wm-table td.wm-actions .wm-btn{width:100%;min-height:40px}
  .wm-reason{max-width:60%;white-space:normal}
  .wm-modal{align-items:flex-end;padding:0}
  .wm-dialog{max-width:none;border-radius:16px 16px 0 0}
  .wm-dialog__foot{border-radius:0}
  .wm-dialog__foot .wm-btn{flex:1;min-height:42px}
  .wm-toast{left:12px;right:12px;top:12px;text-align:center}
}
`;

export default function WorkModeManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all"); // all | wfh | office
  const [edit, setEdit] = useState(null);              // employee row
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/work-mode`);
      const j = await res.json();
      setRows(j.data || []);
    } catch {
      showToast("danger", "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openEdit = (emp) => {
    setEdit(emp);
    setForm(
      emp.workMode && emp.workMode !== "office"
        ? {
            workMode: emp.workMode,
            wfhFrom: emp.wfhFrom || "",
            wfhTo: emp.wfhTo || "",
            wfhDays: emp.wfhDays || [],
            wfhReason: emp.wfhReason || "",
          }
        : { ...emptyForm, wfhFrom: todayStr() }
    );
  };

  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      wfhDays: f.wfhDays.includes(d) ? f.wfhDays.filter((x) => x !== d) : [...f.wfhDays, d],
    }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/work-mode/${edit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || "Failed");
      showToast("success", "Work mode updated ✅");
      setEdit(null);
      load();
    } catch (e) {
      showToast("danger", e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (modeFilter !== "all" && r.effectiveToday !== modeFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.employeeId, r.department].some((v) =>
        String(v || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, modeFilter]);

  const wfhToday = rows.filter((r) => r.effectiveToday === "wfh").length;

  const modeTone = (r) => {
    if (r.effectiveToday === "wfh") return ["brand", "WFH today"];
    if (r.workMode === "hybrid") return ["info", "Hybrid (office today)"];
    if (r.workMode === "wfh") return ["muted", "WFH (not started / ended)"];
    return ["line", "Office"];
  };
  const badge = (r) => {
    const [tone, label] = modeTone(r);
    return <span className={`wm-pill wm-pill--${tone}`}>{tone === "brand" && <i />}{label}</span>;
  };
  const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const officeToday = rows.length - wfhToday;

  return (
    <div className="wm">
      <style>{STYLES}</style>

      {toast && <div className={`wm-toast wm-toast--${toast.type}`} role="status">{toast.text}</div>}

      <div className="wm-head">
        <h1>Work Mode</h1>
        <p>Switch employees between Office / WFH / Hybrid</p>
      </div>

      <div className="wm-stats">
        <div className="wm-stat"><span>Total employees</span><b>{rows.length}</b></div>
        <div className="wm-stat brand"><span>WFH today</span><b>{wfhToday}</b></div>
        <div className="wm-stat"><span>Office today</span><b>{officeToday}</b></div>
      </div>

      <div className="wm-card wm-toolbar">
        <div className="wm-search">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" /><path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="form-control"
            placeholder="Search name, email, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="wm-seg">
          {[["all", "All"], ["wfh", "WFH today"], ["office", "Office today"]].map(([k, l]) => (
            <button key={k} className={modeFilter === k ? "is-on" : ""} onClick={() => setModeFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="wm-card">
        <div className="wm-wrap">
          <table className="wm-table">
            <thead>
              <tr>
                <th>Employee</th><th>Department</th><th>Mode</th><th>Period</th><th>Reason</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}><div className="wm-empty">Loading...</div></td></tr>}
              {!loading && !filtered.length && (
                <tr><td colSpan={6}><div className="wm-empty">No employees found</div></td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="wm-emp">
                      <div className="wm-av">{initials(r.name)}</div>
                      <div>
                        <b>{r.name}</b>
                        <small>{r.employeeId} · {r.designation || "—"}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Department">{r.department || "—"}</td>
                  <td data-label="Mode">{badge(r)}</td>
                  <td data-label="Period">
                    {r.workMode !== "office" ? (
                      <span className="wm-period">
                        {r.wfhFrom} → {r.wfhTo || "open"}
                        {r.workMode === "hybrid" && <span className="wm-days">{(r.wfhDays || []).join(", ")}</span>}
                      </span>
                    ) : <span className="wm-dash">—</span>}
                  </td>
                  <td data-label="Reason"><div className="wm-reason" title={r.wfhReason || ""}>{r.wfhReason || <span className="wm-dash">—</span>}</div></td>
                  <td className="text-end wm-actions">
                    <button className="wm-btn wm-btn--ghost" onClick={() => openEdit(r)}>Change</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && <div className="wm-count">Showing {filtered.length} of {rows.length} employees</div>}
      </div>

      {edit && (
        <div className="wm-modal" role="dialog" aria-modal="true">
          <div className="wm-dialog">
            <div className="wm-dialog__head">
              <h2>Work mode <span>— {edit.name}</span></h2>
              <button className="wm-x" aria-label="Close" onClick={() => setEdit(null)}>✕</button>
            </div>
            <div className="wm-dialog__body">
              <label className="lbl">Mode</label>
              <div className="wm-modes">
                {[["office", "Office"], ["wfh", "Work From Home"], ["hybrid", "Hybrid"]].map(([k, l]) => (
                  <button
                    key={k}
                    className={`wm-mode ${form.workMode === k ? "is-on" : ""}`}
                    onClick={() => setForm({ ...form, workMode: k })}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {form.workMode !== "office" && (
                <>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="lbl">From</label>
                      <input type="date" className="form-control" value={form.wfhFrom}
                        onChange={(e) => setForm({ ...form, wfhFrom: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="lbl">To (optional)</label>
                      <input type="date" className="form-control" value={form.wfhTo}
                        onChange={(e) => setForm({ ...form, wfhTo: e.target.value })} />
                    </div>
                  </div>

                  {form.workMode === "hybrid" && (
                    <div className="mb-3">
                      <label className="lbl">WFH days</label>
                      <div className="wm-dayrow">
                        {DAYS.map((d) => (
                          <button key={d} type="button"
                            className={`wm-day ${form.wfhDays.includes(d) ? "is-on" : ""}`}
                            onClick={() => toggleDay(d)}>{d}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="lbl">Reason</label>
                  <textarea className="form-control" rows={3} value={form.wfhReason}
                    onChange={(e) => setForm({ ...form, wfhReason: e.target.value })} />
                </>
              )}
            </div>
            <div className="wm-dialog__foot">
              <button className="wm-btn wm-btn--ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="wm-btn wm-btn--primary" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}