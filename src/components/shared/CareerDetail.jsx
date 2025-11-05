import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaMoneyBillAlt,
  FaClock,
  FaGlobe,
} from "react-icons/fa";
import Swal from "sweetalert2";
import jobsData from "../jobsData";

const CareerDetail = () => {
  const { jobTitle } = useParams();
  const decodedTitle = decodeURIComponent(jobTitle);
  const job = jobsData.find((j) => j.title === decodedTitle);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    resume: null,
    about: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // ✅ Backend URL (from .env)
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "error",
          title: "Invalid File Type",
          text: "Please upload a PDF or Word document only.",
          confirmButtonColor: "#dc3545",
        });
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pondicherry validation
    if (
      !formData.location ||
      formData.location.toLowerCase().trim() !== "pondicherry"
    ) {
      Swal.fire({
        icon: "warning",
        title: "Location Restriction",
        text: "Sorry, only candidates from Pondicherry are preferred for this position.",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    // Prepare FormData for file upload
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("location", formData.location);
    data.append("about", formData.about);
    data.append("resume", formData.resume);
    data.append("jobTitle", job.title);

    try {
      const res = await fetch(`${API_BASE}/api/hr/apply`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.msg || "Failed to submit application.",
          confirmButtonColor: "#dc3545",
        });
        return;
      }

      setFormSubmitted(true);

      Swal.fire({
        icon: "success",
        title: "Application Submitted!",
        text: "Thank you! Your application has been submitted successfully.",
        confirmButtonColor: "#198754",
      });

      // ✅ Google Ads Conversion Tracking
      if (typeof window.gtag === "function") {
        window.gtag("event", "conversion", {
          send_to: "AW-16969684439/your_conversion_label_here", // 🔁 Replace with your real conversion label
          event_label: `Job Application Submitted - ${job.title}`,
        });
        console.log(`✅ Conversion tracked: Job Application - ${job.title}`);
      } else {
        console.warn(
          "⚠️ gtag not found — check if Google Ads script is loaded"
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong. Please try again later.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  // If job not found
  if (!job) {
    return (
      <section className="py-5 text-center">
        <h3 className="text-danger">Job Not Found</h3>
        <Link to="/careers">← Back to All Positions</Link>
      </section>
    );
  }

  return (
    <>
      <br />
      <section className="py-5 bg-light ">
        <div className="container">
          <Link
            to="/careers"
            className="text-decoration-none text-danger mb-4 d-inline-block fw-semibold"
          >
            ← Back to All Jobs
          </Link>

          <div className="row">
            {/* Left Sidebar - Company Info */}
            <div className="col-lg-4 mb-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <h5 className="fw-semibold mb-3 text-danger">About Radnus</h5>
                <p className="text-muted">
                  Radnus is a leading mobile service and training organization
                  with over 20 years of industry experience. Founded in 2003 by
                  Sundar, Radnus has been at the forefront of innovation, trust,
                  and technical expertise in the mobile sector. We have trained
                  and empowered thousands of professionals, bridging the gap
                  between industry needs and skilled talent while consistently
                  advancing technological excellence.
                </p>
                <ul className="list-unstyled text-muted">
                  <li>
                    <FaGlobe className="me-2" />
                    Website:{" "}
                    <a
                      href="https://www.radnus.in/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-danger"
                    >
                      radnus.in
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Main Content - Job Details */}
            <div className="col-lg-8">
              <div className="p-4 rounded shadow-sm mb-4">
                <h2 className="fw-bold mb-3">{job.title}</h2>
                <div className="text-muted small mb-3 d-flex flex-wrap gap-3">
                  <span>
                    <FaMapMarkerAlt className="me-1 text-dark" />{" "}
                    {job.location || "Hybrid"}
                  </span>
                  <span>
                    <FaBriefcase className="me-1 text-dark" /> {job.duration}
                  </span>
                  <span>
                    <FaMoneyBillAlt className="me-1 text-dark" /> {job.salary}
                  </span>
                  <span>
                    <FaClock className="me-1 text-dark" /> {job.experience}
                  </span>
                </div>

                <h4 className="fw-semibold mb-2 text-danger">
                  Job Description
                </h4>
                <p className="text-muted">{job.description}</p>

                {job.responsibilities?.length > 0 && (
                  <>
                    <h5 className="fw-semibold mt-4 mb-2">Responsibilities:</h5>
                    <ul className="text-muted">
                      {job.responsibilities.map((res, idx) => (
                        <li key={idx}>{res}</li>
                      ))}
                    </ul>
                  </>
                )}

                {job.requirements?.length > 0 && (
                  <>
                    <h5 className="fw-semibold mt-4 mb-2">Requirements:</h5>
                    <ul className="text-muted">
                      {job.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Application Section */}
              <div className="p-4 rounded shadow-sm">
                <h5 className="fw-semibold mb-3 text-danger">
                  Apply For the Job
                </h5>

                <p className="text-muted mb-3">
                  <strong>Note:</strong> Only candidates from{" "}
                  <span className="text-danger fw-semibold">Pondicherry</span>{" "}
                  are preferred for this position.
                </p>

                {formSubmitted ? (
                  <div className="alert alert-success">
                    Thank you! Your application has been submitted successfully.
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit} style={{ fontSize: "14px" }}>
                    <Form.Group className="mb-3 ">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Current Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter your city (Only Pondicherry candidates preferred)"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Upload Resume (PDF, DOC, DOCX)</Form.Label>
                      <Form.Control
                        type="file"
                        name="resume"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        placeholder="Resume"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="danger"
                      style={{ fontSize: "14px" }}
                    >
                      Submit Application
                    </Button>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CareerDetail;
