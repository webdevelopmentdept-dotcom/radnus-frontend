import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
// Import your background image (place image in src/assets or similar)
import LoanBg from "../../images/startupbg1.png";
import { Helmet } from "react-helmet";

import { motion } from "framer-motion"; // <-- change path/name as needed

export default function Startup({
  title = "Empowering India's Entrepreneurs",
  description = "Helping startups access PMEGP loans, other startup loan schemes, and startup funding loans with expert guidance, fast approval, and transparent support.",
  backgroundImage = LoanBg,
}) {
  return (
    <>
      <Helmet>
        <title>
          Startup Support | PMEGP Loan Assistance for Entrepreneurs | Radnus
          Communication
        </title>

        <meta
          name="description"
          content="Get PMEGP loan assistance and startup guidance from Radnus Communication. We help entrepreneurs and small businesses secure government-backed funding with expert support, training, and end-to-end documentation."
        />

        <meta
          name="keywords"
          content="how to apply for pmegp loan,
     pmegp loan eligibility criteria,
     startup loan schemes in pondicherry,
     best business startup loan, 
     startup funding schemes india , 
     benefits of PMEGP loan,
     pmegp loan documents,
     how to apply for startup loan in India"
        />

        <meta name="author" content="Radnus Communication" />

        {/* Open Graph for social media */}
        <meta
          property="og:title"
          content="PMEGP Startup Loan Assistance – Radnus Communication"
        />
        <meta
          property="og:description"
          content="Empowering entrepreneurs through PMEGP – get expert guidance and financial support for your startup with Radnus Communication."
        />
        <meta property="og:image" content="/logo2.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.radnus.in/startup" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.radnus.in/startup" />
      </Helmet>

      <section
        className="d-flex align-items-center justify-content-start text-white"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "60vh",
        }}
        aria-label="Loan plans hero"
      >
        <Container>
          <Row classNahow to startme="justify-content-start">
            <Col
              xs={12}
              md={6}
              className="d-flex align-items-start text-md-start text-center"
            >
              <div className="w-100 mx-auto" style={{ maxWidth: "540px" }}>
                <h1
                  className="fw-bold display-6 lh-sm mb-3 mt-2 "
                  style={{ color: "#530000ff" }}
                >
                  {title}
                </h1>
                <p
                  className="fs-5 fw-semibold mb-3 "
                  style={{ color: "#000000ff" }}
                >
                  {description}
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-3">
        <Container className="px-4 px-md-5">
          {/* Title - Left aligned */}
          <Row className="justify-content-center text-center">
            <Col lg={9}>
              <h2
                className="fw-bolder text-center text-dark fs-2"
                style={{
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  fontSize: "clamp(1.2rem, 4vw, 2rem)",
                  lineHeight: "1.3",
                }}
              >
                Turning Startup Dreams into Reality with{" "}
                <span
                  className="fw-bolder"
                  style={{
                    background: "linear-gradient(90deg, #cc2a2aff,black)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  PMEGP
                </span>
              </h2>
            </Col>
          </Row>

          {/* First Paragraph */}
          <Row className="justify-content-center text-center ">
            <Col lg={10} md={10} className="mx-auto">
              <p className="fs-5 text-secondary lh-lg mb-0">
                We are committed to helping new{" "}
                <strong>business startups</strong> turn their ideas into
                successful ventures through a the{" "}
                <strong>
                  PMEGP (Prime Minister’s Employment Generation Programme)
                </strong>
                . This is the government-backed initiative provides loan and
                subsidy support to encourage entrepreneurship and
                self-employment.
              </p>
            </Col>
          </Row>

          {/* Second Paragraph */}
          <Row className="justify-content-center text-center">
            <Col lg={10} md={10} className="mx-auto">
              <p className="fs-5 text-muted lh-lg mb-0">
                Through PMEGP, individuals can start small-scale manufacturing,
                service, or trade businesses with financial assistance and
                complete online guidance from application to disbursement,
                including preparation of all{" "}
                <strong>PMEGP loan documents</strong>.Our aim is to make the
                process simple, transparent, and growth-focused — helping you
                build a strong foundation for your entrepreneurial journey.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <section>
        <Container>
          {/* Section Heading */}
          <Row className="justify-content-center pb-2">
            <Col lg={8} className="text-center">
              <h2 className="fw-bold display-6 text-dark mb-3 fs-2">
                Eligible Businesses under{" "}
                <span className="text-danger">PMEGP</span>
              </h2>
              <p className="text-muted fs-5">
                Explore various business categories and their{" "}
                <strong>eligibility criteria</strong> for financial assistance
                under the PMEGP scheme.
              </p>
            </Col>
          </Row>

          <Row className="g-4 justify-content-center">
            {/* Service Centers */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className=" fs-6 text-white text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Service Centers
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    ₹2 Lakhs to ₹10 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    For businesses providing technical or electronic services
                    like mobile, computer, or appliance repairs.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Travels & Transports */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className="fs-6 text-white text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Travels & Transports
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    Up to ₹10 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    Ideal for setting up travel agencies, cab/taxi services, or
                    small transport operations.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Food & Organic Manufacturing */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className=" fs-6 text-white  text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Food Processing Unit
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    Up to ₹25 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    For small-scale food production, packaging, and organic
                    product manufacturing units.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Manufacturing Unit */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className=" fs-6 text-white text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Manufacturing Unit
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    Up to ₹25 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    For industries producing small-scale goods like garments,
                    furniture, tools, or household items.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Farm Business */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className=" fs-6 text-white text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Farm Business
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    Up to ₹25 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    For agricultural and allied activities like dairy, poultry,
                    fishery, or small-scale farming.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Milk Product */}
            <Col md={4} sm={6}>
              <Card style={{ border: "3px solid #e4e4e4ff" }} className="h-100">
                <Card.Header
                  className=" fs-6 text-white text-center"
                  style={{ backgroundColor: "#740000" }}
                >
                  Milk Product
                </Card.Header>
                <Card.Body>
                  <Card.Title className="text-dark">Loan Range</Card.Title>
                  <Card.Text className="text-danger fw-semibold">
                    Up to ₹25 Lakhs
                  </Card.Text>
                  <Card.Text
                    className="text-muted"
                    style={{ fontSize: "1.10rem" }}
                  >
                    For businesses involved in milk processing, packaging, or
                    dairy product manufacturing.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section
        className="pt-3"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)",
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container className="">
          <Row className="align-items-center text-md-start text-center">
            {/* LEFT CONTENT */}
            <Col md={6} className="mb-5 mb-md-0">
              <h1
                className="fw-bold "
                style={{
                  fontSize: "1.6rem",
                  lineHeight: "1.2",
                  letterSpacing: "-0.5px",
                  color: "#1a1a1a",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Driving Growth Through PMEGP Support
              </h1>

              <p
                className=" mb-5"
                style={{
                  fontSize: "1.1rem",
                  maxWidth: "500px",
                  lineHeight: "1.7",
                }}
              >
                Every year, we enable aspiring entrepreneurs and MSMEs to bring
                their ideas to life through{" "}
                <strong>PMEGP loan assistance</strong>. Our initiative focuses
                on driving inclusive growth, fostering innovation, and providing
                financial empowerment across sectors.
              </p>

              {/* STATS */}
              <Row className="g-4 justify-content-md-start justify-content-center">
                <Col xs={6} md={6}>
                  <h3 className="fw-bold mb-1" style={{ color: "#d32f2f" }}>
                    ₹120 Cr+
                  </h3>
                  <p className="text-muted mb-0 fs-6">
                    Cumulative Loan Disbursed Till Date
                  </p>
                </Col>
                <Col xs={6} md={6}>
                  <h3 className="fw-bold mb-1 " style={{ color: "#d32f2f" }}>
                    8,000+
                  </h3>
                  <p className="text-muted mb-0 fs-6">
                    Entrepreneurs Empowered Across India
                  </p>
                </Col>
              </Row>
            </Col>

            {/* RIGHT CONTENT */}
            <Col md={6} className="text-center">
              <h1
                className="fw-bold "
                style={{
                  fontSize: "2.5rem",
                  color: "#ff0303ff",
                  letterSpacing: "-0.5px",
                }}
              >
                ₹390M+
              </h1>
              <p style={{ fontSize: "1rem" }}>
                From transforming small ventures to scaling large enterprises —
                our PMEGP program continues to support sustainable success and
                innovation.
              </p>

              {/* Responsive Red Gradient Bars */}
              <div
                className="d-flex justify-content-center align-items-end gap-3 flex-wrap"
                style={{
                  height: "auto",
                  minHeight: "180px",
                }}
              >
                {[
                  { year: "2020", value: "₹10 Cr", height: 80 },
                  { year: "2021", value: "₹12 Cr", height: 110 },
                  { year: "2022", value: "₹14 Cr", height: 140 },
                  { year: "2023", value: "₹15 Cr", height: 180 },
                  { year: "2024", value: "₹17 Cr", height: 220 },
                ].map((bar, i) => (
                  <div className="text-center" key={i}>
                    <div
                      style={{
                        height: `clamp(${bar.height / 2}px, ${
                          bar.height
                        }px, 220px)`,
                        width: "clamp(30px, 12vw, 60px)",
                        background:
                          "linear-gradient(180deg, rgba(176, 30, 30, 1) 0%, #b61616ff 100%)",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(146, 15, 15, 0.8)",
                        transition: "all 0.3s ease",
                      }}
                    ></div>
                    <h6
                      className="fw-bold mt-2 mb-0"
                      style={{
                        color: "#d32f2f",
                        fontSize: "clamp(0.7rem, 2vw, 1rem)",
                      }}
                    >
                      {bar.value}
                    </h6>
                    <small className="text-muted">{bar.year}</small>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section
        className="pt-2"
        style={{
          background: "linear-gradient(135deg, #f9fbff 0%, #f2f6ff 100%)",
        }}
      >
        <Container className="pb-4">
          <Row className="text-center  mt-2">
            <Col>
              <h2 className="fw-bold  text-dark" style={{ fontSize: "1.6rem" }}>
                Why Entrepreneurs <span className="text-dark">Trust Us</span>
              </h2>
              <p className="text-muted fs-5">
                We make your PMEGP loan journey simple, transparent, and
                efficient.
              </p>
            </Col>
          </Row>

          <Row className="g-4 text-center">
            {[
              {
                icon: "bi bi-clock-history",
                title: "Fast Processing",
                desc: "Quick loan approvals with minimal documentation and guidance at every step.",
              },
              {
                icon: "bi bi-shield-check",
                title: "Secure & Verified",
                desc: "Government-backed initiative ensuring 100% security and transparency.",
              },
              {
                icon: "bi bi-people-fill",
                title: "Personalized Support",
                desc: "Dedicated advisors to assist from application to loan disbursement.",
              },
              {
                icon: "bi bi-bar-chart-line",
                title: "Sustainable Growth",
                desc: "Funding solutions tailored for long-term business success.",
              },
            ].map((item, i) => (
              <Col md={3} sm={6} key={i}>
                <div className="p-3 bg-white rounded-4 shadow-sm h-100">
                  <i className={`${item.icon} fs-1 text-danger mb-3`}></i>
                  <h5 className="fw-bold text-dark ">{item.title}</h5>
                  <p className="text-muted fs-6">{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
}
