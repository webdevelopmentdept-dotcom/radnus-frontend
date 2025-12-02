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
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const trimmed = phone.trim();
  //   if (!/^[0-9]{10}$/.test(trimmed)) {
  //     setMessage("⚠️ Enter a valid 10-digit phone number.");
  //     return;
  //   }

  //   const SCRIPT_URL =
  //     "https://script.google.com/macros/s/AKfycbzwO3RVgZsXUPP42wPPQryGxibnddRDcV1vHXWhroY6ZCxZKx0m2pnyeR72kO4QF1hn/exec";

  //   try {
  //     const fd = new FormData();
  //     fd.append("phone", trimmed);

  //     await fetch(SCRIPT_URL, {
  //       method: "POST",
  //     });

  //     setMessage("✅ Thank you for joining! Your info is saved successfully.");
  //     setPhone("");
  //     setTimeout(() => {
  //       if (typeof window.gtag === "function") {
  //         window.gtag("event", "conversion", {
  //           send_to: "AW-16969684439/jDhoCNWL_7obENer45s_",
  //           event_label: "Join Newsletter - Footer Success",
  //         });
  //         console.log("🔥 Conversion tracked!");
  //       }
  //     }, 300);
  //   } catch (err) {
  //     console.error(err);
  //     setMessage("❌ Something went wrong. Please try again later.");
  //   }
  // };
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const trimmed = phone.trim();
  //   if (!/^[0-9]{10}$/.test(trimmed)) {
  //     setMessage("⚠️ Enter valid phone");
  //     return;
  //   }

  //   try {
  //     const formData = new FormData();
  //     formData.append("phone", trimmed);

  //     await fetch(
  //       "https://script.google.com/macros/s/AKfycbyB3IIhZz1PusN5MPwdIQ8rB8vyArpStbF-KTdOv-FwGN1WSr7VFDtvuQNElNVbRj-B/exec",
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );

  //     setMessage("✅ Saved successfully!");
  //     setPhone("");
  //   } catch (err) {
  //     console.error(err);
  //     setMessage("❌ Something went wrong");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = phone.trim();
    if (!/^[0-9]{10}$/.test(trimmed)) {
      setMessage("⚠️ Enter valid phone");
      return;
    }

    try {
      const body = new URLSearchParams();
      body.append("phone", trimmed);

      // Save fetch response in a variable
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyyN8eqXdN8DwxK4FIZpxLJpA87-XkJKSDTomZSVARflb8AYMM0peGve2cIR_L8XRCT/exec",

        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );

      // Parse the JSON response
      const data = await response.json();
      console.log(data);

      if (data.status === "success") {
        setMessage("✅ Saved successfully!");
        setPhone("");

        setTimeout(() => {
          if (typeof window.gtag === "function") {
            window.gtag("event", "conversion", {
              send_to: "AW-16969684439/jDhoCNWL_7obENer45s_",
              event_label: "Join Newsletter - Footer Success",
            });
            console.log("🔥 Conversion tracked!");
          }
        }, 300);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong");
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
          <Row className="align-items-center mb-3 mt-3">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <img
                className="mb-2"
                src="https://static.wixstatic.com/media/86316b_38b937020dcc47beb619e58eef059c56~mv2.png"
                alt="Radnus Logo"
                height="50"
              />
              <p className="mt-2 mb-1" style={{ fontSize: "1.1rem" }}>
                Shaping Futures in Mobile Technology and Service.
              </p>
              <h6 className="mt-1" style={{ fontSize: "1.1rem" }}>
                Placement Partner –{" "}
                <span className="text-warning">Poorvika</span>
              </h6>
            </Col>

            {/* FORM */}
            <Col md={6} className="text-center mt-2">
              <h6 className="mb-3 fs-5">Get Career & Training Updates</h6>

              <Form
                className="d-flex justify-content-center align-items-center mb-1"
                onSubmit={handleSubmit}
              >
                <Form.Control
                  type="text"
                  placeholder="Enter your 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="me-2"
                  style={{
                    width: "420px",
                    height: "45px",
                    fontSize: "1rem",
                    borderRadius: "8px",
                  }}
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
                    message.includes("⚠️")
                      ? "text-warning"
                      : message.includes("❌")
                      ? "text-danger"
                      : "text-white"
                  }`}
                >
                  {message}
                </p>
              )}
            </Col>
          </Row>
        </Container>

        {/* CONTACT + FOLLOW */}
        <Container>
          <Row className="align-items-start text-center text-md-start">
            <Col md={6} className="mb-4 mb-md-0">
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>
                Contact
              </h6>

              <div className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="text-light me-2" />
                <a
                  href="https://www.google.com/maps/search/Radnus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light"
                >
                  Sinnaya Plaza, MG Road, Puducherry
                </a>
              </div>

              <div className="d-flex align-items-center mb-2">
                <FaPhoneAlt className="text-light me-2" />
                <a href="tel:+919940973030" className="text-light">
                  +91 9940973030
                </a>
              </div>

              <div className="d-flex align-items-center mb-2">
                <FaEnvelope className="text-light me-2" />
                <a href="mailto:sundar12134@gmail.com" className="text-light">
                  sundar12134@gmail.com
                </a>
              </div>
            </Col>

            {/* FOLLOW */}
            <Col md={6}>
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>
                Follow Us
              </h6>

              <div className="d-flex gap-4 fs-4 justify-content-center justify-content-md-start">
                <a
                  className="text-light"
                  href="https://facebook.com/radnus.cellphone.training"
                >
                  <FaFacebookF />
                </a>
                <a
                  className="text-light"
                  href="https://instagram.com/radnus_cellphone_training/"
                >
                  <FaInstagram />
                </a>
                <a
                  className="text-light"
                  href="https://linkedin.com/in/radnus-communication-470b7a327"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  className="text-light"
                  href="https://www.youtube.com/results?search_query=radnus+pondicherry"
                >
                  <FaYoutube />
                </a>
                <a
                  className="text-light"
                  href="https://api.whatsapp.com/send?phone=919940973030"
                >
                  <FaWhatsapp />
                </a>
              </div>
            </Col>
          </Row>
        </Container>

        <div className="text-center text-light mb-3">
          © 2025 All Rights Reserved by Radnus.
        </div>
      </div>
    </footer>
  );
}

export default RadnusFooter;
