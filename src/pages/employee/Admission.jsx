import React, { useState, useEffect, useMemo } from "react";
import EmployeeLayout from "./EmployeeLayout";
import {
  API, empHeaders, ADM_CSS, fmtMoney, StudentCard,
} from "../../components/admission/admissionShared";

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ACADEMIC = ["10th", "12th", "Graduation", "ITI", "Polytechnic", "Others"];

const BLANK = {
  fullName: "", dateOfJoining: "", courseId: "", schemeId: "", accommodation: "WITHOUT",
  modeOfCourse: "Regular", hybridNote: "", timing: "", shopName: "", aadhaarNo: "",
  dateOfBirth: "", postalAddress: "", district: "", state: "Tamil Nadu", pincode: "",
  mobileNo: "", gender: "", bloodGroup: "", email: "", differentlyAbled: "",
  emergencyMobile: "", academicLevel: "", academicOthers: "", discount: "",
  batchNo: "", billNo: "",
};

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const digits = (v, max) => String(v).replace(/\D/g, "").slice(0, max);

// Server student → form state (when editing a draft)
const studentToForm = (s) => ({
  ...BLANK,
  fullName: s.fullName || "",
  dateOfJoining: toInputDate(s.dateOfJoining),
  courseId: s.course?.courseId || "",
  schemeId: s.scheme?.courseId || "",
  accommodation: s.accommodation || "WITHOUT",
  modeOfCourse: s.modeOfCourse || "Regular",
  hybridNote: s.hybridNote || "",
  timing: s.timing || "",
  shopName: s.shopName || "",
  aadhaarNo: s.aadhaarNo || "",
  dateOfBirth: toInputDate(s.dateOfBirth),
  postalAddress: s.postalAddress || "",
  district: s.district || "",
  state: s.state || "Tamil Nadu",
  pincode: s.pincode || "",
  mobileNo: s.mobileNo || "",
  gender: s.gender || "",
  bloodGroup: s.bloodGroup || "",
  email: s.email || "",
  differentlyAbled: s.differentlyAbled || "",
  emergencyMobile: s.emergencyMobile || "",
  academicLevel: s.academic?.level || "",
  academicOthers: s.academic?.others || "",
  discount: s.discount ? String(s.discount) : "",
  batchNo: s.batchNo || "",
  billNo: s.billNo || "",
});

