import React, { useState, useEffect } from "react";
import TrainingFormimg from "../../images/trainingform.webp";

const TrainingForm = ({ course, onCloseForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    address: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Automatically set course if passed from props
  useEffect(() => {
    if (course) setFormData((prev) => ({ ...prev, course }));
  }, [course]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Validation
  const validate = () => {
    const newErrors = {};
    if (!/^[a-zA-Z\s]+$/.test(formData.name))
      newErrors.name = "Name can contain only letters and spaces";
    if (!/^[6-9]\d{9}$/.test(formData.phone))
      newErrors.phone = "Enter a valid 10-digit Indian phone number";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.course) newErrors.course = "Select a course";
    return newErrors;
  };

  // ✅ Google Ads conversion tracking
  const trackConversion = (eventLabel) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/your_conversion_label_here", // 🔁 Replace with your real conversion label
        event_label: eventLabel,
      });
      console.log("✅ Conversion tracked:", eventLabel);
    } else {
      console.log("⚠️ gtag not found for:", eventLabel);
    }
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${API_BASE}/api/applicants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ Fire Google Ads conversion on successful submission
        trackConversion(`Form Submitted - ${formData.course}`);
        setSubmitted(true);
      } else {
        alert(data.msg || "Error submitting form");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  // ✅ Reset / close
  const handleBack = () => {
    setSubmitted(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      course: "",
      address: "",
    });
    setErrors({});
    if (onCloseForm) onCloseForm();
  };

  return (
    <section
      className="vw-100 vh-100 d-flex align-items-center justify-content-center text-white"
      style={{
        backgroundImage: `url(${TrainingFormimg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="bg-dark bg-opacity-75 p-4 rounded-4 shadow-lg"
        style={{ width: "90%", maxWidth: "480px" }}
      >
        {submitted ? (
          <div className="text-center py-5">
            <h3 className="text-warning fw-bold">
              You're In! Admission Request Received
            </h3>
            <p>Awesome! Your learning journey just kicked off.</p>
            <button
              className="btn mt-3"
              style={{ background: "red", color: "white" }}
              onClick={handleBack}
            >
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-center mb-4 fw-bold text-danger">
              Admission Form
            </h2>

            {/* Name */}
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your Name"
                required
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your Email"
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your Number"
                required
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
            </div>

            {/* Address */}
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className={`form-control ${errors.address ? "is-invalid" : ""}`}
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder="Enter your Address"
                required
              />
              {errors.address && (
                <div className="invalid-feedback">{errors.address}</div>
              )}
            </div>

            {/* Course */}
            <div className="mb-4">
              <label className="form-label">Select Course</label>
              <select
                name="course"
                className={`form-select ${errors.course ? "is-invalid" : ""}`}
                value={formData.course}
                onChange={handleChange}
                required
              >
                <option value="">-- Choose a course --</option>
                <option value="LASP">LASP</option>
                <option value="SEMP">SEMP</option>
                <option value="SEMP (Hybrid)">SEMP (Hybrid)</option>
              </select>
              {errors.course && (
                <div className="invalid-feedback">{errors.course}</div>
              )}
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="btn fw-bold px-4"
                style={{ background: "#a37878", color: "white" }}
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default TrainingForm;
