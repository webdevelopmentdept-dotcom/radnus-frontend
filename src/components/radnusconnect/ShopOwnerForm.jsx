import { useState } from "react";
import tnDistrictData from "./TnDistrictData";
import { useNavigate } from "react-router-dom";

// All India States
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

function ShopOwnerForm() {
  const navigate = useNavigate();

  // ✅ Mobile pre-check screen states
  const [mobileScreen, setMobileScreen]     = useState(true);
  const [mobileInput, setMobileInput]       = useState("");
  const [mobileChecking, setMobileChecking] = useState(false);
  const [mobileError, setMobileError]       = useState("");

  // ✅ Duplicate (shopName + district) screen
  const [duplicateScreen, setDuplicateScreen] = useState(false);

  const [step, setStep]                         = useState(1);
  const [submitted, setSubmitted]               = useState(false);
  const [errors, setErrors]                     = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [submitting, setSubmitting]             = useState(false);
  const [otherDistrict, setOtherDistrict]       = useState("");
  const [otherTaluk, setOtherTaluk]             = useState("");

  const [form, setForm] = useState({
    shopName:          "",
    ownerName:         "",
    mobile:            "",
    state:             "", // ✅ new
    district:          "",
    taluk:             "",
    address:           "",
    businessYears:     "",
    needTech:          "",
    technicianTypes:   [],
    jobType:           "",
    experience:        "",
    paymentType:       "",
    salaryRange:       "",
    workingHours:      "",
    foodAccommodation: "",
    toolsSetup:        "",
    machines:          [],
    timeline:          "",
    skills:            "",
    radnusHire:        "",
    remarks:           "",
  });

  const API = import.meta.env.VITE_API_BASE_URL;

  /* ── Mobile pre-check ── */
  const handleMobileCheck = async () => {
    const mobile = mobileInput.trim();
    if (!mobile || mobile.length < 10) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setMobileChecking(true);
    setMobileError("");
    try {
      const res  = await fetch(`${API}/api/shop-owner/check-mobile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.exists && !data.canReapply) {
        setMobileError("already_registered");
      } else {
        setForm((p) => ({ ...p, mobile }));
        setMobileScreen(false);
      }
    } catch {
      setMobileError("Server error. Please try again.");
    } finally {
      setMobileChecking(false);
    }
  };

  /* ── Shop name + district duplicate check (Step 1 Next) ── */
  const checkShopDuplicate = async (shopName, district) => {
    try {
      const res  = await fetch(`${API}/api/shop-owner/check-duplicate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shopName, district }),
      });
      const data = await res.json();
      return data; // { exists, canReapply }
    } catch {
      return { exists: false };
    }
  };

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: false }));

    if (name === "state") {
      setForm((p) => ({ ...p, [name]: value, district: "", taluk: "" }));
      setSelectedDistrict("");
    }
    if (name === "district") {
      setSelectedDistrict(value);
      setForm((p) => ({ ...p, [name]: value, taluk: "" }));
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

  /* ── Validation ── */
  const isInvalidValue = (value) => {
    if (!value) return true;
    const v = value.trim();
    return v === "" || v === "-" || v === "--";
  };

  const hasLetter = (value) => /[a-zA-Z]/.test(value);

  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (isInvalidValue(form.shopName)  || !hasLetter(form.shopName))  newErrors.shopName  = true;
      if (isInvalidValue(form.ownerName) || !hasLetter(form.ownerName)) newErrors.ownerName = true;
      if (isInvalidValue(form.mobile))     newErrors.mobile        = true;
      if (isInvalidValue(form.state))      newErrors.state         = true;
      if (isInvalidValue(form.district))   newErrors.district      = true;
      if (isInvalidValue(form.taluk))      newErrors.taluk         = true;
      if (isInvalidValue(form.businessYears)) newErrors.businessYears = true;
      if (isInvalidValue(form.needTech))   newErrors.needTech      = true;
    }

    if (step === 2) {
      if (!form.technicianTypes || form.technicianTypes.length === 0) newErrors.technicianTypes = true;
      if (isInvalidValue(form.jobType))        newErrors.jobType        = true;
      if (isInvalidValue(form.experience) || form.experience === "Select") newErrors.experience = true;
      if (isInvalidValue(form.paymentType))    newErrors.paymentType    = true;
      if (isInvalidValue(form.salaryRange))    newErrors.salaryRange    = true;
      if (isInvalidValue(form.workingHours))   newErrors.workingHours   = true;
      if (isInvalidValue(form.foodAccommodation)) newErrors.foodAccommodation = true;
    }

    if (step === 3) {
      if (isInvalidValue(form.toolsSetup)) newErrors.toolsSetup = true;
      if (!form.machines || form.machines.length === 0) newErrors.machines = true;
      if (isInvalidValue(form.timeline))   newErrors.timeline   = true;
      if (isInvalidValue(form.radnusHire)) newErrors.radnusHire = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Step 1 Next — validate + shop duplicate check ── */
  const handleStep1Next = async () => {
    if (!validateStep()) return;

    const districtVal = form.district === "Others" ? otherDistrict : form.district;
    if (form.shopName && districtVal) {
      const result = await checkShopDuplicate(form.shopName, districtVal);
      if (result.exists && !result.canReapply) {
        setDuplicateScreen(true);
        return;
      }
    }
    setStep(2);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        district:       form.district === "Others" ? otherDistrict : form.district,
        taluk:          form.taluk    === "Others" ? otherTaluk    : form.taluk,
        technicianTypes: form.technicianTypes || [],
        machines:        form.machines        || [],
      };

      const res  = await fetch(`${API}/api/shop-owner`, {
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
      else alert(data.message || "Submit failed");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const isTN = form.state === "Tamil Nadu";

  /* ── Already Registered Screen (reused for mobile + duplicate) ── */
  const AlreadyRegisteredScreen = () => (
    <>
      <style>{`
        body { background: linear-gradient(135deg,#fff 0%,#fbe9ea 45%,#fff 100%); min-height:100vh; }
        .header { background:#d71920; color:white; }
      `}</style>
      <div className="header py-3 shadow-sm">
        <div className="container">
          <h4 className="fw-bold mb-0">Radnus Connect</h4>
          <small>Mobile Shop Owner – Technician Requirement</small>
        </div>
      </div>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="bg-white p-5 rounded shadow text-center" style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h5 className="text-danger fw-bold mt-3">Already Registered!</h5>
          <p className="text-muted mt-2">
            This shop is already registered.
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

  /* ── Thank You ── */
  if (submitted) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="bg-white p-4 rounded shadow text-center">
          <h4 className="text-danger fw-bold">Thank You!</h4>
          <p>Your requirement submitted successfully.</p>
          <button className="btn btn-danger" onClick={() => navigate("/radnus-connect")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ── Duplicate screen ── */
  if (duplicateScreen) return <AlreadyRegisteredScreen />;

  /* ── Mobile pre-check screen ── */
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
            <small>Mobile Shop Owner – Technician Requirement</small>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="bg-white p-5 rounded shadow" style={{ maxWidth: 420, width: "100%" }}>
            {mobileError === "already_registered" ? (
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

  /* ── Main Form ── */
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
          animation:fade .35s ease;
        }
        @keyframes fade {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:none; }
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
          <div className={`circle ${step >= 1 ? "active" : ""}`}>1</div>
          <div className={`line   ${step >= 2 ? "active" : ""}`} />
          <div className={`circle ${step >= 2 ? "active" : ""}`}>2</div>
          <div className={`line   ${step >= 3 ? "active" : ""}`} />
          <div className={`circle ${step >= 3 ? "active" : ""}`}>3</div>
        </div>
      </div>

      <div className="container my-5" style={{ maxWidth: "900px" }}>
        <div className="card-box">
          <form>

            {/* ═════════════ STEP 1 ═════════════ */}
            {step === 1 && (
              <>
                <h6 className="text-danger fw-bold mb-3">Shop & Business Details</h6>
                <div className="row g-3">

                  <div className="col-md-6">
                    <label className={errors.shopName ? "text-danger" : ""}>Shop Name</label>
                    <input
                      className={`form-control ${errors.shopName ? "border-danger" : ""}`}
                      name="shopName"
                      value={form.shopName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className={errors.ownerName ? "text-danger" : ""}>Owner Name</label>
                    <input
                      className={`form-control ${errors.ownerName ? "border-danger" : ""}`}
                      name="ownerName"
                      value={form.ownerName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className={errors.mobile ? "text-danger" : ""}>Mobile / WhatsApp</label>
                    <input
                      className={`form-control ${errors.mobile ? "border-danger" : ""}`}
                      name="mobile"
                      value={form.mobile}
                      readOnly
                      style={{ background: "#f8f9fa" }}
                    />
                  </div>

                  {/* ✅ State dropdown */}
                  <div className="col-md-6">
                    <label className={errors.state ? "text-danger" : ""}>State</label>
                    <select
                      className={`form-select ${errors.state ? "border-danger" : ""}`}
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                    >
                      <option value="">Select State</option>
                      {INDIA_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div className="col-md-6">
                    <label className={errors.district ? "text-danger" : ""}>District</label>
                    {isTN ? (
                      <>
                        <select
                          className={`form-select ${errors.district ? "border-danger" : ""}`}
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
                            className="form-control mt-2"
                            placeholder="Enter District Name"
                            value={otherDistrict}
                            onChange={(e) => setOtherDistrict(e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        className={`form-control ${errors.district ? "border-danger" : ""}`}
                        name="district"
                        placeholder="Enter district name"
                        value={form.district}
                        disabled={!form.state}
                        onChange={handleChange}
                      />
                    )}
                  </div>

                  {/* Taluk */}
                  <div className="col-md-6">
                    <label className={errors.taluk ? "text-danger" : ""}>Taluk</label>
                    {isTN ? (
                      <>
                        <select
                          className={`form-select ${errors.taluk ? "border-danger" : ""}`}
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
                            className="form-control mt-2"
                            placeholder="Enter Taluk / Area"
                            value={otherTaluk}
                            onChange={(e) => setOtherTaluk(e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        className={`form-control ${errors.taluk ? "border-danger" : ""}`}
                        name="taluk"
                        placeholder="Enter taluk / area"
                        value={form.taluk}
                        disabled={!form.district}
                        onChange={handleChange}
                      />
                    )}
                  </div>

                  <div className="col-md-12">
                    <label>Shop Address</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className={errors.businessYears ? "text-danger" : ""}>Years in Business</label>
                    <select
                      className={`form-select ${errors.businessYears ? "border-danger" : ""}`}
                      name="businessYears"
                      value={form.businessYears}
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

                  <div className="col-md-6">
                    <label className={errors.needTech ? "text-danger" : ""}>Need Technician?</label>
                    <br />
                    <input type="radio" name="needTech" value="Yes" onChange={handleChange} /> Yes
                    <input type="radio" className="ms-3" name="needTech" value="No" onChange={handleChange} /> No
                  </div>

                </div>
              </>
            )}

            {/* ═════════════ STEP 2 ═════════════ */}
            {step === 2 && (
              <>
                <h6 className="text-danger fw-bold mb-3">Technician & Salary Details</h6>

                <label className={errors.technicianTypes ? "text-danger" : ""}>Technician Type</label>
                {["Hardware","Software / Unlocking","iPhone Specialist","All-round"].map((v) => (
                  <div className="form-check" key={v}>
                    <input type="checkbox" className="form-check-input" value={v}
                      onChange={(e) => handleCheckbox(e, "technicianTypes")} />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}
                <hr />

                <label className={errors.jobType ? "text-danger" : ""}>Job Type</label><br />
                {["Full-time","Part-time","On-call"].map((v) => (
                  <span key={v} className="me-3">
                    <input type="radio" name="jobType" value={v} onChange={handleChange} /> {v}
                  </span>
                ))}
                <hr />

                <label className={errors.experience ? "text-danger" : ""}>Experience</label>
                <select
                  className={`form-select mb-3 ${errors.experience ? "border-danger" : ""}`}
                  name="experience"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Fresher</option>
                  <option>1–2 years</option>
                  <option>3–5 years</option>
                  <option>Any experience</option>
                </select>

                <label className={errors.paymentType ? "text-danger" : ""}>Payment Type</label><br />
                <input type="radio" name="paymentType" value="Daily Wage"      onChange={handleChange} /> Daily
                <input type="radio" className="ms-3" name="paymentType" value="Monthly Salary" onChange={handleChange} /> Monthly

                <div className="row mt-3">
                  <div className="col-md-6">
                    <label className={errors.salaryRange ? "text-danger" : ""}>Salary Range</label>
                    <input
                      className={`form-control ${errors.salaryRange ? "border-danger" : ""}`}
                      name="salaryRange"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className={errors.workingHours ? "text-danger" : ""}>Working Hours</label>
                    <input
                      className={`form-control ${errors.workingHours ? "border-danger" : ""}`}
                      name="workingHours"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <label className={`mt-3 ${errors.foodAccommodation ? "text-danger" : ""}`}>
                  Food / Accommodation
                </label><br />
                <input type="radio" name="foodAccommodation" value="Yes" onChange={handleChange} /> Yes
                <input type="radio" className="ms-3" name="foodAccommodation" value="No" onChange={handleChange} /> No
              </>
            )}

            {/* ═════════════ STEP 3 ═════════════ */}
            {step === 3 && (
              <>
                <h6 className="text-danger fw-bold mb-3">Tools & Final Details</h6>

                <label className={errors.toolsSetup ? "text-danger" : ""}>Tools Setup</label>
                <select
                  className={`form-select mb-3 ${errors.toolsSetup ? "border-danger" : ""}`}
                  name="toolsSetup"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Complete setup</option>
                  <option>Partial setup</option>
                  <option>No tools</option>
                </select>

                <label className={errors.machines ? "text-danger" : ""}>Machines Available</label>
                {["Soldering Station","DC Power Supply","Microscope","Hot Air","OCA","Separator","Back Glass"].map((v) => (
                  <div className="form-check" key={v}>
                    <input type="checkbox" className="form-check-input" value={v}
                      onChange={(e) => handleCheckbox(e, "machines")} />
                    <label className="form-check-label">{v}</label>
                  </div>
                ))}

                <label className={`mt-3 ${errors.timeline ? "text-danger" : ""}`}>When Needed?</label>
                <select
                  className={`form-select ${errors.timeline ? "border-danger" : ""}`}
                  name="timeline"
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option>Immediately</option>
                  <option>Within 1 week</option>
                  <option>Within 1 month</option>
                </select>

                <label className="mt-3">Brand / Skill Requirement</label>
                <textarea className="form-control" rows="3" name="skills" onChange={handleChange} />

                <div className="mt-3">
                  <label className={errors.radnusHire ? "text-danger" : ""}>Hire via Radnus?</label><br />
                  <input type="radio" name="radnusHire" value="Yes" onChange={handleChange} /> Yes
                  <input type="radio" className="ms-3" name="radnusHire" value="No" onChange={handleChange} /> No
                </div>

                <div className="mt-3">
                  <label>Remarks</label>
                  <textarea className="form-control" rows="3" name="remarks" onChange={handleChange} />
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="mt-4 d-flex justify-content-between">
              {step > 1 && (
                <button type="button" className="btn btn-outline-danger"
                  onClick={() => setStep(step - 1)}>
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

export default ShopOwnerForm;