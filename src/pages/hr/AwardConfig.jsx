import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, X, Rocket, Copy, Trash2, Pencil, Eye, Flag,
  AlertCircle, CheckCircle2, Info, Trophy,
} from "lucide-react";
import { useDepartments } from "../../hooks/Usedepartments";
import RecognitionTabs from "./RecognitionTabs";
const API = `${import.meta.env.VITE_API_BASE_URL}/api/award-definitions`;

// ─── Labels ──────────────────────────────────────────────────────────────────
const CATEGORY = {
  performance: { label: "Performance", color: "#1d4ed8", bg: "#eff6ff" },
  behavioural: { label: "Behavioural", color: "#6d28d9", bg: "#f5f3ff" },
  team: { label: "Team", color: "#0f766e", bg: "#f0fdfa" },
  special_scheme: { label: "Special scheme", color: "#b45309", bg: "#fffbeb" },
};
const STATUS = {
  draft: { label: "Draft", color: "#4b5563", bg: "#f3f4f6" },
  active: { label: "Active", color: "#047857", bg: "#ecfdf5" },
  closed: { label: "Closed", color: "#475569", bg: "#e2e8f0" },
};
const FREQ = { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", one_time: "One time" };
const RULES = [
  { value: "weighted_score", label: "Weighted score", desc: "Rank people on metrics you weight, like KPI and attendance." },
  { value: "qualifying_days", label: "Qualifying days", desc: "Win by hitting a daily minimum on enough days." },
  { value: "manual_selection", label: "Committee picks", desc: "No scoring. HR or the committee chooses the winners." },
];
const BASES = [
  { value: "kpi", label: "A specific KPI", desc: "Count one or more KPIs from the employees' Daily Log." },
  { value: "whole_kpi", label: "Whole KPI performance", desc: "Rank by the monthly KPI achievement %." },
  { value: "incentive", label: "Incentive", desc: "Count approved incentive entries." },
  { value: "loan", label: "Loan", desc: "Count loans from the Loan module." },
  { value: "", label: "Other or scorecard", desc: "Pick several metrics yourself, or let a committee choose." },
];
const REWARD = {
  trophy: "Trophy", gold_medal: "Gold medal", silver_medal: "Silver medal", bronze_medal: "Bronze medal",
  medal: "Medal", certificate: "Certificate", badge: "Champion badge", gift_voucher: "Gift voucher",
  cash: "Cash", points: "Recognition points",
};
const TIE = {
  higher_kpi: "Higher KPI achievement", higher_attendance: "Better attendance",
  higher_revenue: "Higher revenue", longer_service: "Longer service", committee_decision: "Committee decision",
};
const STEP = { hr: "HR", committee: "Committee", management: "Management" };

const COLOR = {
  border: "#e5e7eb", text: "#111827", sub: "#6b7280", faint: "#9ca3af", bg: "#f9fafb",
  blue: "#2563eb", blueBg: "#eff6ff", green: "#047857", greenBg: "#ecfdf5",
  amber: "#b45309", amberBg: "#fffbeb", red: "#b91c1c", redBg: "#fef2f2",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d} ${MON[+m - 1]} ${y}`;
};
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const ymd = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Awards are usually set up at the end of a month for the next one
function nextMonthRange() {
  const n = new Date();
  const first = new Date(n.getFullYear(), n.getMonth() + 1, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return [
    ymd(first.getFullYear(), first.getMonth(), 1),
    ymd(last.getFullYear(), last.getMonth(), last.getDate()),
  ];
}

const blankForm = () => {
  const [start_date, end_date] = nextMonthRange();
  return {
    name: "", description: "", category: "performance", frequency: "monthly", participation: "individual",
    departments: [], employee_ids: [], start_date, end_date,
    rule_type: "weighted_score", metrics: [],
    qualifying_rule: { metric_key: "daily_incentive_count", min_daily_value: 2, days_required: 20 },
    eligibility: { min_kpi_percent: 0, min_service_months: 0, min_attendance_percent: 0 },
    tie_breakers: [],
    winners: { mode: "top_n", count: 1 },
    rewards: [{ rank_from: 1, rank_to: 1, type: "trophy", title: "", cash_amount: 0, points: 0 }],
    budget: { total: 0 },
    approval_chain: ["hr", "committee", "management"],
    counts_in_appraisal: false, recognition_points: 0, basis: "", loan_count_on: "paid",
  };
};

const fromDoc = (doc) => {
  const b = blankForm();
  return {
    ...b, ...doc,
    start_date: String(doc.start_date || "").slice(0, 10),
    end_date: String(doc.end_date || "").slice(0, 10),
    metrics: (doc.metrics || []).map((m) => ({ ...m, target: m.target ?? "" })),
    qualifying_rule: { ...b.qualifying_rule, ...(doc.qualifying_rule || {}) },
    eligibility: { ...b.eligibility, ...(doc.eligibility || {}) },
    winners: { ...b.winners, ...(doc.winners || {}) },
    budget: { total: doc.budget?.total || 0 },
    rewards: (doc.rewards || []).map((r) => ({ ...r })),
  };
};

const fromPreset = (p, keep) => {
  const b = blankForm();
  return {
    ...b, ...p, ...keep,
    metrics: (p.metrics || []).map((m) => ({ ...m, target: "" })),
    qualifying_rule: { ...b.qualifying_rule, ...(p.qualifying_rule || {}) },
    eligibility: { ...b.eligibility, ...(p.eligibility || {}) },
    winners: { ...b.winners, ...(p.winners || {}) },
    rewards: (p.rewards || []).map((r) => ({ ...r })),
  };
};

// Same rule the server uses, so the number shown here matches the launch check
function estimateCash(f) {
  const winners = Number(f.winners.count) || 0;
  return (f.rewards || []).reduce((sum, r) => {
    if (r.type !== "cash") return sum;
    const from = Number(r.rank_from) || 1;
    const to = Number(r.rank_to);
    const people = to > 0 ? Math.max(to - from + 1, 0) : winners;
    return sum + (Number(r.cash_amount) || 0) * people;
  }, 0);
}

function summarize(f) {
  const parts = [...f.departments.map((d) => `${d} (all)`), ...(f.employee_ids?.length ? [`${f.employee_ids.length} selected employee(s)`] : [])];
  const who = parts.length ? parts.join(", ") : "all departments";
  const win = f.winners.mode === "top_n" ? `Top ${f.winners.count || 1}` : "Everyone who qualifies";
  let how = "chosen by the committee";
  if (f.rule_type === "weighted_score") {
    const n = f.metrics.length;
    how = `scored on ${n || "no"} metric${n === 1 ? "" : "s"}`;
  } else if (f.rule_type === "qualifying_days") {
    how = `reaching ${f.qualifying_rule.min_daily_value || 0} or more a day on ${f.qualifying_rule.days_required || 0} days`;
  }
  return `${win} from ${who}, ${how}, between ${fmtDate(f.start_date)} and ${fmtDate(f.end_date)}.`;
}

const rewardsText = (rewards = []) => {
  if (!rewards.length) return "No rewards yet";
  const names = [...new Set(rewards.map((r) => REWARD[r.type] || r.type))];
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3} more` : names.join(", ");
};

