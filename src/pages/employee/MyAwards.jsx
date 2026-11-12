// src/pages/employee/MyAwards.jsx  (Phase 5) my schemes, where they stand, and the awards I won
import { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", amber: "#b45309", red: "#b91c1c" };
const ord = (n) => `${n}${["th", "st", "nd", "rd"][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]}`;
const label = (k) => String(k || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const date = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const card = { border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, background: "#fff", color: C.text, marginBottom: 14 };
const h2 = { fontSize: 16, color: C.text, margin: "26px 0 10px" };
const note = { color: C.sub, fontSize: 13 };

const STEP_LABEL = { hr: "HR", committee: "Committee", management: "Management" };

// What the employee reads for each stage
const STAGE = {
  ended:      { badge: "Period ended",         color: C.sub,   bg: "#f3f4f6", text: "The period is over. HR is calculating the results." },
  evaluating: { badge: "Being evaluated",      color: C.blue,  bg: "#eff6ff", text: "Results are being evaluated by HR." },
  in_review:  { badge: "Waiting for approval", color: C.amber, bg: "#fffbeb", text: "Results are with the approvers. Winners will be announced once approved." },
  approved:   { badge: "Approved",             color: C.green, bg: "#ecfdf5", text: "Approved. Winners will be announced very soon." },
  published:  { badge: "Result announced",     color: C.sub,   bg: "#f3f4f6", text: "" },
};

// 4 dots: Period ended > Evaluation > Approval > Announced. [done count, current dot]
const PIPE = ["Period ended", "Evaluation", "Approval", "Announced"];
const PIPE_AT = { ended: [1, 1], evaluating: [1, 1], in_review: [2, 2], approved: [3, 3], published: [4, 4] };

function Pill({ stage }) {
  const s = STAGE[stage];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, color: s.color, background: s.bg, whiteSpace: "nowrap" }}>{s.badge}</span>;
}

function Pipeline({ stage }) {
  const [done, cur] = PIPE_AT[stage] || [0, 0];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", margin: "14px 0 4px" }}>
      {PIPE.map((p, i) => {
        const isDone = i < done, isCur = i === cur && stage !== "published";
        const col = isDone ? C.green : isCur ? C.amber : "#d1d5db";
        return (
          <div key={p} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i > 0 && <div style={{ position: "absolute", top: 8, left: "-50%", width: "100%", height: 2, background: i <= done ? C.green : "#e5e7eb" }} />}
            <div style={{ position: "relative", width: 18, height: 18, borderRadius: "50%", margin: "0 auto", background: isDone ? C.green : "#fff", border: `2px solid ${col}`,
              color: "#fff", fontSize: 11, lineHeight: "14px", fontWeight: 700 }}>{isDone ? "✓" : ""}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: isDone || isCur ? C.text : C.sub, fontWeight: isCur ? 700 : 500 }}>{p}</div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalSteps({ steps, current }) {
  if (!steps?.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 0", fontSize: 12 }}>
      {steps.map((s) => {
        const ok = s.status === "approved", isNext = s.step === current;
        return (
          <span key={s.step} style={{ padding: "3px 9px", borderRadius: 999, fontWeight: 600,
            color: ok ? C.green : isNext ? C.amber : C.sub, background: ok ? "#dcfce7" : isNext ? "#fffbeb" : "#f3f4f6" }}>
            {ok ? "✓ " : isNext ? "⏳ " : "○ "}{STEP_LABEL[s.step] || label(s.step)}
          </span>
        );
      })}
    </div>
  );
}

function DayGrid({ s }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {s.period.days.map((d) => {
        const n = s.mine.days[d] || 0, met = n > 0 && n >= s.rule.min_daily_value;
        const future = d > s.period.today;
        return (
          <div key={d} title={`${d}: ${n}`} style={{ width: 32, textAlign: "center", padding: "3px 0", borderRadius: 6, fontSize: 11, opacity: future ? 0.55 : 1,
            background: met ? "#dcfce7" : n > 0 ? "#fef9c3" : "#fff", border: `1px solid ${C.border}`, color: met ? C.green : C.sub }}>
            <div style={{ fontSize: 9 }}>{d.slice(8)}</div><b>{n}</b>
          </div>
        );
      })}
    </div>
  );
}

function Header({ s, right }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <b style={{ fontSize: 16 }}>{s.name}</b>{right}
        </div>
        <span style={{ fontSize: 12, color: C.sub }}>{date(s.period.start)} to {date(s.period.end)}</span>
      </div>
      {s.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>{s.description}</p>}
    </>
  );
}

