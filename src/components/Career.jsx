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




const Career = ({ jobsData }) => {
  const images = ["https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016578/newabout_b8iiuk.webp", "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016369/careerimg1_dxnprm.webp", "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016369/careerimg2_byg1r6.webp", "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016370/careerimg5_ao8cvi.webp", "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016369/careerimg3_mecscz.webp"];

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

      {/* HERO */}
      <section
        className="career-hero d-flex align-items-center"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016368/careerbg_kmhop6.webp)`,
          height: "50vh",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div
          className="position-absolute w-100 h-100"
          style={{ background: "rgba(0,0,0,0.4)" }}
        />
        <div className="container position-relative text-white">
          <h1 className="display-5 fw-bold mb-3">Join Our Team</h1>
          <p className="lead" style={{ maxWidth: "450px" }}>
            Be part of <strong>Radnus</strong> and grow your career with us.
          </p>
        </div>
      </section>

      {/* WORK SECTION */}
      <section className="work-section py-4">
        <div className="container">
          <h2 className="fw-bold mb-3">Work at Radnus</h2>
          <p className="fs-5 mb-4" style={{ lineHeight: "1.6" }}>
            At Radnus, we innovate, collaborate and create opportunities that
            transform careers and technology.
          </p>

          {/* MASONRY GRID */}
          <div className="masonry-grid">
            {images.map((imgSrc, index) => (
              <div className="masonry-item" key={index}>
              <img src={imgSrc} alt={`Culture ${index + 1}`} loading="lazy" decoding="async" />

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS */}
      <section className="bg-light py-5">
        <div className="container text-center mb-5">
          <h2 className="fw-bold fs-3">Open Positions</h2>
          <p className="fs-6">Explore exciting opportunities to grow with us.</p>
        </div>

        {/* FILTER */}
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

        {/* JOB CARDS */}
        <div className="row justify-content-center">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <div className="col-12 col-md-10 col-lg-8 mb-4" key={index}>
                <div className="card border-0 shadow-sm p-4 d-flex flex-md-row justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold mb-2">{job.title}</h5>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      <span>
                        <FaMapMarkerAlt /> {job.type}
                      </span>
                      <span>
                        <FaClock /> {job.duration}
                      </span>
                      <span>
                        <FaMoneyBillAlt /> {job.salary || "N/A"}
                      </span>
                      <span>
                        <FaUserTie /> {job.experience}
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

      {/* MASONRY CSS */}
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
          height: auto;
          border-radius: 12px;
          display: block;
        }

        /* TABLET */
        @media (max-width: 992px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        /* MOBILE – ONE IMAGE PER ROW */
        @media (max-width: 576px) {
          .masonry-grid {
            column-count: 1;
          }
        }
      `}</style>
    </>
  );
};

export default Career;
