// pages/employee/MyAdvances.jsx
import { useState } from "react";
import EmployeeLayout from "./EmployeeLayout";
import { useMyAdvances, useRequestAdvance, useWithdrawAdvance } from "../../hooks/useAdvance";

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

export default function MyAdvances() {
  const employeeId = localStorage.getItem("employeeId");
  const { data: advances = [], isLoading } = useMyAdvances(employeeId);
  const requestMutation  = useRequestAdvance();
  const withdrawMutation = useWithdrawAdvance();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  if (!employeeId) {
    window.location.href = "/login";
    return null;
  }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return showToast("Enter a valid amount", "error");
    if (!reason.trim()) return showToast("Please tell HR why you need the advance", "error");

    requestMutation.mutate(
      { employee_id: employeeId, amount: Number(amount), reason: reason.trim() },
      {
        onSuccess: () => {
          showToast("Advance request submitted to HR");
          setAmount(""); setReason("");
        },
        onError: (err) => showToast(err?.response?.data?.message || "Request failed", "error"),
      }
    );
  };

  const handleWithdraw = (adv) => {
    if (!window.confirm("Withdraw this advance request?")) return;
    withdrawMutation.mutate({ id: adv._id }, {
      onSuccess: () => showToast("Request withdrawn"),
      onError: (err) => showToast(err?.response?.data?.message || "Failed to withdraw", "error"),
    });
  };

  return (
    <EmployeeLayout>
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Salary Advance</h2>
        <p style={{ margin: "4px 0 20px", color: "#6b7280", fontSize: 13 }}>
          Request an advance against your salary — HR will review and let you know which month's pay it'll be recovered from.
        </p>

        {toast && (
          <div style={{
            padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
            background: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
            color: toast.type === "error" ? "#dc2626" : "#059669",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#6ee7b7"}`,
          }}>{toast.message}</div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
          padding: 20, marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Amount (₹)
              </label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Reason
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Why do you need this advance?"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
          </div>
          <button type="submit" disabled={requestMutation.isPending}
            style={{
              background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              opacity: requestMutation.isPending ? 0.6 : 1,
            }}>
            {requestMutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>My Requests</h3>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : advances.length === 0 ? (
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: 50, textAlign: "center", color: "#9ca3af",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
            No advance requests yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {advances.map((a) => (
              <div key={a._id} style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "16px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827" }}>{fmt(a.amount)}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>{a.reason}</p>
                    {a.status !== "pending" && a.hr_remarks && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
                        <strong>HR note:</strong> {a.hr_remarks}
                      </p>
                    )}
                    {(a.status === "approved" || a.status === "recovered") && a.recovery_month && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
                        {a.status === "recovered" ? "Deducted from" : "Will be deducted from"}{" "}
                        {MONTH_NAMES[a.recovery_month]} {a.recovery_year} salary
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <StatusBadge status={a.status} />
                    {a.status === "pending" && (
                      <button onClick={() => handleWithdraw(a)} disabled={withdrawMutation.isPending}
                        style={{
                          background: "#fff5f5", color: "#ef4444", border: "1px solid #ef444433",
                          borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>Withdraw</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}