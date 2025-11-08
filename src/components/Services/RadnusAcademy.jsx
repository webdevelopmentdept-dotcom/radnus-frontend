import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { AiOutlineCheck } from "react-icons/ai";
import Card from "react-bootstrap/Card";
import AcadamyImage from "../../images/acadamybackground.webp";
import SempHybridAcademy from "../../images/semphybridacademy.webp";
import SempAcademy from "../../images/sempacademy.webp";
import LaspAcademy from "../../images/laspacademy.webp";
import SempBackground from "../../images/sempbackground.webp";
import SempHybridBackground from "../../images/semphybridbackground.webp";
import TrainingForm from "../shared/TrainingForm";
import { Package, Shirt, BookOpen, IdCard, Award } from "lucide-react";
import { Helmet } from "react-helmet";

const RadnusAcademy = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const formRef = useRef(null);

  const cards = [
    {
      img: SempAcademy,
      title: "SEMP",
      description: "25 days of practical training in mobile hardware & eMMC..",
      button: "Read More",
      key: "semp",
    },
    {
      img: SempHybridAcademy,
      title: "SEMP(Hybrid)",
      text: "25-day weekend training in mobile hardware & eMMC.",
      button: "Read More",
      key: "hybrid",
    },
    {
      img: LaspAcademy,
      title: "LASP",
      text: "18 days of training in laptop and desktop, basic to chip-level training.",
      button: "Read More",
      key: "lasp",
    },
  ];

  const fontSizes = {
    heading: "2rem",
    subtitle: "1.25rem",
    text: "1rem",
    lead: "1.2rem",
  };

  // ✅ Apply Now Conversion Tracking (Only this stays)
  const trackApplyNowConversion = (course) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/NuslCMaBlLwbENer45s_", // 👉 Replace with your real Google Ads label
        event_label: `Apply Now - ${course}`,
      });
      console.log("✅ Apply Now Conversion tracked:", course);
    } else {
      console.log("⚠️ gtag not found — Apply Now tracking skipped");
    }
  };

  const handleApplyNow = (course) => {
    // Fire conversion event
    trackApplyNowConversion(course);

    // Show the form
    setSelectedCourse(course);
    setShowForm(true);

    // Smooth scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>
          Radnus Academy | Mobile Repair Training & Skill Development
        </title>
        <meta
          name="description"
          content="Join Radnus Academy in Pondicherry to master mobile repair, chip-level training, and business skills. Learn from certified experts and become a professional technician."
        />
        <meta
          name="keywords"
          content="mobile repair training, Radnus academy, mobile chip level course, technician training pondicherry, learn mobile service"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Radnus Communication" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Radnus Academy | Mobile Repair & Skill Development"
        />
        <meta
          property="og:description"
          content="Professional mobile repair and chip-level training at Radnus Academy. Learn, grow, and build your career with us."
        />
        <meta property="og:url" content="https://www.radnus.in/academy" />
        <meta property="og:image" content="https://www.radnus.in/logo2.png" />
        <link rel="canonical" href="https://www.radnus.in/academy" />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section position-relative text-center text-dark d-flex flex-column justify-content-center align-items-center">
        <img
          src={AcadamyImage}
          alt="Hero Background"
          className="hero-img position-absolute top-0 start-0 w-100 h-100"
        />
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-light opacity-50"></div>
        <div className="position-relative container px-3">
          <h1 className="fw-bold mb-3 border-bottom border-3 border-danger d-inline-block pb-2 display-6">
            Radnus Academy
          </h1>
          <p className="lead mb-4 fw-semibold">
            Learn mobile repair and laptop chip level training at the best
            mobile service training institute in Pondicherry. Become a certified
            mobile technician and start your own mobile service shop.
          </p>
          <a
            href="#cards"
            className="btn btn-danger px-3"
            onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
          >
            Explore Programs
          </a>
        </div>
      </section>

      {/* Cards Section */}
      <section id="cards" className="mt-4 container">
        <div className="row g-4 justify-content-center">
          {cards.map((card, index) => (
            <div
              key={index}
              className="col-12 col-md-4 d-flex justify-content-center"
            >
              <Card
                style={{
                  width: "286px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                }}
              >
                <Card.Img
                  variant="top"
                  src={card.img}
                  style={{
                    width: "286px",
                    height: "180px",
                    objectFit: "cover",
                  }}
                />
                <Card.Body className="text-center">
                  <Card.Title
                    style={{ fontWeight: "700", fontSize: fontSizes.subtitle }}
                  >
                    {card.title}
                  </Card.Title>
                  <Card.Text
                    style={{
                      fontSize: fontSizes.text,
                      color: "#555",
                      minHeight: "60px",
                    }}
                  >
                    {card.description || card.text}
                  </Card.Text>
                  <a
                    href={`#${card.key}`}
                    className="btn btn-danger rounded-pill px-4 fw-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById(card.key)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {card.button}
                  </a>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* SEMP Section */}
      <section id="semp" className="pt-3">
        <div className="container">
          <div
            className="row align-items-stretch justify-content-center flex-lg-row-reverse shadow-lg overflow-hidden rounded-4"
            style={{ minHeight: "370px" }}
          >
            <div className="col-lg-6 bg-dark text-white p-lg-5 d-flex flex-column justify-content-center">
              <div>
                <h2 className="fw-bold mb-3 text-uppercase fs-5">
                  Smartphone Entrepreneurship Management Program (SEMP)
                </h2>
                <p
                  className="text-white opacity-75 mb-1"
                  style={{ fontSize: "1.2rem" }}
                >
                  Learn mobile repair in our SEMP program, earn a certified
                  mobile technician course, and gain skills to start your own
                  mobile service shop.
                </p>
                <button
                  className="btn btn-danger rounded-pill px-4 py-2 fw-semibold"
                  onClick={() => handleApplyNow("SEMP")}
                >
                  Apply Now
                </button>
              </div>
            </div>
            <div className="col-lg-6 p-0">
              <img
                src={SempBackground}
                alt="SEMP Training"
                className="img-fluid w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      {showForm && (
        <div className="container-fluid mt-5 p-0" ref={formRef}>
          <TrainingForm
            course={selectedCourse}
            onCloseForm={() => setShowForm(false)}
          />
        </div>
      )}
    </>
  );
};

export default RadnusAcademy;
