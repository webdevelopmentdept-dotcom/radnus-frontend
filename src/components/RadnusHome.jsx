// src/components/RadnusHome.jsx
import React from "react";
import bgImage from "../images/homebackground1.webp";
import illustration from "../images/metricsimag4.webp";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import bg1Image from "../images/bg2.webp";
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

  return (
    <>
      <Helmet>
        <title>
          Radnus Communication | 360° Mobile Industry Ecosystem for Training,
          Repair & Startup Support
        </title>
        <meta
          name="description"
          content="Radnus Communication empowers mobile entrepreneurs through training, repair services, tools, and business startup support. Serving the industry since 2003 with practical expertise."
        />
        <meta
          name="keywords"
          content="Radnus Communication, mobile service training, mobile repair course, mobile technician institute, mobile business ideas, startup training, entrepreneurship training, Pondicherry"
        />
        <meta name="author" content="Radnus Communication" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Radnus Communication | Mobile Service Training & Solutions"
        />
        <meta
          property="og:description"
          content="Radnus Communication provides mobile service training, repair solutions, and entrepreneurship programs for startups and technicians."
        />
        <meta property="og:image" content="https://www.radnus.in/image.png" />
        <meta property="og:url" content="https://www.radnus.in/" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Radnus Communication | Mobile Service Training & Solutions"
        />
        <meta
          name="twitter:description"
          content="Empowering mobile technicians and entrepreneurs with hands-on training and business tools."
        />
        <meta name="twitter:image" content="https://www.radnus.in/image.png" />

        <link rel="canonical" href="https://www.radnus.in/" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {`
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Radnus Communication",
    "url": "https://www.radnus.in",
    "logo": "https://www.radnus.in/logo2.png",
    "foundingDate": "2003",
    "description": "A 360° mobile industry ecosystem offering training, repair, manufacturing, and entrepreneurship solutions.",
    "sameAs": ["https://www.facebook.com/radnuscommunication", "https://www.instagram.com/radnuscommunication"]
  }
  `}
        </script>
      </Helmet>

      {/* Hero Section */}
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
              <div className="d-flex flex-wrap gap-3">
                <button
                  className="btn mb-2"
                  style={{
                    background: "#161515",
                    color: "white",
                    border: "2px solid #a12323",
                  }}
                  onClick={() => {
                    const section = document.querySelector("#contact");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile View - Remove Background Image */}
      <style>
        {`
    @media (max-width: 768px) {
      section.d-flex {
         background: url(${bg1Image}) 93% center / cover no-repeat !important;
          background-size: 195% auto !important;
        background-attachment: scroll !important;
        min-height: 60vh !important;
      }

      section.d-flex h1 {
          font-size: 2rem !important;
  line-height: 2.3rem !important;
  color: #ff3333 !important;            /* little brighter red */
  text-shadow: 2px 2px 6px rgba(0,0,0,0.3); /* 🔥 shadow for contrast */
      }

      section.d-flex p {
        color: #ffffff !important;
        font-size: 1.2rem !important;
        font-weight: 600 !important; /
      }

     section.d-flex button {
        font-size: 0.9rem !important;
        padding: 8px 16px !important;
        display: inline-block !important;  /* 🟢 Add this line */
        margin: 0 auto !important; 
      }
        /* 🟢 Overlay layer */
      section.d-flex::before {
        content: "" !important;
        position: absolute !important;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.1); /* dark transparent overlay */
        z-index: 0; /* keep below text */
      }

      /* 🟢 Make sure text appears above overlay */
      section.d-flex .container {
        position: relative;
        z-index: 1;
      }
    }
  `}
      </style>

      {/* Highlights Section */}
      <section className="text-dark py-1 bg-white" id="track">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Stats */}
            <div
              className="col-md-7 text-center text-md-start "
              style={{ color: "#a80303" }}
            >
              <motion.h1
                className="fw-bold mb-3 fs-1"
                initial={{ y: -40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
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
                    whileHover={{ scale: 1.08 }}
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <div className="p-4 rounded-3 shadow-sm h-100 text-center bg-danger text-white">
                      <h2 className="fw-bold fs-2">
                        <CountUp
                          end={item.end}
                          duration={2.5}
                          enableScrollSpy={true}
                        />
                        +
                      </h2>
                      <p className="mb-0 fs-6">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Image */}
            <div className="col-md-5 d-flex justify-content-center align-items-center mt-2 mt-md-0">
              <motion.img
                src={illustration}
                alt="Radnus Illustration"
                className="img-fluid"
                style={{ maxHeight: "700px", objectFit: "contain" }}
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.4 }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className=" pb-4 bg-white">
        <div className="container text-center">
          <motion.h1
            style={{ color: "#a80303" }}
            className="fw-bold mb-3"
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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
                viewport={{ once: true }}
              >
                <div className="card h-100 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-between hover-elegant">
                  <h6 className="text-dark mb-4 fs-6">{service.title}</h6>

                  <Link
                    to={service.path}
                    className="btn btn-sm mt-auto service-btn"
                  >
                    Learn More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inline style for hover effect */}
        <style jsx="true">{`
          .service-btn {
            border: 1px solid #000;
            color: #000;
            background-color: transparent;
            transition: all 0.3s ease;
            text-decoration: none;
          }

          .service-btn:hover {
            color: #fff;
            background-color: #000;
            border-color: #000;
          }
          .service-card {
            padding: 1rem;
            min-height: 110px; /* adjust as needed */
          }

          @media (max-width: 768px) {
            .service-card {
              padding: 0.5rem;
              min-height: 140px; /* smaller height */
            }

            h6.text-daark {
              font-size: 0.85rem; /* smaller title */
            }

            .service-btn {
              font-size: 0.75rem;
              padding: 5px 8px;
            }
          }
        `}</style>
      </section>
    </>
  );
}

export default RadnusHome;
