import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BsArrowRightCircleFill } from "react-icons/bs"; // Professional icon
import placement from "../../images/Placement.jpg";
import PartnerCollab from "../../images/PartnerCollab.png";
import Africon from "../../images/Africon.png";
import Australia from "../../images/Austarlia.jpg";
import Canada from "../../images/Canada.webp";
import Oman from "../../images/Oman.jpg";
import Qatar from "../../images/Qatar.jpg";
import Saudi from "../../images/Saudi.webp";
import Singapore from "../../images/Singapore.webp";
import Srilanka from "../../images/Srilanka.jpg";
import Uae from "../../images/Uae.jpg";
import Uk from "../../images/Uk.jpg";
import Usa from "../../images/Usa.jpg";
import Nepal from "../../images/Nepal.png";
import Malasiya from "../../images/Malasiya.webp";
import { Helmet } from "react-helmet";
const Placement = () => {
  const whyCompaniesChoose = [
    "Hands-on knowledge of chip-level mobile service and software repair",
    "Strong understanding of customer handling, shop operations, and sales",
    "Ability to manage service centers, tools, and technical teams independently",
    "Skilled in digital diagnostics, mobile tool usage, and technical communication",
    "Ready-to-deploy professionals with strong service attitude and business awareness",
  ];

  const placementSupport = [
    "Comprehensive Resume Preparation & Personalized Interview Training ",
    "Country-wise Job Connection and Placement Support Assistance Services",
    "Technical Test Preparation and Skill Assessment Exercises for Students",
    "Visa & Documentation Guidance Support (Through Authorized Partners)",
    "Pre-departure Orientation and Cultural Briefing for Overseas Jobs",
  ];

  const countries = [
    { name: "UAE", img: Uae },
    { name: "Qatar", img: Qatar },
    { name: "Saudi Arabia", img: Saudi },
    { name: "Oman", img: Oman },
    { name: "Singapore", img: Singapore },
    { name: "Malaysia", img: Malasiya },
    { name: "Sri Lanka", img: Srilanka },
    { name: "Nepal", img: Nepal },
    { name: "UK", img: Uk },
    { name: "USA", img: Usa },
    { name: "Canada", img: Canada },
    { name: "Australia", img: Australia },
    { name: "Africa Region", img: Africon },
  ];

  return (
    <>
      {/* Hero Section */}
      <Helmet>
        <title>Global Placement Assistance | Radnus Communication</title>
        <meta
          name="description"
          content="Radnus Communication provides global placement assistance for skilled mobile service professionals. Resume prep, interview training, visa guidance, and country-wise placement support."
        />
        <meta
          name="keywords"
          content="Radnus global placement,
           mobile service placement,
            cellphone repair job, 
            Mobile repair job placement,
            Mobile repair training and job support, 
           Poorvika job placement"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.radnus.in/placement" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Global Placement Assistance | Radnus Communication"
        />
        <meta
          property="og:description"
          content="Empowering skilled mobile service professionals for global careers. Resume prep, interview training, visa support, and country-wise placement assistance."
        />
        <meta property="og:url" content="https://www.radnus.in/placement" />
        <meta property="og:image" content="/logo2.png" />
        <meta property="og:site_name" content="radnus.in" />
      </Helmet>
      <section className="text-center mb-2">
        <h1
          className="display-4 fw-bold lh-sm fs-1 pt-3"
          style={{
            background: "linear-gradient(to right, #dc3545, #000000)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "2px 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-danger">G</span>lobal{" "}
          <span className="text-danger">P</span>lacement{" "}
          <span className="text-danger">A</span>ssistance{" "}
          <span className="text-danger">B</span>y{" "}
          <span className="text-danger">R</span>adnus
        </h1>
        <p className="lead text-secondary mt-2">
          Empowering Skilled Talent — Connecting to Global Careers
        </p>
        <img
          src={placement}
          alt="Mobile Repair Training"
          className="img-fluid rounded shadow mt-4"
          style={{ maxHeight: "400px", transition: "transform 0.3s ease" }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
      </section>

      {/* Partner Collaboration Section */}
      <section className="container my-4 py-3">
        <div className="row align-items-center flex-md-row flex-column-reverse">
          <div className="col-md-6 text-center mb-4 mb-md-0">
            <div
              className="mx-auto shadow-lg overflow-hidden"
              style={{
                width: "100%",
                maxWidth: "400px",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                transition: "transform 0.6s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <img
                src={PartnerCollab}
                alt="Radnus Global Placement"
                className="img-fluid w-100 h-100"
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
          </div>

          <div className="col-md-6 d-flex flex-column justify-content-center">
            <h2
              className="fw-bold mb-3 text-danger"
              style={{ lineHeight: "1.3" }}
            >
              Global Career Opportunities
            </h2>
            <p className="fs-6 text-muted" style={{ lineHeight: "1.8" }}>
              At <strong>Radnus</strong>, we empower students to step
              confidently into global careers with hands-on experience and
              industry-ready skills.
            </p>
            <p className="text-secondary" style={{ lineHeight: "1.8" }}>
              Collaborations with companies like{" "}
              <strong style={{ color: "#ff5e00" }}>Poorvika Mobiles</strong>{" "}
              help us create placement networks across India and overseas.
            </p>
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="container  py-1">
        <h2 className="text-center fw-bold mb-4">
          Global Career Opportunities
        </h2>
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
          {countries.map((country) => (
            <div
              key={country.name}
              className="d-flex flex-column align-items-center p-2 rounded shadow-sm"
              style={{
                width: "120px",
                background: "#f8f9fa",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              <img
                src={country.img}
                alt={country.name}
                className="img-fluid mb-2"
                style={{
                  height: "60px",
                  objectFit: "contain",
                  background: "transparent",
                }}
              />
              <div className="fw-semibold text-center">{country.name}</div>
            </div>
          ))}
        </div>
        <p className="text-center fs-6 mb-3">
          At <strong>Radnus</strong>, our vision is to expand into{" "}
          <strong className="text-danger">
            global companies and international markets
          </strong>
          .
        </p>
        <p className="text-center fs-6 mt-3">
          Hands-on training ensures every professional is prepared to succeed
          internationally.
        </p>
      </section>

      {/* Dual Placement Info Section */}
      <section className="container my-3 py-1">
        <div className="row g-4">
          {/* Why Companies Choose Radnus-Trained Students */}
          <div className="col-md-6">
            <div className="card shadow-sm p-4 h-100">
              <h3 className="text-danger mb-3 fs-4">
                Why Companies Choose Radnus-Trained Students
              </h3>
              <ul className="list-unstyled">
                {whyCompaniesChoose.map((item, idx) => (
                  <li key={idx} className="d-flex align-items-start mb-2">
                    <BsArrowRightCircleFill className="text-dark me-3 fs-5 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Placement Support */}
          <div className="col-md-6">
            <div className="card shadow-sm p-4 h-100">
              <h3 className="text-danger mb-3">
                Our Placement Support Includes
              </h3>
              <ul className="list-unstyled">
                {placementSupport.map((item, idx) => (
                  <li key={idx} className="d-flex align-items-start mb-2">
                    <BsArrowRightCircleFill className="text-dark me-3 fs-5 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Placement;
