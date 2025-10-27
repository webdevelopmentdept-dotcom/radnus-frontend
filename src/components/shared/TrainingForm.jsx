import React, { useState, useEffect } from "react";
import TrainingFormimg from "../../images/TrainingForm.png";

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

  // Initialize course prop correctly
  useEffect(() => {
    if (course) setFormData((prev) => ({ ...prev, course }));
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!/^[a-zA-Z\s]+$/.test(formData.name))
      newErrors.name = "Name can contain only letters and spaces";
    if (!/^[6-9]\d{9}$/.test(formData.phone))
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number starting with 6-9";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.course) newErrors.course = "Select a course";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      // Fetch token from localStorage
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/applicants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }), // attach token if exists
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        if (res.status === 401) {
          // token invalid or expired
          alert("Session expired. Please login again.");
          localStorage.removeItem("token"); // remove old token
          window.location.href = "/login"; // optional redirect
        } else {
          alert(data.msg || "Error submitting form");
        }
      }
    } catch (err) {
      alert("Server error");
    }
  };

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
              style={{ background: "red" }}
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

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your number"
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className={`form-control ${errors.address ? "is-invalid" : ""}`}
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder="Enter your address"
                required
              />
              {errors.address && (
                <div className="invalid-feedback">{errors.address}</div>
              )}
            </div>

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
                className="btn fw-bold px-4 submitbtn"
                style={{ background: "#a37878" }}
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
