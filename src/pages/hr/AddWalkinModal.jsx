import React, { useEffect, useState } from "react";

const SOURCE_OPTIONS = ["Naukri", "Indeed", "Adexpress", "LinkedIn", "Referral", "Walk-in Direct", "Others"];

export default function AddWalkinModal({ apiBase, onClose, onSaved }) {
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    requisitionDate: "",
    interviewDate: "",
    name: "",
    department: "",
    designation: "",
    mobile: "",
    emergencyContact: "",
    location: "",
    source: "Walk-in Direct",
    receivedBy: "",
    remarks: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // ── designations of the currently selected department ──
  const selectedDept = departments.find((d) => d.name === form.department);
  const availableDesignations = (selectedDept?.designations || []).filter(
    (d) => d.status === "active"
  );

  useEffect(() => {
    fetch(`${apiBase}/api/departments/active`)
      .then((r) => r.json())
      .then((d) => setDepartments(d.data || []))
      .catch(() => setDepartments([]));
  }, [apiBase]);

  const update = (field, value) => {
    if (field === "department") {
      setForm((f) => ({ ...f, department: value, designation: "" }));
      return;
    }

    if (field === "mobile") {
      // digits only, max 10
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm((f) => ({ ...f, mobile: digitsOnly }));
      setFieldErrors((fe) => ({
        ...fe,
        mobile:
          digitsOnly.length === 0 || digitsOnly.length === 10
            ? ""
            : "Mobile number must be exactly 10 digits.",
      }));
      return;
    }

    setForm((f) => ({ ...f, [field]: value }));
  };

  const isValidMobile = /^\d{10}$/.test(form.mobile);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      setError("Candidate Name and Mobile No are required.");
      return;
    }
    if (!isValidMobile) {
      setError("Mobile No must be exactly 10 digits.");
      setFieldErrors((fe) => ({ ...fe, mobile: "Mobile number must be exactly 10 digits." }));
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/hr/walkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.applicant);
        onClose();
      } else {
        setError(data.msg || "Failed to save walk-in applicant.");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ha-overlay" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="ha-modal-header">
          <span className="ha-modal-title">Add Walk-in Applicant</span>
          <button onClick={onClose} className="ha-close-btn">Close</button>
        </div>

        <div className="ha-modal-body" style={{ padding: 20 }}>
          {error && (
            <div style={{ background: "#fff1f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Candidate Name *">
              <input className="ha-custom-input" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Field>

            <Field label="Mobile No *">
              <input
                className="ha-custom-input"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit mobile number"
                style={fieldErrors.mobile ? { borderColor: "#dc2626" } : undefined}
              />
              {fieldErrors.mobile && (
                <span style={{ fontSize: 11, color: "#dc2626" }}>{fieldErrors.mobile}</span>
              )}
            </Field>

            <Field label="Requisition Date">
              <input className="ha-custom-input" type="date" value={form.requisitionDate} onChange={(e) => update("requisitionDate", e.target.value)} />
            </Field>

            <Field label="Interview Date">
              <input className="ha-custom-input" type="date" value={form.interviewDate} onChange={(e) => update("interviewDate", e.target.value)} />
            </Field>

            <Field label="Department">
              <select className="ha-custom-input" value={form.department} onChange={(e) => update("department", e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Designation">
              <select
                className="ha-custom-input"
                value={form.designation}
                onChange={(e) => update("designation", e.target.value)}
                disabled={!form.department}
              >
                <option value="">
                  {form.department ? "Select Designation" : "Select Department first"}
                </option>
                {availableDesignations.map((d) => (
                  <option key={d._id || d.title} value={d.title}>
                    {d.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Emergency Contact Number">
              <input className="ha-custom-input" value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} />
            </Field>

            <Field label="Location">
              <input className="ha-custom-input" value={form.location} onChange={(e) => update("location", e.target.value)} />
            </Field>

            <Field label="Job Portal / Source">
              <select className="ha-custom-input" value={form.source} onChange={(e) => update("source", e.target.value)}>
                {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Received By">
              <input className="ha-custom-input" value={form.receivedBy} onChange={(e) => update("receivedBy", e.target.value)} />
            </Field>

            <Field label="Remarks" full>
              <textarea className="ha-custom-input" rows={3} value={form.remarks} onChange={(e) => update("remarks", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="ha-reject-modal-footer">
          <button className="ha-reject-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="ha-reject-confirm-btn" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving..." : "Save Walk-in Applicant"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}