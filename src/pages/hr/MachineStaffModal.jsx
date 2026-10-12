import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Document lists ───────────────────────────────────────────
const FILE_DOCS_REQUIRED = ["Aadhaar", "PAN", "Passport Photo", "Bank Passbook"];
const FILE_DOCS_OPTIONAL = [
  "Resume",
  "10th Marksheet",
  "12th Marksheet",
  "UG Consolidated",
  "PG Consolidated",
  "Cancelled Cheque",
];

// ── Validation rules ─────────────────────────────────────────
const MAX_FILE_MB = 5;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ESSL_RE = /^\d{1,9}$/;
const digitsOnly = (v) => v.replace(/\D/g, "");

const getAge = (dobStr) => {
  const d = new Date(dobStr);
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
};

// ── Shared styles (same look as the other HR pages) ──────────
const inp = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 13,
  boxSizing: "border-box",
  background: "#fff",
};
const inpErr = { ...inp, border: "1px solid #dc2626", background: "#fef2f2" };
const lbl = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  marginBottom: 4,
  display: "block",
};
const sec = {
  fontSize: 13,
  fontWeight: 800,
  color: "#1a1a2e",
  margin: "18px 0 10px",
  borderBottom: "1px solid #f3f4f6",
  paddingBottom: 6,
};

const Field = ({ label, required, error, children }) => (
  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
    <label style={lbl}>
      {label}
      {required && <span style={{ color: "#dc2626" }}> *</span>}
    </label>
    {children}
    {error && (
      <span
        data-field-error="1"
        style={{ fontSize: 11, color: "#dc2626", display: "block", marginTop: 3 }}
      >
        {error}
      </span>
    )}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
    {children}
  </div>
);