const errOf = (e) => ({
  message: e?.response?.data?.message || "Something went wrong. Try again.",
  errors: e?.response?.data?.errors || [],
  warnings: e?.response?.data?.warnings || [],
});

// ─── Shared styles ───────────────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", padding: "9px 11px", border: `1px solid ${COLOR.border}`, borderRadius: 8,
    fontSize: 13, color: COLOR.text, background: "#fff", boxSizing: "border-box",
  },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: COLOR.sub, marginBottom: 5 },
  hint: { margin: "5px 0 0", fontSize: 11.5, color: COLOR.faint, lineHeight: 1.45 },
  btn: (kind = "ghost", small = false) => ({
    display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600,
    fontSize: small ? 12 : 13, padding: small ? "5px 10px" : "9px 16px", borderRadius: 8,
    border: kind === "primary" ? "none" : `1px solid ${kind === "danger" ? "#fecaca" : COLOR.border}`,
    background: kind === "primary" ? COLOR.blue : kind === "danger" ? COLOR.redBg : "#fff",
    color: kind === "primary" ? "#fff" : kind === "danger" ? COLOR.red : "#374151",
    whiteSpace: "nowrap",
  }),
  chip: (on) => ({
    padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${on ? COLOR.blue : COLOR.border}`,
    background: on ? COLOR.blueBg : "#fff", color: on ? "#1d4ed8" : "#4b5563",
  }),
  grid: (min = 200) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }),
};

const CSS = `
.ac-in:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe}
.ac-in:disabled,.ac-btn:disabled{opacity:.65;cursor:not-allowed}
.ac-btn:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}
.ac-row:hover{background:#f9fafb}
@keyframes ac-slide{from{transform:translateX(24px);opacity:.4}to{transform:none;opacity:1}}
.ac-drawer{animation:ac-slide .18s ease-out}
@media (prefers-reduced-motion: reduce){.ac-drawer{animation:none}}
`;

// ─── Small building blocks ───────────────────────────────────────────────────
const Pill = ({ color, bg, children }) => (
  <span style={{ background: bg, color, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const Field = ({ label, hint, children, style }) => (
  <label style={{ display: "block", ...style }}>
    <span style={S.label}>{label}</span>
    {children}
    {hint && <p style={S.hint}>{hint}</p>}
  </label>
);

const Section = ({ title, hint, children }) => (
  <section style={{ padding: "20px 0", borderTop: `1px solid ${COLOR.border}` }}>
    <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: COLOR.text }}>{title}</h3>
    {hint && <p style={{ ...S.hint, margin: "4px 0 14px", fontSize: 12.5, color: COLOR.sub }}>{hint}</p>}
    {!hint && <div style={{ height: 12 }} />}
    {children}
  </section>
);

const Segmented = ({ value, onChange, options }) => (
  <div role="radiogroup" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map((o) => (
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
        className="ac-btn" onClick={() => onChange(o.value)} style={S.chip(value === o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);

const Notice = ({ tone = "error", items }) => {
  if (!items?.length) return null;
  const t = tone === "error"
    ? { c: COLOR.red, bg: COLOR.redBg, bd: "#fecaca", Icon: AlertCircle }
    : { c: COLOR.amber, bg: COLOR.amberBg, bd: "#fde68a", Icon: Info };
  return (
    <div role={tone === "error" ? "alert" : "status"}
      style={{ background: t.bg, border: `1px solid ${t.bd}`, color: t.c, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12.5 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <t.Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
          {items.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
    </div>
  );
};

function Dialog({ title, onClose, children, footer }) {
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        style={{ background: "#fff", borderRadius: 14, width: "min(460px, 100%)", boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button type="button" aria-label="Close" className="ac-btn" onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: COLOR.sub }}><X size={18} /></button>
        </div>
        <div style={{ padding: "12px 20px", fontSize: 13.5, color: "#374151", lineHeight: 1.55 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 20px 18px" }}>{footer}</div>
      </div>
    </div>
  );
}

// ─── Editor drawer ───────────────────────────────────────────────────────────
function AwardEditor({ meta, doc, mode, initialErrors, onClose, onSaved }) {
  const readOnly = mode === "view";
  const { departments } = useDepartments();
  const initial = useMemo(() => (doc ? fromDoc(doc) : blankForm()), [doc]);
  const [form, setForm] = useState(initial);
  const [allEmps, setAllEmps] = useState([]);
  const [customScope, setCustomScope] = useState(() => (initial.departments.length + (initial.employee_ids || []).length) > 0);
  const [deptPick, setDeptPick] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  useEffect(() => {
    axios.get(`${API}/employees-lite`).then((r) => setAllEmps(r.data.data || [])).catch(() => { });
  }, []);
  const empById = useMemo(() => Object.fromEntries(allEmps.map((e) => [e._id, e])), [allEmps]);
  const deptEmployees = useMemo(
    () => allEmps.filter((e) => e.department === deptPick && `${e.name} ${e.employeeId}`.toLowerCase().includes(empSearch.toLowerCase())),
    [allEmps, deptPick, empSearch]);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState(initialErrors || []);
  const [warns, setWarns] = useState([]);

  const pickedKpis = form.qualifying_rule.daily_kpi_names || [];
  const toggleKpi = (n) => patch({
    qualifying_rule: {
      ...form.qualifying_rule,
      daily_kpi_names: pickedKpis.includes(n) ? pickedKpis.filter((x) => x !== n) : [...pickedKpis, n]
    }
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  const metricInfo = (key) => meta.metrics.find((m) => m.key === key);
  const weightTotal = Math.round(form.metrics.reduce((s, m) => s + (Number(m.weight) || 0), 0) * 100) / 100;
  const cash = estimateCash(form);
  const budget = Number(form.budget.total) || 0;

  const tryClose = () => {
    if (!readOnly && dirty && !window.confirm("Discard your changes?")) return;
    onClose();
  };
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") tryClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const applyPreset = (name) => {
    const p = meta.presets.find((x) => x.name === name);
    if (!p) return;
    setForm((f) => fromPreset(p, { start_date: f.start_date, end_date: f.end_date, departments: f.departments, employee_ids: f.employee_ids }));
    setErrs([]); setWarns([]);
  };

  const toggle = (key, value) =>
    patch({ [key]: form[key].includes(value) ? form[key].filter((x) => x !== value) : [...form[key], value] });

  const toggleWholeDept = (d) => patch({
    departments: form.departments.includes(d) ? form.departments.filter((x) => x !== d) : [...form.departments, d],
    employee_ids: form.employee_ids.filter((id) => empById[id]?.department !== d),   // already covered by the whole department
  });
  const selectShown = () => patch({ employee_ids: [...new Set([...form.employee_ids, ...deptEmployees.map((e) => e._id)])] });

  const [activeKpis, setActiveKpis] = useState({ total: 0, kpis: [], loading: false });
  useEffect(() => {
    if (form.basis !== "kpi" && form.basis !== "whole_kpi") return;
    let off = false;
    setActiveKpis((s) => ({ ...s, loading: true }));
    axios.get(`${API}/active-kpis`, {
      params: {
        departments: form.departments.join(","), employee_ids: form.employee_ids.join(","), start: form.start_date, end: form.end_date,
      }
    }).then((r) => { if (!off) setActiveKpis({ total: r.data.data.total_employees, kpis: r.data.data.kpis, loading: false }); })
      .catch(() => { if (!off) setActiveKpis({ total: 0, kpis: [], loading: false }); });
    return () => { off = true; };
  }, [form.basis, form.departments, form.employee_ids, form.start_date, form.end_date]);

  const chooseBasis = (b) => {
    if (b === "whole_kpi") return patch({ basis: b, rule_type: "weighted_score", metrics: [{ metric_key: "kpi_achievement", weight: 100, target: "" }] });
    if (b === "") return patch({ basis: "" });
    patch({ basis: b, rule_type: "qualifying_days", qualifying_rule: { ...form.qualifying_rule, metric_key: "daily_incentive_count" } });
  };

  const save = async (launch) => {
    if (customScope && !form.departments.length && !form.employee_ids.length) {
      setErrs(["Pick at least one department or employee, or switch to All departments."]);
      return;
    }
    setSaving(true); setErrs([]); setWarns([]);
    try {
      const res = form._id ? await axios.put(`${API}/${form._id}`, form) : await axios.post(API, form);
      const saved = res.data.data;
      patch({ _id: saved._id });                      // a retry now updates instead of creating a copy
      if (!launch) {
        const w = res.data.warnings || [];
        onSaved(saved, w.length ? `Draft saved. ${w.length} thing${w.length > 1 ? "s" : ""} to check before launch` : "Draft saved", true);
        return;
      }
      try {
        const r = await axios.post(`${API}/${saved._id}/launch`);
        onSaved(r.data.data, `${saved.name} is live`, true);
      } catch (e) {
        const x = errOf(e);
        setErrs(x.errors.length ? x.errors : [x.message]);
        setWarns(x.warnings);
        onSaved(saved, "Saved as a draft. Fix the issues to launch", false);
      }
    } catch (e) {
      const x = errOf(e);
      setErrs(x.errors.length ? x.errors : [x.message]);
      setWarns(x.warnings);
    } finally {
      setSaving(false);
    }
  };

  // metric rows
  const usedKeys = form.metrics.map((m) => m.metric_key);
  const addMetric = (key) => key && patch({ metrics: [...form.metrics, { metric_key: key, weight: "", target: "" }] });
  const setMetric = (i, p) => patch({ metrics: form.metrics.map((m, j) => (j === i ? { ...m, ...p } : m)) });
  const setReward = (i, p) => patch({ rewards: form.rewards.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const num = (key, sub) => (e) => patch({ [key]: { ...form[key], [sub]: e.target.value } });

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) tryClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", zIndex: 1100, display: "flex", justifyContent: "flex-end" }}>
      <div className="ac-drawer" role="dialog" aria-modal="true" aria-label="Award details"
        style={{ width: "min(860px, 100vw)", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,.15)" }}>

        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {readOnly ? form.name : form._id ? "Edit award" : "New award or scheme"}
              </h2>
              {doc && <Pill {...STATUS[doc.status]}>{STATUS[doc.status].label}</Pill>}
            </div>
          </div>
          <button type="button" aria-label="Close" className="ac-btn" onClick={tryClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: COLOR.sub }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 8px" }}>
          {readOnly && (
            <Notice tone="warn" items={[`This award is ${doc.status}, so its rules are locked. Clone it to make a changed copy for another period.`]} />
          )}
          <Notice tone="error" items={errs} />
          <Notice tone="warn" items={warns} />

          {!readOnly && !form._id && (
            <Field label="Start from a template" hint="Fills in metrics, weights and rewards. You can change anything afterwards.">
              <select className="ac-in" style={S.input} defaultValue="" onChange={(e) => applyPreset(e.target.value)}>
                <option value="">Blank, I will set everything myself</option>
                {meta.presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </Field>
          )}

          <div style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: "10px 14px", margin: "14px 0 4px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
            <strong>{form.name || "Untitled award"}.</strong> {summarize(form)}
          </div>

          <fieldset disabled={readOnly || saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <Section title="Basics">
              <div style={S.grid(260)}>
                <Field label="Award or scheme name">
                  <input className="ac-in" style={S.input} value={form.name} maxLength={80}
                    placeholder="e.g. December revenue champion"
                    onChange={(e) => patch({ name: e.target.value })} />
                </Field>
                <Field label="Frequency">
                  <select className="ac-in" style={S.input} value={form.frequency} onChange={(e) => patch({ frequency: e.target.value })}>
                    {meta.frequencies.map((f) => <option key={f} value={f}>{FREQ[f]}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description" style={{ marginTop: 14 }}>
                <textarea className="ac-in" style={{ ...S.input, minHeight: 60, resize: "vertical" }} maxLength={500}
                  value={form.description} placeholder="What is this award for?"
                  onChange={(e) => patch({ description: e.target.value })} />
              </Field>
              <div style={{ marginTop: 14 }}>
                <span style={S.label}>Category</span>
                <Segmented value={form.category} onChange={(v) => patch({ category: v })}
                  options={meta.categories.map((c) => ({ value: c, label: CATEGORY[c].label }))} />
              </div>
            </Section>

            <Section title="Period and participants">
              <div style={S.grid(180)}>
                <Field label="Start date">
                  <input type="date" className="ac-in" style={S.input} value={form.start_date} onChange={(e) => patch({ start_date: e.target.value })} />
                </Field>
                <Field label="End date">
                  <input type="date" className="ac-in" style={S.input} value={form.end_date} onChange={(e) => patch({ end_date: e.target.value })} />
                </Field>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={S.label}>Who competes</span>
                <Segmented value={form.participation} onChange={(v) => patch({ participation: v })}
                  options={[{ value: "individual", label: "Individuals" }, { value: "team", label: "Teams or departments" }]} />
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={S.label}>Who can take part</span>
                <Segmented value={customScope ? "custom" : "all"}
                  onChange={(v) => {
                    if (v === "all") { patch({ departments: [], employee_ids: [] }); setCustomScope(false); setDeptPick(""); }
                    else setCustomScope(true);
                  }}
                  options={[{ value: "all", label: "All departments" }, { value: "custom", label: "Choose departments and employees" }]} />
              </div>

              {customScope && (
                <div style={{ marginTop: 12, border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 14 }}>
                  <Field label="Department">
                    <select className="ac-in" style={S.input} value={deptPick} disabled={readOnly}
                      onChange={(e) => { setDeptPick(e.target.value); setEmpSearch(""); }}>
                      <option value="">Select a department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>{d.name}{form.departments.includes(d.name) ? "  (whole department)" : ""}</option>
                      ))}
                    </select>
                  </Field>

                  {deptPick && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, cursor: "pointer" }}>
                        <input type="checkbox" style={{ marginTop: 3 }} disabled={readOnly}
                          checked={form.departments.includes(deptPick)} onChange={() => toggleWholeDept(deptPick)} />
                        <span>Whole department
                          <span style={{ ...S.hint, display: "block" }}>Everyone in {deptPick}, including people who join later.</span>
                        </span>
                      </label>

                      {!form.departments.includes(deptPick) && (
                        <div style={{ marginTop: 10 }}>
                          <input className="ac-in" style={S.input} placeholder="Search employee" value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)} />
                          <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 8 }}>
                            {deptEmployees.length === 0 && (
                              <span style={S.hint}>No active employees found in this department.</span>
                            )}
                            {deptEmployees.map((e) => (
                              <label key={e._id} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 13, cursor: "pointer" }}>
                                <input type="checkbox" disabled={readOnly}
                                  checked={form.employee_ids.includes(e._id)} onChange={() => toggle("employee_ids", e._id)} />
                                {e.name} <span style={{ color: COLOR.faint }}>{e.employeeId}</span>
                              </label>
                            ))}
                          </div>
                          {deptEmployees.length > 0 && !readOnly && (
                            <button type="button" className="ac-btn" style={{ ...S.chip(false), marginTop: 8 }} onClick={selectShown}>
                              Select all shown
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <span style={S.label}>Selected</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {form.departments.map((d) => (
                        <button key={d} type="button" className="ac-btn" disabled={readOnly} style={S.chip(true)}
                          onClick={() => toggle("departments", d)}>{d} (whole) ✕</button>
                      ))}
                      {form.employee_ids.map((id) => (
                        <button key={id} type="button" className="ac-btn" disabled={readOnly} style={S.chip(true)}
                          onClick={() => toggle("employee_ids", id)}>
                          {empById[id] ? `${empById[id].name} (${empById[id].department})` : "Employee"} ✕
                        </button>
                      ))}
                      {!form.departments.length && !form.employee_ids.length && (
                        <span style={S.hint}>Nothing selected yet. Pick at least one department or employee.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <Section title="What is this based on?" hint="Pick the data this award or scheme counts. The options below change with your choice.">
              <div style={S.grid(210)}>
                {BASES.map((b) => {
                  const on = (form.basis || "") === b.value;
                  return (
                    <button key={b.value || "other"} type="button" role="radio" aria-checked={on} className="ac-btn" disabled={readOnly}
                      onClick={() => chooseBasis(b.value)}
                      style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: on ? COLOR.blueBg : "#fff", border: `1px solid ${on ? "#2563eb" : COLOR.border}` }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: on ? "#1d4ed8" : COLOR.text }}>{b.label}</div>
                      <div style={{ fontSize: 12, color: COLOR.sub, marginTop: 3, lineHeight: 1.4 }}>{b.desc}</div>
                    </button>
                  );
                })}
              </div>

              {(form.basis === "kpi" || form.basis === "whole_kpi") && (
                <div style={{ marginTop: 16 }}>
                  <span style={S.label}>
                    {form.basis === "kpi" ? "Pick the KPI(s) this scheme counts" : "KPIs assigned to the selected employees (for information)"}
                  </span>
                  {!form.departments.length && !form.employee_ids.length && (
                    <p style={S.hint}>Everyone is selected, so this list is long. Choose departments or employees above for a shorter list.</p>
                  )}
                  {activeKpis.loading && <p style={S.hint}>Loading KPIs...</p>}
                  {!activeKpis.loading && activeKpis.kpis.length === 0 && (
                    <p style={S.hint}>No active KPIs found for these employees in this period. Assign KPIs to them first.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {activeKpis.kpis.map((k) => (
                      <label key={k.kpi_name} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, cursor: form.basis === "kpi" ? "pointer" : "default" }}>
                        {form.basis === "kpi"
                          ? <input type="checkbox" style={{ marginTop: 3 }} disabled={readOnly} checked={pickedKpis.includes(k.kpi_name)} onChange={() => toggleKpi(k.kpi_name)} />
                          : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                        <span>{k.kpi_name}
                          <span style={{ color: COLOR.faint }}> · target {k.target}, {k.frequency} · {k.employee_count} of {activeKpis.total} employees</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {form.basis === "kpi" && pickedKpis.length > 0 && (
                    <p style={S.hint}>If you pick more than one, they are added together each day. Employees who do not have a picked KPI will show 0.</p>
                  )}
                  {form.basis === "whole_kpi" && (
                    <p style={S.hint}>Winners are ranked by KPI achievement from the finalized monthly review, so evaluate after the review is finalized. Use "Minimum KPI achievement" under Eligibility to decide who qualifies, and set the winners below.</p>
                  )}
                </div>
              )}
            </Section>

            <Section title={form.basis ? "Scheme rules" : "How winners are chosen"} hint="">
              {form.basis === "whole_kpi" && (
                <p style={S.hint}>
                  Ranking uses the KPI achievement % from each employee's finalized monthly review (100% weight). Set the minimum KPI % under Eligibility, and the winners and rewards below.
                </p>
              )}

              {!form.basis && (
                <div style={S.grid(230)}>
                  {RULES.map((r) => {
                    const on = form.rule_type === r.value;
                    return (
                      <button key={r.value} type="button" role="radio" aria-checked={on} className="ac-btn"
                        onClick={() => patch({ rule_type: r.value })}
                        style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: on ? COLOR.blueBg : "#fff", border: `1px solid ${on ? COLOR.blue : COLOR.border}` }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: on ? "#1d4ed8" : COLOR.text }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: COLOR.sub, marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {form.rule_type === "weighted_score" && form.basis !== "whole_kpi" && (
                <div style={{ marginTop: 16 }}>
                  {form.metrics.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                        <thead>
                          <tr style={{ textAlign: "left", color: COLOR.sub, fontSize: 12 }}>
                            <th style={{ padding: "6px 8px", fontWeight: 600 }}>Metric</th>
                            <th style={{ padding: "6px 8px", fontWeight: 600, width: 110 }}>Weight (%)</th>
                            <th style={{ padding: "6px 8px", fontWeight: 600, width: 150 }}>Target (optional)</th>
                            <th style={{ width: 36 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {form.metrics.map((m, i) => {
                            const info = metricInfo(m.metric_key);
                            return (
                              <tr key={m.metric_key} style={{ borderTop: `1px solid ${COLOR.border}` }}>
                                <td style={{ padding: "8px" }}>
                                  {info?.label || m.metric_key}
                                  {info?.source === "manual" && <span style={{ marginLeft: 8, fontSize: 11, color: COLOR.amber }}>scored by committee</span>}
                                </td>
                                <td style={{ padding: "8px" }}>
                                  <input type="number" min="0" max="100" className="ac-in" style={S.input} value={m.weight}
                                    aria-label={`${info?.label} weight`} onChange={(e) => setMetric(i, { weight: e.target.value })} />
                                </td>
                                <td style={{ padding: "8px" }}>
                                  <input type="number" min="0" className="ac-in" style={S.input} value={m.target}
                                    placeholder={`KPI target${info?.unit ? ` (${info.unit})` : ""}`}
                                    aria-label={`${info?.label} target`} onChange={(e) => setMetric(i, { target: e.target.value })} />
                                </td>
                                <td style={{ padding: "8px", textAlign: "right" }}>
                                  <button type="button" className="ac-btn" aria-label={`Remove ${info?.label}`}
                                    onClick={() => patch({ metrics: form.metrics.filter((_, j) => j !== i) })}
                                    style={{ border: "none", background: "none", cursor: "pointer", color: COLOR.faint }}><X size={16} /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                    <select className="ac-in" style={{ ...S.input, width: 260 }} value="" onChange={(e) => addMetric(e.target.value)} aria-label="Add a metric">
                      <option value="">Add a metric</option>
                      {meta.metrics.filter((m) => !usedKeys.includes(m.key)).map((m) => (
                        <option key={m.key} value={m.key}>{m.label}{m.source === "manual" ? " (committee scores it)" : ""}</option>
                      ))}
                    </select>
                    {form.metrics.length > 0 && (
                      <Pill color={weightTotal === 100 ? COLOR.green : COLOR.amber} bg={weightTotal === 100 ? COLOR.greenBg : COLOR.amberBg}>
                        Weights total {weightTotal} of 100
                      </Pill>
                    )}
                  </div>
                </div>
              )}

              {form.rule_type === "qualifying_days" && (
                <div style={{ marginTop: 16 }}>
                  <div style={S.grid(190)}>
                    {!form.basis && (
                      <Field label="Metric counted each day">
                        <select className="ac-in" style={S.input} value={form.qualifying_rule.metric_key} onChange={num("qualifying_rule", "metric_key")}>
                          {meta.metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                        </select>
                      </Field>
                    )}
                    <Field label="Minimum each day">
                      <input type="number" min="0" className="ac-in" style={S.input} value={form.qualifying_rule.min_daily_value} onChange={num("qualifying_rule", "min_daily_value")} />
                    </Field>
                    <Field label="Days needed to qualify">
                      <input type="number" min="1" max="366" className="ac-in" style={S.input} value={form.qualifying_rule.days_required} onChange={num("qualifying_rule", "days_required")} />
                    </Field>
                  </div>
                  <p style={S.hint}>
                    A person qualifies after reaching at least {form.qualifying_rule.min_daily_value || 0} on {form.qualifying_rule.days_required || 0} different days between the start and end dates.
                  </p>
                  {!form.basis && (
                    <p style={{ ...S.hint, marginTop: 14 }}>
                      Choose what this scheme is based on in the section above. The KPI list appears only after you pick "A specific KPI".
                    </p>
                  )}
                  {form.basis === "loan" && (
                    <div style={{ marginTop: 14 }}>
                      <Field label="Count a loan when it is">
                        <select className="ac-in" style={S.input} value={form.loan_count_on} onChange={(e) => patch({ loan_count_on: e.target.value })}>
                          <option value="paid">Paid (recommended, counted on the paid date)</option>
                          <option value="created">Created (application taken, counted on the created date)</option>
                        </select>
                      </Field>
                      <p style={S.hint}>Loans are counted for the staff member who created them.</p>
                    </div>
                  )}
                  {form.basis === "incentive" && (
                    <p style={{ ...S.hint, marginTop: 14 }}>Counts approved or paid incentive entries of each employee, one entry counts as one. Employees need an incentive plan assigned.</p>
                  )}
                </div>
              )}
            </Section>

            <Section title="Eligibility and tie-breakers" hint="Checked before ranking. Someone who misses a minimum cannot win, even if they score highest. Use 0 for no minimum.">
              <div style={S.grid(190)}>
                <Field label="Minimum KPI achievement (%)">
                  <input type="number" min="0" max="200" className="ac-in" style={S.input} value={form.eligibility.min_kpi_percent} onChange={num("eligibility", "min_kpi_percent")} />
                </Field>
                <Field label="Minimum attendance (%)">
                  <input type="number" min="0" max="100" className="ac-in" style={S.input} value={form.eligibility.min_attendance_percent} onChange={num("eligibility", "min_attendance_percent")} />
                </Field>
                <Field label="Minimum service (months)">
                  <input type="number" min="0" className="ac-in" style={S.input} value={form.eligibility.min_service_months} onChange={num("eligibility", "min_service_months")} />
                </Field>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={S.label}>If scores tie, decide by (applied in the order you pick)</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {meta.tie_breakers.map((t) => {
                    const idx = form.tie_breakers.indexOf(t);
                    return (
                      <button key={t} type="button" className="ac-btn" aria-pressed={idx >= 0} style={S.chip(idx >= 0)} onClick={() => toggle("tie_breakers", t)}>
                        {idx >= 0 ? `${idx + 1}. ` : ""}{TIE[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            <Section title="Winners and rewards">
              <div style={S.grid(240)}>
                <div>
                  <span style={S.label}>Winner selection</span>
                  <Segmented value={form.winners.mode} onChange={(v) => patch({ winners: { ...form.winners, mode: v } })}
                    options={[{ value: "top_n", label: "Top ranked" }, { value: "all_qualifying", label: "Everyone who qualifies" }]} />
                </div>
                <Field label={form.winners.mode === "top_n" ? "Number of winners" : "Expected number of winners"}
                  hint={form.winners.mode === "all_qualifying" ? "Only used to estimate the cash budget." : undefined}>
                  <input type="number" min="0" className="ac-in" style={S.input} value={form.winners.count} onChange={num("winners", "count")} />
                </Field>
              </div>

              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {form.rewards.map((r, i) => (
                  <div key={i} style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, padding: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <Field label="From rank" style={{ width: 82 }}>
                      <input type="number" min="1" className="ac-in" style={S.input} value={r.rank_from} onChange={(e) => setReward(i, { rank_from: e.target.value })} />
                    </Field>
                    <Field label="To rank" style={{ width: 82 }}>
                      <input type="number" min="0" className="ac-in" style={S.input} value={r.rank_to} onChange={(e) => setReward(i, { rank_to: e.target.value })} />
                    </Field>
                    <Field label="Reward" style={{ width: 170 }}>
                      <select className="ac-in" style={S.input} value={r.type} onChange={(e) => setReward(i, { type: e.target.value })}>
                        {meta.reward_types.map((t) => <option key={t} value={t}>{REWARD[t]}</option>)}
                      </select>
                    </Field>
                    {r.type === "cash" && (
                      <Field label="Amount per winner (₹)" style={{ width: 150 }}>
                        <input type="number" min="0" className="ac-in" style={S.input} value={r.cash_amount} onChange={(e) => setReward(i, { cash_amount: e.target.value })} />
                      </Field>
                    )}
                    {r.type === "points" && (
                      <Field label="Points per winner" style={{ width: 140 }}>
                        <input type="number" min="0" className="ac-in" style={S.input} value={r.points} onChange={(e) => setReward(i, { points: e.target.value })} />
                      </Field>
                    )}
                    <Field label="Label (optional)" style={{ flex: 1, minWidth: 150 }}>
                      <input className="ac-in" style={S.input} maxLength={80} value={r.title} placeholder="e.g. Team trophy" onChange={(e) => setReward(i, { title: e.target.value })} />
                    </Field>
                    <button type="button" className="ac-btn" aria-label={`Remove reward ${i + 1}`} style={{ ...S.btn("ghost", true), marginBottom: 2 }}
                      onClick={() => patch({ rewards: form.rewards.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div>
                  <button type="button" className="ac-btn" style={S.btn("ghost", true)}
                    onClick={() => patch({ rewards: [...form.rewards, { rank_from: 1, rank_to: 1, type: "certificate", title: "", cash_amount: 0, points: 0 }] })}>
                    <Plus size={14} /> Add reward
                  </button>
                  <p style={S.hint}>To rank 0 means every winner gets this reward.</p>
                </div>
              </div>
            </Section>

            <Section title="Budget and approval">
              <div style={S.grid(220)}>
                <Field label="Cash budget (₹)" hint="Set 0 if this award has no cash.">
                  <input type="number" min="0" className="ac-in" style={S.input} value={form.budget.total} onChange={num("budget", "total")} />
                </Field>
                <div>
                  <span style={S.label}>Estimated cash rewards</span>
                  <div style={{ padding: "9px 0", fontSize: 15, fontWeight: 700, color: budget > 0 && cash > budget ? COLOR.red : COLOR.text }}>
                    {money(cash)}
                    {budget > 0 && cash > budget && <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8 }}>over budget</span>}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={S.label}>Approval steps</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {meta.approval_steps.map((s) => (
                    <button key={s} type="button" className="ac-btn" aria-pressed={form.approval_chain.includes(s)} style={S.chip(form.approval_chain.includes(s))} onClick={() => toggle("approval_chain", s)}>{STEP[s]}</button>
                  ))}
                </div>
                <p style={S.hint}>
                  Winners are approved by {meta.approval_steps.filter((s) => form.approval_chain.includes(s)).map((s) => STEP[s]).join(", then ") || "nobody"} before they are published.
                </p>
              </div>
            </Section>

            <Section title="Appraisal impact">
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={form.counts_in_appraisal} style={{ marginTop: 3 }}
                  onChange={(e) => patch({ counts_in_appraisal: e.target.checked })} />
                <span style={{ fontSize: 13 }}>
                  Add recognition points to the winner's appraisal score
                  <span style={{ ...S.hint, display: "block" }}>Leave this off when the award is already based on KPI results, so the same performance is not counted twice.</span>
                </span>
              </label>
              {form.counts_in_appraisal && (
                <Field label="Recognition points per win" style={{ width: 200, marginTop: 12 }}>
                  <input type="number" min="0" max="100" className="ac-in" style={S.input} value={form.recognition_points} onChange={(e) => patch({ recognition_points: e.target.value })} />
                </Field>
              )}
            </Section>
          </fieldset>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${COLOR.border}`, display: "flex", justifyContent: "flex-end", gap: 8, background: "#fff" }}>
          <button type="button" className="ac-btn" style={S.btn("ghost")} onClick={tryClose}>{readOnly ? "Close" : "Cancel"}</button>
          {!readOnly && (
            <>
              <button type="button" className="ac-btn" style={S.btn("ghost")} disabled={saving} onClick={() => save(false)}>
                {saving ? "Saving..." : "Save draft"}
              </button>
              <button type="button" className="ac-btn" style={S.btn("primary")} disabled={saving} onClick={() => save(true)}>
                <Rocket size={14} /> Save and launch
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AwardConfig() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [editor, setEditor] = useState(null);     // { mode, doc, errors }
  const [editorKey, setEditorKey] = useState(0);  // changes only when the drawer is opened
  const openEditor = (e) => { setEditorKey((k) => k + 1); setEditor(e); };
  const [dialog, setDialog] = useState(null);     // { kind: 'close'|'delete'|'clone', doc }
  const [dlg, setDlg] = useState({ reason: "", name: "", start_date: "", end_date: "", error: "", busy: false });
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    try {
      const [list, m] = await Promise.all([
        axios.get(API),
        meta ? Promise.resolve(null) : axios.get(`${API}/meta`),
      ]);
      setItems(list.data.data || []);
      if (m) setMeta(m.data.data);
      setLoadError("");
    } catch (e) {
      setLoadError(errOf(e).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const h = (e) => { if (e.key === "Escape") setDialog(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [dialog]);

  const counts = useMemo(() => {
    const c = { all: items.length, draft: 0, active: 0, closed: 0 };
    items.forEach((i) => { c[i.status] += 1; });
    return c;
  }, [items]);

  const shown = useMemo(() => items.filter((i) =>
    (status === "all" || i.status === status) &&
    (category === "all" || i.category === category) &&
    (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()))
  ), [items, status, category, q]);

  const openDialog = (kind, doc) => {
    const [s, e] = nextMonthRange();
    setDlg({ reason: "", name: doc.name, start_date: s, end_date: e, error: "", busy: false });
    setDialog({ kind, doc });
  };

  const launchRow = async (doc) => {
    try {
      await axios.post(`${API}/${doc._id}/launch`);
      notify(`${doc.name} is live`);
      load();
    } catch (e) {
      const x = errOf(e);
      openEditor({ mode: "edit", doc, errors: x.errors.length ? x.errors : [x.message] });
    }
  };

  const runDialog = async () => {
    const { kind, doc } = dialog;
    setDlg((d) => ({ ...d, busy: true, error: "" }));
    try {
      if (kind === "close") {
        await axios.post(`${API}/${doc._id}/close`, { reason: dlg.reason });
        notify(`${doc.name} is closed`);
      } else if (kind === "delete") {
        await axios.delete(`${API}/${doc._id}`);
        notify(`${doc.name} deleted`);
      } else {
        await axios.post(`${API}/${doc._id}/clone`, { name: dlg.name, start_date: dlg.start_date, end_date: dlg.end_date });
        notify("Copy created as a draft");
      }
      setDialog(null);
      load();
    } catch (e) {
      const x = errOf(e);
      setDlg((d) => ({ ...d, busy: false, error: x.errors[0] || x.message }));
    }
  };

  const th = { textAlign: "left", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: COLOR.sub, background: COLOR.bg, whiteSpace: "nowrap" };
  const td = { padding: "12px 14px", verticalAlign: "top", fontSize: 13, color: "#374151", borderTop: `1px solid ${COLOR.border}` };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1240, margin: "0 auto" }}>
      <style>{CSS}</style>
            <RecognitionTabs group="schemes" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLOR.text }}>Award configuration</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: COLOR.sub, maxWidth: 560, lineHeight: 1.5 }}>
            Set up monthly awards and special schemes. KPI templates are not changed here, awards only read them.
          </p>
        </div>
        <button type="button" className="ac-btn" style={S.btn("primary")} disabled={!meta}
          onClick={() => openEditor({ mode: "new", doc: null })}>
          <Plus size={15} /> New award or scheme
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "20px 0 14px" }}>
        <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["all", "All"], ["draft", "Drafts"], ["active", "Active"], ["closed", "Closed"]].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={status === k} className="ac-btn"
              style={S.chip(status === k)} onClick={() => setStatus(k)}>{label} {counts[k]}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <select className="ac-in" aria-label="Filter by category" style={{ ...S.input, width: 170 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ position: "relative", width: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLOR.faint }} />
          <input className="ac-in" aria-label="Search awards" style={{ ...S.input, paddingLeft: 30 }} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loadError && <Notice tone="error" items={[`Could not load awards. ${loadError}`]} />}

      <div style={{ background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 12, overflowX: "auto" }}>
        {loading ? (
          <p style={{ padding: 32, textAlign: "center", color: COLOR.sub, margin: 0 }}>Loading awards...</p>
        ) : shown.length === 0 ? (
          <div style={{ padding: "44px 20px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLOR.text }}>
              {items.length === 0 ? "No awards set up yet" : "No awards match these filters"}
            </p>
            <p style={{ margin: "6px auto 16px", maxWidth: 420, fontSize: 13, color: COLOR.sub, lineHeight: 1.5 }}>
              {items.length === 0
                ? "Start from one of the ready-made templates, like Best Performer or the 20 Days Incentive Challenge, or build your own."
                : "Try a different status, category or search."}
            </p>
            {items.length === 0 && meta && (
              <button type="button" className="ac-btn" style={S.btn("primary")} onClick={() => openEditor({ mode: "new", doc: null })}>
                <Plus size={15} /> New award or scheme
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
            <thead>
              <tr>
                <th style={th}>Award</th><th style={th}>Period</th><th style={th}>How it is decided</th>
                <th style={th}>Winners and rewards</th><th style={th}>Status</th><th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => {
                const cat = CATEGORY[a.category] || CATEGORY.performance;
                const rule = `${a.qualifying_rule?.min_daily_value} a day on ${a.qualifying_rule?.days_required} days`;
                const how = a.basis === "whole_kpi" ? "Whole KPI performance"
                  : a.basis === "kpi" ? `KPI: ${(a.qualifying_rule?.daily_kpi_names || []).join(", ") || "none picked"}, ${rule}`
                    : a.basis === "incentive" ? `Incentive entries, ${rule}`
                      : a.basis === "loan" ? `Loans ${a.loan_count_on === "created" ? "created" : "paid"}, ${rule}`
                        : a.rule_type === "weighted_score" ? `Weighted score, ${a.metrics?.length || 0} metrics`
                          : a.rule_type === "qualifying_days" ? rule
                            : "Committee picks";
                return (
                  <tr key={a._id} className="ac-row">
                    <td style={td}>
                      <div style={{ fontWeight: 700, color: COLOR.text, marginBottom: 5 }}>{a.name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Pill color={cat.color} bg={cat.bg}>{cat.label}</Pill>
                        <span style={{ fontSize: 12, color: COLOR.sub }}>
                          {a.participation === "team" ? "Teams" : "Individuals"}, {[...(a.departments || []), ...(a.employee_ids?.length ? [`${a.employee_ids.length} employee(s)`] : [])].join(", ") || "all departments"}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtDate(a.start_date)}<br /><span style={{ color: COLOR.sub }}>to {fmtDate(a.end_date)}</span></td>
                    <td style={td}>{how}</td>
                    <td style={td}>
                      <div>{a.winners?.mode === "top_n" ? `Top ${a.winners.count}` : "All who qualify"}</div>
                      <div style={{ color: COLOR.sub, fontSize: 12, marginTop: 2 }}>{rewardsText(a.rewards)}</div>
                    </td>
                    <td style={td}><Pill {...STATUS[a.status]}>{STATUS[a.status].label}</Pill></td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {a.status === "draft" && (
                          <>
                            <button type="button" className="ac-btn" style={S.btn("ghost", true)} onClick={() => openEditor({ mode: "edit", doc: a })}><Pencil size={13} /> Edit</button>
                            <button type="button" className="ac-btn" style={{ ...S.btn("primary", true) }} onClick={() => launchRow(a)}><Rocket size={13} /> Launch</button>
                          </>
                        )}
                        {a.status !== "draft" && (
                          <button type="button" className="ac-btn" style={S.btn("ghost", true)} onClick={() => openEditor({ mode: "view", doc: a })}><Eye size={13} /> View</button>
                        )}
                        {a.status === "active" && (
                          <button type="button" className="ac-btn" style={S.btn("ghost", true)} onClick={() => openDialog("close", a)}><Flag size={13} /> Close</button>
                        )}
                        {a.status !== "draft" && a.rule_type === "qualifying_days" && (
                          <button type="button" className="ac-btn" style={S.btn("ghost", true)}
                            onClick={() => navigate(`/hr/dashboard/recognition/award-config/${a._id}/progress`)}>
                            <Eye size={13} /> Progress
                          </button>
                        )}
                        {a.status !== "draft" && (
                          <button type="button" className="ac-btn" style={S.btn("primary", true)}
                            onClick={() => navigate(`/hr/dashboard/recognition/award-config/${a._id}/evaluate`)}>
                            <Trophy size={13} /> Evaluate
                          </button>
                        )}
                        <button type="button" className="ac-btn" style={S.btn("ghost", true)} onClick={() => openDialog("clone", a)}><Copy size={13} /> Clone</button>
                        <button type="button" className="ac-btn" style={S.btn("danger", true)} onClick={() => openDialog("delete", a)}><Trash2 size={13} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editor && meta && (
        <AwardEditor
          key={editorKey}
          meta={meta} mode={editor.mode} doc={editor.doc} initialErrors={editor.errors}
          onClose={() => setEditor(null)}
          onSaved={(doc, msg, close) => { notify(msg); load(); if (close) setEditor(null); else setEditor((e) => ({ ...e, mode: "edit", doc })); }}
        />
      )}

      {dialog?.kind === "close" && (
        <Dialog title={`Close ${dialog.doc.name}?`} onClose={() => setDialog(null)}
          footer={<>
            <button type="button" className="ac-btn" style={S.btn("ghost")} onClick={() => setDialog(null)}>Keep active</button>
            <button type="button" className="ac-btn" style={S.btn("primary")} disabled={dlg.busy} onClick={runDialog}>Close award</button>
          </>}>
          <p style={{ margin: "0 0 10px" }}>A closed award is locked. You can still clone it for the next period.</p>
          <Field label="Reason (optional)">
            <input className="ac-in" style={S.input} maxLength={300} value={dlg.reason} onChange={(e) => setDlg({ ...dlg, reason: e.target.value })} />
          </Field>
          {dlg.error && <p style={{ color: COLOR.red, fontSize: 12.5 }}>{dlg.error}</p>}
        </Dialog>
      )}

      {dialog?.kind === "delete" && (
        <Dialog title={`Delete ${dialog.doc.name}?`} onClose={() => setDialog(null)}
          footer={<>
            <button type="button" className="ac-btn" style={S.btn("ghost")} onClick={() => setDialog(null)}>Keep it</button>
            <button type="button" className="ac-btn" style={S.btn("danger")} disabled={dlg.busy} onClick={runDialog}>Delete</button>
          </>}>
          {dialog.doc.status === "draft"
            ? "This draft will be removed for good."
            : "This will remove the award for good, together with its results, approval record and planned rewards. It cannot be deleted if winners are already published or rewards are already given."}
          {dlg.error && <p style={{ color: COLOR.red, fontSize: 12.5 }}>{dlg.error}</p>}
        </Dialog>
      )}

      {dialog?.kind === "clone" && (
        <Dialog title={`Clone ${dialog.doc.name}`} onClose={() => setDialog(null)}
          footer={<>
            <button type="button" className="ac-btn" style={S.btn("ghost")} onClick={() => setDialog(null)}>Cancel</button>
            <button type="button" className="ac-btn" style={S.btn("primary")} disabled={dlg.busy} onClick={runDialog}>Create draft copy</button>
          </>}>
          <p style={{ margin: "0 0 12px" }}>Same rules and rewards, new dates. The copy starts as a draft.</p>
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Name"><input className="ac-in" style={S.input} maxLength={80} value={dlg.name} onChange={(e) => setDlg({ ...dlg, name: e.target.value })} /></Field>
            <div style={S.grid(150)}>
              <Field label="Start date"><input type="date" className="ac-in" style={S.input} value={dlg.start_date} onChange={(e) => setDlg({ ...dlg, start_date: e.target.value })} /></Field>
              <Field label="End date"><input type="date" className="ac-in" style={S.input} value={dlg.end_date} onChange={(e) => setDlg({ ...dlg, end_date: e.target.value })} /></Field>
            </div>
          </div>
          {dlg.error && <p style={{ color: COLOR.red, fontSize: 12.5 }}>{dlg.error}</p>}
        </Dialog>
      )}

      {toast && (
        <div role="status" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1300, display: "flex", gap: 8, alignItems: "center",
          background: toast.type === "error" ? COLOR.red : "#111827", color: "#fff", padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.2)"
        }}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toast.msg}
        </div>
      )}
    </div>
  );
}