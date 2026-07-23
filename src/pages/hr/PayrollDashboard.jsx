// pages/hr/PayrollDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePayrollRuns, usePayslipsByRun, useGeneratePayroll,
  useApprovePayroll, useRevertPayrollApproval, useMarkPayrollPaid, useDeletePayrollRun,
  useMarkPayslipPaid, useMarkPayslipPending,
} from "../../hooks/usePayroll";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  draft:    { bg: "#fff7ed", color: "#d97706", border: "#fcd34d" },
  approved: { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" },
  paid:     { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700,
      textTransform: "capitalize",
    }}>{status}</span>
  );
}

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());
  const [selectedRun, setSelectedRun] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: runs = [], isLoading: runsLoading } = usePayrollRuns();
  const { data: payslips = [], isLoading: payslipsLoading } = usePayslipsByRun(selectedRun?._id);

  const generateMutation = useGeneratePayroll();
  const approveMutation  = useApprovePayroll();
  const revertApprovalMutation = useRevertPayrollApproval();
  const markPaidMutation = useMarkPayrollPaid();
  const deleteMutation   = useDeletePayrollRun();
  const markPayslipPaidMutation    = useMarkPayslipPaid();
  const markPayslipPendingMutation = useMarkPayslipPending();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = () => {
    const hrName = localStorage.getItem("hrName") || "HR Admin";
    generateMutation.mutate(
      { month, year, generated_by: hrName },
      {
        onSuccess: (res) => showToast(res.message || "Payroll generated"),
        onError: (err) => showToast(err?.response?.data?.message || "Generation failed", "error"),
      }
    );
  };

  const handleApprove = (run) => {
    const hrName = localStorage.getItem("hrName") || "HR Admin";
    if (!window.confirm(`Approve payroll for ${MONTH_NAMES[run.month]} ${run.year}? Payslips will lock for editing.`)) return;
    approveMutation.mutate(
      { id: run._id, approved_by: hrName },
      {
        onSuccess: () => showToast("Payroll approved"),
        onError: (err) => showToast(err?.response?.data?.message || "Approval failed", "error"),
      }
    );
  };

  const handleUndoApprove = (run) => {
    if (!window.confirm(
      `Revert payroll for ${MONTH_NAMES[run.month]} ${run.year} back to Draft?\n\nPayslips will unlock for editing and disappear from employee view until re-approved.`
    )) return;
    revertApprovalMutation.mutate(run._id, {
      onSuccess: () => showToast("Reverted to Draft"),
      onError: (err) => showToast(err?.response?.data?.message || "Failed to revert", "error"),
    });
  };

  const handleMarkPaid = (run) => {
    if (!window.confirm(`Mark payroll for ${MONTH_NAMES[run.month]} ${run.year} as PAID? This cannot be undone.`)) return;
    markPaidMutation.mutate(run._id, { onSuccess: () => showToast("Marked as paid") });
  };

  const handleMarkPayslipPaid = (payslip) => {
    if (!window.confirm(`Mark ${payslip.employee_name}'s salary as PAID?`)) return;
    markPayslipPaidMutation.mutate(
      { id: payslip._id },
      {
        onSuccess: () => showToast(`${payslip.employee_name} marked as paid`),
        onError: (err) => showToast(err?.response?.data?.message || "Failed to mark as paid", "error"),
      }
    );
  };

  const handleMarkPayslipPending = (payslip) => {
    if (!window.confirm(`Revert ${payslip.employee_name}'s payment status back to pending?`)) return;
    markPayslipPendingMutation.mutate(payslip._id, {
      onSuccess: () => showToast(`${payslip.employee_name} reverted to pending`),
      onError: (err) => showToast(err?.response?.data?.message || "Failed to revert", "error"),
    });
  };

  const handleDelete = (run) => {
    if (!window.confirm("Delete this draft payroll run?")) return;
    deleteMutation.mutate(run._id, {
      onSuccess: () => { showToast("Draft deleted"); if (selectedRun?._id === run._id) setSelectedRun(null); },
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Payroll</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Attendance-based salary generation — monthly
          </p>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
          background: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
          color: toast.type === "error" ? "#dc2626" : "#059669",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : "#6ee7b7"}`,
        }}>{toast.message}</div>
      )}

      {/* Generate Panel */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
        padding: 20, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap",
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}>
            {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, width: 100 }} />
        </div>
        <button onClick={handleGenerate} disabled={generateMutation.isPending}
          style={{
            background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            opacity: generateMutation.isPending ? 0.6 : 1,
          }}>
          {generateMutation.isPending ? "Generating..." : "⚡ Generate Payroll"}
        </button>
      </div>

      {/* Payroll runs list */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ background: "#1a1a2e", padding: "14px 20px" }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 700 }}>Payroll Runs</h3>
        </div>
        {runsLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</div>
         ) : runs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No payroll generated yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 850 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["Month", "Employees", "Gross", "Deductions", "Net Pay", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run._id}
                    onClick={() => setSelectedRun(run)}
                    style={{
                      borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                      background: selectedRun?._id === run._id ? "#f0f4ff" : "#fff",
                    }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{MONTH_NAMES[run.month]} {run.year}</td>
                    <td style={{ padding: "12px 16px" }}>{run.total_employees}</td>
                    <td style={{ padding: "12px 16px" }}>{fmt(run.total_gross)}</td>
                    <td style={{ padding: "12px 16px" }}>{fmt(run.total_deductions)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(run.total_net_pay)}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={run.status} /></td>
                    <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {run.status === "draft" && (
                          <>
                            <button onClick={() => handleApprove(run)} style={btnStyle("#eff6ff", "#2563eb")}>Approve</button>
                            <button onClick={() => handleDelete(run)} style={btnStyle("#fff5f5", "#ef4444")}>Delete</button>
                          </>
                        )}
                        {run.status === "approved" && (
                          <>
                            <button onClick={() => handleMarkPaid(run)} style={btnStyle("#ecfdf5", "#059669")}>Mark Paid</button>
                            <button onClick={() => handleUndoApprove(run)} disabled={revertApprovalMutation.isPending}
                              style={btnStyle("#fff7ed", "#d97706")}>Undo Approve</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected run's payslips */}
      {selectedRun && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ background: "#1a1a2e", padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 700 }}>
              Payslips — {MONTH_NAMES[selectedRun.month]} {selectedRun.year}
            </h3>
            <button onClick={() => setSelectedRun(null)} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}>✕</button>
          </div>
          {payslipsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1050 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                    {["Employee", "Dept", "Present", "LOP", "Payable Days", "Gross", "Deductions", "Net Pay", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
               <tbody>
  {payslips.map((p) => {
    const lopAmount = (p.lop_days || 0) * (p.per_day_rate || 0);
    const totalDeductionsWithLop = lopAmount + (p.deductions?.total_deductions || 0);

    return (
      <tr key={p._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.employee_name}</td>
        <td style={{ padding: "12px 16px", color: "#6b7280" }}>{p.department}</td>
        <td style={{ padding: "12px 16px" }}>{p.present_days}</td>
        <td style={{ padding: "12px 16px", color: p.lop_days > 0 ? "#ef4444" : "#9ca3af" }}>{p.lop_days}</td>
        <td style={{ padding: "12px 16px" }}>{p.payable_days}</td>
        <td style={{ padding: "12px 16px" }}>{fmt(p.gross_salary_monthly)}</td>
        <td style={{ padding: "12px 16px" }}>{fmt(totalDeductionsWithLop)}</td>
        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(p.net_pay)}</td>
        <td style={{ padding: "12px 16px" }}><StatusBadge status={p.status} /></td>
        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate(`/hr/dashboard/payroll/payslip/${p._id}`)}
              style={btnStyle("#f3f4f6", "#374151")}>View</button>
            {p.status === "approved" && (
              <button onClick={() => handleMarkPayslipPaid(p)}
                disabled={markPayslipPaidMutation.isPending}
                style={btnStyle("#ecfdf5", "#059669")}>Mark Paid</button>
            )}
            {p.status === "paid" && (
              <button onClick={() => handleMarkPayslipPending(p)}
                disabled={markPayslipPendingMutation.isPending}
                style={btnStyle("#fff7ed", "#d97706")}>Undo</button>
            )}
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
              </table>
            </div>
          )}
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