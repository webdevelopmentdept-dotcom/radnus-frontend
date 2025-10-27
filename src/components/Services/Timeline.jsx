import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// 🖼️ Import different images for each milestone
import Img2003 from "../../images/Start.jpeg";
import Img2011 from "../../images/Time1.png";
import Img2017 from "../../images/Venam.jpeg";
import { Helmet } from "react-helmet";
import Img2025 from "../../images/Cimg2.jpg";

export default function Timeline() {
  const milestones = [
    {
      year: "2003",
      title: "The Beginning",
      desc: "Founded as Univercell Mobile, setting new benchmarks in mobile repair and retail services through innovation, trust, and customer satisfaction.",
      image: Img2003,
    },
    {
      year: "2011",
      title: "Rebranding & Expansion",
      desc: "We evolved into Radnus Communication — expanding into OEM solutions, tools, and accessories while building trust across India.",
      image: Img2011,
    },
    {
      year: "2017",
      title: "Innovation in Mobility",
      desc: "Launched a new era of premium-quality mobile accessories and professional repair tools, strengthening our retail network and customer reach across India.",
      image: Img2017,
    },
    {
      year: "2025",
      title: "The Franchise Revolution",
      desc: "Evolving into a franchise-driven ecosystem — empowering entrepreneurs and bringing advanced mobile solutions to every corner of India.",
      image: Img2025,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Our Journey | Radnus Communication Timeline</title>
        <meta
          name="description"
          content="Explore the milestones of Radnus Communication — from humble beginnings in 2003 to a nationwide leader in mobile services, tools, and accessories."
        />
        <meta
          name="keywords"
          content="radnus Communication histroy, 
          radnus success story,
           mobile service journey, 
           Radnus franchise growth"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.radnus.in/timeline" />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Our Journey | Radnus Communication Timeline"
        />
        <meta
          property="og:description"
          content="Discover how Radnus Communication evolved from a local mobile shop into a national brand — innovation, empowerment, and trust since 2003."
        />
        <meta property="og:url" content="https://www.radnus.in/timeline" />
        <meta property="og:image" content="/logo2.png" />
        <meta property="og:site_name" content="radnus.in" />
      </Helmet>
      {/* ---------- HERO SECTION ---------- */}
      <section
        className="d-flex align-items-center justify-content-center text-center text-light "
        style={{
          background: "linear-gradient(135deg, #b30000, #ff4d4d)",
          minHeight: "50vh",
        }}
      >
        <Container>
          <h1
            className="fw-bold display-3 text-uppercase mb-4 fs-1"
            style={{ letterSpacing: "2px" }}
          >
            Our Milestones
          </h1>
          <p
            className="lead"
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              lineHeight: "1.7",
              fontSize: "1.1rem",
              color: "#fff",
            }}
          >
            Tracing the milestones that shaped{" "}
            <strong>Radnus Communication</strong> a legacy of innovation, trust,
            and empowerment across India’s mobile ecosystem.
          </p>
        </Container>
      </section>

      {/* ---------- TIMELINE SECTION ---------- */}
      <section className="py-3 position-relative bg-white overflow-hidden">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold text-danger display-6 mb-3 fs-2">
              Timeline
            </h2>
            <p className="text-muted fs-5">
              Two decades of innovation, expansion, and leadership.
            </p>
          </div>

          {/* Timeline Container */}
          <div className="position-relative">
            {/* Center Line */}
            <div
              className="position-absolute d-none d-md-block"
              style={{
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "4px",
                height: "100%",
                background: "linear-gradient(180deg, #ffcccc, #b30000)",
                zIndex: 0,
                borderRadius: "4px",
              }}
            ></div>

            {milestones.map((item, index) => (
              <Row
                key={index}
                className={`align-items-center g-0 mb-4 ${
                  // 🔹 smaller vertical gap (was mb-5)
                  index % 2 === 0 ? "" : "flex-md-row-reverse"
                }`}
              >
                {/* IMAGE SIDE */}
                <Col
                  xs={12}
                  md={6}
                  className="text-center mb-4 mb-md-0" // 🔹 spacing between image and text on mobile
                >
                  <div
                    className="shadow rounded overflow-hidden mx-auto"
                    style={{
                      width: "85%",
                      height: "260px", // 🔹 reduced height
                      border: "2px solid #b30000",
                      borderRadius: "12px",
                      overflow: "hidden",
                      transition: "transform 0.4s ease, box-shadow 0.4s ease",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.08)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    />
                  </div>
                </Col>

                {/* TEXT SIDE */}
                <Col xs={12} md={6}>
                  <Card
                    className="border-0 shadow-sm p-4 position-relative"
                    style={{
                      borderLeft: "6px solid #b30000",
                      borderRadius: "12px",
                      backgroundColor: "#fff",
                      zIndex: 1,
                    }}
                  >
                    {/* Dot Connector */}
                    <div
                      className="d-none d-md-block" // 🔹 hide dot on small screens (line hidden anyway)
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: index % 2 === 0 ? "-13px" : "auto",
                        right: index % 2 !== 0 ? "-13px" : "auto",
                        transform: "translateY(-50%)",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#b30000",
                        boxShadow: "0 0 10px rgba(179,0,0,0.6)",
                      }}
                    ></div>

                    <h3 className="fw-bold text-danger mb-2">{item.year}</h3>
                    <h5 className="fw-semibold mb-3 text-dark">{item.title}</h5>
                    <p
                      className="text-muted mb-0"
                      style={{ lineHeight: "1.6", fontSize: "0.95rem" }}
                    >
                      {item.desc}
                    </p>
                  </Card>
                </Col>
              </Row>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------- CORE VALUES SECTION ---------- */}
      <section
        className=" text-center"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)",
        }}
      >
        <Container>
          <h2 className="fw-bold text-danger mb-2 text-uppercase">
            Our Core Values
          </h2>
          <p
            className="text-muted mb-5"
            style={{
              maxWidth: "750px",
              margin: "0 auto",
              fontSize: "1.05rem",
            }}
          >
            Every service and innovation at{" "}
            <strong>Radnus Communication</strong> is built upon strong
            principles that drive growth, trust, and excellence across India.
          </p>

          <Row className="justify-content-center">
            {[
              {
                title: "Innovation",
                desc: "We embrace new technologies and solutions to advance the mobile service ecosystem.",
              },
              {
                title: "Empowerment",
                desc: "Through Radnus Academy and business opportunities, we uplift technicians and entrepreneurs nationwide.",
              },
              {
                title: "Integrity",
                desc: "Our success is built on transparent business ethics and reliable partnerships.",
              },
              {
                title: "Customer Focus",
                desc: "We prioritize client satisfaction and lasting relationships through quality and consistency.",
              },
            ].map((value, i) => (
              <Col md={3} sm={6} key={i} className="mb-4">
                <Card
                  className="border-0 shadow-lg p-4 h-100"
                  style={{
                    borderTop: "5px solid #b30000",
                    borderRadius: "12px",
                    transition: "transform 0.4s ease, box-shadow 0.4s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(179,0,0,0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 5px 15px rgba(0,0,0,0.1)";
                  }}
                >
                  <h5 className="fw-bold text-danger mb-3">{value.title}</h5>
                  <p className="text-muted small">{value.desc}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
}
