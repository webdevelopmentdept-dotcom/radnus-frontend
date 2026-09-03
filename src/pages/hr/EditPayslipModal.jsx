// components/hr/EditPayslipModal.jsx
import { useState } from "react";
import { useUpdatePayslip } from "../../hooks/usePayroll";

// Fields shown in the modal. Each maps to a nested path on the payslip doc.
const EARNING_FIELDS = [
  { key: "basic", label: "Basic" },
  { key: "hra", label: "HRA" },
  { key: "special_allowance", label: "Special Allowance" },
  { key: "conveyance_allowance", label: "Conveyance Allowance" },
  { key: "overtime_amount", label: "Overtime" },
];

const DEDUCTION_FIELDS = [
  { key: "pf", label: "Provident Fund" },
  { key: "esi", label: "ESI" },
  { key: "tds", label: "TDS" },
  { key: "professional_tax", label: "Professional Tax" },
];

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function EditPayslipModal({ payslip, onClose }) {
  const { mutate, isPending, error } = useUpdatePayslip();

  // ── Employee & period info ──
  const [employeeName, setEmployeeName] = useState(payslip.employee_name || "");
  const [designation, setDesignation] = useState(payslip.designation || "");
  const [department, setDepartment] = useState(payslip.department || "");
  const [employeeCode, setEmployeeCode] = useState(payslip.employee_code || "");
  const [dateOfJoining, setDateOfJoining] = useState(payslip.date_of_joining || "");
  const [month, setMonth] = useState(payslip.month || 1);
  const [year, setYear] = useState(payslip.year || new Date().getFullYear());

  const [earnings, setEarnings] = useState({
    basic: payslip.earnings?.basic || 0,
    hra: payslip.earnings?.hra || 0,
    special_allowance: payslip.earnings?.special_allowance || 0,
    conveyance_allowance: payslip.earnings?.conveyance_allowance || 0,
    overtime_amount: payslip.earnings?.overtime_amount || 0,
  });

  const [deductions, setDeductions] = useState({
    pf: payslip.deductions?.pf || 0,
    esi: payslip.deductions?.esi || 0,
    tds: payslip.deductions?.tds || 0,
    professional_tax: payslip.deductions?.professional_tax || 0,
  });

  const [absentDays, setAbsentDays] = useState(
    payslip.lop_days ?? ((payslip.absent_days || 0) + (payslip.unpaid_leave_days || 0))
  );
  const [halfDays, setHalfDays] = useState(payslip.half_days || 0);
  const initialWorkedDays =
    payslip.payable_days ??
    ((payslip.present_days || 0) + (payslip.half_days || 0) * 0.5 + (payslip.paid_leave_days || 0) +
     (payslip.holiday_days || 0) + (payslip.weekend_days || 0));
  const [workedDays, setWorkedDays] = useState(initialWorkedDays);

  const [otherAmount, setOtherAmount] = useState(payslip.other_deduction?.amount || 0);
  const [otherReason, setOtherReason] = useState(payslip.other_deduction?.reason || "");

  const handleSave = () => {
    if (Number(otherAmount) > 0 && !String(otherReason).trim()) {
      alert("Other Deduction amount இருந்தா, reason கட்டாயம் கொடுக்கணும்.");
      return;
    }

    mutate(
      {
        id: payslip._id,
        payload: {
          employee_name: employeeName,
          designation,
          department,
          employee_code: employeeCode,
          date_of_joining: dateOfJoining,
          month: Number(month),
          year: Number(year),
          ...(Number(workedDays) !== initialWorkedDays ? { worked_days: Number(workedDays) || 0 } : {}),
          earnings,
          deductions,
          lop_days: Number(absentDays) || 0,
          half_days: Number(halfDays) || 0,
          other_deduction: {
            amount: Number(otherAmount) || 0,
            reason: otherReason,
          },
          edited_by: "HR", // TODO: replace with logged-in HR user's name/id
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Edit Payslip — {payslip.employee_name}
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* Employee & Period Info */}
          <SectionTitle text="Employee & Period Info" />
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Employee Name</label>
              <input type="text" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Employee Code</label>
              <input type="text" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Designation</label>
              <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Joining</label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Pay Period Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Attendance */}
          <SectionTitle text="Attendance" />
          <div style={gridStyle}>
            <NumberField label="Worked Days (total)" value={workedDays} onChange={setWorkedDays} />
            <NumberField label="Absent (LOP) Days" value={absentDays} onChange={setAbsentDays} />
            <NumberField label="Half Days" value={halfDays} onChange={setHalfDays} />
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
            Worked Days மாத்தினா, Total Earnings &amp; Net Pay அதுக்கு ஏத்த proportionally recalculate ஆகும்.
          </p>

          {/* Earnings */}
          <SectionTitle text="Earnings" />
          <div style={gridStyle}>
            {EARNING_FIELDS.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                value={earnings[f.key]}
                onChange={(v) => setEarnings((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </div>

          {/* Deductions */}
          <SectionTitle text="Deductions" />
          <div style={gridStyle}>
            {DEDUCTION_FIELDS.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                value={deductions[f.key]}
                onChange={(v) => setDeductions((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </div>

          {/* Other deduction */}
          <SectionTitle text="Other Deduction" />
          <div style={gridStyle}>
            <NumberField label="Amount" value={otherAmount} onChange={setOtherAmount} />
            <div>
              <label style={labelStyle}>Reason</label>
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="e.g. Uniform cost"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>
              {error.response?.data?.message || error.message}
            </p>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={isPending} style={saveBtnStyle}>
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ text }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase",
      letterSpacing: 0.4, margin: "18px 0 8px",
    }}>{text}</p>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={inputStyle}
      />
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};

const modalStyle = {
  background: "#fff", borderRadius: 14, width: "92%", maxWidth: 560,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
};

const headerStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 24px", borderBottom: "1px solid #e5e7eb",
};

const closeBtnStyle = {
  background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280",
};

const footerStyle = {
  display: "flex", justifyContent: "flex-end", gap: 10,
  padding: "16px 24px", borderTop: "1px solid #e5e7eb",
};

const gridStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px",
};

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 14, boxSizing: "border-box",
};

const cancelBtnStyle = {
  background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8,
  padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer",
};

const saveBtnStyle = {
  background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
  padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
};