const Rewards = ({ s }) => (s.rewards.length > 0
  ? <p style={{ margin: "10px 0 0", fontSize: 12, color: C.sub }}>Rewards: {s.rewards.map((r) => r.title || label(r.type)).join(", ")}</p> : null);

// ── a scheme that is still running ─────────────────────────────────────────
function RunningCard({ s }) {
  const need = s.rule.days_required, m = s.mine;
  const pct = need ? Math.min(100, (m.qualifying_days / need) * 100) : 0;
  return (
    <div style={card}>
      <Header s={s} />
      <p style={{ margin: "12px 0 6px", fontSize: 14 }}>
        <b>{m.qualifying_days}</b> of {need} days done
        {" · "}{m.qualified ? <span style={{ color: C.green, fontWeight: 700 }}>You have qualified!</span>
          : m.can_still_qualify ? <span style={{ color: C.blue }}>{need - m.qualifying_days} more days needed, {m.remaining_days} days left</span>
          : <span style={{ color: C.red }}>You can no longer reach {need} days in this period</span>}
      </p>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 6 }}>
        <div style={{ height: 8, borderRadius: 6, width: `${pct}%`, background: m.qualified ? C.green : m.can_still_qualify ? C.blue : C.red }} />
      </div>
      {m.qualified && <p style={{ margin: "8px 0 0", fontSize: 12, color: C.green }}>Winners are decided after the period ends, so keep going to stay ahead.</p>}
      <p style={{ margin: "8px 0 10px", fontSize: 12, color: C.sub }}>Reach at least {s.rule.min_daily_value} in a day to count that day. Today: {m.today_count}</p>
      <DayGrid s={s} />
      <Rewards s={s} />
    </div>
  );
}

// ── period is over, result not announced yet ───────────────────────────────
function ReviewCard({ s }) {
  const need = s.rule.days_required, m = s.mine, st = STAGE[s.stage];
  return (
    <div style={card}>
      <Header s={s} right={<Pill stage={s.stage} />} />
      <Pipeline stage={s.stage} />
      <p style={{ margin: "12px 0 0", fontSize: 13 }}>{st.text}</p>
      {s.stage === "in_review" && <ApprovalSteps steps={s.steps} current={s.current_step} />}
      <p style={{ margin: "12px 0 0", fontSize: 13, color: C.sub }}>
        Your result: <b style={{ color: C.text }}>{m.qualifying_days} of {need} days</b>
        {" · "}{m.qualified ? <span style={{ color: C.green, fontWeight: 700 }}>Qualified</span> : <span style={{ color: C.red, fontWeight: 700 }}>Not qualified</span>}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: C.sub }}>Final winners and ranks are shown only after the result is announced.</p>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, color: C.blue, cursor: "pointer" }}>See my days</summary>
        <div style={{ marginTop: 8 }}><DayGrid s={s} /></div>
      </details>
      <Rewards s={s} />
    </div>
  );
}

// ── announced, I was not selected ──────────────────────────────────────────
function PastCard({ s }) {
  const need = s.rule.days_required, m = s.mine, gap = Math.max(0, need - m.qualifying_days);
  return (
    <div style={card}>
      <Header s={s} right={<Pill stage="published" />} />
      <p style={{ margin: "10px 0 0", fontSize: 13 }}>
        {m.qualified
          ? "You qualified, but you were not among this time's winners. Great effort, keep it up for the next scheme."
          : `You completed ${m.qualifying_days} of ${need} days${gap ? `, ${gap} short of the target` : ""}. Not selected this time, you can do it in the next scheme.`}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: C.sub }}>Announced {s.published_at ? date(s.published_at) : ""}</p>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, color: C.blue, cursor: "pointer" }}>See my days</summary>
        <div style={{ marginTop: 8 }}><DayGrid s={s} /></div>
      </details>
    </div>
  );
}

