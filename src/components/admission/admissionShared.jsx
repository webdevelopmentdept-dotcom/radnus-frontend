import React, { useState } from "react";
import { Download, Mail, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export const API = import.meta.env.VITE_API_BASE_URL;

export const empHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
});
export const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
});

export const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return "—";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};
export const maskAadhaar = (a) => {
  const d = String(a || "").replace(/\D/g, "");
  return d.length >= 4 ? `XXXX XXXX ${d.slice(-4)}` : d || "—";
};

export const PAYMENT_TYPES = ["Booking Amount", "1st Installment", "2nd Installment", "3rd Installment", "App Payment", "Other"];
export const PAY_MODES = ["Cash", "UPI", "Bank", "Card", "Other"];

// Download any authenticated file (PDF / Excel) as a blob
export async function downloadFile(url, filename, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let msg = `Download failed (${res.status})`;
    try { msg = (await res.json()).message || msg; } catch { /* not json */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const ADM_CSS = `
.adm-root {
  --bg:#F6F7FB; --surface:#fff; --border:#E4E7EE; --text:#101828; --muted:#64748B;
  --primary:#2A3EB1; --primary-dark:#212F8B; --primary-soft:#EEF1FD;
  --accent:#0F9D80; --accent-soft:#E7F7F2; --danger:#D8434B; --danger-soft:#FDEEEE;
  --warn:#B7791F; --warn-soft:#FEF6E4;
  font-family:"Inter","Segoe UI",system-ui,-apple-system,sans-serif; color:var(--text);
  min-width:0; max-width:100%;
}
.adm-root, .adm-root *, .adm-root *::before, .adm-root *::after { box-sizing:border-box; }
.adm-page { background:var(--bg); min-height:100vh; }
/* width:0 + min-width:100% = contributes NOTHING to the parent's intrinsic width, so a wide
   scrolling row (tabs / tables) can never stretch the whole page on a phone */
.adm-tabs { display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border); overflow-x:auto; scrollbar-width:none; width:0; min-width:100%; }
.adm-tabs::-webkit-scrollbar { display:none; }
.adm-tab { flex-shrink:0; padding:11px 16px; border:none; background:none; font-size:14px; font-weight:600; color:var(--muted);
  border-bottom:2px solid transparent; cursor:pointer; white-space:nowrap; }
.adm-tab.active { color:var(--primary); border-bottom-color:var(--primary); }
.adm-table-wrap { overflow-x:auto; width:0; min-width:100%; -webkit-overflow-scrolling:touch; }
.adm-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px; margin-bottom:18px;
  box-shadow:0 1px 2px rgba(16,24,40,.06); min-width:0; }
.adm-card h6 { font-weight:700; margin:0 0 14px; font-size:15px; }
.adm-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.adm-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
.adm-grid.addrow { grid-template-columns:2fr 1fr 1fr 1fr auto; align-items:end; }
.adm-grid > *, .adm-stats > *, .adm-kv > * { min-width:0; }
.adm-field label { display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:5px; }
.adm-field label .req { color:var(--danger); }
.adm-field input, .adm-field select, .adm-field textarea { width:100%; min-width:0; padding:9px 12px; border:1px solid var(--border);
  border-radius:8px; font-size:14px; background:#fff; color:var(--text); }
.adm-field input:focus, .adm-field select:focus, .adm-field textarea:focus { outline:none; border-color:var(--primary);
  box-shadow:0 0 0 3px var(--primary-soft); }
.adm-field input[readonly], .adm-field input:disabled, .adm-field select:disabled { background:#F1F3F8; color:var(--muted); }
.adm-field .hint { font-size:11.5px; color:var(--muted); margin-top:4px; }
.adm-span2 { grid-column:span 2; } .adm-span3 { grid-column:1/-1; }
.adm-radio-row { display:flex; gap:10px 18px; flex-wrap:wrap; padding-top:6px; }
.adm-radio-row label { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:500; color:var(--text); margin:0; cursor:pointer; }
.adm-radio-row input { width:auto; }
.adm-btn { padding:10px 20px; border-radius:8px; border:1px solid var(--border); background:#fff; font-weight:600; font-size:14px; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px; text-decoration:none; color:var(--text); }
.adm-btn:disabled { opacity:.55; cursor:not-allowed; }
.adm-btn.primary { background:var(--primary); border-color:var(--primary); color:#fff; }
.adm-btn.primary:hover:not(:disabled) { background:var(--primary-dark); }
.adm-btn.success { background:var(--accent); border-color:var(--accent); color:#fff; }
.adm-btn.danger { color:var(--danger); border-color:#F3C6C9; background:var(--danger-soft); }
.adm-btn.sm { padding:6px 12px; font-size:12.5px; }
.adm-alert { padding:12px 16px; border-radius:10px; font-size:14px; margin-bottom:16px; overflow-wrap:anywhere; }
.adm-alert.error { background:var(--danger-soft); color:var(--danger); border:1px solid #F3C6C9; }
.adm-alert.ok { background:var(--accent-soft); color:var(--accent); border:1px solid #BFE8DC; }
.adm-alert.warn { background:var(--warn-soft); color:var(--warn); border:1px solid #F3E2B3; }
.adm-badge { display:inline-block; font-size:11.5px; font-weight:700; padding:3px 10px; border-radius:20px; white-space:nowrap; }
.adm-badge.draft { background:#EEF0F4; color:#475467; }
.adm-badge.done { background:var(--primary-soft); color:var(--primary); }
.adm-badge.full { background:var(--accent-soft); color:var(--accent); }
.adm-badge.pending { background:var(--danger-soft); color:var(--danger); }
.adm-badge.partial { background:var(--warn-soft); color:var(--warn); }
.adm-badge.paid { background:var(--accent-soft); color:var(--accent); }
.adm-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:20px; }
.adm-stats.three { grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
.adm-stat { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:14px 16px; min-width:0; }
.adm-stat .v { font-size:22px; font-weight:800; overflow-wrap:anywhere; } .adm-stat .v.sm { font-size:18px; }
.adm-stat .l { font-size:12px; color:var(--muted); margin-top:2px; }
.adm-filters { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
.adm-filters input, .adm-filters select { padding:9px 14px; border:1px solid var(--border); border-radius:8px; font-size:14px; background:#fff; min-width:170px; flex:1 1 170px; max-width:100%; }
.adm-chips { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.adm-chip { padding:5px 14px; border-radius:20px; border:1px solid var(--border); background:#fff; font-size:12.5px; font-weight:600; cursor:pointer; color:var(--muted); }
.adm-chip.active { background:var(--primary); border-color:var(--primary); color:#fff; }
.adm-student { background:var(--surface); border:1px solid var(--border); border-radius:14px; margin-bottom:12px; overflow:hidden; min-width:0; }
.adm-student-head { display:grid; grid-template-columns:minmax(0,2fr) minmax(0,1.6fr) minmax(0,1.3fr) minmax(0,1fr) 28px; gap:12px; align-items:center; padding:14px 18px; cursor:pointer; }
.adm-student-head:hover { background:var(--bg); }
.adm-student-head .hb { display:flex; flex-direction:column; gap:4px; align-items:flex-start; }
.adm-name { font-weight:700; font-size:14.5px; overflow-wrap:anywhere; } .adm-sub { font-size:12px; color:var(--muted); margin-top:2px; overflow-wrap:anywhere; }
.adm-body { border-top:1px solid var(--border); padding:18px; background:#FCFCFE; min-width:0; }
.adm-kv { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px 18px; margin-bottom:16px; }
.adm-kv .k { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
.adm-kv .val { font-size:13.5px; margin-top:2px; overflow-wrap:anywhere; }
.adm-table { width:100%; border-collapse:collapse; font-size:13.5px; margin-bottom:14px; }
.adm-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); padding:8px 10px; background:var(--bg); border-bottom:1px solid var(--border); white-space:nowrap; }
.adm-table td { padding:9px 10px; border-bottom:1px solid var(--border); }
.adm-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.adm-modal-bg { position:fixed; inset:0; background:rgba(16,24,40,.45); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; }
.adm-modal { background:#fff; border-radius:16px; padding:22px; width:100%; max-width:420px; max-height:92vh; overflow-y:auto; box-shadow:0 12px 40px rgba(16,24,40,.25); }
.adm-modal h6 { font-weight:700; margin-bottom:14px; }
.adm-empty { text-align:center; padding:40px 16px; color:var(--muted); font-size:14px; }
.adm-thumb { width:70px; height:80px; object-fit:cover; border-radius:8px; border:1px solid var(--border); margin-top:8px; }

@media (max-width:900px) {
  .adm-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .adm-grid.addrow { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .adm-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .adm-kv { grid-template-columns:repeat(2,minmax(0,1fr)); }
  /* student row becomes a compact card: name / course / amounts + status */
  .adm-student-head { grid-template-columns:minmax(0,1fr) 24px; grid-template-areas:"n x" "c c" "m m" "b b"; gap:8px 10px; padding:14px; }
  .adm-student-head .hn { grid-area:n; } .adm-student-head .hc { grid-area:c; } .adm-student-head .hm { grid-area:m; }
  .adm-student-head .hb { grid-area:b; flex-direction:row; flex-wrap:wrap; align-items:center; gap:6px; } .adm-student-head .hx { grid-area:x; align-self:start; }
}
@media (max-width:560px) {
  .adm-page.container-fluid { padding-left:14px !important; padding-right:14px !important; padding-top:16px !important; }
  .adm-grid, .adm-grid.two, .adm-grid.addrow, .adm-kv { grid-template-columns:minmax(0,1fr); } .adm-span2 { grid-column:auto; }
  .adm-card { padding:16px; border-radius:14px; } .adm-body { padding:14px; }
  .adm-stats { gap:10px; } .adm-stat { padding:12px; } .adm-stat .v { font-size:18px; } .adm-stat .v.sm { font-size:14px; }
  .adm-stats.three .adm-stat { padding:10px; } .adm-stats.three .l { font-size:11px; }
  .adm-filters input, .adm-filters select { flex:1 1 100%; min-width:0; }
  .adm-btn { width:100%; justify-content:center; } .adm-actions .adm-btn.sm { width:auto; }
  /* tabs: show ALL four at once (2 x 2) instead of a hidden sideways-scrolling row */
  .adm-tabs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; overflow:visible; border-bottom:none; width:auto; min-width:0; margin-bottom:16px; }
  .adm-tab { white-space:normal; text-align:center; line-height:1.25; padding:10px 8px; font-size:13px; background:#fff;
    border:1px solid var(--border); border-radius:10px; }
  .adm-tab.active { background:var(--primary); border-color:var(--primary); color:#fff; }
  .adm-table th, .adm-table td { padding:8px 8px; font-size:12.5px; }
  /* payments table → stacked cards (no sideways scrolling) */
  .adm-table.stack thead { display:none; }
  .adm-table.stack, .adm-table.stack tbody { display:block; }
  .adm-table.stack tr { display:block; background:#fff; border:1px solid var(--border); border-radius:10px; padding:8px 12px; margin-bottom:8px; }
  .adm-table.stack td { display:flex; justify-content:space-between; align-items:center; gap:12px; border:none; padding:4px 0; text-align:right; }
  .adm-table.stack td::before { content:attr(data-label); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); text-align:left; }
  .adm-table.stack td:not([data-label]) { display:block; text-align:left; }
}
`;

export function StatusBadge({ status }) {
  if (status === "DRAFT") return <span className="adm-badge draft">Draft</span>;
  if (status === "FULLY_COMPLETED") return <span className="adm-badge full">Fully Completed</span>;
  return <span className="adm-badge done">Application Completed</span>;
}

export function PayBadge({ status }) {
  const map = { PENDING: ["pending", "Payment Pending"], PARTIAL: ["partial", "Partial"], PAID: ["paid", "Paid"] };
  const [cls, label] = map[status] || map.PENDING;
  return <span className={`adm-badge ${cls}`}>{label}</span>;
}

// ── Add payment popup ──────────────────────────────────────
function PayModal({ student, headers, onClose, onDone }) {
  const used = (student.payments || []).map((p) => p.type);
  const suggested = PAYMENT_TYPES.slice(0, 4).find((t) => !used.includes(t)) || "Other";

  const [amount, setAmount] = useState("");
  const [type, setType] = useState(suggested);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("Cash");
  const [refNo, setRefNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1) return setErr("Enter a valid amount");
    if (n > student.balance) return setErr(`Amount is more than the balance (${fmtMoney(student.balance)})`);
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API}/api/admission/${student._id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ amount: n, type, paidDate, mode, refNo }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save payment");
      onDone(data.data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-modal-bg" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h6>Add payment</h6>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
          {student.fullName} · Balance <b>{fmtMoney(student.balance)}</b> of {fmtMoney(student.totalFees)}
        </p>
        {err && <div className="adm-alert error">{err}</div>}
        <div className="adm-field" style={{ marginBottom: 12 }}>
          <label>Amount (₹) <span className="req">*</span></label>
          <input inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="Amount received" />
          <div style={{ marginTop: 6 }}>
            <button type="button" className="adm-chip" onClick={() => setAmount(String(student.balance))}>Full balance {fmtMoney(student.balance)}</button>
          </div>
        </div>
        <div className="adm-field" style={{ marginBottom: 12 }}>
          <label>Payment for</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="adm-grid two" style={{ marginBottom: 12 }}>
          <div className="adm-field">
            <label>Paid date</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <div className="adm-field">
            <label>Mode <span className="req">*</span></label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {PAY_MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="adm-field" style={{ marginBottom: 18 }}>
          <label>Reference / Receipt No</label>
          <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="UPI ref, receipt no…" />
        </div>
        <div className="adm-actions" style={{ justifyContent: "flex-end" }}>
          <button className="adm-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn success" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

// ── One student row + expandable details ──────────────────
// View-only by default (admin + report). Telecaller passes the edit flags:
// canPay → Add Payment   canUndo → Remove payment   canEditRefs → Batch/Bill No   canEmail → Send / Resend email
// canEdit + onEdit(student) → Edit Application (completed students)
// onChanged(updatedStudent) / onDelete(student) / extraActions(student)
export function StudentCard({ s, headers, canPay, canUndo, canEditRefs, canEmail, canEdit, onEdit, onChanged, onDelete, extraActions }) {
  const [open, setOpen] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [batchNo, setBatchNo] = useState(s.batchNo || "");
  const [billNo, setBillNo] = useState(s.billNo || "");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const draft = s.status === "DRAFT";
  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const pdf = async () => {
    setBusy("pdf");
    try {
      await downloadFile(`${API}/api/admission/${s._id}/pdf`, `${s.applicationNo || "draft-application"}.pdf`, headers());
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  const email = async () => {
    setBusy("mail");
    try {
      const res = await fetch(`${API}/api/admission/${s._id}/send-email`, { method: "POST", headers: headers() });
      const data = await res.json();
      if (data.data) onChanged && onChanged(data.data);
      if (!data.success) throw new Error(data.message || "Email failed");
      flash("ok", `PDF emailed to ${s.email}`);
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  const saveRefs = async () => {
    setBusy("refs");
    try {
      const res = await fetch(`${API}/api/admission/${s._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ batchNo, billNo }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save");
      onChanged && onChanged(data.data);
      flash("ok", "Batch No / Bill No saved");
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  const undo = async (p) => {
    if (!window.confirm(`Remove the ${fmtMoney(p.amount)} payment (${p.type})?`)) return;
    try {
      const res = await fetch(`${API}/api/admission/${s._id}/payments/${p._id}`, { method: "DELETE", headers: headers() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed");
      onChanged && onChanged(data.data);
    } catch (e) { flash("error", e.message); }
  };

  const kv = (k, v) => (
    <div><div className="k">{k}</div><div className="val">{v || "—"}</div></div>
  );

  return (
    <div className="adm-student">
      <div className="adm-student-head" onClick={() => setOpen((o) => !o)}>
        <div className="hn">
          <div className="adm-name">{s.fullName}</div>
          <div className="adm-sub">{s.applicationNo || "Draft (no application no yet)"} · {s.mobileNo}</div>
        </div>
        <div className="hc">
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.scheme?.name || s.course?.name || "—"}</div>
          <div className="adm-sub">{s.scheme?.name ? "Government Scheme" : s.accommodation === "WITH" ? "With accommodation" : "Without accommodation"}</div>
        </div>
        <div className="hm">
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{fmtMoney(s.totalFees)}</div>
          {!draft && <div className="adm-sub">Paid {fmtMoney(s.paidAmount)} · Bal {fmtMoney(s.balance)}</div>}
        </div>
        <div className="hb">
          <StatusBadge status={s.status} />
          {!draft && <PayBadge status={s.paymentStatus} />}
        </div>
        <div className="hx">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </div>

      {open && (
        <div className="adm-body">
          {msg.text && <div className={`adm-alert ${msg.type === "ok" ? "ok" : "error"}`}>{msg.text}</div>}

          <div className="adm-kv">
            {kv("Register No", s.registerNo)}
            {kv("Application date", fmtDate(s.applicationDate))}
            {kv("BDA", s.staffName)}
            {kv("Date of joining", fmtDate(s.dateOfJoining))}
            {kv("Date of birth", fmtDate(s.dateOfBirth))}
            {kv("Gender / Blood", `${s.gender || "—"} / ${s.bloodGroup || "—"}`)}
            {kv("Shop name", s.shopName)}
            {kv("Aadhaar", maskAadhaar(s.aadhaarNo))}
            {kv("Email", s.email)}
            {kv("Mode", s.modeOfCourse === "Hybrid" ? `Hybrid — ${s.hybridNote || ""}` : s.modeOfCourse)}
            {kv("Timing", s.timing)}
            {kv("Emergency mobile", s.emergencyMobile)}
            {kv("Differently abled", s.differentlyAbled)}
            {kv("Academic", s.academic?.level === "Others" ? `Others — ${s.academic?.others || ""}` : s.academic?.level)}
            {kv("Address", [s.postalAddress, s.district, s.state, s.pincode].filter(Boolean).join(", "))}
          </div>

          <div className="adm-actions" style={{ marginBottom: 16 }}>
            {s.documents?.photo?.url && <a className="adm-btn sm" href={s.documents.photo.url} target="_blank" rel="noreferrer">View Photo</a>}
            {s.documents?.aadhaar?.url && <a className="adm-btn sm" href={s.documents.aadhaar.url} target="_blank" rel="noreferrer">View Aadhaar</a>}
          </div>

          {/* Fee summary + payments */}
          {!draft && (
            <>
              <div className="adm-stats three">
                <div className="adm-stat"><div className="v sm">{fmtMoney(s.totalFees)}</div><div className="l">Total fees</div></div>
                <div className="adm-stat"><div className="v sm" style={{ color: "var(--accent)" }}>{fmtMoney(s.paidAmount)}</div><div className="l">Paid</div></div>
                <div className="adm-stat"><div className="v sm" style={{ color: s.balance > 0 ? "var(--danger)" : "var(--accent)" }}>{fmtMoney(s.balance)}</div><div className="l">Balance</div></div>
              </div>

              <div className="adm-table-wrap">
              <table className="adm-table stack">
                <thead>
                  <tr><th>Date</th><th>Payment for</th><th>Amount</th><th>Mode</th><th>Reference</th><th>Received by</th><th /></tr>
                </thead>
                <tbody>
                  {(s.payments || []).map((p) => (
                    <tr key={p._id}>
                      <td data-label="Date">{fmtDate(p.paidDate)}</td>
                      <td data-label="Payment for" style={{ fontWeight: 600 }}>{p.type}</td>
                      <td data-label="Amount">{fmtMoney(p.amount)}</td>
                      <td data-label="Mode">{p.mode}</td>
                      <td data-label="Reference" style={{ color: "var(--muted)" }}>{p.refNo || "—"}</td>
                      <td data-label="Received by" style={{ color: "var(--muted)" }}>{p.receivedByName || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        {canUndo && <button className="adm-btn danger sm" onClick={() => undo(p)}>Remove</button>}
                      </td>
                    </tr>
                  ))}
                  {(s.payments || []).length === 0 && (
                    <tr><td colSpan={7} style={{ color: "var(--muted)" }}>No payments recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
              </div>

              {canPay && s.balance > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <button className="adm-btn success sm" onClick={() => setShowPay(true)}>+ Add Payment</button>
                </div>
              )}
            </>
          )}

          {canEditRefs && (
            <div className="adm-grid two" style={{ marginBottom: 16, maxWidth: 520 }}>
              <div className="adm-field"><label>Batch No</label><input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} /></div>
              <div className="adm-field"><label>Bill No</label><input value={billNo} onChange={(e) => setBillNo(e.target.value)} /></div>
              <div><button className="adm-btn sm primary" onClick={saveRefs} disabled={busy === "refs"}>{busy === "refs" ? "Saving…" : "Save Batch / Bill No"}</button></div>
            </div>
          )}

          <div className="adm-actions">
            <button className="adm-btn sm" onClick={pdf} disabled={busy === "pdf"}><Download size={14} /> {busy === "pdf" ? "Preparing…" : "Download PDF"}</button>
            {!draft && s.email && canEmail && (
              <button className="adm-btn sm" onClick={email} disabled={busy === "mail"}>
                <Mail size={14} /> {busy === "mail" ? "Sending…" : s.emailStatus === "SENT" ? "Resend Email" : "Send Email"}
              </button>
            )}
            {!draft && <span style={{ fontSize: 12, color: s.emailStatus === "FAILED" ? "var(--danger)" : "var(--muted)" }}>
              {s.emailStatus === "SENT" ? `Emailed ${fmtDate(s.emailSentAt)}` : s.emailStatus === "FAILED" ? "Last email failed" : s.email ? "Email not sent yet" : "No email on file"}
            </span>}
            {!draft && canEdit && onEdit && <button className="adm-btn sm primary" onClick={() => onEdit(s)}>Edit Application</button>}
            {extraActions && extraActions(s)}
            {onDelete && <button className="adm-btn sm danger" onClick={() => onDelete(s)}><Trash2 size={14} /> {draft ? "Delete Draft" : "Delete Application"}</button>}
          </div>
        </div>
      )}

      {showPay && (
        <PayModal
          student={s}
          headers={headers}
          onClose={() => setShowPay(false)}
          onDone={(updated) => { setShowPay(false); onChanged && onChanged(updated); }}
        />
      )}
    </div>
  );
}