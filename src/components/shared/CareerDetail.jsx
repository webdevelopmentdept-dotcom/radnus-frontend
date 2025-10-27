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
import jobsData from "../jobsData";

const CareerDetail = () => {
  const { jobTitle } = useParams();
  const decodedTitle = decodeURIComponent(jobTitle);
  const job = jobsData.find((j) => j.title === decodedTitle);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
    about: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

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
        alert("Please upload a PDF or Word document only.");
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormSubmitted(true);
  };

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

              {/* Application Form */}
              <div className="p-4 rounded shadow-sm">
                <h5 className="fw-semibold mb-3 text-danger">
                  Apply For the Job
                </h5>
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
                      <Form.Label>Upload Resume (Pdf, Doc, Docx)</Form.Label>
                      <Form.Control
                        type="file"
                        name="resume"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        placeholder="Resume"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>About Yourself</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="about"
                        rows={4}
                        value={formData.about}
                        onChange={handleChange}
                        placeholder="Briefly introduce yourself..."
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
