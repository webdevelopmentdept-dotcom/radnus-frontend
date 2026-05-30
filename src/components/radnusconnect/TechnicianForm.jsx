import { useState } from "react";
import tnDistrictData from "./TnDistrictData";
import { useNavigate } from "react-router-dom";

// ✅ All India States list
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

function TechnicianForm() {
  const navigate = useNavigate();

  // ✅ Mobile pre-check screen states
  const [mobileScreen, setMobileScreen]     = useState(true);
  const [mobileInput, setMobileInput]       = useState("");
  const [mobileChecking, setMobileChecking] = useState(false);
  const [mobileError, setMobileError]       = useState("");

  // Form states
  const [step, setStep]                   = useState(1);
  const [submitted, setSubmitted]         = useState(false);
  const [errors, setErrors]               = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [otherDistrict, setOtherDistrict] = useState("");
  const [otherTaluk, setOtherTaluk]       = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false); // ✅ name+district duplicate

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    address: "",
    state: "",       // ✅ new field
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

  const API = import.meta.env.VITE_API_BASE_URL;

  // ✅ Mobile pre-check handler
  const handleMobileCheck = async () => {
    const mobile = mobileInput.trim();
    if (!mobile || mobile.length < 10) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setMobileChecking(true);
    setMobileError("");
    try {
      const res  = await fetch(`${API}/api/technician/check-mobile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.exists) {
        setMobileError("already_registered"); // special flag
      } else {
        // Mobile clear — load form with mobile pre-filled
        setForm((p) => ({ ...p, mobile }));
        setMobileScreen(false);
      }
    } catch {
      setMobileError("Server error. Please try again.");
    } finally {
      setMobileChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((p) => ({ ...p, [name]: false }));

    if (name === "state") {
      // Reset district/taluk when state changes
      setForm((p) => ({ ...p, [name]: value, district: "", taluk: "" }));
      setSelectedDistrict("");
    }

    if (name === "district") {
      setSelectedDistrict(value);
      setForm((p) => ({ ...p, [name]: value, taluk: "" }));
    }

    if (name === "paymentType") {
      setForm((p) => ({ ...p, [name]: value, expectedSalary: "" }));
    }
  };

  // ✅ name + district duplicate check (called on Step 1 Next)
  const checkNameDistrictDuplicate = async (name, district) => {
    try {
      const res  = await fetch(`${API}/api/technician/check-duplicate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName: name, district }),
      });
      const data = await res.json();
      return data.exists;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        district: form.district === "Others" ? otherDistrict : form.district,
        taluk:    form.taluk    === "Others" ? otherTaluk    : form.taluk,
      };

      const res = await fetch(`${API}/api/technician`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 409) {
        setMobileError("already_registered");
        setMobileScreen(true);
        return;
      }
      if (data.success) setSubmitted(true);
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

  /* ================= VALIDATION ================= */
  const isInvalidValue = (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value !== "string") return false;
    const v = value.trim();
    return v === "" || v === "-" || v === "--" || v === "---";
  };

  const hasLetter = (value) => /[a-zA-Z]/.test(value);

  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (isInvalidValue(form.fullName) || !hasLetter(form.fullName))
        newErrors.fullName = true;
      if (isInvalidValue(form.mobile))
        newErrors.mobile = true;
      if (isInvalidValue(form.address) || !hasLetter(form.address))
        newErrors.address = true;
      if (isInvalidValue(form.state))
        newErrors.state = true;
      if (isInvalidValue(form.district))
        newErrors.district = true;
      if (isInvalidValue(form.taluk))
        newErrors.taluk = true;
      if (isInvalidValue(form.experience) || form.experience === "Select")
        newErrors.experience = true;
    }

    if (step === 2) {
      if (!form.skills  || form.skills.length  === 0) newErrors.skills  = true;
      if (!form.brands  || form.brands.length  === 0) newErrors.brands  = true;
      if (!form.tools   || form.tools.length   === 0) newErrors.tools   = true;
    }

    if (step === 3) {
      if (isInvalidValue(form.jobType))      newErrors.jobType      = true;
      if (isInvalidValue(form.paymentType))  newErrors.paymentType  = true;
      if (form.paymentType && isInvalidValue(form.expectedSalary))
        newErrors.expectedSalary = true;
      if (isInvalidValue(form.workLocation)) newErrors.workLocation = true;
      if (isInvalidValue(form.joinReady))    newErrors.joinReady    = true;
      if (isInvalidValue(form.radnusAgree))  newErrors.radnusAgree  = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1 Next — validate + duplicate check
  const handleStep1Next = async () => {
    if (!validateStep()) return;

    const districtVal = form.district === "Others" ? otherDistrict : form.district;
    if (form.fullName && districtVal) {
      const isDuplicate = await checkNameDistrictDuplicate(form.fullName, districtVal);
      if (isDuplicate) {
        setDuplicateWarning(true);
        return;
      }
    }
    setDuplicateWarning(false);
    setStep(2);
  };

  /* ================= THANK YOU PAGE ================= */
  if (submitted) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#fbe9ea" }}>
        <div className="bg-white p-5 rounded shadow text-center">
          <h3 className="text-danger fw-bold mb-3">Thank You!</h3>
          <p>Your technician profile has been submitted successfully.</p>
          <button className="btn btn-danger" onClick={() => navigate("/radnus-connect")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ================= MOBILE PRE-CHECK SCREEN ================= */
  if (mobileScreen) {
    return (
      <>
        <style>{`
          body { background: linear-gradient(135deg,#fff 0%,#fbe9ea 45%,#fff 100%); min-height:100vh; }
          .header { background:#d71920; color:white; }
        `}</style>

        <div className="header py-3 shadow-sm">
          <div className="container">
            <h4 className="fw-bold mb-0">Radnus Connect</h4>
            <small>Mobile Service Technician – Registration</small>
          </div>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="bg-white p-5 rounded shadow" style={{ maxWidth: 420, width: "100%" }}>

            {mobileError === "already_registered" ? (
              /* ── Already Registered Screen ── */
              <div className="text-center">
                <div style={{ fontSize: 48 }}>⚠️</div>
                <h5 className="text-danger fw-bold mt-3">Already Registered!</h5>
                <p className="text-muted mt-2">
                  This mobile number is already registered.
                </p>
                <button
                  className="btn btn-danger mt-3"
                  onClick={() => navigate("/radnus-connect")}
                >
                  Back to Home
                </button>
              </div>
            ) : (
              /* ── Mobile Entry Screen ── */
              <>
                <h5 className="fw-bold text-danger mb-1">Start Registration</h5>
                <p className="text-muted small mb-4">
                  Enter your WhatsApp / Mobile number to continue.
                </p>

                <label className="form-label fw-semibold" style={{ fontSize: ".85rem" }}>
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  className={`form-control mb-2 ${mobileError ? "border-danger" : ""}`}
                  placeholder="Eg: 9876543210"
                  maxLength={10}
                  value={mobileInput}
                  onChange={(e) => { setMobileInput(e.target.value); setMobileError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleMobileCheck()}
                />
                {mobileError && mobileError !== "already_registered" && (
                  <small className="text-danger">{mobileError}</small>
                )}

                <button
                  className="btn btn-danger w-100 mt-3"
                  onClick={handleMobileCheck}
                  disabled={mobileChecking}
                >
                  {mobileChecking ? "Checking..." : "Continue →"}
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ================= DUPLICATE SCREEN ================= */
  if (duplicateWarning) {
    return (
      <>
        <style>{`
          body { background: linear-gradient(135deg,#fff 0%,#fbe9ea 45%,#fff 100%); min-height:100vh; }
          .header { background:#d71920; color:white; }
        `}</style>
        <div className="header py-3 shadow-sm">
          <div className="container">
            <h4 className="fw-bold mb-0">Radnus Connect</h4>
            <small>Mobile Service Technician – Registration</small>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="bg-white p-5 rounded shadow text-center" style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h5 className="text-danger fw-bold mt-3">Already Registered!</h5>
            <p className="text-muted mt-2">
              This name and district is already registered.
            </p>
            <button
              className="btn btn-danger mt-3"
              onClick={() => navigate("/radnus-connect")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ================= MAIN FORM ================= */
  const isTN = form.state === "Tamil Nadu";

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
        .line { flex:1;height:4px;background:#dee2e6;margin:0 8px;border-radius:2px; }
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
          <div className={`circle ${step >= 1 ? "active" : ""}`}>1</div>
          <div className={`line ${step >= 2 ? "active" : ""}`} />
          <div className={`circle ${step >= 2 ? "active" : ""}`}>2</div>
          <div className={`line ${step >= 3 ? "active" : ""}`} />
          <div className={`circle ${step >= 3 ? "active" : ""}`}>3</div>
        </div>
      </div>

      <div className="container my-5" style={{ maxWidth: "900px" }}>
        <div className="card-box">

          <form>
            {/* ================= STEP 1 ================= */}
            {step === 1 && (
              <>
                <h6 className="text-danger fw-bold mb-3">Personal & Location Details</h6>

                <label className={errors.fullName ? "text-danger" : ""}>Full Name</label>
                <input
                  className={`form-control mb-3 ${errors.fullName ? "border-danger" : ""}`}
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />

                <label className={errors.mobile ? "text-danger" : ""}>Mobile / WhatsApp</label>
                <input
                  className={`form-control mb-3 ${errors.mobile ? "border-danger" : ""}`}
                  name="mobile"
                  value={form.mobile}
                  readOnly  /* ✅ pre-filled from mobile screen, readonly */
                  style={{ background: "#f8f9fa" }}
                />

                <label className={errors.address ? "text-danger" : ""}>Residential Address</label>
                <textarea
                  className={`form-control mb-3 ${errors.address ? "border-danger" : ""}`}
                  name="address"
                  rows="3"
                  value={form.address}
                  onChange={handleChange}
                />

                {/* ✅ State dropdown */}
                <label className={errors.state ? "text-danger" : ""}>State</label>
                <select
                  className={`form-select mb-3 ${errors.state ? "border-danger" : ""}`}
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* District — TN: dropdown, Others: free text */}
                <label className={errors.district ? "text-danger" : ""}>District</label>
                {isTN ? (
                  <>
                    <select
                      className={`form-select mb-3 ${errors.district ? "border-danger" : ""}`}
                      name="district"
                      value={form.district}
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
                        className="form-control mb-3"
                        placeholder="Enter District Name"
                        value={otherDistrict}
                        onChange={(e) => setOtherDistrict(e.target.value)}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    className={`form-control mb-3 ${errors.district ? "border-danger" : ""}`}
                    name="district"
                    placeholder="Enter district name"
                    value={form.district}
                    disabled={!form.state}
                    onChange={handleChange}
                  />
                )}

                {/* Taluk — TN: dropdown, Others: free text */}
                <label className={errors.taluk ? "text-danger" : ""}>Taluk / Area</label>
                {isTN ? (
                  <>
                    <select
                      className={`form-select mb-3 ${errors.taluk ? "border-danger" : ""}`}
                      name="taluk"
                      value={form.taluk}
                      disabled={!selectedDistrict}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {selectedDistrict && selectedDistrict !== "Others" &&
                        tnDistrictData[selectedDistrict]?.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      <option value="Others">Others</option>
                    </select>
                    {form.taluk === "Others" && (
                      <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Enter Taluk / Area"
                        value={otherTaluk}
                        onChange={(e) => setOtherTaluk(e.target.value)}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    className={`form-control mb-3 ${errors.taluk ? "border-danger" : ""}`}
                    name="taluk"
                    placeholder="Enter taluk / area"
                    value={form.taluk}
                    disabled={!form.district}
                    onChange={handleChange}
                  />
                )}

                <label className={errors.experience ? "text-danger" : ""}>Total Experience</label>
                <select
                  className={`form-select ${errors.experience ? "border-danger" : ""}`}
                  name="experience"
                  value={form.experience}
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
                <h6 className="text-danger fw-bold mb-3">Skills & Technical Capability</h6>

                <label className={errors.skills ? "text-danger" : ""}>Primary Skills</label>
                {["Hardware (Android)","Software / Flashing","iPhone Hardware","iPhone Software","Chip-level Repair","All-round Technician"].map((v) => (
                  <div className="form-check" key={v}>
                    <input type="checkbox" className="form-check-input" value={v} onChange={(e) => handleCheckbox(e, "skills")} />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}

                <label className={`mt-3 ${errors.brands ? "text-danger" : ""}`}>Brands You Can Handle</label>
                {["Samsung","Xiaomi","Oppo / Vivo","Apple","All brands"].map((v) => (
                  <div className="form-check" key={v}>
                    <input type="checkbox" className="form-check-input" value={v} onChange={(e) => handleCheckbox(e, "brands")} />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}

                <label className={`mt-3 ${errors.tools ? "text-danger" : ""}`}>Tools & Machines</label>
                {["Soldering Station","DC Power Supply","Microscope","Hot Air","OCA Laminator","Separator Machine","Back Glass Machine","Software Tools"].map((v) => (
                  <div className="form-check" key={v}>
                    <input type="checkbox" className="form-check-input" value={v} onChange={(e) => handleCheckbox(e, "tools")} />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}
              </>
            )}

            {/* ================= STEP 3 ================= */}
            {step === 3 && (
              <>
                <h6 className="text-danger fw-bold mb-3">Job Preference & Availability</h6>

                <div className="mb-3">
                  <label className={errors.jobType ? "text-danger" : ""}>Preferred Job Type</label>
                  <div>
                    {["Full-time","Part-time","Daily / On-call"].map((v) => (
                      <label key={v} className="me-3">
                        <input type="radio" name="jobType" value={v} onChange={handleChange} /> {v}
                      </label>
                    ))}
                  </div>
                </div>

                {!form.paymentType && (
                  <small className="text-muted d-block mt-1">
                    Please select Daily or Monthly to enter expected salary
                  </small>
                )}

                <div className="mb-3">
                  <label className={errors.paymentType ? "text-danger" : ""}>Expected Payment Type</label>
                  <div className="d-flex gap-4 mt-1">
                    {["Daily","Monthly"].map((v) => (
                      <div className="form-check" key={v}>
                        <input className="form-check-input" type="radio" name="paymentType" value={v} checked={form.paymentType === v} onChange={handleChange} />
                        <label className="form-check-label">{v}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {form.paymentType && (
                  <div className="mb-3">
                    <label className={errors.expectedSalary ? "text-danger" : ""}>
                      {form.paymentType === "Daily" ? "Expected Daily Wage (₹)" : "Expected Monthly Salary (₹)"}
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.expectedSalary ? "border-danger" : ""}`}
                      name="expectedSalary"
                      placeholder={form.paymentType === "Daily" ? "Eg: 800" : "Eg: 20000"}
                      value={form.expectedSalary}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className={errors.workLocation ? "text-danger" : ""}>Preferred Working Location</label>
                  <div>
                    {["Same district","Nearby districts","Anywhere in TN / Pondicherry"].map((v) => (
                      <label key={v} className="me-3">
                        <input type="radio" name="workLocation" value={v} onChange={handleChange} /> {v}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className={errors.joinReady ? "text-danger" : ""}>Ready to Join</label>
                  <div>
                    {["Yes","No","Notice Period"].map((v) => (
                      <label key={v} className="me-3">
                        <input type="radio" name="joinReady" value={v} onChange={handleChange} /> {v}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className={errors.radnusAgree ? "text-danger" : ""}>Agree to Radnus Placement?</label>
                  <div>
                    {["Yes","No"].map((v) => (
                      <label key={v} className="me-3">
                        <input type="radio" name="radnusAgree" value={v} onChange={handleChange} /> {v}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label>Additional Skills / Remarks (optional)</label>
                  <textarea className="form-control" rows="3" name="remarks" onChange={handleChange} />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="d-flex justify-content-between mt-4">
              {step > 1 && (
                <button type="button" className="btn btn-outline-danger" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-danger ms-auto"
                  onClick={step === 1 ? handleStep1Next : () => { if (validateStep()) setStep(step + 1); }}
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