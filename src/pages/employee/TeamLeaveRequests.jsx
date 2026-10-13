import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");
const cfg = () => ({ headers: { Authorization: `Bearer ${token()}` } });
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const daysOf = (l) => l.is_half_day ? 0.5 : Math.floor((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1;

export default function TeamLeaveRequests() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/api/leave-requests/team-requests`, cfg());
      setRows(r.data.data || []);
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    if (action === "tl-reject" && !(remarks[id] || "").trim()) {
      setMsg("Please enter a reason to reject");
      return;
    }
    setBusy(id + action); setMsg("");
    try {
      await axios.put(`${API_BASE}/api/leave-requests/${id}/${action}`, { tl_remark: remarks[id] || "" }, cfg());
      await load();
    } catch (e) { setMsg(e.response?.data?.message || "Failed"); }
    setBusy(null);
  };

  const pending = rows.filter(l => l.current_stage === "team_lead");
  const done    = rows.filter(l => l.current_stage !== "team_lead");
  const shown   = tab === "pending" ? pending : done;

  const finalLabel = (l) =>
    l.status === "approved" ? "HR: Approved ✅" :
    l.status === "rejected" ? "HR: Rejected ❌" : "Waiting for HR ⏳";

  const card = { background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 14, padding: 16, marginBottom: 10 };
  const btn = (bg, color) => ({ padding: "8px 14px", borderRadius: 8, border: "none", background: bg, color, fontWeight: 700, fontSize: 12, cursor: "pointer" });

  return (
    <EmployeeLayout>
      <style>{`
        .tl-page { padding: 24px; max-width: 820px; width: 100%; box-sizing: border-box; min-width: 0; }
        .tl-page * { box-sizing: border-box; }
        @media (max-width: 767px) {
          .tl-page { padding: 14px; max-width: 100vw; overflow-x: hidden; }
          .tl-page, .tl-page * { overflow-wrap: anywhere; }
        }
      `}</style>
      <div className="tl-page">
        <h2 style={{ margin: 0 }}>Team Leave Requests</h2>
        <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          Your decision goes to HR for the final approval.
        </p>

        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          {[["pending", `Pending (${pending.length})`], ["done", `Reviewed (${done.length})`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={btn(tab === k ? "#0a0a0a" : "#f3f4f6", tab === k ? "#fff" : "#374151")}>{label}</button>
          ))}
        </div>

        {msg && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        {loading ? <p>Loading…</p> : shown.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No {tab === "pending" ? "pending" : "reviewed"} requests</p>
        ) : shown.map(l => (
          <div key={l._id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{l.employee_name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{l.department}</div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Applied {fmtD(l.createdAt)}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <b>{l.leave_type}</b> · {fmtD(l.from_date)} → {fmtD(l.to_date)} · {daysOf(l)} day(s)
              {l.is_half_day && ` · ${l.session}`}
            </div>
            {l.reason && <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>Reason: {l.reason}</div>}

            {tab === "pending" ? (
              <div style={{ marginTop: 12 }}>
                <textarea rows={2} placeholder="Remark (required for reject)" value={remarks[l._id] || ""}
                  onChange={e => setRemarks(r => ({ ...r, [l._id]: e.target.value }))}
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1.5px solid #e5e7eb", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button style={btn("#fee2e2", "#dc2626")} disabled={!!busy} onClick={() => act(l._id, "tl-reject")}>Reject</button>
                  <button style={btn("#0a0a0a", "#fff")} disabled={!!busy} onClick={() => act(l._id, "tl-approve")}>Approve</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 12 }}>
                <div>Your decision: <b style={{ color: l.tl_status === "approved" ? "#16a34a" : "#dc2626" }}>{l.tl_status}</b>
                  {l.tl_remark && ` — "${l.tl_remark}"`}</div>
                <div style={{ marginTop: 4 }}>{finalLabel(l)}</div>
                {l.hr_remark && (
                  <div style={{ marginTop: 4, color: l.status === "rejected" ? "#dc2626" : "#0369a1", fontWeight: 500 }}>
                    {l.status === "rejected" ? "HR rejection reason" : "HR Note"}: {l.hr_remark}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </EmployeeLayout>
  );
}