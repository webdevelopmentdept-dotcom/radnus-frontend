import React, { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaWhatsapp,
} from "react-icons/fa";

function RadnusFooter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("⚠️ Please enter your email.");
    } else {
      setMessage("Thank you for joining! We’ll keep you updated.");
      setEmail("");
    }
  };

  return (
    <footer id="contact">
      <div
        className="text-white py-2"
        style={{
          background: "linear-gradient(135deg, #c8102e, #8b0e1c)",
          borderTopLeftRadius: "40px",
          borderTopRightRadius: "40px",
        }}
      >
        <Container>
          {/* Top Row */}
          <Row className="align-items-center mb-3">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <img
                src="https://static.wixstatic.com/media/86316b_38b937020dcc47beb619e58eef059c56~mv2.png/v1/fill/w_128,h_46,al_c,q_85,usm_0.66_1.00_0.01/86316b_38b937020dcc47beb619e58eef059c56~mv2.png"
                alt="Radnus Logo"
                height="40"
              />
              <p className="mt-2 mb-1 fs-6">
                Shaping Futures in Mobile Technology and Service.
              </p>
              <h6 className="mt-1 fs-6 fw-bold text-dark">
                Placement Partner –{" "}
                <span className="text-warning">Poorvika</span>
              </h6>
            </Col>

            <Col md={6} className="text-center">
              <h6 className="mb-1">Get Career & Training Updates</h6>
              <Form
                className="d-flex justify-content-center align-items-center mb-1"
                onSubmit={handleSubmit}
              >
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="me-2"
                  style={{
                    width: "220px",
                    height: "34px",
                    fontSize: "0.85rem",
                  }}
                  required
                />
                <Button
                  type="submit"
                  variant="light"
                  className="text-danger fw-bold px-2 py-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Join
                </Button>
              </Form>

              {message && (
                <p
                  className={`fs-6  mb-0 ${
                    message.includes("") ? "text-warning fw-bold" : "text-white"
                  }`}
                >
                  {message}
                </p>
              )}
            </Col>
          </Row>

          {/* Bottom Row */}
          <Row className="gy-2 gx-1">
            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-1 " style={{ fontSize: "1.1rem" }}>
                Quick Links
              </h6>
              <Link className="footer-link d-block" to="/">
                Home
              </Link>
              <Link className="footer-link d-block" to="/about">
                Who We Are
              </Link>
              <Link className="footer-link d-block" to="/academy">
                What We Do
              </Link>
              <Link className="footer-link d-block" to="/careers">
                Career
              </Link>
            </Col>

            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
                Services
              </h6>
              <Link className="footer-link d-block" to="/academy">
                Academy
              </Link>
              <Link className="footer-link d-block" to="/whitelabel">
                OEM
              </Link>
              <Link className="footer-link d-block" to="/tools-tech">
                Tools
              </Link>
              <Link className="footer-link d-block" to="/service">
                Service
              </Link>
            </Col>

            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-1">More</h6>
              <Link className="footer-link d-block" to="/accessories">
                Accessories
              </Link>
              <Link className="footer-link d-block" to="/startup">
                Startup
              </Link>
            </Col>

            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
                Career & Insights
              </h6>
              <Link className="footer-link d-block" to="/placement">
                Placement
              </Link>
              <Link className="footer-link d-block" to="/timeline">
                Timeline
              </Link>
            </Col>
            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>
                Contact
              </h6>

              <div className="d-flex align-items-center contact-item mb-2">
                <FaMapMarkerAlt className="text-light me-2 flex-shrink-0 contact-icon" />
                <a
                  href="https://www.google.com/maps/place/Radnus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link text-light text-decoration-none w-100 contact-text"
                >
                  Sinnaya Plaza, MG Road, Puducherry
                </a>
              </div>

              <div className="d-flex align-items-center contact-item mb-2">
                <FaPhoneAlt className="text-light me-2 flex-shrink-0 contact-icon" />
                <a
                  href="tel:+91940973030"
                  className="footer-link text-light text-decoration-none w-100 contact-text"
                >
                  +91 91940973030
                </a>
              </div>

              <div className="d-flex align-items-center contact-item mb-2">
                <FaEnvelope className="text-light me-2 flex-shrink-0 contact-icon" />
                <a
                  href="mailto:sundar12134@gmail.com"
                  className="footer-link text-light text-decoration-none w-100 contact-text"
                >
                  sundar12134@gmail.com
                </a>
              </div>

              <style>
                {`
  /* 📱 Mobile (<576px) */
  @media (max-width: 576px) {
    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: unset !important;
      font-size: 1rem !important;  /* ✅ bigger text */
      line-height: 1.4;
    }

    .contact-icon {
      width: 18px !important;   /* ✅ slightly bigger icon */
      height: 18px !important;
      flex-shrink: 0;
    }

    .contact-text {
      display: inline-block;
      width: auto !important;
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: unset !important;
    }
  `}
              </style>
            </Col>

            <Col md={2} xs={12}>
              <h6 className="fw-bold mb-1 " style={{ fontSize: "1.1rem" }}>
                Follow Us
              </h6>
              <div className="d-flex gap-4 justify-content-md-start justify-content-center mt-2 mb-3 fs-5">
                <a
                  href="https://facebook.com/radnus.cellphone.training"
                  target="_blank"
                  className="text-white"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://instagram.com/radnus_cellphone_training/"
                  target="_blank"
                  className="text-white"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://linkedin.com/in/radnus-communication-470b7a327"
                  target="_blank"
                  className="text-white"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href="https://www.youtube.com/results?search_query=radnus+pondicherry"
                  target="_blank"
                  className="text-white"
                >
                  <FaYoutube />
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919940973030&text=Hi%20Radnus%20Team!%20I%20would%20like%20to%20know%20more%20about%20your%20training."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white"
                >
                  <FaWhatsapp />
                </a>
              </div>
            </Col>
          </Row>

          <div className="text-center  fs-6 text-light">
            © 2025 All Rights Reserved by Radnus.
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default RadnusFooter;
