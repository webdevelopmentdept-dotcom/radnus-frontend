
import React from "react";
import bgImage from "../images/homebackground1.webp";
import illustration from "../images/metricsimag4.webp";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import bg1Image from "../images/bg2.webp";
import UpcomingEventsPopup from "./UpcomingEventsPopup";
function RadnusHome() {
  const stats = [
    { end: 8500, label: "Students Trained" },
    { end: 500, label: "PMEGP loan for startup" },
    { end: 50000, label: "Mobile Delivered" },
    { end: 8000, label: "Mobile Shops Empowered" },
    { end: 20, label: "Years in Industry" },
    { end: 3, label: "Major Telecom Partners" },
  ];

  const services = [
    { title: "Academy", path: "/academy" },
    { title: "Service", path: "/service" },
    { title: "Accessories", path: "/accessories" },
    { title: "White Label", path: "/whitelabel" },
    { title: "Tools", path: "/tools-tech" },
    { title: "Startup Support", path: "/startup" },
  ];

  const trackEvent = (eventName, category, label, sendTo) => {
    if (typeof gtag === "function") {
      const params = { event_category: category, event_label: label };
      if (sendTo) params.send_to = sendTo;
      gtag("event", eventName, params);
    }
  };
  console.log("UpcomingEventsPopup loaded");

  return (
    <>
      <Helmet>
        <title>Radnus Communication | 360° Mobile Industry Ecosystem</title>
        <meta
          name="description"
          content="Radnus Communication empowers mobile entrepreneurs through training, repair services, tools, and startup support since 2003."
        />
      </Helmet>

      {/* HERO SECTION */}
      <section
        className="d-flex align-items-center text-white text-center text-md-start"
        style={{
          background: `url(${bgImage}) center center / cover no-repeat fixed`,
          minHeight: "90vh",
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-12">
              <h1 className="fw-bold display-4 text-danger mb-0">Radnus</h1>
              <h1 className="fw-bold display-4 text-danger mb-3">
                Communication
              </h1>

              <p className="lead text-dark mb-4">
                Empowering businesses since <strong>2003</strong>, Radnus
                provides training, tools, and solutions to help entrepreneurs
                grow successfully.
              </p>

              <button
                className="btn mb-2"
                style={{
                  background: "#161515",
                  color: "white",
                  border: "2px solid #a12323",
                }}
                onClick={() => {
                  trackEvent("conversion", "Hero CTA", "Contact Us - Home");
                  document.querySelector("#contact")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>
      <UpcomingEventsPopup />

      {/* Mobile BG Fix */}
      <style>
        {`
          @media (max-width: 768px) {
            section.d-flex {
              background: url(${bg1Image}) 93% center / cover no-repeat !important;
              background-size: 195% auto !important;
              background-attachment: scroll !important;
              min-height: 60vh !important;
            }
          }
        `}
      </style>

      {/* 🔥 UNLOCKER MARQUEE – CLEAN & FINAL */}
      <section
        style={{
          background: "#ffffff",
          padding: "12px 0",

          overflow: "hidden",
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            animation: "scrollLoop 20s linear infinite",
            fontWeight: "600",
            color: "#a80303",
            fontSize: "1.2rem",
          }}
        >
          {/* Text Loop 1 */}
          <div style={{ display: "inline-flex" }}>
            <span className="mx-4">
              Radnus Unlocker – Reliable Online Unlock Service Provider in India
            </span>
            <span className="mx-4">
              100% Genuine & Licensed Mobile Unlock Tools
            </span>
            <span className="mx-4">
              Instant Activation • Fast Support • Technician Trusted
            </span>
            <span className="mx-4">
              Trusted by Thousands of Technicians Nationwide
            </span>
          </div>

          {/* Duplicate Loop => Infinite scroll */}
          <div style={{ display: "inline-flex" }}>
            <span className="mx-4">
              Radnus Unlocker – Reliable Online Unlock Service Provider in India
            </span>
            <span className="mx-4">
              100% Genuine & Licensed Mobile Unlock Tools
            </span>
            <span className="mx-4">
              Instant Activation • Fast Support • Technician Trusted
            </span>
            <span className="mx-4">
              Trusted by Thousands of Technicians Nationwide
            </span>
          </div>
        </div>

        {/* Desktop CTA */}
        <a
          href="https://radnusunlockers.com"
          target="_blank"
          rel="noopener noreferrer"
          className="unlock-btn-desktop"
          style={{
            position: "absolute",
            right: "15px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#615353ff",
            color: "white",
            padding: "6px 18px",
            borderRadius: "20px",

            textDecoration: "none",
            boxShadow: "0px 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          Visit Unlocker →
        </a>

        {/* Mobile CTA */}
        <a
          href="https://radnusunlockers.com"
          target="_blank"
          rel="noopener noreferrer"
          className="unlock-btn-mobile"
          style={{
            display: "none",
            marginTop: "10px",
            background: "#a80303",
            color: "white",
            padding: "6px 2px",
            borderRadius: "5px",

            width: "150px",
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center",
          }}
        >
          Visit Unlocker →
        </a>

        <style>
          {`
            @keyframes scrollLoop {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @media (max-width: 768px) {
              .unlock-btn-desktop {
                display: none !important;
              }
              .unlock-btn-mobile {
                display: block !important;
              }
            }
          `}
        </style>
      </section>

      {/* TRACK RECORD */}
      <section className="text-dark py-1 bg-white" id="track">
        <div className="container">
          <div className="row align-items-center">
            <div
              className="col-md-7 text-center text-md-start"
              style={{ color: "#a80303" }}
            >
              <motion.h1
                className="fw-bold mb-3 fs-1"
                initial={{ y: -40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Our Proven Track Record
              </motion.h1>

              <div className="row g-4">
                {stats.map((item, i) => (
                  <motion.div
                    key={i}
                    className="col-6 col-md-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                  >
                    <div className="p-4 rounded-3 shadow-sm h-100 text-center bg-danger text-white">
                      <h2 className="fw-bold fs-2">
                        <CountUp end={item.end} duration={2.5} />+
                      </h2>
                      <p className="mb-0 fs-6">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="col-md-5 d-flex justify-content-center align-items-center mt-2 mt-md-0">
              <motion.img
                src={illustration}
                alt="Metrics Illustration"
                className="img-fluid"
                style={{ maxHeight: "700px", objectFit: "contain" }}
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="pb-4 bg-white">
        <div className="container text-center">
          <motion.h1
            style={{ color: "#a80303" }}
            className="fw-bold mb-3"
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
          >
            Our Services
          </motion.h1>

          <div className="row text-center g-4">
            {services.map((service, i) => (
              <motion.div
                key={i}
                className="col-6 col-sm-6 col-md-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="card h-100 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-between">
                  <h6 className="text-dark mb-4 fs-6">{service.title}</h6>

                  <Link
                    to={service.path}
                    className="btn btn-sm mt-auto service-btn"
                    onClick={() =>
                      trackEvent("cta_click", "Service CTA", service.title)
                    }
                  >
                    Learn More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <style jsx="true">{`
          .service-btn {
            border: 1px solid #000;
            color: #000;
            background-color: transparent;
            transition: 0.3s;
            text-decoration: none;
          }
          .service-btn:hover {
            color: #fff;
            background-color: #000;
          }
        `}</style>
      </section>
    </>
  );
}

export default RadnusHome;