import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { AiOutlineCheck } from "react-icons/ai";
import Card from "react-bootstrap/Card";
import { Navigate } from "react-router-dom";
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

  // ✅ Conversion tracking helper
  const trackConversion = (eventLabel) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/NuslCMaBlLwbENer45s_", // 👉 replace with real label
        event_label: eventLabel,
      });
      console.log("✅ Conversion tracked:", eventLabel);
    } else {
      console.log("⚠️ gtag not found for:", eventLabel);
    }
  };

  const handleApplyNow = (course) => {
    trackConversion(`Apply Now - ${course}`);
    setSelectedCourse(course);
    setShowForm(true);
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
          <h1 className="fw-bold mb-3 border-bottom border-3 border-danger d-inline-block pb-2 display-6 display-md-3 display-lg-1">
            Radnus Academy
          </h1>
          <p className="lead mb-4 fs-5 fs-md-5 fw-semibold fs-lg-3">
            Learn mobile repair and laptop chip level training at the best
            mobile service training institute in Pondicherry. Become a certified
            mobile technician and start your own mobile service shop.
          </p>
          <a
            href="#cards"
            className="btn btn-danger px-3 explore-btn"
            style={{ fontSize: "1rem" }}
          >
            Explore Programs
          </a>
        </div>
      </section>

      <style>{`
        .hero-section {
          min-height: 75vh;
        }
        .hero-img {
          object-fit: cover;
          height: 100%;
          width: 100%;
        }
        @media (max-width: 768px) {
          .hero-section {
            min-height: 50vh;
          }
        }
      `}</style>

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
                  transition: "all 0.3s ease-in-out",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0,0,0,0.15)";
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
                    style={{
                      fontWeight: "700",
                      fontSize: fontSizes.subtitle,
                      marginBottom: "0.5rem",
                    }}
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
                    className="btn btn-danger rounded-pill px-4 fw-semibold shadow-sm"
                    style={{
                      borderRadius: "50px",
                      padding: "0.5rem 1.5rem",
                      fontWeight: "600",
                      transition: "all 0.3s ease-in-out",
                    }}
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
            className="row align-items-stretch justify-content-center flex-lg-row-reverse shadow-lg overflow-hidden rounded-4 program-section"
            style={{ minHeight: "370px" }}
          >
            <div
              className="col-lg-6 bg-dark text-white  p-lg-5 d-flex flex-column justify-content-center"
              style={{
                background:
                  "linear-gradient(135deg, #111 0%, #212529 60%, #343a40 100%)",
              }}
            >
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

                <ul
                  className="list-unstyled mb-4 lh-lg"
                  style={{ fontSize: "1rem" }}
                >
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    25 Days of Hotel Accommodation (Sharing Basis)
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />3 Times Food
                    + Snacks & Tea Daily
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Complimentary Dinner @ Star Hotel
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Real-Time Case Studies
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Free Tools & Smartphones for Practice
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Business & Management Development Classes
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    App Login Access (1 Year) + Technical Support
                  </li>
                </ul>
                <button
                  className="btn btn-danger rounded-pill px-4 py-2 fw-semibold shadow-sm"
                  onClick={() => handleApplyNow("SEMP")}
                >
                  Apply Now
                </button>
              </div>
            </div>
            <div className="col-lg-6 p-0 position-relative d-flex">
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

      {/* SEMP Hybrid Section */}
      <section
        id="hybrid"
        className="pt-4"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        }}
      >
        <div className="container">
          <div
            className="row align-items-stretch justify-content-center shadow-lg overflow-hidden rounded-4 flex-lg-row program-section"
            style={{ minHeight: "400px" }}
          >
            <div
              className="col-lg-6 bg-dark text-white p-3 p-lg-5 d-flex flex-column justify-content-center"
              style={{
                background:
                  "linear-gradient(135deg, #111 0%, #212529 60%, #343a40 100%)",
              }}
            >
              <div>
                <h2
                  className="fw-bold mb-3 text-uppercase"
                  style={{ fontSize: "1.3rem" }}
                >
                  Smartphone Entrepreneurship Management Program (Hybrid)
                </h2>
                <p
                  className="text-light opacity-75 mb-4"
                  style={{ fontSize: "1.2rem" }}
                >
                  Hybrid course combining offline + online training for mobile &
                  laptop repair.
                </p>
                <ul
                  className="list-unstyled mb-4 lh-lg"
                  style={{ fontSize: "1rem" }}
                >
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    18-days offline hotel accommodation (sharing basis)
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    17-days online course access
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />3 Times Food
                    + Snacks & Tea Daily
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Complimentary Dinner @ Star Hotel
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Real-Time Case Studies
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Free Tools & Smartphones for Practice
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Management & Business Development Classes
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    App Login Access (1 Year) + Technical Support
                  </li>
                </ul>
                <button
                  className="btn btn-danger rounded-pill px-4 py-2 fw-semibold shadow-sm"
                  onClick={() => handleApplyNow("SEMP (Hybrid)")}
                >
                  Apply Now
                </button>
              </div>
            </div>
            <div className="col-lg-6 p-0 position-relative d-flex">
              <img
                src={SempHybridBackground}
                alt="SEMP Hybrid Training"
                className="img-fluid w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* LASP Section */}
      <section
        id="lasp"
        className="pt-4"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        }}
      >
        <div className="container">
          <div
            className="row align-items-stretch justify-content-center flex-lg-row-reverse shadow-lg overflow-hidden rounded-4 program-section"
            style={{ minHeight: "400px" }}
          >
            <div className="col-lg-6 bg-dark text-white p-3 p-lg-5 d-flex flex-column justify-content-center">
              <div>
                <h2
                  className="fw-bold mb-3 text-uppercase"
                  style={{ fontSize: fontSizes.subtitle }}
                >
                  Laptop Advance Service Program (LASP)
                </h2>
                <p
                  className="text-light opacity-75 mb-4"
                  style={{ fontSize: fontSizes.lead }}
                >
                  LASP offers laptop chip level training for beginners and
                  advanced learners. Learn laptop service and become a certified
                  technician.
                </p>

                <ul
                  className="list-unstyled mb-4 lh-lg"
                  style={{ fontSize: fontSizes.text }}
                >
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    25 Days Hotel Accommodation (Sharing)
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />3 Times Food
                    + Snacks & Tea Daily
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Complimentary Dinner @ Star Hotel
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Real-Time Case Studies
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Free Tools & Laptops for Practice
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    Business & Management Development Classes
                  </li>
                  <li>
                    <AiOutlineCheck className="text-danger me-2" />
                    App Login Access (1 Year) + Technical Support
                  </li>
                </ul>
                <button
                  className="btn btn-danger rounded-pill px-4 py-2 fw-semibold shadow-sm"
                  onClick={() => handleApplyNow("LASP")}
                >
                  Apply Now
                </button>
              </div>
            </div>
            <div className="col-lg-6 p-0 position-relative d-flex">
              <img
                src={LaspAcademy}
                alt="LASP Training"
                className="img-fluid w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-4 bg-[#1f1f1f]">
        <div className="container ">
          {/* --- Section Heading --- */}
          <div className="text-center mb-5 ">
            <h2 className="fw-bold text-dark position-relative d-inline-block">
              Free Welcome Kit
              <div
                className="mx-auto  RadnusAcdemycss"
                style={{
                  height: "4px",
                  width: "80px",
                  backgroundColor: "#dc3545",
                  borderRadius: "2px",
                }}
              ></div>
            </h2>
            <p className="text-gray-400 mt-2 fs-5">
              Everything you need to get started at Radnus Academy
            </p>
          </div>

          {/* --- Cards Row --- */}
          <div className="row g-4 justify-content-center ">
            {/* Card 1 */}
            <div className="col-12 col-md-4">
              <div className="p-4 text-center RadnusAcdemycss">
                <Package size={48} strokeWidth={1.25} className="mb-3" />
                <h5 className="fw-bold mb-2">Student Joining Kit</h5>
                <p>All the essentials for your first day</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="col-12 col-md-4">
              <div className="p-4 text-center RadnusAcdemycss">
                <Shirt
                  size={48}
                  strokeWidth={1.25}
                  className="mb-3 text-gray-400 "
                />
                <h5 className="fw-bold mb-2">Radnus Branded T-Shirt</h5>
                <p>Wear your pride with our official T-shirt</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="col-12 col-md-4">
              <div className="p-4 text-center RadnusAcdemycss">
                <BookOpen
                  size={48}
                  strokeWidth={1.25}
                  className="mb-3 text-gray-400 g"
                />
                <h5 className="fw-bold mb-2">Notebook & Training Booklet</h5>
                <p>All course materials at your fingertips</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="col-12 col-md-4">
              <div className="p-4 text-center RadnusAcdemycss">
                <IdCard
                  size={48}
                  strokeWidth={1.25}
                  className="mb-3 text-gray-400 "
                />
                <h5 className="fw-bold mb-2">ID Card with Lanyard</h5>
                <p>Your identity as a certified Radnus trainee</p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="col-12 col-md-4">
              <div className="p-4 text-center RadnusAcdemycss">
                <Award
                  size={48}
                  strokeWidth={1.25}
                  className="mb-3 text-gray-400 "
                />
                <h5 className="fw-bold mb-2">Framed Certificate</h5>
                <p>Your achievement displayed proudly</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Who Can Join Section */}
      <section className="pt-3 pb-2 bg-light">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark position-relative d-inline-block">
              Who Can Join?
              <div
                className="mx-auto mt-2"
                style={{
                  height: "4px",
                  width: "80px",
                  backgroundColor: "#dc3545",
                  borderRadius: "2px",
                }}
              ></div>
            </h2>
            <p className="text-muted mt-2" style={{ fontSize: fontSizes.text }}>
              Radnus Academy welcomes learners from all walks of life
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white shadow-sm rounded-4 border border-light h-100">
                <h5
                  className="fw-semibold mb-2"
                  style={{ fontSize: fontSizes.subtitle }}
                >
                  ITI, Diploma, Engineering & Degree Holders
                </h5>
                <p
                  className="text-muted mb-0"
                  style={{ fontSize: fontSizes.text }}
                >
                  Students aiming to build a career in mobile technology
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white shadow-sm rounded-4 border border-light h-100">
                <h5
                  className="fw-semibold mb-2"
                  style={{ fontSize: fontSizes.subtitle }}
                >
                  Existing Mobile Shop Owners
                </h5>
                <p
                  className="text-muted mb-0"
                  style={{ fontSize: fontSizes.text }}
                >
                  Enhance your skills and expand your business
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-4 bg-white shadow-sm rounded-4 border border-light h-100">
                <h5
                  className="fw-semibold mb-2"
                  style={{ fontSize: fontSizes.subtitle }}
                >
                  Business Starters, Job Seekers, Housewives
                </h5>
                <p
                  className="text-muted mb-0"
                  style={{ fontSize: fontSizes.text }}
                >
                  Anyone eager to learn and start a mobile business
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
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
