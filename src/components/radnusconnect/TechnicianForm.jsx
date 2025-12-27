import { useState } from "react";
import tnDistrictData from "./TnDistrictData";
import { useNavigate } from "react-router-dom";

function TechnicianForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    address: "",
    district: "",
    taluk: "",
    experience: "",

    skills: [],
    brands: [],
    tools: [],

    jobType: "",
    paymentType: "",
    expectedSalary: "",

    workLocation: "",
    joinReady: "",
    radnusAgree: "",

    remarks: "",
  });

  /* ✅ MISSING FUNCTION – FIXED */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((p) => ({ ...p, [name]: false }));

    if (name === "district") {
      setSelectedDistrict(value);
      setForm((p) => ({ ...p, taluk: "" }));
    }

    if (name === "paymentType") {
      setForm((p) => ({ ...p, expectedSalary: "" }));
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (submitting) return;

  // ✅ IMPORTANT FIX
  if (!validateStep()) return;

  setSubmitting(true);

  try {
    const API = import.meta.env.VITE_API_BASE_URL;

    const res = await fetch(`${API}/api/technician`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    await res.json();
    setSubmitted(true);
  } catch (err) {
    console.error("Submit error:", err);
  } finally {
    setSubmitting(false);
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
    setErrors((p) => ({ ...p, [field]: false }));
  };


  /* ================= VALIDATION HELPERS ================= */
const isInvalidValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false; // arrays safe
  const v = value.trim();
  return v === "" || v === "-" || v === "--" || v === "---";
};

const hasLetter = (value) => {
  return /[a-zA-Z]/.test(value);
};

 const validateStep = () => {
  let newErrors = {};

  /* ===== STEP 1 ===== */
  if (step === 1) {
    if (isInvalidValue(form.fullName) || !hasLetter(form.fullName))
      newErrors.fullName = true;

    if (isInvalidValue(form.mobile)) newErrors.mobile = true;

    if (isInvalidValue(form.address) || !hasLetter(form.address))
      newErrors.address = true;

    if (isInvalidValue(form.district)) newErrors.district = true;

    if (isInvalidValue(form.taluk)) newErrors.taluk = true;

    if (
      isInvalidValue(form.experience) ||
      form.experience === "Select"
    )
      newErrors.experience = true;
  }

  /* ===== STEP 2 ===== */
  if (step === 2) {
    if (!form.skills || form.skills.length === 0)
      newErrors.skills = true;

    if (!form.brands || form.brands.length === 0)
      newErrors.brands = true;

    if (!form.tools || form.tools.length === 0)
      newErrors.tools = true;
  }

  /* ===== STEP 3 ===== */
  if (step === 3) {
    if (isInvalidValue(form.jobType))
      newErrors.jobType = true;

    if (isInvalidValue(form.paymentType))
      newErrors.paymentType = true;

    if (
      form.paymentType &&
      isInvalidValue(form.expectedSalary)
    )
      newErrors.expectedSalary = true;

    if (isInvalidValue(form.workLocation))
      newErrors.workLocation = true;

    if (isInvalidValue(form.joinReady))
      newErrors.joinReady = true;

    if (isInvalidValue(form.radnusAgree))
      newErrors.radnusAgree = true;
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  /* ================= THANK YOU PAGE ================= */
  if (submitted) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", background: "#fbe9ea" }}
      >
        <div className="bg-white p-5 rounded shadow text-center">
          <h3 className="text-danger fw-bold mb-3">Thank You!</h3>
          <p>Your technician profile has been submitted successfully.</p>
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
        }
        label { font-size:.85rem;font-weight:600; }
      `}</style>

      <div className="header py-3 shadow-sm">
        <div className="container">
          <h4 className="fw-bold mb-0">Radnus Connect</h4>
          <small>Mobile Service Technician – Registration</small>
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
          <form>
          {/* ================= STEP 1 ================= */}
            {step === 1 && (
              <>
                <h6 className="text-danger fw-bold mb-3">
                  Personal & Location Details
                </h6>

                <label className={errors.fullName ? "text-danger" : ""}>
                  Full Name
                </label>
                <input
                  className={`form-control mb-3 ${
                    errors.fullName ? "border-danger" : ""
                  }`}
                  name="fullName"
                  onChange={handleChange}
                />

                <label className={errors.mobile ? "text-danger" : ""}>
                  Mobile / WhatsApp
                </label>
                <input
                  className={`form-control mb-3 ${
                    errors.mobile ? "border-danger" : ""
                  }`}
                  name="mobile"
                  onChange={handleChange}
                />

                <label className={errors.address ? "text-danger" : ""}>
                  Residential Address
                </label>
                <textarea
                  className={`form-control mb-3 ${
                    errors.address ? "border-danger" : ""
                  }`}
                  name="address"
                  rows="3"
                  onChange={handleChange}
                />

                <label className={errors.district ? "text-danger" : ""}>
                  District
                </label>
                <select
                  className={`form-select mb-3 ${
                    errors.district ? "border-danger" : ""
                  }`}
                  name="district"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {Object.keys(tnDistrictData).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>

                <label className={errors.taluk ? "text-danger" : ""}>
                  Taluk
                </label>
                <select
                  className={`form-select mb-3 ${
                    errors.taluk ? "border-danger" : ""
                  }`}
                  name="taluk"
                  disabled={!selectedDistrict}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {selectedDistrict &&
                    tnDistrictData[selectedDistrict].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                </select>

                <label className={errors.experience ? "text-danger" : ""}>
                  Total Experience
                </label>
                <select
                  className={`form-select ${
                    errors.experience ? "border-danger" : ""
                  }`}
                  name="experience"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Fresher</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>More than 5 years</option>
                </select>
              </>
            )}

            {/* ================= STEP 2 ================= */}
            {step === 2 && (
              <>
                <h6 className="text-danger fw-bold mb-3">
                  Skills & Technical Capability
                </h6>

                <label className={errors.skills ? "text-danger" : ""}>
                  Primary Skills
                </label>
                {[
                  "Hardware (Android)",
                  "Software / Flashing",
                  "iPhone Hardware",
                  "iPhone Software",
                  "Chip-level Repair",
                  "All-round Technician",
                ].map((v) => (
                  <div className="form-check" key={v}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      value={v}
                      onChange={(e) => handleCheckbox(e, "skills")}
                    />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}

                <label className={`mt-3 ${errors.brands ? "text-danger" : ""}`}>
                  Brands You Can Handle
                </label>
                {["Samsung", "Xiaomi", "Oppo / Vivo", "Apple", "All brands"].map(
                  (v) => (
                    <div className="form-check" key={v}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        value={v}
                        onChange={(e) => handleCheckbox(e, "brands")}
                      />
                      <label className="form-check-label">{v}</label>
                    </div>
                  )
                )}

                <label className={`mt-3 ${errors.tools ? "text-danger" : ""}`}>
                  Tools & Machines
                </label>
                {[
                  "Soldering Station",
                  "DC Power Supply",
                  "Microscope",
                  "Hot Air",
                  "OCA Laminator",
                  "Separator Machine",
                  "Back Glass Machine",
                  "Software Tools",
                ].map((v) => (
                  <div className="form-check" key={v}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      value={v}
                      onChange={(e) => handleCheckbox(e, "tools")}
                    />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}
              </>
            )}

            {/* ================= STEP 3 ================= */}
          {step === 3 && (
  <>
    <h6 className="text-danger fw-bold mb-3">
      Job Preference & Availability
    </h6>

    {/* Preferred Job Type */}
    <div className="mb-3">
      <label className={errors.jobType ? "text-danger" : ""}>
        Preferred Job Type
      </label>
      <div>
        {["Full-time", "Part-time", "Daily / On-call"].map((v) => (
          <label key={v} className="me-3">
            <input
              type="radio"
              name="jobType"
              value={v}
              onChange={handleChange}
            />{" "}
            {v}
          </label>
        ))}
      </div>
    </div>

    {/* Expected Payment */}
    {!form.paymentType && (
  <small className="text-muted d-block mt-1">
    Please select Daily or Monthly to enter expected salary
  </small>
)}

<div className="mb-3">
  <label className={errors.paymentType ? "text-danger" : ""}>
    Expected Payment Type
  </label>

  <div className="d-flex gap-4 mt-1">
    <div className="form-check">
      <input
        className="form-check-input"
        type="radio"
        name="paymentType"
        value="Daily"
        checked={form.paymentType === "Daily"}
        onChange={handleChange}
      />
      <label className="form-check-label">Daily</label>
    </div>

    <div className="form-check">
      <input
        className="form-check-input"
        type="radio"
        name="paymentType"
        value="Monthly"
        checked={form.paymentType === "Monthly"}
        onChange={handleChange}
      />
      <label className="form-check-label">Monthly</label>
    </div>
  </div>
</div>




{/* Expected Salary / Wage */}
{form.paymentType && (
  <div className="mb-3">
    <label className={errors.expectedSalary ? "text-danger" : ""}>
      {form.paymentType === "Daily"
        ? "Expected Daily Wage (₹)"
        : "Expected Monthly Salary (₹)"}
    </label>

    <input
      type="number"
      className={`form-control ${
        errors.expectedSalary ? "border-danger" : ""
      }`}
      name="expectedSalary"
      placeholder={
        form.paymentType === "Daily"
          ? "Eg: 800"
          : "Eg: 20000"
      }
      value={form.expectedSalary}
      onChange={handleChange}
    />
  </div>
)}


    {/* Preferred Working Location */}
    <div className="mb-3">
      <label className={errors.workLocation ? "text-danger" : ""}>
        Preferred Working Location
      </label>
      <div>
        {[
          "Same district",
          "Nearby districts",
          "Anywhere in TN / Pondicherry",
        ].map((v) => (
          <label key={v} className="me-3">
            <input
              type="radio"
              name="workLocation"
              value={v}
              onChange={handleChange}
            />{" "}
            {v}
          </label>
        ))}
      </div>
    </div>

    {/* Ready to Join */}
    <div className="mb-3">
      <label className={errors.joinReady ? "text-danger" : ""}>
        Ready to Join
      </label>
      <div>
        {["Yes", "No", "Notice Period"].map((v) => (
          <label key={v} className="me-3">
            <input
              type="radio"
              name="joinReady"
              value={v}
              onChange={handleChange}
            />{" "}
            {v}
          </label>
        ))}
      </div>
    </div>

    {/* Agree to Radnus */}
    <div className="mb-3">
      <label className={errors.radnusAgree ? "text-danger" : ""}>
        Agree to Radnus Placement?
      </label>
      <div>
        <label className="me-3">
          <input
            type="radio"
            name="radnusAgree"
            value="Yes"
            onChange={handleChange}
          />{" "}
          Yes
        </label>
        <label>
          <input
            type="radio"
            name="radnusAgree"
            value="No"
            onChange={handleChange}
          />{" "}
          No
        </label>
      </div>
    </div>

    {/* Remarks (optional) */}
    <div className="mb-3">
      <label>Additional Skills / Remarks (optional)</label>
      <textarea
        className="form-control"
        rows="3"
        name="remarks"
        onChange={handleChange}
      />
    </div>
  </>
)}

            <div className="d-flex justify-content-between mt-4">
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
                  onClick={() => {
                    if (validateStep()) setStep(step + 1);
                  }}
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

export default TechnicianForm;
