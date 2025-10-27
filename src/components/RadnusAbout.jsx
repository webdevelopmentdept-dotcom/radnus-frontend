import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Container, Row, Col, Image, Card } from "react-bootstrap";
import { Helmet } from "react-helmet";
import RadnusVision from "../images/radnusvision.png";
import AboutIcon from "../images/abouticon.png";
import RadnusMission from "../images/radnusmission.png";
import PoorvikabrandLogo from "../images/poorvikabrandlogo.png";
import PartnerCollab from "../images/partnercollab.png";
import AboutBackground from "../images/aboutbackground.jpg";
import Slider1 from "../images/slider1.jpg";
import Slider2 from "../images/acadamybackground.jpg";
import Venam from "../images/venam.jpeg";
import slider3 from "../images/openspeech.jpg";
import {
  FiClock,
  FiAward,
  FiUserCheck,
  FiBriefcase,
  FiBookOpen,
  FiTool,
} from "react-icons/fi";

function RadnusAbout() {
  const fontSizes = {
    heading: "2rem",
    subtitle: "1.25rem",
    text: "1rem",
    lead: "1.2rem",
  };

  return (
    <>
      <Helmet>
        <title>
          About Radnus Communication | Mobile Service Training & Jobs in
          Pondicherry | Founded by Sundar
        </title>
        <meta
          name="description"
          content="Learn about Radnus Communication, founded by Sundar — a leading mobile service training institute in Pondicherry offering practical chip-level repair courses, mobile accessories business support, and Poorvika placement opportunities for mobile technicians."
        />
        <meta
          name="keywords"
          content="Radnus Communication, Radnus founder Sundar, mobile service training Pondicherry, mobile repair course MG Road, chip level training, mobile service job vacancy, Poorvika placement partner, mobile accessories manufacturing, best mobile technician institute, entrepreneurship training Pondicherry, Radnus Poorvika placement, mobile franchise training"
        />
        <meta name="author" content="Radnus Communication" />
        <link rel="canonical" href="https://www.radnus.in/about" />
        <meta
          property="og:title"
          content="Radnus Communication – Mobile Service Training & Jobs in Pondicherry"
        />
        <meta
          property="og:description"
          content="Discover Radnus Communication, founded by Sundar — empowering mobile technicians and entrepreneurs through training, Poorvika placement, and Make-in-India mobile accessories innovation."
        />
        <meta property="og:image" content="/image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.radnus.in/about" />
      </Helmet>

      {/* ✅ Hero Section */}
      <section
        className="about-hero-section position-relative bg-dark text-white d-flex justify-content-center align-items-center text-center overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        <img
          src={AboutBackground}
          alt="Radnus Communication mobile training background"
          className="position-absolute w-100 h-100"
          style={{ objectFit: "cover", objectPosition: "center", zIndex: 1 }}
        />

        <div
          className="position-absolute w-100 h-100"
          style={{ backgroundColor: "rgb(64 52 52 / 44%)", zIndex: 2 }}
        ></div>

        <div
          className="position-relative text-white p-3"
          style={{ zIndex: 3, maxWidth: "600px" }}
        >
          <p
            className="text-uppercase fw-bold mb-2 text-danger"
            style={{ fontSize: "1.7rem" }}
          >
            About Us
          </p>

          <h1 className="fw-bold mb-3" style={{ fontSize: "2.4rem" }}>
            Radnus Communication
          </h1>

          <p className="fw-medium" style={{ fontSize: "1.25rem" }}>
            <strong style={{ color: "rgba(255, 242, 242, 1)" }}>
              Founded in 2003 by Sundar as Univercell Mobile
            </strong>
            , Radnus Communication rebranded in 2011, expanding into{" "}
            <strong>mobile service training</strong>,{" "}
            <strong>chip-level repair courses</strong>, and{" "}
            <strong>mobile accessories manufacturing</strong>. We empower
            entrepreneurs, technicians, and franchise partners across India.
          </p>
        </div>

        <style jsx="true">{`
          @media (max-width: 576px) {
            .about-hero-section {
              min-height: 50vh !important;
            }
            .mobile-white-text {
              color: #ffffff !important;
            }
          }
        `}</style>
      </section>

      {/* ✅ Why Choose Us */}
      <section className="pt-4 text-center text-dark px-3" id="why-choose-us">
        <div className="container">
          <h2
            className="mb-2 text-danger text-uppercase"
            style={{ fontSize: "1.5rem" }}
          >
            Why Choose Radnus Communication
          </h2>

          <p
            className="text-muted mb-4 fw-semibold"
            style={{ fontSize: "1.25rem" }}
          >
            We deliver <strong>real-world mobile repair training</strong>,{" "}
            <strong>entrepreneurship guidance</strong>, and{" "}
            <strong>Poorvika placement support</strong> for our students. With{" "}
            <strong>20+ years of industry experience</strong>, Radnus has built
            trust through quality, innovation, and job-ready skills.
          </p>

          <div className="row justify-content-center why-icons-row">
            {[
              { icon: <FiBookOpen />, text: "100% Practical Training" },
              { icon: <FiAward />, text: "20+ Years of Trust" },
              { icon: <FiClock />, text: "Flexible Timings" },
              { icon: <FiUserCheck />, text: "Experienced Trainers" },
              { icon: <FiTool />, text: "Fully Equipped Labs" },
              { icon: <FiBriefcase />, text: "Job & Business Guidance" },
            ].map((item, index) => (
              <div
                className="col-6 col-sm-4 col-md-2 mb-4 mb-sm-3 mb-md-0"
                key={index}
              >
                <div className="d-flex flex-column align-items-center">
                  <div className="text-dark mb-2" style={{ fontSize: "2rem" }}>
                    {item.icon}
                  </div>
                  <h6
                    className="text-dark text-center"
                    style={{ fontSize: "1.25rem" }}
                  >
                    {item.text}
                  </h6>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx="true">{`
          @media (max-width: 576px) {
            .why-icons-row > .col-6 {
              margin-bottom: 1rem !important;
            }
            .why-icons-row {
              row-gap: 0.5rem !important;
            }
          }
        `}</style>
        <style jsx="true">{`
          /* ✅ Force hero text to stay white on mobile too */
          @media (max-width: 768px) {
            .about-hero-section h1,
            .about-hero-section p {
              color: #ffffff !important;
            }
          }
        `}</style>
      </section>

      {/* ✅ Exclusive Industry Partnership */}
      <Container className="pt-2 pb-1 px-3">
        <h3 className="text-center text-danger" style={{ fontSize: "1.5rem" }}>
          Exclusive Industry Partnership
        </h3>
        <div
          className="mx-auto mb-4"
          style={{
            width: "70px",
            height: "2px",
            background: "#C8102E",
            borderRadius: "3px",
          }}
        />

        <Row className="g-4 align-items-stretch">
          <Col xs={12} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="logo-circle-outer me-3">
                    <div className="logo-circle-inner">
                      <img
                        src={PoorvikabrandLogo}
                        alt="Poorvika Mobile Retailer logo"
                        className="img-fluid"
                      />
                    </div>
                  </div>

                  <h5
                    className="text-danger mb-0"
                    style={{ fontSize: "1.25rem" }}
                  >
                    Exclusive Placement Partner
                  </h5>
                </div>
                <Card.Text className="lh-lg" style={{ fontSize: "1.2rem" }}>
                  Radnus Communication proudly partners with{" "}
                  <strong>Poorvika Mobile Retailer</strong> to create mobile
                  service job opportunitiesand structured{" "}
                  <strong>career placements</strong> for students.
                </Card.Text>
                <ul className="mb-0 ps-4 lh-lg" style={{ fontSize: "1.1rem" }}>
                  <li>Nation’s No.1 Mobile Retailer</li>
                  <li>Exclusive Placement Collaboration with Radnus</li>
                  <li>Proven 100% Placement Record</li>
                  <li>Pan-India Job Support</li>
                  <li>Trusted by Millions of Customers</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="h-100 shadow-sm overflow-hidden">
              <Card.Img
                src={PartnerCollab}
                alt="Radnus and Poorvika partnership event"
                className="img-fluid"
                style={{ objectFit: "cover", height: "100%" }}
              />
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ✅ Event Highlights */}
      <Container className="py-3 text-center px-3">
        <h2
          className="mb-4 text-danger position-relative d-inline-block"
          style={{ fontSize: "1.5rem" }}
        >
          Event Highlights
          <span
            style={{
              position: "absolute",
              width: "60%",
              height: "4px",
              backgroundColor: "#C8102E",
              bottom: "-8px",
              left: "20%",
              borderRadius: "2px",
            }}
          />
        </h2>

        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          modules={[Autoplay, Pagination, Navigation]}
          breakpoints={{
            576: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="mySwiper"
        >
          {[
            {
              img: Slider1,
              title: "Grand Inauguration",
              text: "Celebrating the grand launch of Radnus Communication",
            },
            {
              img: slider3,
              title: "Opening Speech",
              text: "Founder Sundar addressing students and entrepreneurs",
            },
            {
              img: Slider2,
              title: "All Together",
              text: "Capturing moments with our mobile training batch",
            },
            {
              img: Venam,
              title: "Gift Presentation",
              text: "Commemorating collaboration with Poorvika Mobile Retailer",
            },
          ].map((slide, index) => (
            <SwiperSlide key={index}>
              <Card className="shadow-lg border-0">
                <Card.Img
                  variant="top"
                  src={slide.img}
                  alt={slide.title}
                  className="img-fluid"
                  style={{ height: "250px", objectFit: "cover" }}
                />
                <Card.Body className="text-center">
                  <Card.Title
                    className="fw-bold"
                    style={{ fontSize: "1.2rem" }}
                  >
                    {slide.title}
                  </Card.Title>
                  <Card.Text style={{ fontSize: "1.1rem" }}>
                    {slide.text}
                  </Card.Text>
                </Card.Body>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>

      {/* ✅ Mission & Vision */}
      <Container fluid className="py-4">
        <Row className="justify-content-center g-5">
          {/* Mission */}
          <Col md={5} className="text-start">
            <Image
              src={RadnusMission}
              alt="Radnus Communication mission"
              thumbnail
              className="mb-3"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
            {/* Content */}
            <h2
              className="fw-bold mb-3"
              style={{ color: "rgb(169,28,32)", fontSize: "1.5rem" }}
            >
              Our Mission
            </h2>
            <ul
              className="list-unstyled"
              style={{ fontSize: "1.1rem", lineHeight: "1.8" }}
            >
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Expand Radnus globally through strong franchise networks in
                mobile sales, service, and training.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Build India’s first unified franchise model for major global
                brands, setting new industry standards.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Achieve major global presence with multi-brand Radnus Stores and
                digital sales.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Grow Radnus Accessories worldwide with Make-in-India innovation
                and global partnerships.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Create a connected ecosystem linking technology,
                entrepreneurship, and education.
              </li>
            </ul>
          </Col>

          {/* Vision */}
          <Col md={5} className="text-start">
            <Image
              src={RadnusVision}
              alt="Radnus Communication vision"
              thumbnail
              className="mb-3"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
            {/* Content */}
            <h2
              className="fw-bold mb-3"
              style={{ color: "rgb(169,28,32)", fontSize: "1.5rem" }}
            >
              Our Vision
            </h2>
            <ul
              className="list-unstyled"
              style={{ fontSize: "1.1rem", lineHeight: "1.8" }}
            >
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Build a world-class 50+ acre campus offering advanced training
                and global management education.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Equip learners with strong technical, business, and leadership
                skills for the digital era.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Foster creativity and ethical leadership to shape globally
                competent professionals.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Empower startups through MSME support, funding, and mentorship
                for sustainable growth.
              </li>
              <li className="d-flex align-items-start mb-2">
                <img
                  src={AboutIcon}
                  alt="Arrow Icon"
                  className="me-2 mt-1"
                  style={{ width: "20px" }}
                />
                Deliver excellence across service, franchise, and manufacturing
                with global quality.
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default RadnusAbout;
