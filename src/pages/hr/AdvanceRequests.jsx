// pages/hr/AdvanceRequests.jsx
import { useState } from "react";
import { useAllAdvances, useApproveAdvance, useRejectAdvance } from "../../hooks/useAdvance";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  pending:   { bg: "#fff7ed", color: "#d97706", border: "#fcd34d", label: "Pending" },
  approved:  { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd", label: "Approved" },
  rejected:  { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Rejected" },
  recovered: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7", label: "Deducted" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700,
    }}>{s.label}</span>
  );
}

const TABS = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "recovered", label: "Deducted" },
  { key: "rejected", label: "Rejected" },
  { key: "",         label: "All" },
];

export default function AdvanceRequests() {
  const [tab, setTab] = useState("pending");
  const { data: advances = [], isLoading } = useAllAdvances(tab || undefined);
  const approveMutation = useApproveAdvance();
  const rejectMutation  = useRejectAdvance();

  const [toast, setToast] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const today = new Date();
  const [form, setForm] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openApprove = (adv) => {
    setReviewing(adv);
    setForm({
      amount: adv.amount,
      recovery_month: today.getMonth() + 1,
      recovery_year: today.getFullYear(),
      hr_remarks: "",
    });
  };

  const closeApprove = () => { setReviewing(null); setForm(null); };

  const submitApprove = () => {
    const hrName = localStorage.getItem("hrName") || "HR Admin";
    approveMutation.mutate(
      {
        id: reviewing._id,
        approved_by: hrName,
        amount: Number(form.amount),
        recovery_month: Number(form.recovery_month),
        recovery_year: Number(form.recovery_year),
        hr_remarks: form.hr_remarks,
      },
      {
        onSuccess: () => {
          showToast(`Approved — will be deducted from ${MONTH_NAMES[form.recovery_month]} ${form.recovery_year} salary`);
          closeApprove();
        },
        onError: (err) => showToast(err?.response?.data?.message || "Approval failed", "error"),
      }
    );
  };

  const handleReject = (adv) => {
    const hr_remarks = window.prompt(`Reason for rejecting ${adv.employee_name}'s advance request (shown to employee):`, "");
    if (hr_remarks === null) return;
    const hrName = localStorage.getItem("hrName") || "HR Admin";
    rejectMutation.mutate(
      { id: adv._id, approved_by: hrName, hr_remarks },
      {
        onSuccess: () => showToast("Request rejected"),
        onError: (err) => showToast(err?.response?.data?.message || "Failed to reject", "error"),
      }
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Salary Advance Requests</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
          Approve or reject employee advance requests. Approved amounts are automatically deducted from the salary of the month you choose.
        </p>
      </div>

      {toast && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
          background: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
          color: toast.type === "error" ? "#dc2626" : "#059669",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : "#6ee7b7"}`,
        }}>{toast.message}</div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: tab === t.key ? "1px solid #1a1a2e" : "1px solid #e5e7eb",
              background: tab === t.key ? "#1a1a2e" : "#fff",
              color: tab === t.key ? "#fff" : "#374151",
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : advances.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No requests here.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["Employee", "Dept", "Amount", "Reason", "Recovery Month", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advances.map((a) => (
                  <tr key={a._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.employee_name}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{a.department}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(a.amount)}</td>
                    <td style={{ padding: "12px 16px", color: "#374151", maxWidth: 260 }}>{a.reason}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {a.recovery_month ? `${MONTH_NAMES[a.recovery_month]} ${a.recovery_year}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={a.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      {a.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openApprove(a)} style={btnStyle("#eff6ff", "#2563eb")}>Approve</button>
                          <button onClick={() => handleReject(a)} style={btnStyle("#fff5f5", "#ef4444")}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>
                          {a.approved_by ? `by ${a.approved_by}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewing && form && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={closeApprove}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 14, padding: 24, width: 380, maxWidth: "90vw",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#111827" }}>
              Approve Advance — {reviewing.employee_name}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#6b7280" }}>
              Reason: {reviewing.reason}
            </p>

            <label style={labelStyle}>Amount to approve (₹)</label>
            <input type="number" min="1" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={inputStyle} />

            <label style={labelStyle}>Deduct from salary of</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.recovery_month}
                onChange={(e) => setForm({ ...form, recovery_month: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}>
                {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" value={form.recovery_year}
                onChange={(e) => setForm({ ...form, recovery_year: e.target.value })}
                style={{ ...inputStyle, width: 90 }} />
            </div>

            <label style={labelStyle}>Note to employee (optional)</label>
            <textarea rows={2} value={form.hr_remarks}
              onChange={(e) => setForm({ ...form, hr_remarks: e.target.value })}
              style={{ ...inputStyle, resize: "vertical" }} />

            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={closeApprove} style={btnStyle("#f3f4f6", "#374151")}>Cancel</button>
              <button onClick={submitApprove} disabled={approveMutation.isPending}
                style={{ ...btnStyle("#1a1a2e", "#fff"), border: "none" }}>
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    padding: "6px 12px", border: `1px solid ${color}33`, borderRadius: 7,
    background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer",
  };
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", margin: "12px 0 6px" };
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" };