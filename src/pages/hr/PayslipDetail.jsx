// pages/hr/PayslipDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { usePayslipDetail } from "../../hooks/usePayroll";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// ── EDIT THESE TO YOUR ACTUAL COMPANY DETAILS ──────────────────────
const COMPANY = {
  name: "Radnus Communication",
  addressLine1: "Sinnaya Plaza, 242/244, Mahatma Gandhi Rd,", // TODO: put real address
  addressLine2: " Puducherry, 605001",
  logo: "/image.png", // same logo already used in RadnusNavbar.jsx
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ── Number → words (Indian numbering system) ───────────────────────
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigits(n) {
  if (n < 100) return twoDigits(n);
  return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
}
function numberToWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const rest = num;
  let parts = [];
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(threeDigits(lakh) + " Lakh");
  if (thousand) parts.push(threeDigits(thousand) + " Thousand");
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
}
const amountInWords = (v) => `${numberToWords(v)} Rupees Only`;

const WORKED_DAYS = (p) =>
  (p.present_days || 0) + (p.half_days || 0) * 0.5 + (p.paid_leave_days || 0);

export default function PayslipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading } = usePayslipDetail(id);

  if (isLoading) return <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>Loading...</div>;
  if (!p) return <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Payslip not found.</div>;

 
const lopAmount = (p.absent_days || 0) * (p.per_day_rate || 0);
const halfDayAmount = (p.half_days || 0) * (p.per_day_rate || 0) * 0.5;
// deductions.total_deductions already includes any advance recovery amount
const totalDeductions = (p.deductions?.total_deductions || 0) + lopAmount + halfDayAmount;
  const totalEarnings = p.earnings?.gross_earnings || 0;

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} className="no-print" style={{
        background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600,
        cursor: "pointer", marginBottom: 16,
      }}>← Back</button>

      <div id="payslip-print" style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden",
        padding: "32px 40px", fontFamily: "inherit",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={COMPANY.logo} alt="Radnus Logo" style={{ height: 56, marginBottom: 8, objectFit: "contain" }} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>Payslip</h1>
          <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600, color: "#374151" }}>{COMPANY.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
            {COMPANY.addressLine1}<br />{COMPANY.addressLine2}
          </p>
        </div>

        {/* Employee / period info — two columns, like a classic payslip */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px",
          margin: "24px 0", fontSize: 14,
        }}>
          <InfoRow label="Date of Joining" value={p.date_of_joining || "—"} />
          <InfoRow label="Employee name" value={p.employee_name} />
          <InfoRow label="Pay Period" value={`${MONTH_NAMES[p.month]} ${p.year}`} />
          <InfoRow label="Designation" value={p.designation} />
          <InfoRow label="Worked Days" value={WORKED_DAYS(p)} />
          <InfoRow label="Department" value={p.department} />
          {p.employee_code && <InfoRow label="Employee Code" value={p.employee_code} />}
          <InfoRow label="Absent (LOP) Days" value={p.absent_days || 0} />
        </div>

        {/* Earnings | Deductions table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8 }}>
          <thead>
            <tr>
              <th style={thStyle}>Earnings</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={thStyle}>Deductions</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
{buildRows(p, lopAmount, halfDayAmount).map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{row.eLabel}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.eAmount}</td>
                <td style={tdStyle}>{row.dLabel}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.dAmount}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...tdStyle, ...totalStyle, textAlign: "right" }}>Total Earnings</td>
              <td style={{ ...tdStyle, ...totalStyle, textAlign: "right" }}>{fmt(totalEarnings)}</td>
              <td style={{ ...tdStyle, ...totalStyle, textAlign: "right" }}>Total Deductions</td>
              <td style={{ ...tdStyle, ...totalStyle, textAlign: "right" }}>{fmt(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>

        {/* Net Pay */}
        <div style={{
          display: "flex", justifyContent: "flex-end", padding: "14px 0",
          borderTop: "2px solid #111827", marginTop: 4,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, marginRight: 24 }}>Net Pay</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{fmt(p.net_pay)}</span>
        </div>

        {/* Amount in words */}
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{fmt(p.net_pay)}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#374151" }}>{amountInWords(p.net_pay)}</p>
        </div>

        {/* Signatures */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
          marginTop: 56, fontSize: 13, textAlign: "center",
        }}>
          <div>
            <p style={{ margin: 0 }}>MD Signature</p>
            <div style={{ borderTop: "1px solid #111827", marginTop: 48 }} />
          </div>
          <div>
            <p style={{ margin: 0 }}>Employee Signature</p>
            <div style={{ borderTop: "1px solid #111827", marginTop: 48 }} />
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 40 }}>
          This is system generated payslip
        </p>
      </div>

      <button onClick={() => window.print()} className="no-print" style={{
        marginTop: 16, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
      }}>🖨️ Print Payslip</button>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #payslip-print { border: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Build side-by-side earnings/deductions rows (pads shorter column with blanks) ──
function buildRows(p, lopAmount, halfDayAmount) {
  const earningsList = [
    { label: "Basic", amount: p.earnings?.basic },
    { label: "HRA", amount: p.earnings?.hra },
    { label: "Special Allowance", amount: p.earnings?.special_allowance },
    { label: "Conveyance Allowance", amount: p.earnings?.conveyance_allowance },
  ];
  if (p.earnings?.overtime_amount > 0) earningsList.push({ label: "Overtime", amount: p.earnings.overtime_amount });

  const deductionsList = [];
  
  if (p.absent_days > 0) deductionsList.push({ label: `LOP (${p.absent_days} day${p.absent_days > 1 ? "s" : ""})`, amount: lopAmount });
  if (p.half_days > 0) deductionsList.push({ label: `Half Day (${p.half_days} day${p.half_days > 1 ? "s" : ""})`, amount: halfDayAmount });
  (p.advance_recoveries || []).forEach((a) => {
    deductionsList.push({ label: `Advance Recovery (${a.reason})`, amount: a.amount });
  });
  if (p.deductions?.pf > 0) deductionsList.push({ label: "Provident Fund", amount: p.deductions.pf });
  if (p.deductions?.esi > 0) deductionsList.push({ label: "ESI", amount: p.deductions.esi });
  if (p.deductions?.tds > 0) deductionsList.push({ label: "TDS", amount: p.deductions.tds });
if (p.deductions?.professional_tax > 0) deductionsList.push({ label: "Professional Tax", amount: p.deductions.professional_tax });
  if (p.other_deduction?.amount > 0) {
    deductionsList.push({
      label: `Other Deduction${p.other_deduction.reason ? ` (${p.other_deduction.reason})` : ""}`,
      amount: p.other_deduction.amount,
    });
  }
  if (deductionsList.length === 0) deductionsList.push({ label: "No deductions applied", amount: 0 });

  const rowCount = Math.max(earningsList.length, deductionsList.length);
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push({
      eLabel: earningsList[i]?.label || "",
      eAmount: earningsList[i] ? fmt(earningsList[i].amount) : "",
      dLabel: deductionsList[i]?.label || "",
      dAmount: deductionsList[i] ? fmt(deductionsList[i].amount) : "",
    });
  }
  return rows;
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #e5e7eb", padding: "3px 0" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value ?? "—"}</span>
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "8px 6px", background: "#f3f4f6", borderBottom: "2px solid #111827", fontSize: 13 };
const tdStyle = { padding: "6px 6px", borderBottom: "1px solid #f3f4f6" };
const totalStyle = { fontWeight: 700, borderTop: "2px solid #111827", borderBottom: "none" };