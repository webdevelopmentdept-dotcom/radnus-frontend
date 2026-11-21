import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const UNITS = ["calls", "leads", "follow-ups", "posts", "reels", "designs", "tickets", "bugs", "pages", "hours"];
const DAYS7 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const emptyForm = {
    task_type: "normal", title: "", description: "", priority: "medium", planned_hours: "",
    target_value: "", unit: "", date: todayIST(), due_date: "",
};
const emptyRepeat = {
    enabled: false, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], end_date: "", only_wfh: false, close_previous: false,
};
const HR_TABS = [
    ["selected", "Selected"], ["department", "Department"], ["team", "Team"], ["all_wfh", "All WFH"], ["all", "Everyone"],
];
const TL_TABS = [["selected", "Selected"], ["team", "Whole team"], ["all_wfh", "Team WFH"]];
const REVIEW_BADGE = { pending: "muted", accepted: "success", rework: "warning" };
const BASE_TABS = [["overview", "Day Overview"], ["assign", "Assign Task"], ["targets", "Daily Targets"]];

const STYLES = `
.wt{--ink:#18212f;--sub:#5b6677;--faint:#8a94a4;--line:#e3e7ee;--bg:#f4f6fa;--card:#fff;--brand:#2556e8;--brand-soft:#e9efff;
--ok:#0f7a55;--ok-bg:#e2f5ec;--warn:#92600a;--warn-bg:#fdf0d0;--bad:#b3261e;--bad-bg:#fde7e5;--info:#0b6b86;--info-bg:#def3f8;--mut:#475467;--mut-bg:#edf0f4;--dark:#1f2937;--dark-bg:#1f2937;
padding:28px 32px 48px;color:var(--ink);font-size:14px;max-width:1440px}
.wt *{box-sizing:border-box}
.wt-head h1{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:0 0 4px}
.wt-head p{margin:0;color:var(--sub);font-size:14px}

.wt-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:22px 0 20px;overflow-x:auto}
.wt-tab{appearance:none;background:none;border:0;padding:10px 16px;font-size:14px;font-weight:600;color:var(--sub);position:relative;white-space:nowrap;display:flex;align-items:center;gap:8px;cursor:pointer;border-radius:8px 8px 0 0}
.wt-tab:hover{color:var(--ink);background:#eef1f6}
.wt-tab.is-on{color:var(--brand)}
.wt-tab.is-on::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--brand);border-radius:2px}
.wt-count{font-size:11px;font-weight:700;min-width:20px;height:20px;padding:0 6px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center}
.wt-count--warn{background:var(--warn-bg);color:var(--warn)}
.wt-count--mut{background:var(--mut-bg);color:var(--mut)}

.wt-card{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.wt-card+.wt-card{margin-top:16px}
.wt-card__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line)}
.wt-card__title{font-size:15px;font-weight:700;margin:0}
.wt-card__body{padding:20px}
.wt-hint{color:var(--sub);font-size:13px;margin-top:10px;line-height:1.5}

.wt-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 16px;margin-bottom:16px}
.wt-toolbar .grow{flex:1}
.wt-field{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--sub);font-weight:500;margin:0}
.wt .form-control,.wt .form-select{border-radius:8px;border-color:#d5dbe5;font-size:14px;min-height:38px;color:var(--ink)}
.wt .form-control:focus,.wt .form-select:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,86,232,.15)}
.wt .form-control-sm,.wt .form-select-sm{min-height:36px;font-size:14px}
.wt .form-check-input:checked{background-color:var(--brand);border-color:var(--brand)}
.wt .form-switch .form-check-input{cursor:pointer}
.wt label.lbl{display:block;font-size:12px;font-weight:600;color:var(--sub);margin-bottom:5px}

.wt-btn{appearance:none;border:1px solid transparent;border-radius:8px;font-size:13px;font-weight:600;padding:7px 14px;line-height:1.3;cursor:pointer;transition:background .15s,border-color .15s;white-space:nowrap}
.wt-btn:disabled{opacity:.5;cursor:not-allowed}
.wt-btn--primary{background:var(--brand);color:#fff}.wt-btn--primary:hover:not(:disabled){background:#1b45c4}
.wt-btn--ghost{background:#fff;border-color:#d5dbe5;color:var(--ink)}.wt-btn--ghost:hover:not(:disabled){background:#f1f4f9}
.wt-btn--ok{background:var(--ok);color:#fff}.wt-btn--ok:hover{background:#0a6445}
.wt-btn--warn{background:var(--warn-bg);color:var(--warn);border-color:#f2d98f}.wt-btn--warn:hover{background:#fbe7b0}
.wt-btn--bad{background:#fff;color:var(--bad);border-color:#f1c0bc}.wt-btn--bad:hover{background:var(--bad-bg)}
.wt-btn--block{width:100%;padding:11px 14px;font-size:14px}
.wt-icon-btn{appearance:none;border:0;background:#f1f4f9;color:var(--sub);width:36px;height:36px;border-radius:8px;font-size:16px;cursor:pointer}
.wt-icon-btn:hover{background:#e5e9f0;color:var(--ink)}

.wt-pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;line-height:1.5;white-space:nowrap;text-transform:capitalize}
.wt-pill--success{background:var(--ok-bg);color:var(--ok)}
.wt-pill--warning{background:var(--warn-bg);color:var(--warn)}
.wt-pill--danger{background:var(--bad-bg);color:var(--bad)}
.wt-pill--info{background:var(--info-bg);color:var(--info)}
.wt-pill--muted{background:var(--mut-bg);color:var(--mut)}
.wt-pill--brand{background:var(--brand-soft);color:var(--brand)}
.wt-pill--dark{background:var(--dark-bg);color:#fff}
.wt-pill--line{background:#fff;color:var(--sub);border:1px solid var(--line);font-weight:500}
.wt-pill--nocap{text-transform:none}

.wt-table-wrap{overflow-x:auto}
.wt-table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}
.wt-table th{background:#f8f9fc;color:var(--sub);font-size:12.5px;font-weight:600;padding:11px 14px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap;position:sticky;top:0}
.wt-table td{padding:14px;border-bottom:1px solid var(--line);vertical-align:middle}
.wt-table tbody tr:last-child td{border-bottom:0}
.wt-table tbody tr:hover td{background:#fafbfe}
.wt-table .c{text-align:center}
.wt-empty{padding:44px 20px;text-align:center;color:var(--faint)}

.wt-emp{display:flex;align-items:center;gap:12px}
.wt-av{width:36px;height:36px;border-radius:50%;background:var(--brand-soft);color:var(--brand);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none}
.wt-emp b{display:block;font-weight:600;line-height:1.3}
.wt-emp small{color:var(--faint);font-size:12.5px}
.wt-num{font-weight:600;font-variant-numeric:tabular-nums}
.wt-sub{display:block;color:var(--faint);font-size:12px;font-weight:400}
.wt-dash{color:#c3cad6}
.wt-check{color:var(--ok);vertical-align:middle}
.wt-score{display:flex;align-items:center;gap:8px;min-width:96px}
.wt-bar{flex:1;height:6px;border-radius:3px;background:var(--mut-bg);overflow:hidden}
.wt-bar i{display:block;height:100%;border-radius:3px}
.wt-bar .ok{background:#18a572}.wt-bar .warn{background:#e8a317}.wt-bar .bad{background:#e0463d}

.wt-detail__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.wt-detail__head h3{font-size:17px;font-weight:700;margin:0}
.wt-detail__head h3 span{color:var(--faint);font-weight:500}
.wt-chips{display:flex;gap:8px;flex-wrap:wrap;padding:14px 20px 0}
.wt-task{display:flex;gap:14px;padding:16px 20px;border-bottom:1px solid var(--line)}
.wt-task:last-of-type{border-bottom:0}
.wt-task__bar{width:4px;border-radius:2px;flex:none;background:#c3cad6}
.wt-task__bar.success{background:#18a572}.wt-task__bar.warning{background:#e8a317}.wt-task__bar.dark{background:#6b7280}
.wt-task__main{flex:1;min-width:0}
.wt-task__top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.wt-task__title{font-size:15px;font-weight:600;margin:0 0 6px}
.wt-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.wt-task__act{display:flex;gap:8px;align-items:center;flex:none}
.wt-target{margin-top:8px;font-weight:600;font-size:13px;color:var(--ink)}
.wt-log{margin:10px 0 0;padding:0;list-style:none;border-left:2px solid var(--line)}
.wt-log li{padding:2px 0 2px 12px;color:var(--sub);font-size:13px}
.wt-log b{color:var(--ink);font-weight:600}
.wt-closed{margin-top:8px;font-size:13px;color:var(--sub)}
.wt-files{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.wt-file{display:inline-flex;align-items:center;font-size:12.5px;font-weight:500;color:var(--brand);background:var(--brand-soft);padding:4px 10px;border-radius:6px;text-decoration:none}
.wt-file:hover{background:#d9e4ff;color:#1b45c4}
.wt-summary{margin:0 20px 16px;padding:12px 14px;background:#f8f9fc;border-radius:8px;color:var(--sub);font-size:13.5px}
.wt-review{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px 20px;border-top:1px solid var(--line);background:#fafbfd;border-radius:0 0 12px 12px}
.wt-review .push{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}

.wt-seg{display:inline-flex;background:#edf0f5;border-radius:9px;padding:3px;gap:2px;flex-wrap:wrap}
.wt-seg button{appearance:none;border:0;background:transparent;padding:6px 14px;font-size:13px;font-weight:600;color:var(--sub);border-radius:7px;cursor:pointer}
.wt-seg button.is-on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.12)}
.wt-list{border:1px solid var(--line);border-radius:10px;max-height:380px;overflow:auto}
.wt-list__head{position:sticky;top:0;background:#f8f9fc;padding:10px 14px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;z-index:1}
.wt-list__row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--line);margin:0;cursor:pointer}
.wt-list__row:last-child{border-bottom:0}
.wt-list__row:hover{background:#fafbfe}
.wt-list input[type=checkbox]{width:16px;height:16px;accent-color:var(--brand)}
.wt-repeat{border:1px dashed #cdd5e1;border-radius:10px;padding:14px;background:#fafbfd}
.wt-days{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.wt-day{appearance:none;border:1px solid #d5dbe5;background:#fff;color:var(--sub);font-size:13px;font-weight:600;border-radius:8px;padding:5px 12px;cursor:pointer}
.wt-day.is-on{background:var(--brand);border-color:var(--brand);color:#fff}
.wt-rule{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:16px 20px;border-bottom:1px solid var(--line)}
.wt-rule:last-child{border-bottom:0}
.wt-rule h4{font-size:15px;font-weight:600;margin:0 0 4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.wt-rule p{margin:0;color:var(--sub);font-size:13px;line-height:1.55}
.wt-code{display:block;margin-top:12px;padding:10px 12px;background:#0f172a;color:#cbe3ff;border-radius:8px;font-size:12.5px;white-space:pre-wrap;word-break:break-all}

.wt-toast{position:fixed;top:20px;right:24px;z-index:2000;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(16,24,40,.18);border:1px solid}
.wt-toast--success{background:var(--ok-bg);color:var(--ok);border-color:#b7e3cf}
.wt-toast--danger{background:var(--bad-bg);color:var(--bad);border-color:#f4c1bd}

@media (max-width:768px){.wt{padding:18px 14px 36px}.wt-task__top{flex-direction:column}.wt-review .push{margin-left:0}}
`;