export default function MachineStaffModal({ onClose, onSaved }) {
  const [unlinked, setUnlinked] = useState([]); // machine users not yet linked to an HRMS employee
  const [deptList, setDeptList] = useState([]); // Departments master
  const [suggest, setSuggest] = useState({ employeeId: "", email: "" });

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    dob: "",
    address: "",
    department: "",
    designation: "",
    essl_id: "",
    shift_start: "10:00",
    shift_end: "19:00",
    date_of_joining: "",
    gross_salary: "",
    basic: "",
    professional_tax: "",
    pf_applicable: false,
    esi_applicable: false,
  });

  const [files, setFiles] = useState({});
  const [refs, setRefs] = useState({
    "Reference Number 1": "",
    "Reference Number 2": "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Initial data load ──────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/hr/machine-staff/unlinked`)
      .then((r) => r.json())
      .then((d) => setUnlinked(d.data || []))
      .catch(() => {});

    fetch(`${API_BASE}/api/hr/machine-staff/next-id`)
      .then((r) => r.json())
      .then((d) => setSuggest({ employeeId: d.employeeId, email: d.email }))
      .catch(() => {});

    fetch(`${API_BASE}/api/departments/active`)
      .then((r) => r.json())
      .then((d) => setDeptList(d?.data || []))
      .catch(() => {});
  }, []);

  const clearError = (key) => setErrors((e) => ({ ...e, [key]: undefined }));
  const setFieldError = (key, msg) => setErrors((e) => ({ ...e, [key]: msg }));

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    clearError(k);
  };

  // ── Derived values ─────────────────────────────────────────
  const picked = unlinked.find((u) => u.essl_id === form.essl_id.trim());
  const selectedDept = deptList.find((d) => d.name === form.department);
  const roles = (selectedDept?.designations || []).filter(
    (x) => x.status !== "inactive"
  );

  const onPickEssl = (val) => {
    set("essl_id", digitsOnly(val));
    const u = unlinked.find((x) => x.essl_id === digitsOnly(val).trim());
    if (u?.name && !form.name.trim()) set("name", u.name);
  };

  // ── File selection (type + size checked immediately) ───────
  const onFileChange = (type, e) => {
    const file = e.target.files?.[0] || null;
    const key = `file:${type}`;

    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFieldError(key, "Only JPG, PNG or PDF files are allowed.");
        e.target.value = "";
        setFiles((f) => ({ ...f, [type]: null }));
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setFieldError(key, `File must be smaller than ${MAX_FILE_MB} MB.`);
        e.target.value = "";
        setFiles((f) => ({ ...f, [type]: null }));
        return;
      }
    }
    clearError(key);
    clearError("proof");
    setFiles((f) => ({ ...f, [type]: file }));
  };

  // ── Validation (returns an errors object) ──────────────────
  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const gross = Number(form.gross_salary);
    const basic = form.basic === "" ? null : Number(form.basic);
    const pt = form.professional_tax === "" ? null : Number(form.professional_tax);

    // Basic details
    if (!name) e.name = "Full name is required.";
    else if (!NAME_RE.test(name)) e.name = "Use letters only (2 to 60 characters).";

    if (!MOBILE_RE.test(form.mobile))
      e.mobile = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";

    if (email && !EMAIL_RE.test(email)) e.email = "Enter a valid email address.";

    if (form.dob) {
      if (new Date(form.dob) > new Date()) e.dob = "Date of birth cannot be in the future.";
      else if (getAge(form.dob) < 18) e.dob = "Staff must be at least 18 years old.";
      else if (getAge(form.dob) > 70) e.dob = "Please check the date of birth.";
    }

    if (form.address.length > 200) e.address = "Address must be 200 characters or fewer.";

    // Role & machine link
    if (!form.department) e.department = "Please select a department.";
    if (!form.designation) e.designation = "Please select a designation (role).";

    if (!form.essl_id.trim()) e.essl_id = "eSSL machine ID is required.";
    else if (!ESSL_RE.test(form.essl_id.trim()))
      e.essl_id = "Machine ID must be a number (up to 9 digits).";

    if (!form.shift_start) e.shift_start = "Shift start is required.";
    if (!form.shift_end) e.shift_end = "Shift end is required.";
    else if (form.shift_start && form.shift_end <= form.shift_start)
      e.shift_end = "Shift end must be after shift start.";

    // Salary
    if (!(gross > 0)) e.gross_salary = "Enter a gross salary greater than 0.";
    if (basic !== null && (basic < 0 || (gross > 0 && basic > gross)))
      e.basic = "Basic must be between 0 and the gross salary.";
    if (pt !== null && (pt < 0 || (gross > 0 && pt > gross)))
      e.professional_tax = "Professional tax must be between 0 and the gross salary.";

    // Mandatory documents
    for (const t of FILE_DOCS_REQUIRED) {
      if (!files[t]) e[`file:${t}`] = `${t} is required.`;
    }
    if (!(files["Gas Book"] || (files["Ration Card Front"] && files["Ration Card Back"]))) {
      e.proof = "Upload a Gas Book, or both sides of a Ration Card.";
    }

    // Reference numbers (10-digit mobile numbers, different from each other and from the staff's own)
    const r1 = refs["Reference Number 1"].trim();
    const r2 = refs["Reference Number 2"].trim();
    for (const k of Object.keys(refs)) {
      const v = refs[k].trim();
      if (!v) e[`ref:${k}`] = `${k} is required.`;
      else if (!MOBILE_RE.test(v))
        e[`ref:${k}`] = "Enter a valid 10-digit mobile number.";
      else if (v === form.mobile)
        e[`ref:${k}`] = "Reference number cannot be the staff's own mobile number.";
    }
    if (r1 && r2 && r1 === r2 && !e["ref:Reference Number 2"])
      e["ref:Reference Number 2"] = "Both reference numbers must be different.";

    return e;
  };

  // ── Save ───────────────────────────────────────────────────
  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setError("Please fix the highlighted fields.");
      setTimeout(() => {
        document
          .querySelector('[data-field-error="1"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
    setError("");
    setSaving(true);

    try {
      // 1) Create Employee + EmploymentDetails (activated directly)
      const res = await fetch(`${API_BASE}/api/hr/machine-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          mobile: form.mobile,
          email: form.email.trim(),
          dob: form.dob,
          address: form.address.trim(),
          department: form.department,
          designation: form.designation,
          essl_id: form.essl_id.trim(),
          shift_start: form.shift_start,
          shift_end: form.shift_end,
          date_of_joining: form.date_of_joining,
          salary: {
            gross_salary: form.gross_salary,
            basic: form.basic,
            professional_tax: form.professional_tax,
            pf_applicable: form.pf_applicable,
            esi_applicable: form.esi_applicable,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save staff.");

      const id = data.data._id;
      const failed = [];

      // 2) Upload file documents
      for (const [docType, file] of Object.entries(files)) {
        if (!file) continue;
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("docType", docType);
          const r = await fetch(`${API_BASE}/api/hr/machine-staff/${id}/docs`, {
            method: "POST",
            body: fd,
          });
          const j = await r.json();
          if (!j.success) failed.push(docType);
        } catch {
          failed.push(docType);
        }
      }

      // 3) Save text documents (Reference Number 1 / 2)
      for (const [docType, value] of Object.entries(refs)) {
        try {
          const r = await fetch(`${API_BASE}/api/hr/machine-staff/${id}/docs/text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ docType, value: value.trim() }),
          });
          const j = await r.json();
          if (!j.success) failed.push(docType);
        } catch {
          failed.push(docType);
        }
      }

      onSaved(data, failed);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── File input (render function, NOT a component, so the
  //    input is not remounted and keeps its selected file) ────
  const renderFile = (type, required) => (
    <Field key={type} label={type} required={required} error={errors[`file:${type}`]}>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={(e) => onFileChange(type, e)}
        style={{
          ...(errors[`file:${type}`] ? inpErr : inp),
          padding: 6,
          fontSize: 12,
        }}
      />
    </Field>
  );

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 760,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 22,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Staff (Non-HRMS)</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              Activated directly · ID: {suggest.employeeId || "…"} · No login access
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {/* 1. Basic details */}
        <div style={sec}>1. Basic details</div>
        <Row>
          <Field label="Full Name" required error={errors.name}>
            <input
              style={errors.name ? inpErr : inp}
              maxLength={60}
              value={form.name}
              onChange={(e) => set("name", e.target.value.replace(/[^A-Za-z .'-]/g, ""))}
            />
          </Field>
          <Field label="Mobile (unique)" required error={errors.mobile}>
            <input
              style={errors.mobile ? inpErr : inp}
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => set("mobile", digitsOnly(e.target.value))}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Email (optional)" error={errors.email}>
            <input
              style={errors.email ? inpErr : inp}
              value={form.email}
              placeholder={suggest.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <span style={{ fontSize: 10, color: "#9ca3af" }}>
              If left blank, this will be used: {suggest.email}
            </span>
          </Field>
          <Field label="Date of Birth" error={errors.dob}>
            <input
              type="date"
              style={errors.dob ? inpErr : inp}
              max={new Date().toISOString().slice(0, 10)}
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Address" error={errors.address}>
            <input
              style={errors.address ? inpErr : inp}
              maxLength={200}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </Row>

        {/* 2. Role & machine link */}
        <div style={sec}>2. Role & machine link</div>
        <Row>
          <Field label="Department" required error={errors.department}>
            <select
              style={errors.department ? inpErr : inp}
              value={form.department}
              onChange={(e) => {
                setForm((f) => ({ ...f, department: e.target.value, designation: "" }));
                clearError("department");
                clearError("designation");
              }}
            >
              <option value="">-- Select Department --</option>
              {deptList.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Designation (Role)" required error={errors.designation}>
            <select
              style={errors.designation ? inpErr : inp}
              value={form.designation}
              disabled={!form.department}
              onChange={(e) => set("designation", e.target.value)}
            >
              <option value="">
                {form.department
                  ? roles.length
                    ? "-- Select Role --"
                    : "No roles in this department"
                  : "Select a department first"}
              </option>
              {roles.map((r) => (
                <option key={r._id} value={r.title}>
                  {r.title}
                </option>
              ))}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="eSSL Machine ID" required error={errors.essl_id}>
            <input
              style={errors.essl_id ? inpErr : inp}
              list="ms-essl"
              inputMode="numeric"
              maxLength={9}
              value={form.essl_id}
              onChange={(e) => onPickEssl(e.target.value)}
            />
            <datalist id="ms-essl">
              {unlinked.map((u) => (
                <option key={u.essl_id} value={u.essl_id}>
                  {`${u.name || "No name"} · ${u.punch_days} days`}
                </option>
              ))}
            </datalist>
            {picked && (
              <span style={{ fontSize: 10, color: "#16a34a" }}>
                {picked.punch_days} day(s) of past punches will be added to attendance automatically.
              </span>
            )}
          </Field>
          <Field label="Date of Joining" error={errors.date_of_joining}>
            <input
              type="date"
              style={errors.date_of_joining ? inpErr : inp}
              value={form.date_of_joining}
              onChange={(e) => set("date_of_joining", e.target.value)}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Shift Start" required error={errors.shift_start}>
            <input
              type="time"
              style={errors.shift_start ? inpErr : inp}
              value={form.shift_start}
              onChange={(e) => set("shift_start", e.target.value)}
            />
          </Field>
          <Field label="Shift End" required error={errors.shift_end}>
            <input
              type="time"
              style={errors.shift_end ? inpErr : inp}
              value={form.shift_end}
              onChange={(e) => set("shift_end", e.target.value)}
            />
          </Field>
        </Row>

        {/* 3. Salary */}
        <div style={sec}>3. Salary</div>
        <Row>
          <Field label="Gross Salary (monthly)" required error={errors.gross_salary}>
            <input
              type="number"
              min="0"
              style={errors.gross_salary ? inpErr : inp}
              value={form.gross_salary}
              onChange={(e) => set("gross_salary", e.target.value)}
            />
          </Field>
          <Field label="Basic (optional)" error={errors.basic}>
            <input
              type="number"
              min="0"
              style={errors.basic ? inpErr : inp}
              value={form.basic}
              onChange={(e) => set("basic", e.target.value)}
            />
          </Field>
          <Field label="Professional Tax" error={errors.professional_tax}>
            <input
              type="number"
              min="0"
              style={errors.professional_tax ? inpErr : inp}
              value={form.professional_tax}
              onChange={(e) => set("professional_tax", e.target.value)}
            />
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 18, fontSize: 13, marginBottom: 6 }}>
          <label>
            <input
              type="checkbox"
              checked={form.pf_applicable}
              onChange={(e) => set("pf_applicable", e.target.checked)}
            />{" "}
            PF applicable
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.esi_applicable}
              onChange={(e) => set("esi_applicable", e.target.checked)}
            />{" "}
            ESI applicable
          </label>
        </div>

        {/* 4. Mandatory docs */}
        <div style={sec}>4. Documents (mandatory)</div>
        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
          JPG, PNG or PDF only, up to {MAX_FILE_MB} MB each.
        </p>
        <Row>{FILE_DOCS_REQUIRED.map((t) => renderFile(t, true))}</Row>

        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 6px" }}>
          Address proof: <b>Gas Book</b> or <b>Ration Card (front and back)</b>{" "}
          <span style={{ color: "#dc2626" }}>*</span>
        </p>
        <Row>
          {renderFile("Gas Book", false)}
          {renderFile("Ration Card Front", false)}
          {renderFile("Ration Card Back", false)}
        </Row>
        {errors.proof && (
          <span
            data-field-error="1"
            style={{ fontSize: 11, color: "#dc2626", display: "block", margin: "-4px 0 10px" }}
          >
            {errors.proof}
          </span>
        )}

        <Row>
          {Object.keys(refs).map((k) => (
            <Field key={k} label={`${k} (mobile)`} required error={errors[`ref:${k}`]}>
              <input
                style={errors[`ref:${k}`] ? inpErr : inp}
                inputMode="numeric"
                maxLength={10}
                value={refs[k]}
                onChange={(e) => {
                  setRefs((r) => ({ ...r, [k]: digitsOnly(e.target.value) }));
                  clearError(`ref:${k}`);
                }}
              />
            </Field>
          ))}
        </Row>

        {/* 5. Optional docs */}
        <div style={sec}>5. Documents (optional)</div>
        <Row>{FILE_DOCS_OPTIONAL.map((t) => renderFile(t, false))}</Row>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: "#16a34a",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving and uploading…" : "Save & Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}