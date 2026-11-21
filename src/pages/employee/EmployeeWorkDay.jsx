import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(new Date(d + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
const weekday = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
const PRI = { high: "danger", medium: "warning", low: "muted" };
const REVIEW_TONE = { accepted: "success", rework: "warning", pending: "muted" };
const draftKey = (date) => `work-day-draft:${localStorage.getItem("employeeId") || "me"}:${date}`;
const UNITS = ["calls", "leads", "follow-ups", "posts", "reels", "designs", "tickets", "bugs", "pages", "hours"];
const emptyTask = {
    task_type: "normal", title: "", description: "", priority: "medium",
    planned_hours: "", target_value: "", unit: "", due_date: "",
};

const STYLES = `
.wd{--ink:#18212f;--sub:#5b6677;--faint:#8a94a4;--line:#e3e7ee;--card:#fff;--brand:#2556e8;--brand-soft:#e9efff;
--ok:#0f7a55;--ok-bg:#e2f5ec;--warn:#92600a;--warn-bg:#fdf0d0;--bad:#b3261e;--bad-bg:#fde7e5;--info:#0b6b86;--info-bg:#def3f8;--mut:#475467;--mut-bg:#edf0f4;
padding:28px 32px 56px;max-width:1120px;color:var(--ink);font-size:14px}
.wd *{box-sizing:border-box}
.wd-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.wd-top h1{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:0 0 8px}
.wd-sub{color:var(--sub);font-size:14px;margin:0}

.wd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:22px 0 12px}
.wd-stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wd-stat span{display:block;color:var(--sub);font-size:12.5px;font-weight:500;margin-bottom:4px}
.wd-stat b{font-size:24px;font-weight:700;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.wd-stat.ok b{color:var(--ok)}.wd-stat.warn b{color:var(--warn)}.wd-stat.info b{color:var(--info)}
.wd-flags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}

.wd-alert{border-radius:10px;padding:11px 14px;margin-top:12px;font-size:13.5px;border:1px solid}
.wd-alert--warn{background:var(--warn-bg);color:var(--warn);border-color:#f2d98f}
.wd-alert--ok{background:var(--ok-bg);color:var(--ok);border-color:#b7e3cf}

.wd-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:22px 0 20px;overflow-x:auto}
.wd-tab{appearance:none;background:none;border:0;padding:10px 16px;font-size:14px;font-weight:600;color:var(--sub);position:relative;white-space:nowrap;display:flex;align-items:center;gap:8px;cursor:pointer;border-radius:8px 8px 0 0}
.wd-tab:hover{color:var(--ink);background:#eef1f6}
.wd-tab.is-on{color:var(--brand)}
.wd-tab.is-on::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--brand);border-radius:2px}
.wd-count{font-size:11px;font-weight:700;min-width:20px;height:20px;padding:0 6px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:var(--mut-bg);color:var(--mut)}
.wd-count--warn{background:var(--warn-bg);color:var(--warn)}

.wd-pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;line-height:1.5;white-space:nowrap}
.wd-pill--success{background:var(--ok-bg);color:var(--ok)}
.wd-pill--warning{background:var(--warn-bg);color:var(--warn)}
.wd-pill--danger{background:var(--bad-bg);color:var(--bad)}
.wd-pill--info{background:var(--info-bg);color:var(--info)}
.wd-pill--muted{background:var(--mut-bg);color:var(--mut)}
.wd-pill--brand{background:var(--brand-soft);color:var(--brand)}
.wd-pill--dark{background:#1f2937;color:#fff}
.wd-pill--line{background:#fff;color:var(--sub);border:1px solid var(--line);font-weight:500}
.wd-cap{text-transform:capitalize}

.wd-card{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wd-card__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line)}
.wd-card__title{font-size:15px;font-weight:700;margin:0}
.wd-card__body{padding:20px}
.wd-empty{padding:40px 20px;text-align:center;color:var(--faint);background:var(--card);border:1px dashed #cdd5e1;border-radius:12px}
.wd-section{font-size:13px;font-weight:700;color:var(--sub);margin:4px 0 10px;display:flex;align-items:center;gap:8px}
.wd-section.bad{color:var(--bad)}
.wd-section:not(:first-child){margin-top:22px}

.wd-task{display:flex;background:var(--card);border:1px solid var(--line);border-radius:12px;margin-bottom:12px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wd-task.is-overdue{border-color:#f1b4af}
.wd-task.is-cancelled{opacity:.62}
.wd-task__bar{width:4px;flex:none;background:#c3cad6}
.wd-task__bar.success{background:#18a572}.wd-task__bar.warning{background:#e8a317}.wd-task__bar.danger{background:#e0463d}
.wd-task__main{flex:1;min-width:0;padding:16px 18px}
.wd-task__top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.wd-task__title{font-size:15.5px;font-weight:600;margin:0}
.wd-task__title.strike{text-decoration:line-through;color:var(--sub)}
.wd-task__desc{color:var(--sub);font-size:13.5px;margin:3px 0 0}
.wd-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.wd-note{margin-top:10px;font-size:13px;color:var(--sub)}
.wd-upd{margin-top:14px;padding:14px;background:#f8f9fc;border:1px solid var(--line);border-radius:10px}
.wd-upd__row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.wd-upd__lbl{font-size:12px;font-weight:600;color:var(--sub);margin-bottom:8px;display:block}
.wd-seg{display:inline-flex;background:#e8ebf1;border-radius:9px;padding:3px;gap:2px}
.wd-seg button{appearance:none;border:0;background:transparent;padding:6px 14px;font-size:13px;font-weight:600;color:var(--sub);border-radius:7px;cursor:pointer}
.wd-seg button.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.14)}
.wd-seg button.is-on.success{color:var(--ok)}.wd-seg button.is-on.warning{color:var(--warn)}
.wd-seg button:disabled{cursor:not-allowed;opacity:.6}
.wd-prog{margin-top:12px}
.wd-prog__meta{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;gap:8px;flex-wrap:wrap}
.wd-bar{height:7px;border-radius:4px;background:#e3e7ee;overflow:hidden}
.wd-bar i{display:block;height:100%;border-radius:4px;background:var(--brand);transition:width .25s}
.wd-bar i.full{background:#18a572}
.wd-files{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}
.wd-file{display:inline-flex;align-items:center;gap:6px;background:var(--brand-soft);border-radius:8px;padding:4px 6px 4px 10px;font-size:12.5px;font-weight:500}
.wd-file a{color:var(--brand);text-decoration:none}
.wd-file button{appearance:none;border:0;background:transparent;color:var(--bad);font-size:12px;width:20px;height:20px;border-radius:50%;cursor:pointer}
.wd-file button:hover{background:var(--bad-bg)}
.wd-upload{display:inline-flex;align-items:center;font-size:13px;font-weight:600;color:var(--sub);border:1px dashed #b9c2d0;border-radius:8px;padding:5px 12px;cursor:pointer;margin:0;background:#fff}
.wd-upload:hover{border-color:var(--brand);color:var(--brand)}

.wd .form-control,.wd .form-select{border-radius:8px;border-color:#d5dbe5;font-size:14px;min-height:38px;color:var(--ink);background-color:#fff}
.wd .form-control:focus,.wd .form-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,86,232,.15)}
.wd .form-control-sm{min-height:36px}
.wd .form-control:disabled{background:#f1f3f7}
.wd label.lbl{display:block;font-size:12px;font-weight:600;color:var(--sub);margin-bottom:5px}
.wd-btn{appearance:none;border:1px solid transparent;border-radius:8px;font-size:13.5px;font-weight:600;padding:8px 16px;line-height:1.3;cursor:pointer;transition:background .15s;white-space:nowrap}
.wd-btn:disabled{opacity:.5;cursor:not-allowed}
.wd-btn--primary{background:var(--brand);color:#fff}.wd-btn--primary:hover:not(:disabled){background:#1b45c4}
.wd-btn--ok{background:var(--ok);color:#fff}.wd-btn--ok:hover:not(:disabled){background:#0a6445}
.wd-btn--ghost{background:#fff;border-color:#d5dbe5;color:var(--ink)}.wd-btn--ghost:hover:not(:disabled){background:#f1f4f9}
.wd-btn--bad{background:#fff;color:var(--bad);border-color:#f1c0bc;padding:5px 12px;font-size:13px}.wd-btn--bad:hover:not(:disabled){background:var(--bad-bg)}
.wd-btn--block{width:100%;padding:11px 14px;font-size:14px}
.wd-seg2{display:inline-flex;background:#edf0f5;border-radius:9px;padding:3px;gap:2px}
.wd-seg2 button{appearance:none;border:0;background:transparent;padding:6px 14px;font-size:13px;font-weight:600;color:var(--sub);border-radius:7px;cursor:pointer}
.wd-seg2 button.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.12)}

.wd-step{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.wd-step h4{font-size:15px;font-weight:600;margin:0 0 2px}
.wd-step p{margin:0;color:var(--sub);font-size:13px}
.wd-recap{margin:0;padding:0;list-style:none}
.wd-recap li{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 20px;border-bottom:1px solid var(--line);font-size:14px}
.wd-recap li:last-child{border-bottom:0}
.wd-check{color:var(--ok);vertical-align:middle}

.wd-hist-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.wd-hist-wrap{overflow-x:auto}
.wd-hist{width:100%;border-collapse:collapse;font-size:14px;min-width:680px}
.wd-hist th{text-align:left;font-size:12px;font-weight:600;color:var(--sub);padding:10px 14px;border-bottom:1px solid var(--line);background:#f8f9fc;white-space:nowrap}
.wd-hist td{padding:12px 14px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
.wd-hist tbody tr:last-child td{border-bottom:0}
.wd-hist tr.wd-hist__row{cursor:pointer}
.wd-hist tr.wd-hist__row:hover{background:#f6f8fc}
.wd-hist tr.wd-hist__row.is-open{background:#f6f8fc}
.wd-hist__date small{color:var(--faint);margin-left:6px;font-weight:500}
.wd-hist__more td{background:#f8f9fc;white-space:normal}
.wd-hist__more p{margin:0 0 6px;font-size:13px;color:var(--sub);overflow-wrap:anywhere}
.wd-hist__more .wd-btn{margin-top:6px}

.wd-toast{position:fixed;top:20px;right:24px;z-index:2000;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(16,24,40,.18);border:1px solid}
.wd-toast--success{background:var(--ok-bg);color:var(--ok);border-color:#b7e3cf}
.wd-toast--danger{background:var(--bad-bg);color:var(--bad);border-color:#f4c1bd}
.wd-task__top>div:first-child{min-width:0;flex:1}
.wd-task__title,.wd-task__desc{overflow-wrap:anywhere}
.wd-file a{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}
.wd-recap li span:first-child{min-width:0;overflow-wrap:anywhere}
.wd-tab .short{display:none}

@media (max-width:991.98px){.wd{padding:22px 20px 48px}}
@media (max-width:767.98px){
  .wd{padding:16px 12px 40px;font-size:14px}
  .wd-top h1{font-size:22px;margin-bottom:6px}
  .wd-top{align-items:stretch}
  .wd-top>div:first-child{flex:1 1 auto}
  .wd-top .form-control{width:100% !important;min-width:0}
  .wd-stats{grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}
  .wd-stat{padding:12px 14px}
  .wd-stat b{font-size:21px}
  .wd-tabs{gap:0;margin:16px 0 16px;overflow-x:visible}
  .wd-tab{flex:1;justify-content:center;padding:10px 4px;font-size:13px;gap:5px}
  .wd-tab .full{display:none}.wd-tab .short{display:inline}
  .wd-tab.is-on::after{left:6px;right:6px}
  .wd-count{min-width:18px;height:18px;font-size:10.5px;padding:0 5px}
  .wd-task__main{padding:14px 14px}
  .wd-task__top{flex-direction:row;gap:8px}
  .wd-upd{padding:12px;margin-top:12px}
  .wd-seg{display:flex;width:100%}
  .wd-seg button{flex:1;padding:9px 4px;font-size:13px}
  .wd-upd__row .form-control{width:100% !important}
  .wd-upd__row{gap:8px}
  .wd .form-control,.wd .form-select{font-size:16px;min-height:42px}
  .wd .form-control-sm{min-height:42px}
  .wd-btn{min-height:42px}
  .wd-btn--bad{min-height:36px}
  .wd-upload{min-height:40px}
  .wd-card__head{flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px}
  .wd-card__body{padding:16px}
  .wd-seg2{display:flex}.wd-seg2 button{flex:1}
  .wd-step{padding:14px 16px}
  .wd-step .wd-btn{width:100%}
  .wd-recap li{padding:11px 16px;align-items:flex-start}
  .wd-toast{left:12px;right:12px;top:12px;text-align:center}
  .wd-alert{font-size:13px}
}
@media (max-width:380px){.wd-stat b{font-size:19px}.wd-tab{font-size:12.5px}}
`;

export default function EmployeeWorkDay() {
    const [date, setDate] = useState(todayIST());
    const [tasks, setTasks] = useState([]);
    const [report, setReport] = useState(null);
    const [mode, setMode] = useState(null);
    const [edits, setEdits] = useState({});
    const [summary, setSummary] = useState("");
    const [nt, setNt] = useState(emptyTask);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);
    const [tab, setTab] = useState("assigned");

    // History tab state
    const [hist, setHist] = useState([]);
    const [histDays, setHistDays] = useState(7);
    const [histLoading, setHistLoading] = useState(false);
    const [histOpen, setHistOpen] = useState(null);

    const today = todayIST();
    const locked = report?.review_status === "accepted";

    const say = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3500); };
    const errMsg = (e) => e?.response?.data?.message || e.message || "Something went wrong";
    const entryOf = (t) => (t.progress_log || []).find((l) => l.date === date);

    const load = async () => {
        try {
            const r = await axios.get(`${API_BASE}/api/work/my`, { params: { date } });
            const t = r.data.data.tasks || [];
            setTasks(t);
            setReport(r.data.data.report);
            setSummary(r.data.data.report?.summary || "");
            const e = {};
            t.forEach((x) => {
                const en = (x.progress_log || []).find((l) => l.date === date);
                e[x._id] =
                    x.task_type === "target"
                        ? { value: en ? String(en.value_today) : "", note: en?.note || "" }
                        : {
                            status: en ? en.status : "pending",
                            percent: en && en.status === "partial" ? en.percent : "",
                            note: en?.note || "",
                        };
            });
            let draftSummary = null;
            try {
                const raw = localStorage.getItem(draftKey(date));
                if (raw) {
                    const d = JSON.parse(raw);
                    t.forEach((x) => {
                        if (d.edits?.[x._id]) e[x._id] = { ...e[x._id], ...d.edits[x._id] };
                    });
                    if (typeof d.summary === "string") draftSummary = d.summary;
                }
            } catch {
                draftSummary = null;
            }
            setEdits(e);
            if (draftSummary !== null) setSummary(draftSummary);
        } catch (e) { say("danger", errMsg(e)); }
    };

    const loadHistory = async () => {
        setHistLoading(true);
        try {
            const to = todayIST();
            const from = addDays(to, -(histDays - 1));
            const r = await axios.get(`${API_BASE}/api/work/my/history`, { params: { from, to } });
            setHist(r.data.data || []);
        } catch (e) { say("danger", errMsg(e)); }
        finally { setHistLoading(false); }
    };

    useEffect(() => { load(); }, [date]);
    useEffect(() => {
        axios.get(`${API_BASE}/api/work-mode/me`).then((r) => setMode(r.data.data)).catch(() => { });
    }, []);
    useEffect(() => { if (tab === "history") loadHistory(); }, [tab, histDays]);

    const persistDraft = (nextEdits, nextSummary) => {
        try {
            localStorage.setItem(draftKey(date), JSON.stringify({ edits: nextEdits, summary: nextSummary }));
        } catch {
            return;
        }
    };

    const setEdit = (id, patch) =>
        setEdits((p) => {
            const next = { ...p, [id]: { ...p[id], ...patch } };
            persistDraft(next, summary);
            return next;
        });

    const run = async (fn, okMsg) => {
        setBusy(true);
        try { await fn(); if (okMsg) say("success", okMsg); await load(); }
        catch (e) { say("danger", errMsg(e)); }
        finally { setBusy(false); }
    };

    const addTask = () =>
        run(async () => {
            await axios.post(`${API_BASE}/api/work/tasks`, { ...nt, date });
            setNt(emptyTask);
        }, "Task added ✅");

    const removeTask = (t) => {
        if (!(t.progress_log || []).length) return run(() => axios.delete(`${API_BASE}/api/work/tasks/${t._id}`), "Deleted");
        const reason = window.prompt("Why are you closing this task? (reason)");
        if (!reason) return;
        run(() => axios.post(`${API_BASE}/api/work/tasks/${t._id}/close`, { reason }), "Task closed");
    };

    const upload = (id, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        run(() => axios.post(`${API_BASE}/api/work/tasks/${id}/attachment`, fd), "Uploaded ✅");
    };
    const delFile = (id, attId) => run(() => axios.delete(`${API_BASE}/api/work/tasks/${id}/attachment/${attId}`));

    const submitPlan = () => run(() => axios.post(`${API_BASE}/api/work/plan/submit`, { date }), "Plan submitted ✅");

    const submitEod = () =>
        run(async () => {
            const items = tasks
                .filter((t) => t.status !== "cancelled")
                .map((t) => {
                    const e = edits[t._id] || {};
                    return t.task_type === "target"
                        ? { id: t._id, value_today: e.value === "" ? 0 : e.value, note: e.note }
                        : { id: t._id, status: e.status, percent: e.percent, note: e.note };
                });
            await axios.post(`${API_BASE}/api/work/eod`, { date, summary, items });
            localStorage.removeItem(draftKey(date));
        }, "EOD report submitted ✅");

    // History row -> antha naal-oda tasks tab-ku poga
    const openDay = (d) => {
        setDate(d);
        setTab("assigned");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const carried = tasks.filter((t) => t.date < date);
    const mine = tasks.filter((t) => t.date === date);
    const done = mine.filter((t) => t.status === "completed").length;
    const isOverdue = (t) => t.due_date && t.due_date < today && !["completed", "cancelled"].includes(t.status);

    const stTone = (s) => (s === "completed" ? "success" : s === "partial" ? "warning" : "muted");
    const Tick = () => (
        <svg className="wd-check" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const renderCard = (t) => {
        const e = edits[t._id] || {};
        const isTarget = t.task_type === "target";
        const prior = (t.achieved_value || 0) - (entryOf(t)?.value_today || 0);
        const live = prior + (Number(e.value) || 0);
        const livePct = isTarget ? Math.min(100, Math.round((live / t.target_value) * 100)) : 0;
        const cancelled = t.status === "cancelled";
        const canRemove = t.assigned_by_type === "self" && !locked && !cancelled;
        const barTone = cancelled ? "" : isOverdue(t) ? "danger" : stTone(t.status);

        return (
            <div key={t._id} className={`wd-task ${isOverdue(t) ? "is-overdue" : ""} ${cancelled ? "is-cancelled" : ""}`}>
                <div className={`wd-task__bar ${barTone}`} />
                <div className="wd-task__main">
                    <div className="wd-task__top">
                        <div>
                            <h4 className={`wd-task__title ${cancelled ? "strike" : ""}`}>{t.title}</h4>
                            {t.description && <p className="wd-task__desc">{t.description}</p>}
                            <div className="wd-tags">
                                <span className={`wd-pill wd-pill--${PRI[t.priority]} wd-cap`}>{t.priority}</span>
                                {isTarget && <span className="wd-pill wd-pill--dark">🎯 {t.target_value} {t.unit}</span>}
                                {t.planned_hours > 0 && <span className="wd-pill wd-pill--line">{t.planned_hours}h</span>}
                                <span className="wd-pill wd-pill--line">
                                    {t.assigned_by_type === "self" ? "My task" : `by ${t.assigned_by_name}`}
                                </span>
                                {t.source === "recurring" && <span className="wd-pill wd-pill--line">🔁 Daily</span>}
                                {t.date < date && <span className="wd-pill wd-pill--warning">from {t.date}</span>}
                                {t.due_date && (
                                    <span className={`wd-pill ${isOverdue(t) ? "wd-pill--danger" : "wd-pill--line"}`}>
                                        {isOverdue(t) ? "Overdue · " : "Due "}{t.due_date}
                                    </span>
                                )}
                            </div>
                        </div>
                        {canRemove && (
                            <button className="wd-btn wd-btn--bad" disabled={busy} onClick={() => removeTask(t)}>
                                {(t.progress_log || []).length ? "Close" : "✕"}
                            </button>
                        )}
                    </div>

                    {cancelled && <div className="wd-note">Closed: {t.cancel_reason} ({t.cancelled_by})</div>}

                    {!cancelled && (
                        <div className="wd-upd">
                            {isTarget && (
                                <>
                                    <span className="wd-upd__lbl">Today's progress</span>
                                    <div className="wd-upd__row">
                                        <input type="number" min={0} className="form-control form-control-sm" style={{ width: 140 }}
                                            placeholder={`Today (${t.unit})`} value={e.value ?? ""} disabled={locked}
                                            onChange={(ev) => setEdit(t._id, { value: ev.target.value })} />
                                        <span className="small text-muted">Previous: {prior}/{t.target_value}</span>
                                    </div>
                                    <div className="wd-prog">
                                        <div className="wd-prog__meta">
                                            <b>Total {live}/{t.target_value} ({livePct}%)</b>
                                            {t.target_value - live > 0 && <span style={{ color: "var(--bad)" }}>{t.target_value - live} remaining</span>}
                                        </div>
                                        <div className="wd-bar"><i className={livePct >= 100 ? "full" : ""} style={{ width: `${livePct}%` }} /></div>
                                    </div>
                                </>
                            )}

                            {!isTarget && (
                                <>
                                    <span className="wd-upd__lbl">
                                        Status
                                        {t.percent > 0 && t.status !== "completed" && t.date < date && (
                                            <span className="fw-normal"> · Previous progress: {t.percent}%</span>
                                        )}
                                    </span>
                                    <div className="wd-upd__row">
                                        <div className="wd-seg">
                                            {[["pending", "Pending"], ["partial", "Partial"], ["completed", "Completed"]].map(([k, l]) => (
                                                <button key={k} disabled={locked}
                                                    className={`${e.status === k ? "is-on" : ""} ${e.status === k ? stTone(k) : ""}`}
                                                    onClick={() => setEdit(t._id, { status: k })}>{l}</button>
                                            ))}
                                        </div>
                                        {e.status === "partial" && (
                                            <input type="number" min={1} max={99} className="form-control form-control-sm" style={{ width: 100 }}
                                                placeholder="% done" value={e.percent} disabled={locked}
                                                onChange={(ev) => setEdit(t._id, { percent: ev.target.value })} />
                                        )}
                                    </div>
                                </>
                            )}

                            <input className="form-control form-control-sm mt-3" disabled={locked}
                                placeholder={!isTarget && e.status === "partial" ? "Reason / what is remaining (required)" : "Note (optional)"}
                                value={e.note || ""} onChange={(ev) => setEdit(t._id, { note: ev.target.value })} />

                            <div className="wd-files">
                                {(t.attachments || []).map((a) => (
                                    <span key={a._id} className="wd-file">
                                        <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                                        {!locked && <button aria-label="Remove file" onClick={() => delFile(t._id, a._id)}>✕</button>}
                                    </span>
                                ))}
                                {!locked && (t.attachments || []).length < 3 && (
                                    <label className="wd-upload">
                                        + Proof (optional)
                                        <input type="file" hidden accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={(ev) => { upload(t._id, ev.target.files[0]); ev.target.value = ""; }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // tab split: tasks given by HR / Team Leader vs tasks I added myself
    const isSelf = (t) => t.assigned_by_type === "self";
    const assignedCarried = carried.filter((t) => !isSelf(t));
    const assignedToday = mine.filter((t) => !isSelf(t));
    const myCarried = carried.filter(isSelf);
    const myToday = mine.filter(isSelf);
    const assignedCount = assignedCarried.length + assignedToday.length;
    const myCount = myCarried.length + myToday.length;
    const dayLabel = date === today ? "Today's tasks" : `Tasks — ${date}`;

    const renderGroup = (carriedList, todayList, emptyText) => (
        <>
            {carriedList.length > 0 && (
                <>
                    <div className="wd-section bad">⏳ Pending from earlier</div>
                    {carriedList.map((t) => renderCard(t))}
                </>
            )}
            {(todayList.length > 0 || carriedList.length > 0) && <div className="wd-section">{dayLabel}</div>}
            {!todayList.length && <div className="wd-empty">{emptyText}</div>}
            {todayList.map((t) => renderCard(t))}
        </>
    );

    const recapText = (t) => {
        const e = edits[t._id] || {};
        if (t.task_type === "target") {
            const prior = (t.achieved_value || 0) - (entryOf(t)?.value_today || 0);
            return `${prior + (Number(e.value) || 0)}/${t.target_value} ${t.unit}`;
        }
        return e.status === "partial" && e.percent ? `partial ${e.percent}%` : e.status || "pending";
    };

    const TABS = [
        ["assigned", "Assigned to me", "Assigned", assignedCount],
        ["mine", "My Tasks", "Mine", myCount],
        ["report", "Plan & EOD Report", "Report", 0],
        ["history", "History", "History", 0],
    ];

    return (
        <EmployeeLayout>
            <div className="wd">
                <style>{STYLES}</style>

                {toast && <div className={`wd-toast wd-toast--${toast.type}`} role="status">{toast.text}</div>}

                <div className="wd-top">
                    <div>
                        <h1>My Work Day</h1>
                        {mode?.effectiveToday === "wfh"
                            ? <span className="wd-pill wd-pill--brand">Work From Home today</span>
                            : <span className="wd-pill wd-pill--line">Office</span>}
                    </div>
                    <input type="date" className="form-control w-auto" value={date} max={today}
                        onChange={(e) => setDate(e.target.value || today)} />
                </div>

                <div className="wd-stats">
                    <div className="wd-stat"><span>Tasks</span><b>{mine.length}</b></div>
                    <div className="wd-stat ok"><span>Completed</span><b>{done}</b></div>
                    {carried.length > 0 && <div className="wd-stat warn"><span>Pending from earlier</span><b>{carried.length}</b></div>}
                    {report?.score != null && <div className="wd-stat info"><span>Score</span><b>{report.score}%</b></div>}
                </div>

                <div className="wd-flags">
                    {report?.plan_submitted_at && <span className="wd-pill wd-pill--success"><Tick /> Plan submitted</span>}
                    {report?.eod_submitted_at && <span className="wd-pill wd-pill--success"><Tick /> EOD submitted</span>}
                    {locked && <span className="wd-pill wd-pill--success">Accepted 🔒</span>}
                    {report?.review_status === "rework" && <span className="wd-pill wd-pill--warning">Rework needed</span>}
                </div>

                {report?.review_status === "rework" && report.review_note && (
                    <div className="wd-alert wd-alert--warn">
                        Rework requested by {report.reviewer_name}: {report.review_note}
                    </div>
                )}
                {report?.review_status === "accepted" && report.review_note && (
                    <div className="wd-alert wd-alert--ok">
                        Accepted by {report.reviewer_name}: {report.review_note}
                    </div>
                )}

                <div className="wd-tabs" role="tablist">
                    {TABS.map(([k, l, ls, n]) => (
                        <button key={k} role="tab" className={`wd-tab ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)}>
                            <span className="full">{l}</span><span className="short">{ls}</span>
                            {n > 0 && <span className="wd-count">{n}</span>}
                        </button>
                    ))}
                </div>

                {tab === "assigned" && renderGroup(assignedCarried, assignedToday, "No tasks assigned to you for this day")}

                {tab === "mine" && (
                    <div className="row g-4">
                        <div className={!locked && date >= today ? "col-lg-7" : "col-12"}>
                            {renderGroup(myCarried, myToday, "You haven't added any tasks for this day")}
                        </div>

                        {!locked && date >= today && (
                            <div className="col-lg-5">
                                <div className="wd-card">
                                    <div className="wd-card__head">
                                        <h2 className="wd-card__title">Add my task</h2>
                                        <div className="wd-seg2">
                                            <button className={nt.task_type === "normal" ? "is-on" : ""}
                                                onClick={() => setNt({ ...nt, task_type: "normal" })}>Normal</button>
                                            <button className={nt.task_type === "target" ? "is-on" : ""}
                                                onClick={() => setNt({ ...nt, task_type: "target" })}>Target (number)</button>
                                        </div>
                                    </div>
                                    <div className="wd-card__body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="lbl">Title</label>
                                                <input className="form-control" placeholder="Task title" value={nt.title}
                                                    onChange={(e) => setNt({ ...nt, title: e.target.value })} />
                                            </div>
                                            {nt.task_type === "target" && (
                                                <>
                                                    <div className="col-6">
                                                        <label className="lbl">Target</label>
                                                        <input type="number" min={1} className="form-control" placeholder="eg. 20" value={nt.target_value}
                                                            onChange={(e) => setNt({ ...nt, target_value: e.target.value })} />
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="lbl">Unit</label>
                                                        <input list="wfh-units" className="form-control" placeholder="calls, posts..." value={nt.unit}
                                                            onChange={(e) => setNt({ ...nt, unit: e.target.value })} />
                                                        <datalist id="wfh-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                                                    </div>
                                                </>
                                            )}
                                            <div className="col-6 col-sm-4">
                                                <label className="lbl">Priority</label>
                                                <select className="form-select" value={nt.priority} onChange={(e) => setNt({ ...nt, priority: e.target.value })}>
                                                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                                                </select>
                                            </div>
                                            <div className="col-6 col-sm-4">
                                                <label className="lbl">Hours</label>
                                                <input type="number" min={0} max={24} className="form-control" placeholder="Hours" value={nt.planned_hours}
                                                    onChange={(e) => setNt({ ...nt, planned_hours: e.target.value })} />
                                            </div>
                                            <div className="col-12 col-sm-4">
                                                <label className="lbl">Due (optional)</label>
                                                <input type="date" className="form-control" min={date} value={nt.due_date} title="Due date (optional)"
                                                    onChange={(e) => setNt({ ...nt, due_date: e.target.value })} />
                                            </div>
                                            <div className="col-12">
                                                <label className="lbl">Description</label>
                                                <input className="form-control" placeholder="Description (optional)" value={nt.description}
                                                    onChange={(e) => setNt({ ...nt, description: e.target.value })} />
                                            </div>
                                        </div>
                                        <button className="wd-btn wd-btn--primary wd-btn--block mt-3" disabled={busy || !nt.title.trim()} onClick={addTask}>Add task</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === "report" && (
                    <>
                        {locked && <div className="wd-empty">This day's report has been accepted and is locked.</div>}
                        {!locked && !tasks.length && <div className="wd-empty">No tasks yet — add or receive tasks to submit a plan or EOD report.</div>}

                        {tasks.length > 0 && !locked && (
                            <div className="row g-4">
                                <div className="col-lg-7">
                                    <div className="wd-card">
                                        <div className="wd-card__head"><h2 className="wd-card__title">Review before you submit</h2></div>
                                        <ul className="wd-recap">
                                            {tasks.filter((t) => t.status !== "cancelled").map((t) => {
                                                const e = edits[t._id] || {};
                                                return (
                                                    <li key={t._id}>
                                                        <span>{t.title}</span>
                                                        <span className={`wd-pill wd-pill--${t.task_type === "target" ? "info" : stTone(e.status)} wd-cap`}>{recapText(t)}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>

                                <div className="col-lg-5">
                                    <div className="wd-card">
                                        {date === today && (
                                            <div className="wd-step">
                                                <div>
                                                    <h4>Today's plan</h4>
                                                    <p>{report?.plan_submitted_at ? "Plan already submitted" : "Submit your plan for the day"}</p>
                                                </div>
                                                {report?.plan_submitted_at
                                                    ? <span className="wd-pill wd-pill--success"><Tick /> Done</span>
                                                    : <button className="wd-btn wd-btn--ghost" disabled={busy} onClick={submitPlan}>Submit today's plan</button>}
                                            </div>
                                        )}
                                        <div className="wd-card__body">
                                            <label className="lbl">End-of-day summary</label>
                                            <textarea className="form-control mb-3" rows={4} placeholder="What did you work on today overall? Any blockers?"
                                                value={summary} onChange={(e) => { setSummary(e.target.value); persistDraft(edits, e.target.value); }} />
                                            <button className="wd-btn wd-btn--ok wd-btn--block" disabled={busy} onClick={submitEod}>
                                                {report?.eod_submitted_at ? "Update EOD report" : "Submit EOD report"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {tab === "history" && (
                    <>
                        <div className="wd-hist-bar">
                            <div className="wd-seg2">
                                {[7, 14, 30].map((n) => (
                                    <button key={n} className={histDays === n ? "is-on" : ""} onClick={() => setHistDays(n)}>
                                        Last {n} days
                                    </button>
                                ))}
                            </div>
                            <button className="wd-btn wd-btn--ghost" disabled={histLoading} onClick={loadHistory}>
                                {histLoading ? "Loading..." : "Refresh"}
                            </button>
                        </div>

                        {!histLoading && !hist.length && (
                            <div className="wd-empty">No work records in the last {histDays} days</div>
                        )}

                        {hist.length > 0 && (
                            <div className="wd-card">
                                <div className="wd-hist-wrap">
                                    <table className="wd-hist">
                                        <thead>
                                            <tr>
                                                <th>Date</th><th>Mode</th><th>Tasks</th><th>Done</th>
                                                <th>Plan</th><th>EOD</th><th>Score</th><th>Review</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hist.map((r) => (
                                                <Fragment key={r.date}>
                                                    <tr className={`wd-hist__row ${histOpen === r.date ? "is-open" : ""}`}
                                                        tabIndex={0}
                                                        onClick={() => setHistOpen(histOpen === r.date ? null : r.date)}
                                                        onKeyDown={(ev) => { if (ev.key === "Enter") setHistOpen(histOpen === r.date ? null : r.date); }}>
                                                        <td className="wd-hist__date">{r.date}<small>{weekday(r.date)}</small></td>
                                                        <td>
                                                            {r.work_mode
                                                                ? <span className={`wd-pill ${r.work_mode === "wfh" ? "wd-pill--brand" : "wd-pill--line"}`}>
                                                                    {r.work_mode === "wfh" ? "WFH" : "Office"}
                                                                </span>
                                                                : "—"}
                                                        </td>
                                                        <td>
                                                            {r.total}
                                                            {r.cancelled > 0 && <small className="text-muted"> (+{r.cancelled} closed)</small>}
                                                        </td>
                                                        <td>{r.done}</td>
                                                        <td>{r.plan ? <Tick /> : "—"}</td>
                                                        <td>
                                                            {r.eod ? <Tick /> : "—"}
                                                            {r.eod && r.eod_late && <span className="wd-pill wd-pill--danger ms-1">Late</span>}
                                                        </td>
                                                        <td>{r.score != null ? `${r.score}%` : "—"}</td>
                                                        <td>
                                                            {r.eod
                                                                ? <span className={`wd-pill wd-pill--${REVIEW_TONE[r.review_status] || "muted"} wd-cap`}>{r.review_status}</span>
                                                                : "—"}
                                                        </td>
                                                    </tr>
                                                    {histOpen === r.date && (
                                                        <tr className="wd-hist__more">
                                                            <td colSpan={8}>
                                                                <p>Completed {r.done} · Partial {r.partial} · Pending {r.pending} · Closed {r.cancelled}</p>
                                                                {r.summary && <p>💬 {r.summary}</p>}
                                                                {r.review_note && (
                                                                    <p>Review ({r.review_status}) by {r.reviewer_name || "HR"}: {r.review_note}</p>
                                                                )}
                                                                <button className="wd-btn wd-btn--ghost" onClick={() => openDay(r.date)}>Open this day</button>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </EmployeeLayout>
    );
}