// ── details of an award I won: how I did ───────────────────────────────────
function WonDetails({ d }) {
  if (!d) return <p style={{ ...note, margin: "8px 0 0" }}>Details are not available for this award.</p>;
  if (d.kind === "scheme") {
    const s = d.scheme, m = s.mine, need = s.rule.days_required;
    return (
      <div style={{ marginTop: 8 }}>
        <p style={{ margin: "0 0 6px", fontSize: 13 }}>
          Rule: reach at least <b>{s.rule.min_daily_value}</b> in a day, on <b>{need}</b> days.
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 13 }}>
          You completed <b>{m.qualifying_days} of {need} days</b>, {m.total} in total
          {m.qualified && <span style={{ color: C.green, fontWeight: 700 }}> · Qualified</span>}
        </p>
        <DayGrid s={{ period: s.period, rule: s.rule, mine: m }} />
      </div>
    );
  }
  const rows = d.metrics || [];
  return (
    <div style={{ marginTop: 8 }}>
      {rows.length === 0 ? <p style={note}>No score breakdown for this award.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>{["Measure", "My value", "Score", "Weight"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 12, color: C.sub, borderBottom: `1px solid ${C.border}` }}>{h}</th>))}</tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.metric_key}>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{label(v.metric_key)}</td>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{v.raw ?? "-"}</td>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{v.score != null ? Math.round(v.score) : "-"}</td>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{v.weight ?? "-"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {d.weighted_score != null && <p style={{ margin: "8px 0 0", fontSize: 13 }}>Final score: <b>{Math.round(d.weighted_score * 10) / 10}</b></p>}
    </div>
  );
}

export default function MyAwards() {
  const [awards, setAwards] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([
          axios.get(`${API_BASE}/api/my-awards/published`),
          axios.get(`${API_BASE}/api/my-awards/schemes`),
        ]);
        setAwards(a.data.data); setSchemes(s.data.data);
      } catch (e) { setError(e?.response?.data?.message || e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  // an award I won is shown only under "Awards I won", never again as a scheme
  const won = new Set(awards.map((a) => String(a.award_id)));
  const list = schemes.filter((s) => !won.has(String(s.award_id)));
  const running = list.filter((s) => s.stage === "running");
  const review = list.filter((s) => ["ended", "evaluating", "in_review", "approved"].includes(s.stage));
  const past = list.filter((s) => s.stage === "published");

  return (
    <EmployeeLayout>
      <div style={{ padding: "24px 28px", maxWidth: 900, color: C.text }}>
        <h1 style={{ margin: 0, fontSize: 24, color: C.text }}>My awards</h1>
        <p style={{ margin: "6px 0 20px", ...note }}>Awards you have won, and how you are doing in your schemes.</p>
        {loading && <p style={{ color: C.sub }}>Loading...</p>}
        {error && <p style={{ color: C.red }}>{error}</p>}

        {!loading && !error && (
          <>
            <h2 style={{ ...h2, marginTop: 0 }}>Running schemes</h2>
            {running.length === 0 && <p style={note}>No scheme is running for you right now.</p>}
            {running.map((s) => <RunningCard key={s.award_id} s={s} />)}

            {review.length > 0 && (
              <>
                <h2 style={h2}>Results in progress</h2>
                {review.map((s) => <ReviewCard key={s.award_id} s={s} />)}
              </>
            )}

            <h2 style={h2}>Awards I won</h2>
            {awards.length === 0 && <p style={note}>No awards yet. Keep going!</p>}
            {awards.map((a, i) => (
              <div key={`${a.award_id}-${i}`} style={{ ...card, borderLeft: `4px solid ${C.amber}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 16 }}>{a.name}</b>
                  <span style={{ fontSize: 12, color: C.sub }}>Announced {date(a.published_at)}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>
                  {date(a.start_date)} to {date(a.end_date)} · You finished <b style={{ color: C.text }}>{ord(a.rank)}</b>{a.team && " (with your team)"}
                </p>
                {a.rewards.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    {a.rewards.map((r, j) => (
                      <div key={j} style={{ fontSize: 13 }}>
                        {r.title || label(r.reward_type)}
                        {r.cash_amount > 0 && ` · ₹${Number(r.cash_amount).toLocaleString("en-IN")}`}
                        {r.points > 0 && ` · ${r.points} points`}
                        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: r.status === "issued" ? C.green : C.amber }}>
                          {r.status === "issued" ? `Received${r.issued_at ? ` on ${date(r.issued_at)}` : ""}` : "On the way"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <details style={{ marginTop: 12 }}>
                  <summary style={{ fontSize: 13, color: C.blue, cursor: "pointer", fontWeight: 600 }}>View details</summary>
                  {a.description && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.sub }}>{a.description}</p>}
                  <WonDetails d={a.details} />
                </details>
              </div>
            ))}

            {past.length > 0 && (
              <>
                <h2 style={h2}>Past schemes</h2>
                {past.map((s) => <PastCard key={s.award_id} s={s} />)}
              </>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}