export default function HrWorkTasks({ role = "hr" }) {
    const isHr = role === "hr";
    const TABS = isHr ? HR_TABS : TL_TABS;
    const MAIN_TABS = BASE_TABS;

    const [mainTab, setMainTab] = useState("overview");
    const [emps, setEmps] = useState([]);
    const [teams, setTeams] = useState([]);
    const [tab, setTab] = useState("selected");
    const [search, setSearch] = useState("");
    const [onlyWfh, setOnlyWfh] = useState(true);
    const [sel, setSel] = useState([]);
    const [dept, setDept] = useState("");
    const [leader, setLeader] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [repeat, setRepeat] = useState(emptyRepeat);
    const [rules, setRules] = useState([]);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);

    const [ovDate, setOvDate] = useState(todayIST());
    const [ovDept, setOvDept] = useState("");
    const [ovWfh, setOvWfh] = useState(true);
    const [rows, setRows] = useState([]);
    const [needsReview, setNeedsReview] = useState(false);
    const [view, setView] = useState(null);

    const [testDate, setTestDate] = useState(todayIST());
    const [testOut, setTestOut] = useState("");

    const say = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };
    const errMsg = (e) => e?.response?.data?.message || e.message;

    useEffect(() => {
        axios.get(`${API_BASE}/api/work/assignable`).then((r) => setEmps(r.data.data || [])).catch((e) => say("danger", errMsg(e)));
        axios.get(`${API_BASE}/api/work/teams`).then((r) => setTeams(r.data.data || [])).catch(() => { });
    }, []);

    const loadOverview = async () => {
        try {
            const r = await axios.get(`${API_BASE}/api/work/overview`, {
                params: { date: ovDate, department: ovDept || undefined, wfh: ovWfh ? "1" : undefined },
            });
            setRows(r.data.data || []);
        } catch (e) {
            say("danger", errMsg(e));
        }
    };

    useEffect(() => { loadOverview(); }, [ovDate, ovDept, ovWfh]);
    // top date maathina, open-a irukkura detail panel um antha date ku maaranum
    useEffect(() => {
        if (view && view.date !== ovDate) openView(view.emp, ovDate);
        // eslint-disable-next-line
    }, [ovDate]);

    const loadRules = async () => {
        try {
            const r = await axios.get(`${API_BASE}/api/work/recurring`);
            setRules(r.data.data || []);
        } catch {
            setRules([]);
        }
    };
    useEffect(() => { loadRules(); }, []);

    const stopGroup = async (gid) => {
        if (!window.confirm("This will stop generating new tasks. Stop it?")) return;
        try {
            await axios.put(`${API_BASE}/api/work/recurring/group/${gid}/stop`);
            say("success", "Daily target stopped");
            loadRules();
        } catch (e) {
            say("danger", errMsg(e));
        }
    };

    const groupedRules = useMemo(() => {
        const m = new Map();
        rules.forEach((r) => {
            const g = m.get(r.group_id) || { ...r, names: [] };
            g.names.push(r.employee_id?.name);
            m.set(r.group_id, g);
        });
        return [...m.values()];
    }, [rules]);

    const toggleDay = (d) =>
        setRepeat((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] }));

    const runJob = async (job) => {
        try {
            const r = await axios.post(`${API_BASE}/api/work/jobs/run`, { job, date: testDate });
            setTestOut(`${job}: ${JSON.stringify(r.data.result)}`);
        } catch (e) {
            setTestOut(`${job} failed: ${errMsg(e)}`);
        }
    };

    const departments = useMemo(() => [...new Set(emps.map((e) => e.department).filter(Boolean))].sort(), [emps]);

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        return emps.filter((e) => {
            if (onlyWfh && e.effectiveToday !== "wfh") return false;
            return !q || [e.name, e.employeeId, e.department].some((v) => String(v || "").toLowerCase().includes(q));
        });
    }, [emps, search, onlyWfh]);

    const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const toggleAll = () => setSel(sel.length === list.length ? [] : list.map((e) => e._id));

    const targetPayload = () => {
        if (tab === "selected") return { type: "employees", employee_ids: sel };
        if (tab === "department") return { type: "department", department: dept };
        if (tab === "team") return { type: "team", leader_id: isHr ? leader : undefined };
        return { type: tab };
    };

    const targetReady =
        (tab === "selected" && sel.length > 0) ||
        (tab === "department" && dept) ||
        (tab === "team" && (!isHr || leader)) ||
        tab === "all_wfh" ||
        tab === "all";
    const formReady = form.title.trim() && (form.task_type === "normal" || (form.target_value && form.unit.trim()));

    const assign = async () => {
        if ((tab === "all" || tab === "all_wfh") && !window.confirm("Assign this task to everyone?")) return;
        setBusy(true);
        try {
            const r = await axios.post(`${API_BASE}/api/work/assign`, {
                ...form, target: targetPayload(), repeat: repeat.enabled ? repeat : undefined,
            });
            say("success", `Assigned to ${r.data.count} employee(s) ✅`);
            setForm({ ...emptyForm, date: form.date });
            setRepeat(emptyRepeat);
            setSel([]);
            loadOverview();
            loadRules();
        } catch (e) {
            say("danger", errMsg(e));
        } finally {
            setBusy(false);
        }
    };

    const openView = async (emp, date = ovDate) => {
        try {
            const r = await axios.get(`${API_BASE}/api/work/by-employee/${emp._id}`, { params: { date } });
            setView({ emp, date, data: r.data.data });
        } catch (e) {
            say("danger", errMsg(e));
        }
    };

    const closeTask = async (t) => {
        const reason = window.prompt("Reason for closing this task?");
        if (!reason) return;
        try {
            await axios.post(`${API_BASE}/api/work/tasks/${t._id}/close`, { reason });
            say("success", "Task closed");
            openView(view.emp, view.date);
            loadOverview();
        } catch (e) {
            say("danger", errMsg(e));
        }
    };

    const review = async (status) => {
        let note = "";
        if (status === "rework") {
            const n = window.prompt("What needs to be corrected?");
            if (n === null || !n.trim()) return;
            note = n;
        } else if (status === "accepted") {
            const n = window.prompt("Add a note (optional)");
            if (n === null) return;
            note = n;
        }
        try {
            await axios.put(`${API_BASE}/api/work/review/${view.emp._id}`, { date: view.date, status, note });
            say("success", status === "accepted" ? "Report accepted" : status === "rework" ? "Sent back for rework" : "Report reopened");
            openView(view.emp, view.date);
            loadOverview();
        } catch (e) {
            say("danger", errMsg(e));
        }
    };

    const tone = (t) =>
        t.status === "completed" ? "success" : t.status === "partial" ? "warning" : t.status === "cancelled" ? "dark" : "muted";
    const stBadge = tone;
    const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
    const scoreTone = (s) => (s >= 80 ? "ok" : s >= 50 ? "warn" : "bad");
    const Tick = () => (
        <svg className="wt-check" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-label="Done">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    const Dash = () => <span className="wt-dash">—</span>;

    const rep = view?.data?.report;
    const pendingReview = rows.filter((r) => r.eod && r.review_status === "pending").length;
    const shownRows = needsReview ? rows.filter((r) => r.eod && r.review_status === "pending") : rows;

    return (
        <div className="wt">
            <style>{STYLES}</style>

            {toast && <div className={`wt-toast wt-toast--${toast.type}`} role="status">{toast.text}</div>}

            <div className="wt-head">
                <h1>{isHr ? "WFH Tasks" : "Team Tasks"}</h1>
                <p>Assign tasks to individuals or groups. Employees' own plans are also visible here.</p>
            </div>

            <div className="wt-tabs" role="tablist">
                {MAIN_TABS.map(([k, l]) => (
                    <button key={k} role="tab" className={`wt-tab ${mainTab === k ? "is-on" : ""}`} onClick={() => setMainTab(k)}>
                        {l}
                        {k === "overview" && pendingReview > 0 && <span className="wt-count wt-count--warn">{pendingReview}</span>}
                        {k === "targets" && groupedRules.length > 0 && <span className="wt-count wt-count--mut">{groupedRules.length}</span>}
                    </button>
                ))}
            </div>

            {mainTab === "assign" && (
                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="wt-card">
                            <div className="wt-card__head">
                                <h2 className="wt-card__title">Assign to</h2>
                                <div className="wt-seg">
                                    {TABS.map(([k, l]) => (
                                        <button key={k} className={tab === k ? "is-on" : ""} onClick={() => setTab(k)}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="wt-card__body">
                                {tab === "selected" && (
                                    <>
                                        <div className="d-flex gap-3 align-items-center mb-3">
                                            <input className="form-control" placeholder="Search by name, ID or department..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                            <div className="form-check form-switch d-flex align-items-center gap-2 mb-0 ps-0">
                                                <input className="form-check-input ms-0" type="checkbox" id="onlywfh" checked={onlyWfh} onChange={(e) => setOnlyWfh(e.target.checked)} />
                                                <label className="form-check-label text-nowrap" htmlFor="onlywfh">WFH only</label>
                                            </div>
                                        </div>
                                        <div className="wt-list">
                                            <div className="wt-list__head">
                                                <label className="mb-0 d-flex align-items-center gap-2 fw-semibold" style={{ cursor: "pointer" }}>
                                                    <input type="checkbox" checked={list.length > 0 && sel.length === list.length} onChange={toggleAll} /> Select all ({list.length})
                                                </label>
                                                <span className="wt-pill wt-pill--brand">{sel.length} selected</span>
                                            </div>
                                            {!list.length && <div className="wt-empty">No employees found</div>}
                                            {list.map((e) => (
                                                <label key={e._id} className="wt-list__row">
                                                    <input type="checkbox" checked={sel.includes(e._id)} onChange={() => toggle(e._id)} />
                                                    <div className="wt-av">{initials(e.name)}</div>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-semibold">{e.name}</div>
                                                        <small className="text-muted">{e.employeeId} · {e.department || "—"}</small>
                                                    </div>
                                                    {e.effectiveToday === "wfh" && <span className="wt-pill wt-pill--brand">WFH</span>}
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {tab === "department" && (
                                    <>
                                        <label className="lbl">Department</label>
                                        <select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                                            <option value="">Select...</option>
                                            {departments.map((d) => (
                                                <option key={d} value={d}>{d} ({emps.filter((e) => e.department === d).length})</option>
                                            ))}
                                        </select>
                                        <div className="wt-hint">The task will be assigned to all employees in this department (office + WFH).</div>
                                    </>
                                )}

                                {tab === "team" && isHr && (
                                    <>
                                        <label className="lbl">Team Leader</label>
                                        <select className="form-select" value={leader} onChange={(e) => setLeader(e.target.value)}>
                                            <option value="">Select...</option>
                                            {teams.map((t) => (
                                                <option key={t.leader_id} value={t.leader_id}>{t.leader_name} ({t.members} members)</option>
                                            ))}
                                        </select>
                                        <div className="wt-hint">The task will be assigned to all members of this Team Leader's team.</div>
                                    </>
                                )}

                                {tab === "team" && !isHr && (
                                    <div className="wt-hint mt-0">The task will be assigned to all {emps.length} members of your team.</div>
                                )}

                                {tab === "all_wfh" && (
                                    <div className="wt-hint mt-0">
                                        This will be assigned to <b>everyone working from home</b> on that date.
                                        ({emps.filter((e) => e.effectiveToday === "wfh").length} today)
                                    </div>
                                )}

                                {tab === "all" && <div className="wt-hint mt-0">This will be assigned to all active employees.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="wt-card">
                            <div className="wt-card__head">
                                <h2 className="wt-card__title">Task details</h2>
                                <div className="wt-seg">
                                    <button className={form.task_type === "normal" ? "is-on" : ""} onClick={() => setForm({ ...form, task_type: "normal" })}>Normal</button>
                                    <button className={form.task_type === "target" ? "is-on" : ""} onClick={() => setForm({ ...form, task_type: "target" })}>Target (number)</button>
                                </div>
                            </div>
                            <div className="wt-card__body">
                                <label className="lbl">Title</label>
                                <input className="form-control mb-3" placeholder="Task title (e.g. Follow-up calls)" value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                {form.task_type === "target" && (
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="lbl">Target</label>
                                            <input type="number" min={1} className="form-control" placeholder="e.g. 20" value={form.target_value}
                                                onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
                                        </div>
                                        <div className="col-6">
                                            <label className="lbl">Unit</label>
                                            <input list="hr-units" className="form-control" placeholder="calls, posts..." value={form.unit}
                                                onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                                            <datalist id="hr-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                                        </div>
                                    </div>
                                )}
                                <label className="lbl">Description</label>
                                <textarea className="form-control mb-3" rows={3} placeholder="Description / expected output" value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                <div className="row g-3 mb-3">
                                    <div className="col-6 col-md-3">
                                        <label className="lbl">Priority</label>
                                        <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="lbl">Hours</label>
                                        <input type="number" min={0} max={24} className="form-control" placeholder="Hours" value={form.planned_hours}
                                            onChange={(e) => setForm({ ...form, planned_hours: e.target.value })} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="lbl">Start</label>
                                        <input type="date" className="form-control" min={todayIST()} value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="lbl">Due (optional)</label>
                                        <input type="date" className="form-control" min={form.date} value={form.due_date} disabled={repeat.enabled}
                                            onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="wt-repeat mb-3">
                                    <div className="form-check form-switch mb-0">
                                        <input className="form-check-input" type="checkbox" id="rep" checked={repeat.enabled}
                                            onChange={(e) => setRepeat({ ...repeat, enabled: e.target.checked })} />
                                        <label className="form-check-label fw-semibold" htmlFor="rep">Repeat daily (daily target)</label>
                                    </div>
                                    {repeat.enabled && (
                                        <div>
                                            <div className="wt-days">
                                                {DAYS7.map((d) => (
                                                    <button key={d} type="button" className={`wt-day ${repeat.days.includes(d) ? "is-on" : ""}`} onClick={() => toggleDay(d)}>{d}</button>
                                                ))}
                                            </div>
                                            <label className="lbl">Repeat end date (optional, leave empty to continue indefinitely)</label>
                                            <input type="date" className="form-control mb-3" min={form.date} value={repeat.end_date}
                                                onChange={(e) => setRepeat({ ...repeat, end_date: e.target.value })} />
                                            <div className="form-check mb-1">
                                                <input className="form-check-input" type="checkbox" id="rwfh" checked={repeat.only_wfh}
                                                    onChange={(e) => setRepeat({ ...repeat, only_wfh: e.target.checked })} />
                                                <label className="form-check-label" htmlFor="rwfh">Generate on WFH days only</label>
                                            </div>
                                            <div className="form-check">
                                                <input className="form-check-input" type="checkbox" id="rcp" checked={repeat.close_previous}
                                                    onChange={(e) => setRepeat({ ...repeat, close_previous: e.target.checked })} />
                                                <label className="form-check-label" htmlFor="rcp">
                                                    Auto-close the previous day's unfinished target (no carry-over)
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button className="wt-btn wt-btn--primary wt-btn--block" disabled={busy || !targetReady || !formReady} onClick={assign}>
                                    {busy ? "Assigning..." : tab === "selected" ? `Assign to ${sel.length} employee(s)` : "Assign"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mainTab === "targets" &&
                (groupedRules.length > 0 ? (
                    <div className="wt-card">
                        <div className="wt-card__head">
                            <h2 className="wt-card__title">Active daily targets</h2>
                            <span className="wt-pill wt-pill--muted">{groupedRules.length}</span>
                        </div>
                        {groupedRules.map((g) => (
                            <div key={g.group_id} className="wt-rule">
                                <div>
                                    <h4>
                                        {g.title}
                                        {g.task_type === "target" && <span className="wt-pill wt-pill--dark">🎯 {g.target_value} {g.unit}</span>}
                                    </h4>
                                    <p>
                                        {g.days.join(", ")} · {g.start_date} → {g.end_date || "open"}
                                        {g.only_wfh ? " · WFH only" : ""}
                                        {g.close_previous ? " · auto-close" : ""}
                                    </p>
                                    <p>
                                        {g.names.length} employee(s): {g.names.slice(0, 5).join(", ")}
                                        {g.names.length > 5 ? ` +${g.names.length - 5}` : ""}
                                    </p>
                                </div>
                                <button className="wt-btn wt-btn--bad" onClick={() => stopGroup(g.group_id)}>Stop</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="wt-card"><div className="wt-empty">No active daily targets</div></div>
                ))}

            {mainTab === "test" && isHr && (
                <div className="wt-card">
                    <div className="wt-card__head"><h2 className="wt-card__title">Test jobs (reminders / recurring)</h2></div>
                    <div className="wt-card__body">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <input type="date" className="form-control form-control-sm w-auto" value={testDate}
                                onChange={(e) => setTestDate(e.target.value || todayIST())} />
                            {[
                                ["generate", "Generate recurring"], ["plan", "Plan reminder"], ["morning", "Morning digest"],
                                ["eod", "EOD reminder"], ["escalate", "Escalate TL/HR"],
                            ].map(([k, l]) => (
                                <button key={k} className="wt-btn wt-btn--ghost" onClick={() => runJob(k)}>{l}</button>
                            ))}
                        </div>
                        {testOut && <code className="wt-code">{testOut}</code>}
                        <div className="wt-hint">
                            This sends real notifications (the once-per-day lock is skipped). Remove this tab after testing.
                        </div>
                    </div>
                </div>
            )}

            {mainTab === "overview" && (
                <>
                    <div className="wt-card wt-toolbar">
                        <select className="form-select form-select-sm w-auto" value={ovDept} onChange={(e) => setOvDept(e.target.value)}>
                            <option value="">All departments</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 ps-0">
                            <input className="form-check-input ms-0" type="checkbox" id="ovwfh" checked={ovWfh} onChange={(e) => setOvWfh(e.target.checked)} />
                            <label className="form-check-label" htmlFor="ovwfh">WFH only</label>
                        </div>
                        <input type="date" className="form-control form-control-sm w-auto" value={ovDate}
                            onChange={(e) => setOvDate(e.target.value || todayIST())} />
                        <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 ps-0">
                            <input className="form-check-input ms-0" type="checkbox" id="nr" checked={needsReview}
                                onChange={(e) => setNeedsReview(e.target.checked)} />
                            <label className="form-check-label" htmlFor="nr">Needs review</label>
                        </div>
                        <span className="grow" />
                        {pendingReview > 0 && <span className="wt-pill wt-pill--warning wt-pill--nocap">{pendingReview} waiting for review</span>}
                        <button className="wt-btn wt-btn--ghost"
                            onClick={() => { loadOverview(); if (view) openView(view.emp, view.date); }}>Refresh</button>
                    </div>

                    <div className="wt-card">
                        <div className="wt-table-wrap">
                            <table className="wt-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th><th>Mode</th><th className="c">Tasks</th><th className="c">Self / Assigned</th><th className="c">Done</th>
                                        <th>Pending from earlier</th><th className="c">Plan</th><th className="c">EOD</th><th>Score</th><th>Review</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!shownRows.length && <tr><td colSpan={11}><div className="wt-empty">No employees found</div></td></tr>}
                                    {shownRows.map((r) => (
                                        <tr key={r._id}>
                                            <td>
                                                <div className="wt-emp">
                                                    <div className="wt-av">{initials(r.name)}</div>
                                                    <div>
                                                        <b>{r.name}</b>
                                                        <small>{r.department || "—"}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {r.effectiveToday === "wfh"
                                                    ? <span className="wt-pill wt-pill--brand">WFH</span>
                                                    : <span className="wt-pill wt-pill--line">Office</span>}
                                            </td>
                                            <td className="c">
                                                <span className="wt-num">{r.total}</span>
                                                {r.total === 0 && r.carried > 0 && <span className="wt-sub">carry-over only</span>}
                                            </td>
                                            <td className="c wt-num">{r.self} / {r.assigned}</td>
                                            <td className="c wt-num">{r.completed}</td>
                                            <td>
                                                {r.carried > 0 ? <span className="wt-pill wt-pill--warning">{r.carried}</span> : <Dash />}
                                                {r.overdue > 0 && <span className="wt-pill wt-pill--danger ms-1 wt-pill--nocap">{r.overdue} overdue</span>}
                                            </td>
                                            <td className="c">{r.plan ? <Tick /> : <Dash />}</td>
                                            <td className="c">
                                                {r.eod ? <Tick /> : <Dash />}
                                                {r.eod && r.eod_late && <span className="wt-pill wt-pill--danger ms-1 wt-pill--nocap">Late</span>}
                                            </td>
                                            <td>
                                                {r.score != null ? (
                                                    <div className="wt-score">
                                                        <div className="wt-bar"><i className={scoreTone(r.score)} style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }} /></div>
                                                        <span className="wt-num">{r.score}%</span>
                                                    </div>
                                                ) : <Dash />}
                                            </td>
                                            <td>
                                                {r.eod
                                                    ? <span className={`wt-pill wt-pill--${REVIEW_BADGE[r.review_status] || "muted"}`}>{r.review_status}</span>
                                                    : <Dash />}
                                            </td>
                                            <td className="text-end"><button className="wt-btn wt-btn--ghost" onClick={() => openView(r)}>View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {view && (
                        <div className="wt-card">
                            <div className="wt-detail__head">
                                <div className="wt-emp">
                                    <div className="wt-av">{initials(view.emp.name)}</div>
                                    <h3>{view.emp.name} <span>— {view.date}</span></h3>
                                </div>
                                <div className="d-flex gap-2">
                                    <input type="date" className="form-control form-control-sm" value={view.date}
                                        onChange={(e) => setOvDate(e.target.value)} />
                                    <button className="wt-icon-btn" aria-label="Close" onClick={() => setView(null)}>✕</button>
                                </div>
                            </div>

                            {rep && (
                                <div className="wt-chips">
                                    <span className="wt-pill wt-pill--info wt-pill--nocap">Score {rep.score ?? "—"}%</span>
                                    <span className={`wt-pill ${rep.plan_submitted_at ? "wt-pill--success" : "wt-pill--muted"}`}>Plan {rep.plan_submitted_at ? "✔" : "✘"}</span>
                                    <span className={`wt-pill ${rep.eod_submitted_at ? "wt-pill--success" : "wt-pill--muted"}`}>EOD {rep.eod_submitted_at ? "✔" : "✘"}</span>
                                    {rep.eod_late && <span className="wt-pill wt-pill--danger">Late</span>}
                                </div>
                            )}
                            {!view.data.tasks.length && <div className="wt-empty">No tasks</div>}

                            <div className="mt-2">
                                {view.data.tasks.map((t) => (
                                    <div key={t._id} className="wt-task">
                                        <div className={`wt-task__bar ${tone(t)}`} />
                                        <div className="wt-task__main">
                                            <div className="wt-task__top">
                                                <div>
                                                    <h4 className="wt-task__title">{t.title}</h4>
                                                    <div className="wt-tags">
                                                        <span className={`wt-pill wt-pill--nocap ${t.assigned_by_type === "self" ? "wt-pill--info" : "wt-pill--dark"}`}>
                                                            {t.assigned_by_type === "self" ? "Self plan" : `by ${t.assigned_by_name}`}
                                                        </span>
                                                        {t.date < view.date && <span className="wt-pill wt-pill--warning wt-pill--nocap">from {t.date}</span>}
                                                        {t.due_date && <span className="wt-pill wt-pill--line wt-pill--nocap">due {t.due_date}</span>}
                                                    </div>
                                                    {t.task_type === "target" && <div className="wt-target">🎯 {t.achieved_value}/{t.target_value} {t.unit}</div>}
                                                </div>
                                                <div className="wt-task__act">
                                                    <span className={`wt-pill wt-pill--${stBadge(t)}`}>{t.status}{t.status === "partial" ? ` ${t.percent}%` : ""}</span>
                                                    {["pending", "partial"].includes(t.status) && (
                                                        <button className="wt-btn wt-btn--bad" onClick={() => closeTask(t)}>Close</button>
                                                    )}
                                                </div>
                                            </div>
                                            {t.status === "cancelled" && <div className="wt-closed">Closed: {t.cancel_reason} ({t.cancelled_by})</div>}
                                            {(t.progress_log || []).length > 0 && (
                                                <ul className="wt-log">
                                                    {(t.progress_log || []).map((l) => (
                                                        <li key={l.date}>
                                                            <b>{l.date}</b>: {t.task_type === "target" ? `+${l.value_today} ${t.unit}` : `${l.status} ${l.percent}%`}
                                                            {l.note ? ` — ${l.note}` : ""}
                                                            {l.date > view.date && <span className="wt-pill wt-pill--info wt-pill--nocap ms-2">updated later</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {(t.attachments || []).length > 0 && (
                                                <div className="wt-files">
                                                    {(t.attachments || []).map((a) => (
                                                        <a key={a._id} href={a.url} target="_blank" rel="noreferrer" className="wt-file">{a.name}</a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {rep?.summary && <div className="wt-summary">💬 {rep.summary}</div>}

                            {rep?.eod_submitted_at && (
                                <div className="wt-review">
                                    <span className="text-muted">Review:</span>
                                    <span className={`wt-pill wt-pill--${REVIEW_BADGE[rep.review_status || "pending"]}`}>{rep.review_status || "pending"}</span>
                                    {rep.reviewer_name && <small className="text-muted">by {rep.reviewer_name}</small>}
                                    {rep.review_note && <small>— {rep.review_note}</small>}
                                    <div className="push">
                                        <button className="wt-btn wt-btn--ok" onClick={() => review("accepted")}>Accept</button>
                                        <button className="wt-btn wt-btn--warn" onClick={() => review("rework")}>Request rework</button>
                                        {rep.review_status && rep.review_status !== "pending" && (
                                            <button className="wt-btn wt-btn--ghost" onClick={() => review("pending")}>Reopen</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}