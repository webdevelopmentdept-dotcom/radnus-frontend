import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import EmployeeLayout from "./EmployeeLayout";
import {
  Target, Lock, Share2, Plus, CheckCircle, XCircle, Pause, Play,
  Star, X, Pencil, Sparkles, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/life-growth`;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
});
const api = async (method, path, data) => {
  const r = await axios({ method, url: API + path, data, headers: authHeader() });
  return r.data;
};
const errMsg = (e) => e?.response?.data?.message || "Something went wrong. Please try again.";

const STATUS = {
  planned:     { label: "Planned",     color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In progress", color: "#2563eb", bg: "#eff6ff" },
  paused:      { label: "Paused",      color: "#d97706", bg: "#fffbeb" },
  completed:   { label: "Completed",   color: "#16a34a", bg: "#f0fdf4" },
  cancelled:   { label: "Cancelled",   color: "#dc2626", bg: "#fef2f2" },
  revised:     { label: "Revised",     color: "#7c3aed", bg: "#f5f3ff" },
};
const ACTIONS_FOR = {
  planned:     [["start", "Start", Play], ["pause", "Pause", Pause], ["cancel", "Cancel", XCircle]],
  in_progress: [["complete", "Complete", CheckCircle], ["pause", "Pause", Pause], ["cancel", "Cancel", XCircle]],
  paused:      [["resume", "Resume", Play], ["cancel", "Cancel", XCircle]],
};
const money = (n) => (n === null || n === undefined ? "" : `₹${Number(n).toLocaleString("en-IN")}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 };
const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#111827", fontSize: 13, cursor: "pointer" };
const btnPrimary = { ...btn, background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" };
const input = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", background: "#fff", color: "#111827" };
const label = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <button style={{ ...btn, padding: 4 }} onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───────────── Vision form ───────────── */
function VisionForm({ vision, onSaved, onClose }) {
  const [mission, setMission] = useState(vision?.personal_mission || "");
  const [vis, setVis] = useState(vision?.personal_vision || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body = { personal_mission: mission, personal_vision: vis };
      if (vision) await api("patch", "/my-vision", body);
      else await api("post", "/my-vision", body);
      onSaved();
    } catch (e) { setErr(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <div>
      <label style={label}>My personal mission</label>
      <textarea style={{ ...input, minHeight: 90 }} value={mission} onChange={(e) => setMission(e.target.value)} maxLength={1500}
        placeholder="Who do I want to become? What do I want to achieve? What matters most to me and my family?" />
      <label style={{ ...label, marginTop: 12 }}>My vision for the next five years</label>
      <textarea style={{ ...input, minHeight: 90 }} value={vis} onChange={(e) => setVis(e.target.value)} maxLength={1500}
        placeholder="What does my life look like in five years?" />
      {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        {onClose && <button style={btn} onClick={onClose}>Cancel</button>}
        <button style={btnPrimary} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  );
}

/* ───────────── Goal form (pick a standard option or write your own) ───────────── */
function GoalForm({ stage, categories, hasPrimary, onSaved, onClose }) {
  const [options, setOptions] = useState([]);
  const [pick, setPick] = useState("custom"); // catalogue id or "custom"
  const [f, setF] = useState({ title: "", category: "", description: "", target_date: "", target_amount: "", monthly_contribution: "", next_action: "", notes: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!stage) return;
    api("get", `/catalogue?stage=${stage}`).then((r) => { setOptions(r.data || []); if (r.data?.length) setPick(r.data[0]._id); }).catch(() => {});
  }, [stage]);

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        stage_number: stage || undefined,
        target_date: f.target_date,
        priority: f.priority,
        target_amount: f.target_amount === "" ? undefined : Number(f.target_amount),
        monthly_contribution: f.monthly_contribution === "" ? undefined : Number(f.monthly_contribution),
        next_action: f.next_action || undefined,
        notes: f.notes || undefined,
        description: f.description || undefined,
      };
      if (pick !== "custom") body.catalogue_goal_id = pick;
      else { body.title = f.title; body.category = f.category; }
      await api("post", "/my-goals", body);
      onSaved();
    } catch (e) { setErr(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <div>
      {stage && options.map((o) => (
        <label key={o._id} style={{ display: "flex", gap: 8, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 6, cursor: "pointer", background: pick === o._id ? "#eef2ff" : "#fff" }}>
          <input type="radio" name="opt" checked={pick === o._id} onChange={() => setPick(o._id)} />
          <span><b style={{ fontSize: 14 }}>{o.goal_title}</b><br /><span style={{ fontSize: 12, color: "#6b7280" }}>{o.goal_description}</span></span>
        </label>
      ))}
      <label style={{ display: "flex", gap: 8, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 10, cursor: "pointer", background: pick === "custom" ? "#eef2ff" : "#fff" }}>
        <input type="radio" name="opt" checked={pick === "custom"} onChange={() => setPick("custom")} />
        <b style={{ fontSize: 14 }}>Write my own goal</b>
      </label>

      {pick === "custom" && (
        <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
          <div><label style={label}>Goal title</label><input style={input} value={f.title} onChange={set("title")} maxLength={120} /></div>
          <div><label style={label}>Category</label>
            <select style={input} value={f.category} onChange={set("category")}>
              <option value="">Select...</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label style={label}>Description (optional)</label><textarea style={{ ...input, minHeight: 60 }} value={f.description} onChange={set("description")} maxLength={1000} /></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        <div><label style={label}>Target date *</label><input type="date" style={input} value={f.target_date} onChange={set("target_date")} /></div>
        <div><label style={label}>Priority</label>
          <select style={input} value={f.priority} onChange={set("priority")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        <div><label style={label}>Target amount ₹ (optional)</label><input type="number" min="0" style={input} value={f.target_amount} onChange={set("target_amount")} /></div>
        <div><label style={label}>Monthly plan ₹ (optional)</label><input type="number" min="0" style={input} value={f.monthly_contribution} onChange={set("monthly_contribution")} /></div>
      </div>
      <div style={{ marginTop: 10 }}><label style={label}>My next action (optional)</label><input style={input} value={f.next_action} onChange={set("next_action")} maxLength={300} /></div>
      <div style={{ marginTop: 10 }}><label style={label}>Private notes (optional)</label><textarea style={{ ...input, minHeight: 50 }} value={f.notes} onChange={set("notes")} maxLength={1000} /></div>

      <p style={{ fontSize: 12, color: "#6b7280", margin: "10px 0 0", display: "flex", gap: 6, alignItems: "center" }}>
        <Lock size={13} /> This goal is private. Only you can see it unless you choose to share it.
        {stage && hasPrimary ? " This stage already has a primary goal, so this will be an additional goal." : ""}
      </p>
      {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={btn} onClick={onClose}>Cancel</button>
        <button style={btnPrimary} disabled={saving} onClick={save}>{saving ? "Saving..." : "Add goal"}</button>
      </div>
    </div>
  );
}

/* ───────────── In-app confirm dialog (no browser popups) ───────────── */
function ConfirmDialog({ title, message, label, danger, onYes, onClose }) {
  return createPortal(
    <Modal title={title} onClose={onClose}>
      <p style={{ fontSize: 14, color: "#374151", marginTop: 0 }}>{message}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <button style={btn} onClick={onClose}>Go back</button>
        <button
          style={{ ...btnPrimary, ...(danger ? { background: "#dc2626", borderColor: "#dc2626" } : {}) }}
          onClick={() => { onClose(); onYes(); }}
        >{label}</button>
      </div>
    </Modal>,
    document.body
  );
}

/* ───────────── Share dialog: the employee decides who sees what ───────────── */
const SCOPE_TEXT = {
  none: "Not shared. Only you can see this goal.",
  summary: "Summary: title, category, status, progress and target date.",
  full: "Full details: the summary plus description, next action, amounts and notes.",
};

function ShareModal({ goal, share, onClose, onDone, onError }) {
  const current = (r) => (goal.shared_with || []).find((s) => s.recipient === r)?.scope || "none";
  const [team, setTeam] = useState(current("team_lead"));
  const [hr, setHr] = useState(current("hr"));
  const [saving, setSaving] = useState(false);

  const apply = async (recipient, from, to) => {
    if (from === to) return;
    if (to === "none") await api("delete", `/my-goals/${goal._id}/share?recipient=${recipient}`);
    else await api("post", `/my-goals/${goal._id}/share`, { recipient, scope: to });
  };
  const save = async () => {
    setSaving(true);
    try {
      await apply("team_lead", current("team_lead"), team);
      await apply("hr", current("hr"), hr);
      onDone();
    } catch (e) { onError(errMsg(e)); setSaving(false); }
  };

  const row = (title, note, value, setValue, disabled) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <b style={{ fontSize: 14 }}>{title}</b>
      {note && <div style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 8px" }}>{note}</div>}
      <select style={{ ...input, marginTop: note ? 0 : 8 }} value={value} disabled={disabled} onChange={(e) => setValue(e.target.value)}>
        <option value="none">Do not share</option>
        <option value="summary">Share summary only</option>
        <option value="full">Share full details</option>
      </select>
      <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>{SCOPE_TEXT[value]}</div>
    </div>
  );

  return createPortal(
    <Modal title={`Who can see "${goal.title}"?`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "#4b5563", marginTop: 0 }}>You decide who sees this goal and how much. You can change or stop sharing at any time.</p>
      {row(
        `Team Lead${share.leaderName ? ` (${share.leaderName})` : ""}`,
        share.hasLeader ? "" : "You do not have a Team Lead assigned yet.",
        team, setTeam, !share.hasLeader && current("team_lead") === "none"
      )}
      {row("HR", "Anyone who signs in with the HR login can see what you share here.", hr, setHr, false)}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={btn} onClick={onClose}>Cancel</button>
        <button style={btnPrimary} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </Modal>,
    document.body
  );
}

/* ───────────── One goal ───────────── */
function GoalCard({ g, share, onChange, onError, onOk }) {
  const [progress, setProgress] = useState(g.current_progress);
  const [showShare, setShowShare] = useState(false);
  const [confirm, setConfirm] = useState(null);
  useEffect(() => setProgress(g.current_progress), [g.current_progress]);
  const sharedWith = g.shared_with || [];
  const sharedText = sharedWith
    .map((x) => `${x.recipient === "hr" ? "HR" : share.leaderName || "Team Lead"} (${x.scope === "full" ? "full details" : "summary"})`)
    .join(", ");
  const st = STATUS[g.status] || STATUS.planned;
  const open = ["planned", "in_progress", "paused"].includes(g.status);

  const run = async (fn, okMsg) => { try { await fn(); onChange(); if (okMsg && onOk) onOk(okMsg); } catch (e) { onError(errMsg(e)); } };
  const ACTION_MSG = { start: "Goal started", pause: "Goal paused", resume: "Goal resumed", complete: "Goal completed. Well done!", cancel: "Goal cancelled" };
  const doAction = (name) => run(() => api("post", `/my-goals/${g._id}/${name}`), ACTION_MSG[name]);
  const askCancel = () => setConfirm({
    title: "Cancel this goal?", label: "Yes, cancel goal", danger: false,
    message: `"${g.title}" will be closed and moved to finished goals. This cannot be undone.`,
    onYes: () => doAction("cancel"),
  });
  const doDelete = () => setConfirm({
    title: "Delete this goal?", label: "Delete permanently", danger: true,
    message: `"${g.title}", its notes and any sharing will be removed for good. This cannot be undone.`,
    onYes: () => run(() => api("delete", `/my-goals/${g._id}`), "Goal deleted"),
  });
  const saveProgress = () => progress !== g.current_progress && run(() => api("patch", `/my-goals/${g._id}`, { current_progress: Number(progress) }), "Progress saved");
  return (
    <div style={{ ...card, padding: 12, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <b style={{ fontSize: 14 }}>{g.is_primary && open && <Star size={13} style={{ color: "#f59e0b", marginRight: 4, verticalAlign: "-2px" }} />}{g.title}</b>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{g.category} · Target {fmtDate(g.target_date)}{g.target_amount != null ? ` · ${money(g.target_amount)}` : ""}</div>
        </div>
        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 20, color: st.color, background: st.bg, height: "fit-content" }}>{st.label}</span>
      </div>

      <div style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <input type="range" min="0" max="100" step="5" value={progress} disabled={!open}
          onChange={(e) => setProgress(e.target.value)} onMouseUp={saveProgress} onTouchEnd={saveProgress} onKeyUp={saveProgress} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, width: 36, textAlign: "right" }}>{progress}%</span>
      </div>
      {g.next_action && <div style={{ fontSize: 12, color: "#374151" }}>Next: {g.next_action}</div>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {(ACTIONS_FOR[g.status] || []).map(([name, text, Icon]) => (
          <button key={name} style={btn} onClick={() => (name === "cancel" ? askCancel() : doAction(name))}><Icon size={13} />{text}</button>
        ))}
        {open && g.stage_number && !g.is_primary && <button style={btn} onClick={() => run(() => api("post", `/my-goals/${g._id}/make-primary`), "Primary goal updated")}><Star size={13} />Make primary</button>}
        {g.status !== "cancelled" && (
          <button style={btn} onClick={() => setShowShare(true)}><Share2 size={13} />{sharedWith.length ? "Change sharing" : "Share..."}</button>
        )}
        <button style={{ ...btn, color: "#b91c1c", borderColor: "#fecaca" }} onClick={doDelete}><Trash2 size={13} />Delete</button>
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
        {sharedWith.length ? <><Share2 size={11} /> Shared with {sharedText}</> : <><Lock size={11} /> Private</>}
      </div>
      {showShare && <ShareModal goal={g} share={share} onClose={() => setShowShare(false)} onDone={() => { setShowShare(false); onChange(); if (onOk) onOk("Sharing updated"); }} onError={onError} />}
      {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ───────────── Finished goals: hidden until you click "View" ───────────── */
function ClosedGoals({ goals, share, onChange, onError, onOk }) {
  const [show, setShow] = useState(false);
  if (!goals.length) return null;
  const completed = goals.filter((g) => g.status === "completed").length;
  const cancelled = goals.filter((g) => g.status === "cancelled").length;
  const parts = [completed && `${completed} completed`, cancelled && `${cancelled} cancelled`].filter(Boolean).join(", ");
  return (
    <div style={{ marginTop: 10 }}>
      <button style={{ ...btn, width: "100%", justifyContent: "space-between", background: "#f9fafb" }} onClick={() => setShow((v) => !v)}>
        <span>{show ? "Hide" : "View"} finished goals ({parts || goals.length})</span>
        {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {show && goals.map((g) => <GoalCard key={g._id} g={g} share={share} onChange={onChange} onError={onError} onOk={onOk} />)}
    </div>
  );
}

const isOpenStatus = (st) => ["planned", "in_progress", "paused"].includes(st);

/* ───────────── Page ───────────── */
export default function MyLifeVision() {
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [stages, setStages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vision, setVision] = useState(null);
  const [goals, setGoals] = useState([]);
  const [share, setShare] = useState({ hasLeader: false, sharingEnabled: false, leaderName: "" });
  const [modal, setModal] = useState(null); // { type: "vision" } | { type: "goal", stage }
  const [toast, setToast] = useState(null); // { type: "success" | "error", text }
  const showError = (text) => setToast({ type: "error", text });
  const showOk = (text) => setToast({ type: "success", text });

  const load = useCallback(async () => {
    try {
      const [s, v, g, t] = await Promise.all([api("get", "/stages"), api("get", "/my-vision"), api("get", "/my-goals"), api("get", "/my-share-target")]);
      setStages(s.data); setCategories(s.categories); setVision(v.data); setGoals(g.data); setShare(t);
    } catch (e) {
      if (e?.response?.status === 404) setDisabled(true); else showError(errMsg(e));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), toast.type === "success" ? 3500 : 8000); return () => clearTimeout(t); }, [toast]);

  const done = (msg) => { setModal(null); load(); if (msg) showOk(msg); };

  if (loading) return <EmployeeLayout pageTitle="My Life Vision"><p style={{ padding: 24 }}>Loading...</p></EmployeeLayout>;
  if (disabled) {
    return (
      <EmployeeLayout pageTitle="My Life Vision">
        <div style={{ ...card, margin: 24, textAlign: "center" }}><Sparkles size={28} /><p>My Life Vision is not available for you yet. Please check back soon.</p></div>
      </EmployeeLayout>
    );
  }

  const open = goals.filter((g) => ["planned", "in_progress", "paused"].includes(g.status)).length;
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <EmployeeLayout pageTitle="My Life Vision">
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        {toast && (
          <div
            role={toast.type === "error" ? "alert" : "status"}
            style={{
              ...card, position: "fixed", top: 16, right: 16, zIndex: 3000, maxWidth: 380,
              borderColor: toast.type === "success" ? "#bbf7d0" : "#fecaca",
              background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: toast.type === "success" ? "#15803d" : "#b91c1c",
              boxShadow: "0 8px 24px rgba(0,0,0,.18)", display: "flex", gap: 10, alignItems: "flex-start",
            }}
          >
            {toast.type === "success" ? <CheckCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} /> : <XCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
            <span style={{ flex: 1, fontSize: 14 }}>{toast.text}</span>
            <button style={{ ...btn, padding: 2 }} onClick={() => setToast(null)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}

        <div style={{ ...card, background: "#eef2ff", borderColor: "#c7d2fe", marginBottom: 14, display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
          <Lock size={16} /> Your Life Vision is voluntary and private. It does not affect your KPIs, appraisal, salary or promotion. Only you can see your goals. You choose whether to share a goal with your Team Lead, HR or both, and how much they see.
        </div>

        {!vision ? (
          <div style={card}>
            <h2 style={{ marginTop: 0, fontSize: 20, display: "flex", gap: 8, alignItems: "center" }}><Target size={20} /> Start my Life Vision</h2>
            <p style={{ color: "#4b5563", fontSize: 14 }}>Write a few lines about who you want to become, then pick one goal for each stage of the next five years. You can change everything later.</p>
            <VisionForm vision={null} onSaved={() => done("Life Vision saved")} />
          </div>
        ) : (
          <>
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, display: "flex", gap: 8, alignItems: "center" }}><Target size={18} /> My Life Vision</h2>
                <button style={btn} onClick={() => setModal({ type: "vision" })}><Pencil size={13} /> Edit</button>
              </div>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14, margin: "10px 0 4px" }}><b>Mission: </b>{vision.personal_mission}</p>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14, margin: 0 }}><b>5-year vision: </b>{vision.personal_vision}</p>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{open} open goal{open === 1 ? "" : "s"} · {completed} completed</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
              {stages.map((s) => {
                const list = goals.filter((g) => g.stage_number === s.stage_number);
                const primary = list.find((g) => g.is_primary && ["planned", "in_progress", "paused"].includes(g.status));
                const others = list.filter((g) => g !== primary && isOpenStatus(g.status));
                const finished = list.filter((g) => g !== primary && !isOpenStatus(g.status));
                return (
                  <div key={s.stage_number} style={card}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>STAGE {s.stage_number} · {s.timeframe.toUpperCase()}</div>
                    <b style={{ fontSize: 15 }}>{s.stage_name}</b>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{s.objective}</p>
                    {primary && <GoalCard g={primary} share={share} onChange={load} onError={showError} onOk={showOk} />}
                    {others.map((g) => <GoalCard key={g._id} g={g} share={share} onChange={load} onError={showError} onOk={showOk} />)}
                    <ClosedGoals goals={finished} share={share} onChange={load} onError={showError} onOk={showOk} />
                    <button style={{ ...(primary ? btn : btnPrimary), marginTop: 10 }} onClick={() => setModal({ type: "goal", stage: s.stage_number, hasPrimary: !!primary })}>
                      <Plus size={14} /> {primary ? "Add another goal" : "Choose my goal"}
                    </button>
                  </div>
                );
              })}
            </div>

            {goals.some((g) => !g.stage_number) && (
              <div style={{ ...card, marginTop: 14 }}>
                <b>Other personal goals</b>
                {goals.filter((g) => !g.stage_number && isOpenStatus(g.status)).map((g) => <GoalCard key={g._id} g={g} share={share} onChange={load} onError={showError} onOk={showOk} />)}
                <ClosedGoals goals={goals.filter((g) => !g.stage_number && !isOpenStatus(g.status))} share={share} onChange={load} onError={showError} onOk={showOk} />
              </div>
            )}
            <button style={{ ...btn, marginTop: 14 }} onClick={() => setModal({ type: "goal", stage: null, hasPrimary: false })}><Plus size={14} /> Add a goal outside the stages</button>
          </>
        )}
      </div>

      {modal?.type === "vision" && <Modal title="Edit my vision" onClose={() => setModal(null)}><VisionForm vision={vision} onSaved={() => done("Life Vision updated")} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "goal" && (
        <Modal title={modal.stage ? `Stage ${modal.stage}: choose a goal` : "Add a personal goal"} onClose={() => setModal(null)}>
          <GoalForm stage={modal.stage} categories={categories} hasPrimary={modal.hasPrimary} onSaved={() => done("Goal added")} onClose={() => setModal(null)} />
        </Modal>
      )}
    </EmployeeLayout>
  );
}