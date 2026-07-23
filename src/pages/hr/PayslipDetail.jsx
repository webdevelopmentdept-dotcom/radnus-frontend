// pages/hr/PayslipDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { usePayslipDetail } from "../../hooks/usePayroll";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading } = usePayslipDetail(id);

  if (isLoading) return <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>Loading...</div>;
  if (!p) return <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Payslip not found.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{
        background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600,
        cursor: "pointer", marginBottom: 16,
      }}>← Back</button>

      <div id="payslip-print" style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "#1a1a2e", padding: "24px 28px" }}>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 12, letterSpacing: 1 }}>PAYSLIP</p>
          <h2 style={{ margin: "4px 0 0", color: "#fff", fontSize: 20, fontWeight: 800 }}>
            {MONTH_NAMES[p.month]} {p.year}
          </h2>
        </div>

        {/* Employee info */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Info label="Employee" value={p.employee_name} />
          <Info label="Employee Code" value={p.employee_code || "—"} />
          <Info label="Department" value={p.department} />
          <Info label="Designation" value={p.designation} />
        </div>

        {/* Attendance summary */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
          <h4 style={sectionTitle}>Attendance Summary</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <StatBox label="Total Days" value={p.total_days_in_month} />
            <StatBox label="Present" value={p.present_days} />
            <StatBox label="Half Days" value={p.half_days} />
            <StatBox label="Paid Leave" value={p.paid_leave_days} />
            <StatBox label="Unpaid Leave" value={p.unpaid_leave_days} />
            <StatBox label="Absent (LOP)" value={p.absent_days} highlight />
            <StatBox label="Holidays" value={p.holiday_days} />
            <StatBox label="Payable Days" value={p.payable_days} bold />
          </div>
        </div>

        {/* Earnings */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
          <h4 style={sectionTitle}>Earnings</h4>
          <Row label={`Gross Salary (Monthly Fixed)`} value={fmt(p.gross_salary_monthly)} muted />
          <Row label={`Per Day Rate (÷ ${p.total_days_in_month} days)`} value={fmt(p.per_day_rate)} muted />
          <Row label="Basic" value={fmt(p.earnings?.basic)} />
          <Row label="HRA" value={fmt(p.earnings?.hra)} />
          <Row label="Special Allowance" value={fmt(p.earnings?.special_allowance)} />
          <Row label="Conveyance Allowance" value={fmt(p.earnings?.conveyance_allowance)} />
          {p.earnings?.overtime_amount > 0 && <Row label="Overtime" value={fmt(p.earnings.overtime_amount)} />}
          <Row label="Gross Earnings" value={fmt(p.earnings?.gross_earnings)} bold />
        </div>

        {/* Deductions */}
        {/* <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
          <h4 style={sectionTitle}>Deductions</h4>
          {p.deductions?.total_deductions === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No deductions applied (PF/ESI/TDS process not yet active for this employee).</p>
          ) : (
            <>
              {p.deductions?.pf > 0 && <Row label="PF" value={fmt(p.deductions.pf)} />}
              {p.deductions?.esi > 0 && <Row label="ESI" value={fmt(p.deductions.esi)} />}
              {p.deductions?.tds > 0 && <Row label="TDS" value={fmt(p.deductions.tds)} />}
              {p.deductions?.professional_tax > 0 && <Row label="Professional Tax" value={fmt(p.deductions.professional_tax)} />}
              <Row label="Total Deductions" value={fmt(p.deductions?.total_deductions)} bold />
            </>
          )}
        </div> */}

        {/* Deductions */}
<div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
  <h4 style={sectionTitle}>Deductions</h4>

  {/* LOP as a visible deduction line */}
  {p.absent_days > 0 && (
    <Row
      label={`LOP (${p.absent_days} day${p.absent_days > 1 ? "s" : ""} × ${fmt(p.per_day_rate)})`}
      value={fmt(p.absent_days * p.per_day_rate)}
    />
  )}

  {p.deductions?.total_deductions === 0 ? (
    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No deductions applied (PF/ESI/TDS process not yet active for this employee).</p>
  ) : (
    <>
      {p.deductions?.pf > 0 && <Row label="PF" value={fmt(p.deductions.pf)} />}
      {p.deductions?.esi > 0 && <Row label="ESI" value={fmt(p.deductions.esi)} />}
      {p.deductions?.tds > 0 && <Row label="TDS" value={fmt(p.deductions.tds)} />}
      {p.deductions?.professional_tax > 0 && <Row label="Professional Tax" value={fmt(p.deductions.professional_tax)} />}
      <Row label="Total Deductions" value={fmt(p.deductions?.total_deductions)} bold />
    </>
  )}
</div>

        {/* Net Pay */}
        <div style={{ padding: "24px 28px", background: "#f0f9ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Net Pay</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#059669" }}>{fmt(p.net_pay)}</span>
        </div>
      </div>

      <button onClick={() => window.print()} style={{
        marginTop: 16, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
      }}>🖨️ Print Payslip</button>
    </div>
  );
}

const sectionTitle = { margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 };

function Info({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>{value || "—"}</p>
    </div>
  );
}

function StatBox({ label, value, highlight, bold }) {
  return (
    <div style={{
      background: highlight ? "#fef2f2" : "#f8fafc", borderRadius: 8, padding: "10px 12px",
      border: `1px solid ${highlight ? "#fecaca" : "#e5e7eb"}`,
    }}>
      <p style={{ margin: 0, fontSize: 11, color: highlight ? "#dc2626" : "#6b7280" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: bold ? 800 : 700, color: highlight ? "#dc2626" : "#111827" }}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold, muted }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={{ fontSize: 13, color: muted ? "#9ca3af" : "#374151", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, color: muted ? "#9ca3af" : "#111827", fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}