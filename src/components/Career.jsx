import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import {
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillAlt,
  FaUserTie,
} from "react-icons/fa";

// Images
import careerBg from "../images/careerbg.webp";
import img1 from "../images/aboutbackground.webp";
import img2 from "../images/cimg2.webp";
import img3 from "../images/cimg3.webp";
import img4 from "../images/cimg1.webp";
import img5 from "../images/venam.webp";
import img6 from "../images/slider1.webp";

const Career = ({ jobsData }) => {
  const images = [img1, img2, img3, img4, img5, img6];

  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");

  // Time Ago function
  const getTimeAgo = (date) => {
    if (!date) return "N/A";
    const postedDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));

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

  // Filter Jobs
  const filteredJobs = jobsData.filter((job) => {
    return (
      (department === "" || job.type === department) &&
      (experience === "" || job.experience === experience) &&
      (jobType === "" ||
        job.duration.toLowerCase().includes(jobType.toLowerCase()))
    );
  });

  return (
    <>
      <Helmet>
        <title>Careers at Radnus Communication | Join Our Team</title>
        <meta
          name="description"
          content="Explore exciting career opportunities at Radnus Communication in Puducherry."
        />
      </Helmet>

      {/* Hero */}
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
          <h1 className="display-5 fw-bold mb-3">Join Our Team</h1>
          <p className="lead" style={{ maxWidth: "450px" }}>
            Be part of <strong>Radnus</strong> and grow your career with us.
          </p>
        </div>
      </section>

      {/* Work Section */}
      <section className="work-section py-4">
        <div className="container">
          <h2 className="fw-bold mb-3">Work at Radnus</h2>
          <p className="fs-5 mb-4" style={{ lineHeight: "1.6" }}>
            At Radnus, we innovate, collaborate and create opportunities that
            transform careers and technology.
          </p>

          {/* Masonry Grid */}
          <div className="masonry-grid">
            {images.map((imgSrc, index) => (
              <div className="masonry-item" key={index}>
                <img
                  src={imgSrc}
                  alt={`Culture ${index + 1}`}
                  className="img-fluid"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="bg-light py-5">
        <div className="container text-center mb-5">
          <h2 className="fw-bold fs-3">Open Positions</h2>
          <p className="fs-6">Explore exciting opportunities to grow with us.</p>
        </div>

        {/* Filter */}
        <Row className="mb-5 justify-content-center">
          <Col md={3} sm={6} className="mb-3">
            <Form.Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option>Business Development & Sales</option>
              <option>Sales & Marketing</option>
              <option>IT & Infrastructure</option>
                  <option>Accounts & Finance</option>
              <option>Inventory & Store Operations</option> 
            </Form.Select>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Form.Select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">Experience Level</option>
              <option>Fresher</option>
              <option>0-1 Years</option>
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
                        <FaMapMarkerAlt className="me-1" /> {job.type}
                      </span>
                      <span>
                        <FaClock className="me-1" /> {job.duration}
                      </span>
                      <span>
                        <FaMoneyBillAlt className="me-1" />{" "}
                        {job.salary || "N/A"}
                      </span>
                      <span>
                        <FaUserTie className="me-1" /> {job.experience}
                      </span>
                    </div>
                  </div>

                  <div className="text-end mt-3 mt-md-0">
                    <Link
                      to={`/careers/${encodeURIComponent(job.title)}`}
                      className="btn btn-outline-danger px-4 fw-semibold"
                    >
                      View
                    </Link>

                    <p className="mt-2 text-muted small mb-0">
                      Posted {getTimeAgo(job.posted)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <h5 className="text-center text-secondary py-5">
              No matching positions found
            </h5>
          )}
        </div>
      </section>

      {/* Masonry CSS */}
      <style>{`
       
        .masonry-grid {
  column-count: 3;
  column-gap: 20px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 20px;
}

.masonry-item img {
  width: 100%;
  height: auto;      /* IMPORTANT — keep natural height */
  object-fit: contain;
  border-radius: 12px;
  display: block;
}

      `}</style>
    </>
  );
};

export default Career;
