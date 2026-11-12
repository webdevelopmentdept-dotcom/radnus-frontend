// src/pages/hr/AwardApprovals.jsx  (Phase 5) approvals + analytics for HR / management
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RecognitionTabs from "./RecognitionTabs";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/award-workflow`;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", red: "#b91c1c", amber: "#b45309" };
const STEP = { hr: "HR", committee: "Committee", management: "Management" };
const STAGE = {
  not_submitted: ["Not submitted", C.sub, "#f3f4f6"], in_review: ["In review", C.amber, "#fffbeb"],
  approved: ["Approved", C.blue, "#eff6ff"], returned: ["Sent back", C.red, "#fef2f2"], published: ["Published", C.green, "#dcfce7"],
};
const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";
const date = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const btn = (kind = "ghost") => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
  border: `1px solid ${kind === "primary" ? C.blue : C.border}`, background: kind === "primary" ? C.blue : kind === "danger" ? "#fef2f2" : "#fff",
  color: kind === "primary" ? "#fff" : kind === "danger" ? C.red : C.text,
});
const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, background: "#f9fafb" };
const td = { padding: "12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "top" };
const input = { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box", width: "100%" };
const Pill = ({ children, color, bg }) => <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>;

function Modal({ title, onClose, children }) {
  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 70 }}>
       <div style={{ background: "#fff", color: C.text, borderRadius: 12, padding: 22, width: 460, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 12px" }}>{title}</h3>{children}
      </div>
    </div>
  );
}
const Lbl = ({ t, children }) => <label style={{ display: "block", fontSize: 13, marginTop: 10 }}>{t}<div style={{ marginTop: 4 }}>{children}</div></label>;

export default function AwardApprovals() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("approvals");
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState({});
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500); };
  const load = useCallback(async () => {
    try { const r = await axios.get(API); setRows(r.data.data.awards); setMe(r.data.data.me); }
    catch (e) { notify(errMsg(e), "error"); }
  }, []);
  const loadStats = useCallback(async () => {
    try { setStats((await axios.get(`${API}/analytics`)).data.data); } catch (e) { notify(errMsg(e), "error"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "analytics") loadStats(); }, [tab, loadStats]);

  const submit = async (fn, okMsg) => {
    try { setBusy(true); const r = await fn(); setModal(null); notify(typeof okMsg === "function" ? okMsg(r) : okMsg); load(); }
    catch (e) { setModal((m) => (m ? { ...m, error: errMsg(e) } : m)); if (!modal) notify(errMsg(e), "error"); }
    finally { setBusy(false); }
  };

  const tabBtn = (k, t) => (
    <button key={k} onClick={() => setTab(k)} style={{ ...btn(), background: tab === k ? "#eff6ff" : "#fff", borderColor: tab === k ? C.blue : C.border, color: tab === k ? C.blue : C.text }}>{t}</button>
  );

  const stepChip = (s) => {
    const [mark, color] = s.status === "approved" ? ["✓", C.green] : s.status === "returned" ? ["✗", C.red] : ["○", C.sub];
    return (
      <div key={s.step} style={{ fontSize: 12, marginBottom: 3, color }}>
        <b>{mark} {STEP[s.step]}</b>
        {s.at && <span style={{ color: C.sub }}> · {s.by} ({s.by_role}), {date(s.at)}</span>}
        {s.members?.length > 0 && <div style={{ color: C.sub, marginLeft: 14 }}>Members: {s.members.join(", ")}</div>}
        {s.remark && <div style={{ color: C.sub, marginLeft: 14 }}>"{s.remark}"</div>}
      </div>
    );
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1250, color: C.text }}>
            <RecognitionTabs group="approvals" />
      {toast && <div role="status" style={{ position: "fixed", top: 20, right: 20, zIndex: 90, padding: "10px 16px", borderRadius: 8, color: "#fff", fontSize: 13, background: toast.type === "error" ? C.red : C.green }}>{toast.msg}</div>}
      <h1 style={{ margin: 0, fontSize: 24 }}>Award approvals</h1>
      <p style={{ margin: "6px 0 16px", color: C.sub, fontSize: 13 }}>Send finalized results for approval, record the committee decision, get management sign-off, then publish the winners.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{tabBtn("approvals", "Approvals")}{tabBtn("analytics", "Analytics")}</div>

      {tab === "approvals" && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead><tr><th style={th}>Award</th><th style={th}>Winners</th><th style={th}>Approval steps</th><th style={th}>Status</th><th style={th}>Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: C.sub, padding: 28 }}>Nothing here yet. Finalize an award's results on its Evaluate screen first.</td></tr>}
              {rows.map((r) => {
                const st = STAGE[r.stage];
                return (
                  <tr key={r.award_id}>
                    <td style={td}><b>{r.name}</b><div style={{ color: C.sub, fontSize: 12 }}>{date(r.start_date)} to {date(r.end_date)}</div></td>
                    <td style={td}>
                      {r.winners.length === 0 ? <span style={{ color: C.sub }}>No winners</span> : r.winners.map((w, i) => <div key={i} style={{ fontSize: 12 }}>{w.rank}. {w.name}</div>)}
                      {r.winners_total > r.winners.length && <div style={{ fontSize: 12, color: C.sub }}>+{r.winners_total - r.winners.length} more</div>}
                    </td>
                    <td style={td}>{r.steps.length === 0 ? <span style={{ color: C.sub }}>No approval needed</span> : r.steps.map(stepChip)}</td>
                    <td style={td}>
                      <Pill color={st[1]} bg={st[2]}>{st[0]}</Pill>
                      {r.returned_remark && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{r.returned_remark}</div>}
                      {r.published_at && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{date(r.published_at)}</div>}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.stage === "not_submitted" && <button style={btn("primary")} onClick={() => setModal({ kind: "submit", row: r, remark: "" })}>Submit for approval</button>}
                        {r.stage === "in_review" && r.can_act && <button style={btn("primary")} onClick={() => setModal({ kind: "step", row: r, decision: "approved", members: "", remark: "" })}>{STEP[r.next_step]} decision</button>}
                        {r.stage === "in_review" && !r.can_act && <span style={{ fontSize: 12, color: C.sub }}>Waiting for MD / admin</span>}
                        {r.stage === "approved" && <button style={btn("primary")} onClick={() => setModal({ kind: "publish", row: r })}>Publish winners</button>}
                        {r.stage === "published" && !window.location.pathname.startsWith("/admin") && (
                          <button style={btn()} onClick={() => navigate("/hr/dashboard/recognition/rewards-register")}>Rewards register</button>
                        )}
                        {r.stage !== "published" && <button style={btn("danger")} onClick={() => setModal({ kind: "reopen", row: r, reason: "" })}>Reopen results</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "analytics" && (!stats ? <p style={{ color: C.sub }}>Loading...</p> : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            {[["Active awards", stats.awards.active, C.blue], ["Waiting approval", stats.approvals.in_review, C.amber], ["Published", stats.approvals.published, C.green],
            ["Winners", stats.winners_total, C.text], ["Rewards planned", money(stats.budget.planned), C.amber], ["Rewards given", money(stats.budget.issued), C.green]].map(([l, v, c]) => (
              <div key={l} style={{ flex: "1 1 150px", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", background: "#fff" }}>
                <div style={{ fontSize: 12, color: C.sub }}>{l}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px", border: `1px solid ${C.border}`, borderRadius: 12, background: "#fff", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Winners by department</th><th style={th}>Count</th></tr></thead>
                <tbody>
                  {stats.by_department.length === 0 && <tr><td colSpan={2} style={{ ...td, color: C.sub }}>No published awards yet.</td></tr>}
                  {stats.by_department.map((d) => <tr key={d.department}><td style={td}>{d.department}</td><td style={td}><b>{d.count}</b></td></tr>)}
                </tbody>
              </table>
            </div>
            <div style={{ flex: "1 1 360px", border: `1px solid ${C.border}`, borderRadius: 12, background: "#fff", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Most awards won</th><th style={th}>Wins</th></tr></thead>
                <tbody>
                  {stats.leaderboard.length === 0 && <tr><td colSpan={2} style={{ ...td, color: C.sub }}>No published awards yet.</td></tr>}
                  {stats.leaderboard.map((e, i) => <tr key={i}><td style={td}><b>{e.name}</b><div style={{ fontSize: 12, color: C.sub }}>{e.code} {e.department && `· ${e.department}`}</div></td><td style={td}><b>{e.wins}</b></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ))}

      {modal && (
        <Modal title={{ submit: "Submit for approval", step: `${STEP[modal.row.next_step] || ""} decision`, publish: "Publish winners", reopen: "Reopen results" }[modal.kind]} onClose={() => setModal(null)}>
          <p style={{ margin: 0, fontSize: 13, color: C.sub }}>{modal.row.name}</p>

          {modal.kind === "submit" && <Lbl t="Remark (optional)"><input style={input} value={modal.remark} onChange={(e) => setModal({ ...modal, remark: e.target.value })} /></Lbl>}

          {modal.kind === "step" && <>
            <Lbl t="Decision">
              <select style={input} value={modal.decision} onChange={(e) => setModal({ ...modal, decision: e.target.value })}>
                <option value="approved">Approve</option><option value="returned">Send back</option>
              </select>
            </Lbl>
            {modal.row.next_step === "committee" && modal.decision === "approved" && (
              <Lbl t="Committee members who decided (comma separated)"><input style={input} placeholder="Ravi (MD), Priya (HR), Karthik (Sales Head)" value={modal.members} onChange={(e) => setModal({ ...modal, members: e.target.value })} /></Lbl>
            )}
            <Lbl t={modal.decision === "returned" ? "Reason (required, min 10 characters)" : "Remark (optional)"}><textarea rows={3} style={input} value={modal.remark} onChange={(e) => setModal({ ...modal, remark: e.target.value })} /></Lbl>
          </>}

          {modal.kind === "publish" && <p style={{ fontSize: 13 }}>Winners will be announced and each winner gets a notification. This cannot be undone.</p>}
          {modal.kind === "reopen" && <>
            <p style={{ fontSize: 12, color: C.sub }}>Results become editable again and the approval starts from scratch. Planned reward entries are removed.</p>
            <Lbl t="Reason (required, min 10 characters)"><textarea rows={3} style={input} value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} /></Lbl>
          </>}

          {modal.error && <p style={{ color: C.red, fontSize: 13, margin: "10px 0 0" }}>{modal.error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button style={btn()} onClick={() => setModal(null)}>Close</button>
            <button style={btn("primary")} disabled={busy} onClick={() => {
              const m = modal, id = m.row.award_id;
              if (m.kind === "submit") return submit(() => axios.post(`${API}/${id}/submit`, { remark: m.remark }), "Submitted for approval");
              if (m.kind === "step") return submit(() => axios.post(`${API}/${id}/step`, {
                step: m.row.next_step, decision: m.decision, remark: m.remark,
                members: m.members.split(",").map((s) => s.trim()).filter(Boolean),
              }), m.decision === "approved" ? "Approved" : "Sent back");
              if (m.kind === "publish") return submit(() => axios.post(`${API}/${id}/publish`), (r) => `Published. ${r.data.data.notified} winners notified`);
              if (m.kind === "reopen") return submit(() => axios.post(`${API}/${id}/reopen`, { reason: m.reason }), "Results reopened");
            }}>{modal.kind === "publish" ? "Publish" : "Save"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}