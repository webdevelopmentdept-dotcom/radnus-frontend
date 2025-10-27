import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Row, Col } from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillAlt,
  FaUserTie,
} from "react-icons/fa";
import careerBg from "../images/careerBg.webp";
import img1 from "../images/AboutBackground.jpg";
import img2 from "../images/Cimg2.jpg";
import img3 from "../images/Cimg3.jpg";
import img4 from "../images/Cimg1.jpg";
import img5 from "../images/Venam.jpeg";
import img6 from "../images/Slider1.jpg";

const Career = ({ jobsData }) => {
  const images = [img1, img2, img3, img4, img5, img6];

  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");

  // ✅ Calculate "time ago"
  const getTimeAgo = (date) => {
    if (!date) return "N/A"; // fallback for missing date
    const postedDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));

    if (isNaN(diffDays)) return "Invalid date";
    if (diffDays < 1) return "Today";
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffDays < 365)
      return `${Math.floor(diffDays / 30)} month${
        Math.floor(diffDays / 30) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 365)} year${
      Math.floor(diffDays / 365) > 1 ? "s" : ""
    } ago`;
  };

  const filteredJobs = jobsData.filter((job) => {
    return (
      (department === "" || job.type === department) &&
      (experience === "" || job.experience === experience) &&
      (jobType === "" || job.duration === jobType)
    );
  });

  return (
    <>
      {/* Hero section */}
      <section
        className="career-hero d-flex align-items-center"
        style={{
          backgroundImage: `url(${careerBg})`,
          height: "50vh",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div
          className="position-absolute w-100 h-100"
          style={{ background: "rgba(0,0,0,0.4)" }}
        ></div>
        <div className="container position-relative text-white">
          <h1 className="display-5  fs-bold mb-3">Join Our Team</h1>
          <p className="lead mb-4" style={{ maxWidth: "450px" }}>
            Be part of <strong>Radnus</strong> leading mobile service, repair,
            and technical training.
          </p>
        </div>
      </section>

      {/* Work at Radnus */}
      <section className="work-section py-2">
        <div className="container">
          <div className="row mb-2">
            <div className="col-12 col-md-10">
              <div className="pe-2">
                <h2 className="fs-3 fw-bold mb-2">Work at Radnus</h2>
              </div>
              <p className="fs-5" style={{ lineHeight: "1.6" }}>
                At Radnus, we don’t just repair and train — we innovate,
                collaborate, and create opportunities that transform technology
                and people alike.
              </p>
            </div>
          </div>

          <div className="masonry-grid">
            {images.map((imgSrc, index) => (
              <div className="masonry-item" key={index}>
                <img
                  src={imgSrc}
                  alt={`Culture ${index + 1}`}
                  className="img-fluid w-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-roles" className="py-3 bg-light">
        <div className="container text-center mb-5">
          <h2 className="fw-bold mb-3 fs-3">Open Positions</h2>
          <p className="fs-6">
            Explore exciting opportunities to grow your career with us.
          </p>
        </div>

        {/* Filter */}
        <Row className="mb-5 justify-content-center">
          <Col md={3} sm={6} className="mb-3">
            <Form.Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option>Design & Creative</option>
              <option>Sales & Marketing</option>
              <option>Customer Support / Telecalling</option>
              <option>Business Development</option>
              <option>Software & Web Development</option>
              <option>Human Resources</option>
            </Form.Select>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Form.Select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">Experience Level</option>
              <option>Fresher</option>
              <option>1–3 Years</option>
              <option>3–5 Years</option>
            </Form.Select>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Form.Select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="">Job Type</option>
              <option>Full-Time</option>
              <option>Internship</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Job Cards */}
        <div className="row justify-content-center">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <div className="col-12 col-md-10 col-lg-8 mb-4" key={index}>
                <div className="card border-0 shadow-sm p-4 d-flex flex-md-row justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold mb-2 text-dark">{job.title}</h5>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span>
                        <FaMapMarkerAlt className="me-1 text-dark" /> {job.type}
                      </span>
                      <span>
                        <FaClock className="me-1 text-dark" /> {job.duration}
                      </span>
                      <span>
                        <FaMoneyBillAlt className="me-1 text-dark" />{" "}
                        {job.salary}
                      </span>
                      <span>
                        <FaUserTie className="me-1 text-dark" />{" "}
                        {job.experience}
                      </span>
                    </div>
                  </div>
                  <div className="text-end mt-3 mt-md-0">
                    <Link
                      to={`/careers/${encodeURIComponent(job.title)}`}
                      className="btn btn-outline-danger px-4 fw-semibold"
                    >
                      Apply Now
                    </Link>
                    <p className="mt-2 text-muted small mb-0">
                      Posted {getTimeAgo(job.posted)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-secondary py-5">
              <h5 className="fw-semibold mb-2">No matching positions found</h5>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Career;
