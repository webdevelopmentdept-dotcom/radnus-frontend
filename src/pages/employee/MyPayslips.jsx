// pages/employee/MyPayslips.jsx
import { useState } from "react";
import EmployeeLayout from "./EmployeeLayout";
import { useMyPayslips } from "../../hooks/usePayroll";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function MyPayslips() {
  const employeeId = localStorage.getItem("employeeId");
  const { data: payslips = [], isLoading } = useMyPayslips(employeeId);
  const [selected, setSelected] = useState(null);

  if (!employeeId) {
    window.location.href = "/login";
    return null;
  }

  return (
    <EmployeeLayout>
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>My Payslips</h2>
        <p style={{ margin: "4px 0 20px", color: "#6b7280", fontSize: 13 }}>
          Monthly salary breakdown based on attendance
        </p>

        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : payslips.length === 0 ? (
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: 50, textAlign: "center", color: "#9ca3af",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
            No payslips available yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {payslips.map((p) => {
              const lopAmount = (p.lop_days || 0) * (p.per_day_rate || 0);
              return (
                <div key={p._id}
                  onClick={() => setSelected(selected === p._id ? null : p._id)}
                  style={{
                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                    padding: "16px 20px", cursor: "pointer",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                        {MONTH_NAMES[p.month]} {p.year}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                        {p.payable_days} payable days · Status:{" "}
                        <span style={{ color: p.status === "paid" ? "#059669" : "#2563eb", fontWeight: 600, textTransform: "capitalize" }}>
                          {p.status}
                        </span>
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#059669" }}>{fmt(p.net_pay)}</p>
                      <span style={{
                        fontSize: 12, color: "#9ca3af", transform: selected === p._id ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s",
                      }}>▼</span>
                    </div>
                  </div>

                 {selected === p._id && (
  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>

    {/* Attendance Summary */}
    <SectionLabel text="Attendance Summary" />
    <DetailRow label="Total Days" value={p.total_days_in_month} />
    <DetailRow label="Present Days" value={p.present_days} />
    <DetailRow label="Half Days" value={p.half_days} />
    <DetailRow label="Paid Leave" value={p.paid_leave_days} />
    <DetailRow label="Unpaid Leave" value={p.unpaid_leave_days} />
    <DetailRow label="LOP (Absent) Days" value={p.lop_days} highlight={p.lop_days > 0} />
    <DetailRow label="Payable Days" value={p.payable_days} bold />

    {/* Earnings Breakdown */}
    <SectionLabel text="Earnings Breakdown" />
    <DetailRow label="Gross Salary (Monthly Fixed)" value={fmt(p.gross_salary_monthly)} muted />
    <DetailRow label={`Per Day Rate (÷ ${p.total_days_in_month || 30} days)`} value={fmt(p.per_day_rate)} muted />

    {/* Deductions Breakdown */}
  {/* Deductions Breakdown */}
<SectionLabel text="Deductions Breakdown" />
{p.lop_days > 0 && (
  <DetailRow
    label={`LOP Deduction (${p.lop_days} day${p.lop_days > 1 ? "s" : ""} × ${fmt(p.per_day_rate)})`}
    value={fmt(lopAmount)}
    negative
  />
)}
{p.deductions?.pf > 0 && <DetailRow label="PF" value={fmt(p.deductions.pf)} negative />}
{p.deductions?.esi > 0 && <DetailRow label="ESI" value={fmt(p.deductions.esi)} negative />}
{p.deductions?.tds > 0 && <DetailRow label="TDS" value={fmt(p.deductions.tds)} negative />}
{p.deductions?.professional_tax > 0 && (
  <DetailRow label="Professional Tax" value={fmt(p.deductions.professional_tax)} negative />
)}
<DetailRow
  label="Total Deductions"
  value={fmt(lopAmount + (p.deductions?.total_deductions || 0))}
  bold
/>

    {/* Net Pay */}
    <div style={{
      marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Net Pay</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{fmt(p.net_pay)}</span>
    </div>
  </div>
)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

function SectionLabel({ text }) {
  return (
    <p style={{
      margin: "16px 0 8px", fontSize: 11, fontWeight: 700, color: "#9ca3af",
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>{text}</p>
  );
}

function DetailRow({ label, value, bold, muted, highlight, negative }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: 13, color: highlight ? "#dc2626" : muted ? "#9ca3af" : "#6b7280" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: bold ? 700 : 600,
        color: highlight ? "#dc2626" : negative ? "#dc2626" : muted ? "#9ca3af" : "#111827",
      }}>
        {negative && value !== "₹0" ? `- ${value}` : value}
      </span>
    </div>
  );
}