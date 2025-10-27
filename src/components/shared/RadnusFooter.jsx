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
              <p className="mt-2 mb-1 small">
                Shaping Futures in Mobile Technology and Service.
              </p>
              <h6 className="mt-1 fw-bold text-dark">
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
                  className={`small mb-0 ${
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
              <h6 className="fw-bold mb-1">Quick Links</h6>
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
              <h6 className="fw-bold mb-1">Services</h6>
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
              <h6 className="fw-bold mb-1">Career & Insights</h6>
              <Link className="footer-link d-block" to="/placement">
                Placement
              </Link>
              <Link className="footer-link d-block" to="/timeline">
                Timeline
              </Link>
            </Col>
            <Col md={2} xs={6}>
              <h6 className="fw-bold mb-1">Contact</h6>

              <div className="d-flex align-items-center mb-1">
                <FaMapMarkerAlt className="me-2 text-white" size={16} />
                <a
                  href="https://www.google.com/maps/place/Radnus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Sinnaya Plaza, MG Road, Puducherry
                </a>
              </div>

              <div className="d-flex align-items-center mb-1">
                <FaPhoneAlt className="me-2 text-white" size={16} />
                <a href="tel:+91940973030" className="footer-link">
                  +91 91940973030
                </a>
              </div>

              <div className="d-flex align-items-center mb-1">
                <FaEnvelope className="me-2 text-white" size={16} />
                <a href="mailto:sundar12134@gmail.com" className="footer-link">
                  sundar12134
                  <span className="d-none d-md-inline">
                    <br />
                  </span>
                  @gmail.com
                </a>
              </div>
            </Col>

            <Col md={2} xs={12}>
              <h6 className="fw-bold mb-1">Follow Us</h6>
              <div className="d-flex gap-3 justify-content-md-start justify-content-center mt-2">
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
                  href="https://wa.me/91940973030"
                  target="_blank"
                  className="text-white"
                >
                  <FaWhatsapp />
                </a>
              </div>
            </Col>
          </Row>

          <div className="text-center  small text-light">
            © 2025 All Rights Reserved by Radnus.
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default RadnusFooter;