export default function Admission() {
  const [tab, setTab] = useState("form"); // form | drafts | completed | full
  const [access, setAccess] = useState({ loaded: false, canManage: false });
  const [courses, setCourses] = useState([]);
  const [registerNo, setRegisterNo] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [existingDocs, setExistingDocs] = useState({ photo: "", aadhaar: "" });
  const [files, setFiles] = useState({ photo: null, aadhaar: null });
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("ALL");

  /* ── data loading ── */
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admission/my`, { headers: empHeaders() });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch (e) {
      console.error("ADMISSION LOAD ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/admission/my-access`, { headers: empHeaders() });
        const data = await res.json();
        const ok = !!data.canManage;
        setAccess({ loaded: true, canManage: ok });
        if (!ok) return;
        const [c, r] = await Promise.all([
          fetch(`${API}/api/admission/courses`, { headers: empHeaders() }).then((x) => x.json()),
          fetch(`${API}/api/admission/register-no`, { headers: empHeaders() }).then((x) => x.json()),
        ]);
        if (c.success) setCourses(c.data || []);
        if (r.success) setRegisterNo(r.registerNo || "");
        loadStudents();
      } catch (e) {
        setAccess({ loaded: true, canManage: false });
      }
    })();
  }, []);

  useEffect(() => {
    if (!files.photo) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(files.photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files.photo]);

  /* ── derived fee numbers ── */
  const regular = courses.filter((c) => c.category === "REGULAR");
  const schemes = courses.filter((c) => c.category === "SCHEME");
  const priced = useMemo(() => {
    if (form.schemeId) return schemes.find((c) => c._id === form.schemeId) || null;
    return regular.find((c) => c._id === form.courseId) || null;
  }, [form.courseId, form.schemeId, courses]); // eslint-disable-line react-hooks/exhaustive-deps

  const courseFee = priced ? (form.accommodation === "WITH" ? priced.feeWith || 0 : priced.feeWithout) : 0;
  const discount = Number(form.discount) || 0;
  const totalFees = Math.max(0, courseFee - discount);
  const withAvailable = !!priced && priced.feeWith != null;
  const editingDone = !!editingStudent && editingStudent.status !== "DRAFT"; // editing a completed application
  const feeLocked = editingDone && (editingStudent.payments || []).length > 0; // payments exist → fee frozen

  /* ── form helpers ── */
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pickCourse = (id) => {
    const c = regular.find((x) => x._id === id);
    setForm((f) => ({
      ...f, courseId: id, schemeId: "",
      accommodation: f.accommodation === "WITH" && !(c && c.feeWith != null) ? "WITHOUT" : f.accommodation,
    }));
  };
  const pickScheme = (id) => {
    const c = schemes.find((x) => x._id === id);
    setForm((f) => ({
      ...f, schemeId: id, courseId: id ? "" : f.courseId, // a scheme replaces the course
      accommodation: f.accommodation === "WITH" && !(id ? c && c.feeWith != null : true) ? "WITHOUT" : f.accommodation,
    }));
  };

  const resetForm = () => {
    setForm({ ...BLANK });
    setEditingId(null);
    setEditingStudent(null);
    setExistingDocs({ photo: "", aadhaar: "" });
    setFiles({ photo: null, aadhaar: null });
    setError(""); setErrorList([]);
  };

  const startEdit = (s) => {
    setForm(studentToForm(s));
    setEditingId(s._id);
    setEditingStudent(s);
    setExistingDocs({ photo: s.documents?.photo?.url || "", aadhaar: s.documents?.aadhaar?.url || "" });
    setFiles({ photo: null, aadhaar: null });
    setError(""); setErrorList([]); setSuccess("");
    setTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── save ── */
  const buildBody = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    if (files.photo) fd.append("photo", files.photo);
    if (files.aadhaar) fd.append("aadhaar", files.aadhaar);
    return fd;
  };

  const submit = async (complete) => {
    setError(""); setErrorList([]); setSuccess("");
    if (!form.fullName.trim()) return setError("Full Name is required.");
    if (!form.mobileNo.trim()) return setError("Mobile No is required.");
    if (complete && !(totalFees > 0)) return setError("Select a course and check the discount — Total Fees must be greater than 0.");

    setSaving(complete ? "complete" : "draft");
    try {
      // 1) create / update the draft
      const url = editingId ? `${API}/api/admission/${editingId}` : `${API}/api/admission/create`;
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: empHeaders(), body: buildBody() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save");
      const saved = data.data;

      if (!complete) {
        setSuccess("Draft saved. You can finish it later from the Drafts tab.");
        resetForm();
        await loadStudents();
        setTab("drafts");
        return;
      }

      // 2) complete → App No, status, PDF email
      const cRes = await fetch(`${API}/api/admission/${saved._id}/complete`, { method: "POST", headers: empHeaders() });
      const cData = await cRes.json();
      if (!cData.success) {
        // draft is saved; keep editing it so a retry updates the same record
        setEditingId(saved._id);
        setExistingDocs({ photo: saved.documents?.photo?.url || "", aadhaar: saved.documents?.aadhaar?.url || "" });
        setFiles({ photo: null, aadhaar: null });
        setErrorList(cData.errors || []);
        throw new Error(cData.message || "Could not complete the application");
      }
      const done = cData.data;
      setSuccess(
        `Application ${done.applicationNo} completed. ` +
        (done.email
          ? "Use “Send Email” in the Completed tab to send the PDF to the student."
          : "No email given, so download the PDF from the Completed tab.")
      );
      resetForm();
      await loadStudents();
      setTab("completed");
    } catch (e) {
      setError(e.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving("");
    }
  };

  // Save edits of an already-completed application (no re-complete, no new email)
  const saveChanges = async () => {
    setError(""); setErrorList([]); setSuccess("");
    if (!form.fullName.trim()) return setError("Full Name is required.");
    if (!form.mobileNo.trim()) return setError("Mobile No is required.");
    setSaving("changes");
    try {
      const res = await fetch(`${API}/api/admission/${editingId}`, { method: "PUT", headers: empHeaders(), body: buildBody() });
      const data = await res.json();
      if (!data.success) {
        setErrorList(data.errors || []);
        throw new Error(data.message || "Failed to save changes");
      }
      const saved = data.data;
      setSuccess(`Changes saved for ${saved.fullName} (${saved.applicationNo}). Download or resend the PDF to share the updated copy.`);
      resetForm();
      await loadStudents();
      setTab(saved.status === "FULLY_COMPLETED" ? "full" : "completed");
    } catch (e) {
      setError(e.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving("");
    }
  };

  // Delete a draft or a completed application (blocked while payments exist)
  const deleteStudent = async (s) => {
    const isDraft = s.status === "DRAFT";
    if (!isDraft && (s.payments || []).length > 0) {
      alert("This application has recorded payments.\nRemove the payments first (Remove button in the payments table), then delete the application.");
      return;
    }
    const msg = isDraft
      ? `Delete the draft for ${s.fullName}?`
      : `Delete application ${s.applicationNo} (${s.fullName})?\n\nThis cannot be undone.`;
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`${API}/api/admission/${s._id}`, { method: "DELETE", headers: empHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStudents((p) => p.filter((x) => x._id !== s._id));
      if (editingId === s._id) resetForm();
      setSuccess(isDraft ? "Draft deleted." : `Application ${s.applicationNo} deleted.`);
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  };

  const replaceStudent = (u) => setStudents((p) => p.map((x) => (x._id === u._id ? u : x)));

  /* ── lists per tab ── */
  const matches = (s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [s.fullName, s.mobileNo, s.applicationNo, s.shopName].some((v) => String(v || "").toLowerCase().includes(q));
  };
  const drafts = students.filter((s) => s.status === "DRAFT");
  const completed = students.filter((s) => s.status === "APPLICATION_COMPLETED");
  const full = students.filter((s) => s.status === "FULLY_COMPLETED");
  const completedShown = completed.filter((s) => payFilter === "ALL" || s.paymentStatus === payFilter);

  const issued = [...completed, ...full];
  const stats = {
    apps: issued.length,
    fees: issued.reduce((a, s) => a + (s.totalFees || 0), 0),
    collected: issued.reduce((a, s) => a + (s.paidAmount || 0), 0),
    balance: issued.reduce((a, s) => a + (s.balance || 0), 0),
  };

  const list = (arr, opts = {}) =>
    arr.filter(matches).length === 0 ? (
      <div className="adm-empty">{loading ? "Loading…" : "No students here yet."}</div>
    ) : (
      arr.filter(matches).map((s) => (
        <StudentCard
          key={s._id}
          s={s}
          headers={empHeaders}
          canPay={opts.canPay}
          canUndo={!opts.draft}
          canEmail={!opts.draft}
          canEdit={!opts.draft}
          onEdit={startEdit}
          canEditRefs={s.status !== "DRAFT"}
          onChanged={replaceStudent}
          onDelete={deleteStudent}
          extraActions={opts.draft ? (st) => <button className="adm-btn sm primary" onClick={() => startEdit(st)}>Continue editing</button> : undefined}
        />
      ))
    );

  /* ── render ── */
  const field = (label, node, opts = {}) => (
    <div className={`adm-field ${opts.span || ""}`}>
      <label>{label}{opts.req && <span className="req"> *</span>}</label>
      {node}
      {opts.hint && <div className="hint">{opts.hint}</div>}
    </div>
  );

  return (
    <EmployeeLayout>
      <div className="adm-root adm-page container-fluid px-4 py-4">
        <style>{ADM_CSS}</style>

        <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Admission</h4>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
         Fill the application, complete it, send the PDF to the student from the Completed tab, then track installments
        </p>

        {access.loaded && !access.canManage && (
          <div className="adm-alert error">You don't have access to the Admission module.</div>
        )}

        {access.canManage && (
          <>
            <div className="adm-stats">
              <div className="adm-stat"><div className="v">{stats.apps}</div><div className="l">Applications completed</div></div>
              <div className="adm-stat"><div className="v">{fmtMoney(stats.fees)}</div><div className="l">Total fees</div></div>
              <div className="adm-stat"><div className="v" style={{ color: "var(--accent)" }}>{fmtMoney(stats.collected)}</div><div className="l">Collected</div></div>
              <div className="adm-stat"><div className="v" style={{ color: "var(--danger)" }}>{fmtMoney(stats.balance)}</div><div className="l">Balance</div></div>
            </div>

            <div className="adm-tabs">
              <button className={`adm-tab ${tab === "form" ? "active" : ""}`} onClick={() => setTab("form")}>
                {editingId ? (editingDone ? "Editing Application" : "Editing Draft") : "New Admission"}
              </button>
              <button className={`adm-tab ${tab === "drafts" ? "active" : ""}`} onClick={() => setTab("drafts")}>Drafts ({drafts.length})</button>
              <button className={`adm-tab ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>Completed Applications ({completed.length})</button>
              <button className={`adm-tab ${tab === "full" ? "active" : ""}`} onClick={() => setTab("full")}>Fully Completed ({full.length})</button>
            </div>

            {success && <div className="adm-alert ok">{success}</div>}

            {/* ═════════ FORM ═════════ */}
            {tab === "form" && (
              <div>
                {error && (
                  <div className="adm-alert error">
                    {error}
                    {errorList.length > 1 && (
                      <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                        {errorList.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {editingDone && (
                  <div className="adm-alert warn">
                    Editing completed application <b>{editingStudent.applicationNo}</b>.
                    {feeLocked ? " Course, scheme, accommodation and discount are locked because payments are already recorded." : ""}
                    {" "}After saving, download or resend the PDF to share the updated copy.
                  </div>
                )}

                <div className="adm-card">
                  <h6>Application header</h6>
                  <div className="adm-grid">
                    {editingDone && field("Application No", <input value={editingStudent.applicationNo || ""} readOnly />)}
                    {field("Register No", <input value={registerNo} readOnly />, { hint: "Set by admin — cannot be edited" })}
                    {field("Batch No", <input value={form.batchNo} onChange={(e) => set("batchNo", e.target.value)} />)}
                    {field("Bill No", <input value={form.billNo} onChange={(e) => set("billNo", e.target.value)} />)}
                    {field("BDA", <input value="Auto — logged-in telecaller" readOnly />)}
                    {field("Date", <input value={new Date().toLocaleDateString("en-IN")} readOnly />)}
                  </div>
                </div>

                <div className="adm-card">
                  <h6>I. Personal Details</h6>
                  <div className="adm-grid">
                    {field("Full Name", <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />, { req: true, span: "adm-span2" })}
                    {field("Date of Joining", <input type="date" value={form.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)} />)}

                    {field("Course Taken", (
                      <select value={form.courseId} onChange={(e) => pickCourse(e.target.value)} disabled={!!form.schemeId || feeLocked}>
                        <option value="">Select course</option>
                        {regular.map((c) => <option key={c._id} value={c._id}>{c.name} — {fmtMoney(c.feeWithout)}</option>)}
                      </select>
                    ), { req: true, hint: form.schemeId ? "Disabled — a Government Scheme is selected" : "" })}

                    {field("Government Scheme", (
                      <select value={form.schemeId} onChange={(e) => pickScheme(e.target.value)} disabled={feeLocked}>
                        <option value="">None</option>
                        {schemes.map((c) => <option key={c._id} value={c._id}>{c.name} — {fmtMoney(c.feeWithout)}</option>)}
                      </select>
                    ), { hint: "Choosing a scheme replaces the course" })}

                    {field("Accommodation", (
                      <div className="adm-radio-row">
                        <label><input type="radio" disabled={feeLocked} checked={form.accommodation === "WITHOUT"} onChange={() => set("accommodation", "WITHOUT")} /> Without</label>
                        <label style={{ opacity: withAvailable ? 1 : 0.45 }}>
                          <input type="radio" checked={form.accommodation === "WITH"} disabled={!withAvailable || feeLocked} onChange={() => set("accommodation", "WITH")} /> With
                        </label>
                      </div>
                    ), { hint: priced && !withAvailable ? "Not available for this course" : "" })}

                    {field("Mode of Course", (
                      <div className="adm-radio-row">
                        <label><input type="radio" checked={form.modeOfCourse === "Regular"} onChange={() => set("modeOfCourse", "Regular")} /> Regular</label>
                        <label><input type="radio" checked={form.modeOfCourse === "Hybrid"} onChange={() => set("modeOfCourse", "Hybrid")} /> Hybrid</label>
                      </div>
                    ), { req: true })}
                    {form.modeOfCourse === "Hybrid" &&
                      field("Hybrid details", <input value={form.hybridNote} onChange={(e) => set("hybridNote", e.target.value)} placeholder="e.g. Weekend online + offline lab" />, { req: true, span: "adm-span2" })}

                    {field("Timing", <input value={form.timing} onChange={(e) => set("timing", e.target.value)} />)}
                    {field("Shop Name", <input value={form.shopName} onChange={(e) => set("shopName", e.target.value)} />, { req: true })}
                    {field("Aadhaar No", <input inputMode="numeric" value={form.aadhaarNo} onChange={(e) => set("aadhaarNo", digits(e.target.value, 12))} placeholder="12 digits" />, { req: true })}
                    {field("Date of Birth", <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />, { req: true })}
                    {field("Gender", (
                      <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                        <option value="">Select</option><option>Male</option><option>Female</option><option>Others</option>
                      </select>
                    ), { req: true })}
                    {field("Blood Group", (
                      <select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                        <option value="">Select</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    ), { req: true })}

                    {field("Postal Address", <textarea rows={2} value={form.postalAddress} onChange={(e) => set("postalAddress", e.target.value)} />, { req: true, span: "adm-span3" })}
                    {field("District", <input value={form.district} onChange={(e) => set("district", e.target.value)} />, { req: true })}
                    {field("State", (
                      <>
                        <input list="adm-states" value={form.state} onChange={(e) => set("state", e.target.value)} />
                        <datalist id="adm-states"><option value="Tamil Nadu" /><option value="Puducherry" /></datalist>
                      </>
                    ))}
                    {field("Pin code", <input inputMode="numeric" value={form.pincode} onChange={(e) => set("pincode", digits(e.target.value, 6))} />, { req: true })}
                    {field("Mobile No", <input inputMode="numeric" value={form.mobileNo} onChange={(e) => set("mobileNo", digits(e.target.value, 10))} placeholder="10 digits" />, { req: true })}
                    {field("Email", <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />, { hint: "Used when you send the application PDF from the Completed tab" })}
                    {field("Emergency Mobile No", <input inputMode="numeric" value={form.emergencyMobile} onChange={(e) => set("emergencyMobile", digits(e.target.value, 10))} />)}
                    {field("Differently Abled", (
                      <div className="adm-radio-row">
                        {["Yes", "No", "Not applicable"].map((o) => (
                          <label key={o}><input type="radio" checked={form.differentlyAbled === o} onChange={() => set("differentlyAbled", o)} /> {o}</label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adm-card">
                  <h6>II. Academic Details</h6>
                  <div className="adm-grid">
                    {field("Highest qualification", (
                      <select value={form.academicLevel} onChange={(e) => set("academicLevel", e.target.value)}>
                        <option value="">Select</option>{ACADEMIC.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    ), { req: true })}
                    {form.academicLevel === "Others" &&
                      field("Please specify", <input value={form.academicOthers} onChange={(e) => set("academicOthers", e.target.value)} />, { req: true, span: "adm-span2" })}
                  </div>
                </div>

                <div className="adm-card">
                  <h6>Fee Structure</h6>
                  {!priced && <div className="adm-alert warn">Select a course or a government scheme to see the fee.</div>}
                  <div className="adm-grid">
                    {field("Course fee", <input value={priced ? fmtMoney(courseFee) : "—"} readOnly />, { hint: priced ? `${priced.name}${form.accommodation === "WITH" ? " (with accommodation)" : ""}` : "" })}
                    {field("Discount (₹)", <input inputMode="numeric" value={form.discount} readOnly={feeLocked} onChange={(e) => set("discount", digits(e.target.value, 7))} />)}
                    {field("Total fees", <input value={fmtMoney(totalFees)} readOnly style={{ fontWeight: 700 }} />)}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--muted)" }}>
                    Booking amount and installments are recorded later, in the <b>Completed Applications</b> tab, as the student pays.
                  </div>
                </div>

                <div className="adm-card">
                  <h6>III. Documents</h6>
                  <div className="adm-grid two">
                    {field("Student Photo", (
                      <>
                        <input type="file" accept="image/*" onChange={(e) => setFiles((f) => ({ ...f, photo: e.target.files[0] || null }))} />
                        {(photoPreview || existingDocs.photo) && <img className="adm-thumb" src={photoPreview || existingDocs.photo} alt="Student" />}
                      </>
                    ), { req: true, hint: "Shown in the top-right corner of the PDF" })}
                    {field("Aadhaar Card", (
                      <>
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles((f) => ({ ...f, aadhaar: e.target.files[0] || null }))} />
                        {existingDocs.aadhaar && !files.aadhaar && (
                          <div className="hint"><a href={existingDocs.aadhaar} target="_blank" rel="noreferrer">View uploaded Aadhaar</a></div>
                        )}
                      </>
                    ), { req: true, hint: "Image or PDF, max 5 MB" })}
                  </div>
                </div>

                <div className="adm-actions" style={{ marginBottom: 40 }}>
                  {editingDone ? (
                    <>
                      <button className="adm-btn success" disabled={!!saving} onClick={saveChanges}>
                        {saving === "changes" ? "Saving…" : "Save Changes"}
                      </button>
                      <button className="adm-btn" disabled={!!saving} onClick={() => { resetForm(); setTab(editingStudent.status === "FULLY_COMPLETED" ? "full" : "completed"); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="adm-btn success" disabled={!!saving} onClick={() => submit(true)}>
                        {saving === "complete" ? "Completing…" : "Complete Application"}
                      </button>
                      <button className="adm-btn" disabled={!!saving} onClick={() => submit(false)}>
                        {saving === "draft" ? "Saving…" : "Save as Draft"}
                      </button>
                      {(editingId || form.fullName) && <button className="adm-btn" disabled={!!saving} onClick={resetForm}>Clear form</button>}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ═════════ LISTS ═════════ */}
            {tab !== "form" && (
              <div className="adm-filters">
                <input placeholder="Search name, mobile, application no…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            )}

            {tab === "drafts" && list(drafts, { draft: true })}

            {tab === "completed" && (
              <>
                <div className="adm-chips">
                  {[["ALL", "All"], ["PENDING", "Payment Pending"], ["PARTIAL", "Partially Paid"]].map(([k, l]) => (
                    <button key={k} className={`adm-chip ${payFilter === k ? "active" : ""}`} onClick={() => setPayFilter(k)}>{l}</button>
                  ))}
                </div>
                {list(completedShown, { canPay: true })}
              </>
            )}

            {tab === "full" && list(full, {})}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}