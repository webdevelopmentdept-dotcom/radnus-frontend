import { useState } from "react";
import tnDistrictData from "./TnDistrictData";
import { useNavigate } from "react-router-dom";

function ShopOwnerForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // ✅ FULL INITIAL STATE (IMPORTANT)
  const [form, setForm] = useState({

    shopName: "",
    ownerName: "",
    mobile: "",
    district: "",
    taluk: "",
    address: "",
    businessYears: "",
    needTech: "",
    technicianTypes: [],
    jobType: "",
    experience: "",
    paymentType: "",
    salaryRange: "",
    workingHours: "",
    foodAccommodation: "",
    toolsSetup: "",
    machines: [],
    timeline: "",
    skills: "",
    radnusHire: "",
    remarks: "",
  });
const [otherDistrict, setOtherDistrict] = useState("");
const [otherTaluk, setOtherTaluk] = useState("");

  /* ================= VALIDATION ================= */
  const isInvalidValue = (value) => {
    if (!value) return true;
    const v = value.trim();
    return v === "" || v === "-" || v === "--";
  };

  const hasLetter = (value) => /[a-zA-Z]/.test(value);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: false }));

    if (name === "district") {
      setSelectedDistrict(value);
      setForm((p) => ({ ...p, taluk: "" }));
    }
  };

  const handleCheckbox = (e, field) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };
  /* ================= STEP VALIDATION ================= */
  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      // Shop Name – must contain at least one letter
      if (isInvalidValue(form.shopName) || !hasLetter(form.shopName)) {
        newErrors.shopName = true;
      }

      // Owner Name – must contain at least one letter
      if (isInvalidValue(form.ownerName) || !hasLetter(form.ownerName)) {
        newErrors.ownerName = true;
      }

      if (isInvalidValue(form.mobile)) newErrors.mobile = true;
      if (isInvalidValue(form.district)) newErrors.district = true;
      if (isInvalidValue(form.taluk)) newErrors.taluk = true;
      if (isInvalidValue(form.businessYears)) newErrors.businessYears = true;
      if (isInvalidValue(form.needTech)) newErrors.needTech = true;
    }

    if (step === 2) {
      // Technician Type – at least one checkbox
      if (!form.technicianTypes || form.technicianTypes.length === 0) {
        newErrors.technicianTypes = true;
      }

      // Job Type – radio
      if (isInvalidValue(form.jobType)) {
        newErrors.jobType = true;
      }

      // Experience – dropdown
      if (isInvalidValue(form.experience) || form.experience === "Select") {
        newErrors.experience = true;
      }

      // Payment Type – radio
      if (isInvalidValue(form.paymentType)) {
        newErrors.paymentType = true;
      }

      // Salary Range – text
      if (isInvalidValue(form.salaryRange)) {
        newErrors.salaryRange = true;
      }

      // Working Hours – text
      if (isInvalidValue(form.workingHours)) {
        newErrors.workingHours = true;
      }

      // Food / Accommodation – radio
      if (isInvalidValue(form.foodAccommodation)) {
        newErrors.foodAccommodation = true;
      }
    }

    if (step === 3) {
      // Tools Setup
      if (isInvalidValue(form.toolsSetup)) {
        newErrors.toolsSetup = true;
      }

      // Machines – at least one checkbox
      if (!form.machines || form.machines.length === 0) {
        newErrors.machines = true;
      }

      // Timeline
      if (isInvalidValue(form.timeline)) {
        newErrors.timeline = true;
      }

      // Hire via Radnus
      if (isInvalidValue(form.radnusHire)) {
        newErrors.radnusHire = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */
 const handleSubmit = async (e) => {
  e.preventDefault();
  if (submitting) return;

  if (!validateStep()) return;

  setSubmitting(true);

  try {
    const API = import.meta.env.VITE_API_BASE_URL;

const payload = {
  ...form,
  district: form.district === "Others" ? otherDistrict : form.district,
  taluk: form.taluk === "Others" ? otherTaluk : form.taluk,
  technicianTypes: form.technicianTypes || [],
  machines: form.machines || [],
};


    const res = await fetch(`${API}/api/shop-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || data.error || "Submit failed");
      return;
    }

    setSubmitted(true); // ✅ success
  } catch (err) {
    console.error("Submit error:", err);
    alert("Server error");
  } finally {
    setSubmitting(false);
  }
};
  if (submitted) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="bg-white p-4 rounded shadow text-center">
          <h4 className="text-danger fw-bold">Thank You!</h4>
          <p>Your requirement submitted successfully.</p>
          <button
            className="btn btn-danger"
            onClick={() => navigate("/radnus-connect")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        body {
          background: linear-gradient(135deg,#fff 0%,#fbe9ea 45%,#fff 100%);
          min-height:100vh;
        }
        .header { background:#d71920; color:white; }
        .stepper { display:flex; align-items:center; max-width:900px; margin:auto; }
        .circle {
          width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:#dee2e6;font-weight:600;
        }
        .circle.active { background:#d71920;color:white; }
        .line {
          flex:1;height:4px;background:#dee2e6;
          margin:0 8px;border-radius:2px;
        }
        .line.active { background:#d71920; }
        .card-box {
          background:rgba(255,255,255,0.96);
          border-radius:12px;border:1px solid #eee;
          padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08);
          animation:fade .35s ease;
        }
        @keyframes fade {
          from { opacity:0; transform:translateY(12px); }
          to { opacity:1; transform:none; }
        }
        label { font-size:.85rem;font-weight:600; }
        hr { opacity:.15; }
      `}</style>

      <div className="header py-3 shadow-sm">
        <div className="container">
          <h4 className="fw-bold mb-0">Radnus Connect</h4>
          <small>Mobile Shop Owner – Technician Requirement</small>
        </div>
      </div>

      <div className="bg-white border-bottom py-3">
        <div className="stepper">
          <div className={`circle ${step >= 1 && "active"}`}>1</div>
          <div className={`line ${step >= 2 && "active"}`} />
          <div className={`circle ${step >= 2 && "active"}`}>2</div>
          <div className={`line ${step >= 3 && "active"}`} />
          <div className={`circle ${step >= 3 && "active"}`}>3</div>
        </div>
      </div>
      <div className="container my-5" style={{ maxWidth: "900px" }}>
        <div className="card-box">
          {/* ✅ FORM INSIDE CARD */}
          <form>
            {/* ================= STEP 1 ================= */}
            {step === 1 && (
              <>
                <h6 className="text-danger fw-bold mb-3">
                  Shop & Business Details
                </h6>

                <div className="row g-3">
                  {/* Shop Name */}
                  <div className="col-md-6">
                    <label className={errors.shopName ? "text-danger" : ""}>
                      Shop Name
                    </label>
                    <input
                      className={`form-control ${
                        errors.shopName ? "border-danger" : ""
                      }`}
                      name="shopName"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Owner Name */}
                  <div className="col-md-6">
                    <label className={errors.ownerName ? "text-danger" : ""}>
                      Owner Name
                    </label>
                    <input
                      className={`form-control ${
                        errors.ownerName ? "border-danger" : ""
                      }`}
                      name="ownerName"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Mobile */}
                  <div className="col-md-6">
                    <label className={errors.mobile ? "text-danger" : ""}>
                      Mobile / WhatsApp
                    </label>
                    <input
                      className={`form-control ${
                        errors.mobile ? "border-danger" : ""
                      }`}
                      name="mobile"
                      onChange={handleChange}
                    />
                  </div>

                  {/* District */}
                  <div className="col-md-6">
                    <label className={errors.district ? "text-danger" : ""}>
                      District
                    </label>
                 <select
  className={`form-select ${
    errors.district ? "border-danger" : ""
  }`}
  name="district"
  onChange={handleChange}
>
  <option value="">Select</option>

  {Object.keys(tnDistrictData).map((d) => (
    <option key={d} value={d}>{d}</option>
  ))}

  <option value="Others">Others</option>
</select>
{form.district === "Others" && (
  <input
    type="text"
    className="form-control mt-2"
    placeholder="Enter District Name"
    value={otherDistrict}
    onChange={(e) => setOtherDistrict(e.target.value)}
  />
)}

                  </div>

                  {/* Taluk */}
                  <div className="col-md-12">
                    <label className={errors.taluk ? "text-danger" : ""}>
                      Taluk
                    </label>
                   <select
  className={`form-select ${
    errors.taluk ? "border-danger" : ""
  }`}
  name="taluk"
  disabled={!selectedDistrict}
  onChange={handleChange}
>
  <option value="">Select</option>

  {selectedDistrict &&
    selectedDistrict !== "Others" &&
    tnDistrictData[selectedDistrict]?.map((t) => (
      <option key={t} value={t}>{t}</option>
    ))}

  <option value="Others">Others</option>
</select>
{form.taluk === "Others" && (
  <input
    type="text"
    className="form-control mt-2"
    placeholder="Enter Taluk / Area"
    value={otherTaluk}
    onChange={(e) => setOtherTaluk(e.target.value)}
  />
)}

                  </div>

                  {/* Shop Address (optional – no validation) */}
                  <div className="col-md-12">
                    <label>Shop Address</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="address"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Years in Business */}
                  <div className="col-md-6">
                    <label
                      className={errors.businessYears ? "text-danger" : ""}
                    >
                      Years in Business
                    </label>
                    <select
                      className={`form-select ${
                        errors.businessYears ? "border-danger" : ""
                      }`}
                      name="businessYears"
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option>Less than 1 year</option>
                      <option>1–3 years</option>
                      <option>3–5 years</option>
                      <option>5–10 years</option>
                      <option>More than 10 years</option>
                    </select>
                  </div>

                  {/* Need Technician */}
                  <div className="col-md-6">
                    <label className={errors.needTech ? "text-danger" : ""}>
                      Need Technician?
                    </label>
                    <br />
                    <input
                      type="radio"
                      name="needTech"
                      value="Yes"
                      onChange={handleChange}
                    />{" "}
                    Yes
                    <input
                      type="radio"
                      className="ms-3"
                      name="needTech"
                      value="No"
                      onChange={handleChange}
                    />{" "}
                    No
                  </div>
                </div>
              </>
            )}

            {/* ================= STEP 2 ================= */}
            {step === 2 && (
              <>
                <h6 className="text-danger fw-bold mb-3">
                  Technician & Salary Details
                </h6>
                {/* Technician Type */}
                <label className={errors.technicianTypes ? "text-danger" : ""}>
                  Technician Type
                </label>
                {[
                  "Hardware",
                  "Software / Unlocking",
                  "iPhone Specialist",
                  "All-round",
                ].map((v) => (
                  <div className="form-check" key={v}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      value={v}
                      onChange={(e) => handleCheckbox(e, "technicianTypes")}
                    />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}
                <hr />
                {/* Job Type */}
                <label className={errors.jobType ? "text-danger" : ""}>
                  Job Type
                </label>
                <br />
                {["Full-time", "Part-time", "On-call"].map((v) => (
                  <span key={v} className="me-3">
                    <input
                      type="radio"
                      name="jobType"
                      value={v}
                      onChange={handleChange}
                    />{" "}
                    {v}
                  </span>
                ))}
                <hr />
                {/* Experience */}
                <label className={errors.experience ? "text-danger" : ""}>
                  Experience
                </label>
                <select
                  className={`form-select mb-3 ${
                    errors.experience ? "border-danger" : ""
                  }`}
                  name="experience"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Fresher</option>
                  <option>1–2 years</option>
                  <option>3–5 years</option>
                  <option>Any experience</option>
                </select>
                {/* Payment Type */}
                <label className={errors.paymentType ? "text-danger" : ""}>
                  Payment Type
                </label>
                <br />
                <input
                  type="radio"
                  name="paymentType"
                  value="Daily Wage"
                  onChange={handleChange}
                />{" "}
                Daily
                <input
                  type="radio"
                  className="ms-3"
                  name="paymentType"
                  value="Monthly Salary"
                  onChange={handleChange}
                />{" "}
                Monthly
                {/* Salary / Working Hours (optional – no validation) */}
                <div className="row mt-3">
                  <div className="col-md-6">
                    <label className={errors.salaryRange ? "text-danger" : ""}>
                      Salary Range
                    </label>
                    <input
                      className={`form-control ${
                        errors.salaryRange ? "border-danger" : ""
                      }`}
                      name="salaryRange"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className={errors.workingHours ? "text-danger" : ""}>
                      Working Hours
                    </label>
                    <input
                      className={`form-control ${
                        errors.workingHours ? "border-danger" : ""
                      }`}
                      name="workingHours"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {/* Food / Accommodation (optional) */}
                <label
                  className={`mt-3 ${
                    errors.foodAccommodation ? "text-danger" : ""
                  }`}
                >
                  Food / Accommodation
                </label>
                <br />
                <input
                  type="radio"
                  name="foodAccommodation"
                  value="Yes"
                  onChange={handleChange}
                />{" "}
                Yes
                <input
                  type="radio"
                  className="ms-3"
                  name="foodAccommodation"
                  value="No"
                  onChange={handleChange}
                />{" "}
                No
              </>
            )}

            {/* ================= STEP 3 ================= */}
            {step === 3 && (
              <>
                <h6 className="text-danger fw-bold mb-3">
                  Tools & Final Details
                </h6>

                {/* Tools Setup */}
                <label className={errors.toolsSetup ? "text-danger" : ""}>
                  Tools Setup
                </label>
                <select
                  className={`form-select mb-3 ${
                    errors.toolsSetup ? "border-danger" : ""
                  }`}
                  name="toolsSetup"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Complete setup</option>
                  <option>Partial setup</option>
                  <option>No tools</option>
                </select>

                {/* Machines */}
                <label className={errors.machines ? "text-danger" : ""}>
                  Machines Available
                </label>
                {[
                  "Soldering Station",
                  "DC Power Supply",
                  "Microscope",
                  "Hot Air",
                  "OCA",
                  "Separator",
                  "Back Glass",
                ].map((v) => (
                  <div className="form-check" key={v}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      value={v}
                      onChange={(e) => handleCheckbox(e, "machines")}
                    />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}

                {/* Timeline */}
                <label
                  className={`mt-3 ${errors.timeline ? "text-danger" : ""}`}
                >
                  When Needed?
                </label>
                <select
                  className={`form-select ${
                    errors.timeline ? "border-danger" : ""
                  }`}
                  name="timeline"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Immediately</option>
                  <option>Within 1 week</option>
                  <option>Within 1 month</option>
                </select>

                {/* Skills (optional) */}
                <label className="mt-3">Brand / Skill Requirement</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="skills"
                  onChange={handleChange}
                />

                {/* Hire via Radnus */}
                <div className="mt-3">
                  <label className={errors.radnusHire ? "text-danger" : ""}>
                    Hire via Radnus?
                  </label>
                  <br />
                  <input
                    type="radio"
                    name="radnusHire"
                    value="Yes"
                    onChange={handleChange}
                  />{" "}
                  Yes
                  <input
                    type="radio"
                    className="ms-3"
                    name="radnusHire"
                    value="No"
                    onChange={handleChange}
                  />{" "}
                  No
                </div>

                {/* Remarks (OPTIONAL – alignment fixed) */}
                <div className="mt-3">
                  <label>Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="remarks"
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="mt-4 d-flex justify-content-between">
              {step > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-danger ms-auto"
                  onClick={() => validateStep() && setStep(step + 1)}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger ms-auto"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ShopOwnerForm;
