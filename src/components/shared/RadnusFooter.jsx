import React, { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[0-9]{10}$/.test(trimmed);

    if (!trimmed) {
      setMessage("⚠️ Please enter your email or phone number.");
      return;
    }

    if (!isEmail && !isPhone) {
      setMessage("⚠️ Enter a valid email or 10-digit phone number.");
      return;
    }

    try {
      // ✅ Google Apps Script Web App URL
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzW8jH7iNgOV0Iu1AIDEStTy_dlxd4pwhciOaJ_D2gDczZ8q3NhNzTlwC4iC1ZKNhUp/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        }
      );

      // ✅ No need to parse since CORS is “no-cors”
      setMessage("✅ Thank you for joining! Your info is saved successfully.");
      setEmail("");
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Something went wrong. Please try again later.");
    }
  };

  return (
    <footer id="contact">
      {/* ======= MAIN RED FOOTER ======= */}
      <div
        className="text-white py-1"
        style={{
          background: "linear-gradient(135deg, #c8102e, #8b0e1c)",
          borderTopLeftRadius: "40px",
          borderTopRightRadius: "40px",
        }}
      >
        <Container>
          {/* Top Row */}
          <Row className="align-items-center mb-3 mt-3">
            {/* LEFT LOGO SECTION */}
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <img
                src="https://static.wixstatic.com/media/86316b_38b937020dcc47beb619e58eef059c56~mv2.png/v1/fill/w_128,h_46,al_c,q_85,usm_0.66_1.00_0.01/86316b_38b937020dcc47beb619e58eef059c56~mv2.png"
                alt="Radnus Logo"
                height="50"
              />
              <p className="mt-2 mb-1 fs-6">
                Shaping Futures in Mobile Technology and Service.
              </p>
              <h6 className="mt-1 fs-6 text-dark">
                Placement Partner –{" "}
                <span className="text-warning">Poorvika</span>
              </h6>
            </Col>

            {/* RIGHT FORM SECTION */}
            <Col md={6} className="text-center mt-2">
              <h6 className="mb-3 fs-5">Get Career & Training Updates</h6>
              <Form
                className="d-flex justify-content-center align-items-center mb-1"
                onSubmit={handleSubmit}
              >
                <Form.Control
                  type="text"
                  placeholder="Enter your email or 10-digit phone number"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="me-2"
                  style={{
                    width: "420px",
                    height: "45px",
                    fontSize: "1rem",
                    borderRadius: "8px",
                  }}
                  required
                />
                <Button
                  type="submit"
                  variant="light"
                  className="text-danger"
                  style={{
                    fontSize: "1.1rem",
                    height: "45px",
                    padding: "0 30px",
                    borderRadius: "8px",
                    fontWeight: "600",
                  }}
                >
                  Join
                </Button>
              </Form>

              {message && (
                <p
                  className={`fs-6 mb-0 ${
                    message.includes("⚠️") ? "text-warning" : "text-white"
                  }`}
                >
                  {message}
                </p>
              )}
            </Col>
          </Row>
        </Container>

        {/* ======= CONTACT + FOLLOW US ======= */}
        <Container>
          <Row className="align-items-start text-center text-md-start">
            {/* LEFT COLUMN - CONTACT INFO */}
            <Col md={6} className="mb-4 mb-md-0">
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>
                Contact
              </h6>

              <div className="d-flex align-items-center contact-item mb-2">
                <FaMapMarkerAlt className="text-light me-2 flex-shrink-0 contact-icon" />
                <a
                  href="https://www.google.com/maps/search/Radnus/@11.9342037,79.8111248,14z?entry=s&sa=X&ved=1t%3A199789"
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
                  href="tel:+919940973030"
                  className="footer-link text-light text-decoration-none w-100 contact-text"
                >
                  +91 9940973030
                </a>
              </div>

              <div className="d-flex align-items-center contact-item mb-2">
                <FaEnvelope className="text-light me-2 flex-shrink-0 contact-icon" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=sundar12134@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link text-light text-decoration-none w-100 contact-text"
                >
                  sundar12134@gmail.com
                </a>
              </div>
            </Col>

            {/* RIGHT COLUMN - FOLLOW US */}
            <Col md={6}>
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>
                Follow Us
              </h6>
              <div className="d-flex gap-4 justify-content-md-start justify-content-center fs-4">
                <a
                  href="https://facebook.com/radnus.cellphone.training"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light hover-icon"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://instagram.com/radnus_cellphone_training/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light hover-icon"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://linkedin.com/in/radnus-communication-470b7a327"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light hover-icon"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href="https://www.youtube.com/results?search_query=radnus+pondicherry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light hover-icon"
                >
                  <FaYoutube />
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919940973030&text=Hi%20Radnus%20Team!%20I%20would%20like%20to%20know%20more%20about%20your%20training."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light hover-icon"
                >
                  <FaWhatsapp />
                </a>
              </div>
            </Col>
          </Row>
        </Container>

        {/* ======= STYLES ======= */}
        <style>
          {`
          .footer-link {
            color: #ffffff !important;
            text-decoration: none;
            cursor: pointer;
          }
          .footer-link:hover {
            color: #ffc107 !important;
            text-decoration: underline;
          }
          .contact-item a {
            pointer-events: auto;
          }
          .hover-icon:hover {
            color: #ffc107 !important;
            transform: scale(1.2);
            transition: all 0.3s ease-in-out;
          }
          .contact-item {
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }
          .contact-item .contact-icon {
            width: 20px;
            min-width: 20px;
            text-align: center;
          }
          .contact-item .contact-text {
            margin-left: 10px;
            display: inline-block;
            text-align: left;
            word-break: break-word;
          }

          /* ===== MOBILE VIEW FIXES ===== */
          @media (max-width: 768px) {
            .contact-item {
              justify-content: center !important;
            }
            .contact-item .contact-text {
              margin-left: 8px;
              text-align: left;
            }
            form input[type="text"] {
              width: 100% !important;
              height: 50px !important;
              font-size: 1rem !important;
              padding: 10px !important;
            }
            form button {
              height: 50px !important;
              font-size: 1rem !important;
              padding: 0 25px !important;
            }
            .fs-4 {
              margin-bottom: 25px !important;
            }
            footer .text-center.fs-6 {
              padding-bottom: 10px;
            }
          }
        `}
        </style>

        {/* ======= COPYRIGHT SECTION ======= */}
        <div className="text-center fs-6 text-light">
          © 2025 All Rights Reserved by Radnus.
        </div>
      </div>
    </footer>
  );
}

export default RadnusFooter;
