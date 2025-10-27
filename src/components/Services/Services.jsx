import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "bootstrap-icons/font/bootstrap-icons.css";

// 🖼️ Assets
import CCPin from "../../images/ccpinimg.png";
import Display from "../../images/displayimg.png";
import Battery from "../../images/batteryimg.png";
import Backdoor from "../../images/backdoorimg.png";
import Camera from "../../images/cameraimg.png";
import Frame from "../../images/frameimg.png";
import Audio from "../../images/audioimg.png";
import WaterLock from "../../images/waterlockimg.png";
import Deadmobile from "../../images/deadmobile.png";
import Restart from "../../images/restartimg.png";
import IcRepairs from "../../images/icrepairsimg.png";
import Reballing from "../../images/reballingimg.png";
import MobileServiceBg from "../../images/servicebg1.png";
import { Helmet } from "react-helmet";

// 🧩 CATEGORY DATA
const categories = [
  {
    title: "Basic Replacements",
    layout: "default",
    services: [
      {
        title: "CC Pin Change",
        desc: "Replace damaged charging pins with high-quality new connectors.",
        image: CCPin,
      },
      {
        title: "Display Change",
        desc: "Fix cracked or unresponsive displays using original parts.",
        image: Display,
      },
      {
        title: "Battery Change",
        desc: "Boost performance with a new, genuine battery replacement.",
        image: Battery,
      },
      {
        title: "Backdoor Change",
        desc: "Restore your phone’s back panel for a fresh, premium look.",
        image: Backdoor,
      },
      {
        title: "Camera Change",
        desc: "Repair or replace faulty front/rear cameras with OEM modules.",
        image: Camera,
      },
      {
        title: "Frame Change",
        desc: "Fix bent or damaged mobile frames for better durability.",
        image: Frame,
      },
    ],
  },
  {
    title: "Audio & Connector Repairs",
    layout: "tech",
    services: [
      {
        title: "Mic Change",
        desc: "Fix low or no sound issues caused by a faulty mic unit.",
        image: Audio,
      },
      {
        title: "Speaker / Air Speaker Change",
        desc: "Replace damaged speakers to restore clear and crisp sound.",
        image: Audio,
      },
      {
        title: "Charging Port Fix / Replacement",
        desc: "Solve loose or damaged charging ports with secure replacements.",
        image: Audio,
      },
    ],
  },
  {
    title: "Advanced IC-Level Repairs",
    layout: "grid",
    services: [
      {
        title: "Water Lock Set",
        desc: "Recover phones affected by water damage through advanced ultrasonic cleaning and precise IC repair. Our expert technicians carefully remove corrosion, clean internal components, and restore full functionality to devices that have suffered water exposure.",
        image: WaterLock,
      },
      {
        title: "Dead Mobile Repair",
        desc: "Revive completely dead devices through advanced board-level diagnostics and component repair. Our skilled technicians identify and replace faulty ICs, power lines, and circuits to bring non-responsive phones back to life with precision and reliability.",
        image: Deadmobile,
      },
      {
        title: "Restart Problem Fix",
        desc: "Fix restart, hang, and boot-loop issues with expert IC rework and software calibration. Our technicians diagnose the root cause at the board level to ensure stable performance and prevent future system crashes or random restarts.",
        image: Restart,
      },
      {
        title: "IC Repairs",
        desc: "Repair Charger IC, Power IC, Network IC, Lighting IC, Graphics IC, and Touch IC failures with advanced micro-soldering and precision rework techniques. Our skilled engineers use professional tools to accurately diagnose and replace damaged ICs, restoring full functionality and long-term performance to your device.",
        image: IcRepairs,
      },
      {
        title: "RAM / eMMC / CPU Reballing",
        desc: "Reball or replace IC components such as RAM, eMMC, and CPU using advanced rework stations and precision tools. Our experts ensure perfect solder alignment and thermal balance to restore stable performance, fix boot failures, and extend your device’s lifespan.",
        image: Reballing,
      },
    ],
  },
];

// 🗣️ TESTIMONIALS DATA
const testimonials = [
  {
    name: "Robert Brown",
    date: "January 12, 2025",
    rating: 4,
    title: "Good choice!",
    text: "The headphones are of good quality, fit perfectly and are very easy to pair with any device.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Sophia Miller",
    date: "February 5, 2025",
    rating: 5,
    title: "Excellent Service!",
    text: "They repaired my phone quickly and it works like brand new. Highly recommend their service!",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "David Johnson",
    date: "March 2, 2025",
    rating: 4,
    title: "Very Satisfied!",
    text: "Professional staff and reasonable pricing. My cracked screen was fixed in under an hour and good expirence.",
    image: "https://randomuser.me/api/portraits/men/56.jpg",
  },
  {
    name: "Emma Williams",
    date: "April 10, 2025",
    rating: 5,
    title: "Amazing Quality!",
    text: "Bought a new charger and it’s super durable. Excellent value for money and friendly service.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Michael Davis",
    date: "May 18, 2025",
    rating: 5,
    title: "Fast and Reliable!",
    text: "My tablet repair was completed the same day. The team really knows what they’re doing.",
    image: "https://randomuser.me/api/portraits/men/77.jpg",
  },
];

const Service = () => {
  return (
    <>
      {/* ✅ HELMET FOR META TAGS */}
      <Helmet>
        <title>Professional Mobile Repair & Service | Fast & Reliable</title>
        <meta
          name="description"
          content="Expert mobile repair services including screen replacement, battery service, IC repairs, and more. Fast, reliable, and professional care for all your devices."
        />
        <meta
          name="keywords"
          content="best mobile service center in pondicherry,
          iphone ic chip repair,
          samsung screen replacement,
          mobile camera repair shop near me,
             mobile display changing shop"
        />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Professional Mobile Repair & Service | Fast & Reliable"
        />
        <meta
          property="og:description"
          content="Get your phone repaired quickly and efficiently. Screen replacement, battery service, IC repairs, and more by expert technicians."
        />
        <meta property="og:url" content="https://www.radnus.in/service" />
        <meta property="og:image" content="/logo2.png" />
        <meta property="og:site_name" content="radnus.in" />

        <link rel="canonical" href="https://www.radnus.in/service" />
      </Helmet>
      {/* HERO SECTION */}
      <section
        className="position-relative d-flex align-items-center text-start overflow-hidden"
        style={{
          backgroundImage: `url(${MobileServiceBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "50vh",
        }}
      >
        <div
          className="position-relative text-white px-5"
          style={{ maxWidth: "700px" }}
        >
          <h1 className="fw-bold fs-1 display-4 mb-3">
            Professional Mobile Repair & Service
          </h1>
          <p className="fs-5 text-light mb-0">
            Fast, reliable, and expert care for your devices. Screen
            replacement, battery service, and more.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <div>
        {categories.map((cat, catIndex) => {
          // GRID layout
          if (cat.layout === "grid") {
            return (
              <section key={catIndex} className="py-3 bg-white">
                <Container>
                  <h2
                    className="fw-bold text-center mb-3 border-bottom pb-2"
                    style={{ color: "#111" }}
                  >
                    {cat.title}
                  </h2>

                  {cat.services.map((service, i) => (
                    <Row
                      key={i}
                      className={`align-items-center ${
                        i % 2 !== 0 ? "flex-md-row-reverse" : ""
                      }`}
                    >
                      <Col md={6} className="text-center">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="img-fluid rounded-4 shadow-lg"
                          style={{
                            maxWidth: "400px",
                            transition: "transform 0.3s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.03)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        />
                      </Col>
                      <Col md={6}>
                        <h3 className="fw-bold mb-3 fs-3">{service.title}</h3>
                        <p className="  fs-6" style={{ lineHeight: "2" }}>
                          {service.desc}
                        </p>
                      </Col>
                    </Row>
                  ))}
                </Container>
              </section>
            );
          }

          // TECH layout
          if (cat.layout === "tech") {
            return (
              <section key={catIndex} className="pt-1 bg-white">
                <Container>
                  <h2
                    className="fw-bold text-center mb-5"
                    style={{ color: "#111" }}
                  >
                    {cat.title}
                  </h2>
                  <Row className="align-items-center">
                    <Col md={6} className="text-center mb-4 mb-md-0">
                      <div
                        className="rounded-4 overflow-hidden shadow-sm"
                        style={{
                          border: "1px solid #eee",
                          background: "#fafafa",
                          padding: "12px",
                        }}
                      >
                        <img
                          src={Audio}
                          alt="IC Service Lab"
                          className="img-fluid rounded-3"
                          style={{ maxHeight: "420px", objectFit: "cover" }}
                        />
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="d-flex flex-column gap-4">
                        {cat.services.map((service, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-4 d-flex align-items-center shadow-sm"
                            style={{
                              background: "#fff",
                              border: "1px solid #eaeaea",
                              transition: "0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.transform =
                                "translateY(-3px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div
                              className="rounded-circle me-3 d-flex justify-content-center align-items-center"
                              style={{
                                width: "45px",
                                height: "45px",
                                background: "#f1f1f1",
                                color: "#111",
                                fontWeight: "bold",
                                fontSize: "1.1rem",
                                border: "1px solid #ddd",
                              }}
                            >
                              {i + 1}
                            </div>
                            <div>
                              <h5
                                className="fw-bold mb-1"
                                style={{ color: "#111" }}
                              >
                                {service.title}
                              </h5>
                              <p
                                className="mb-0 text-muted"
                                style={{ fontSize: "0.95rem" }}
                              >
                                {service.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </Container>
              </section>
            );
          }

          // DEFAULT layout
          if (cat.layout === "default") {
            return (
              <section
                key={catIndex}
                className="py-5"
                style={{ background: "#f8f9fa" }}
              >
                <Container>
                  <h2
                    className="fw-bold text-center mb-5"
                    style={{ color: "#111" }}
                  >
                    {cat.title}
                  </h2>
                  <Row className="g-4">
                    {cat.services.map((service, i) => (
                      <Col md={4} key={i}>
                        <div
                          className="p-4 bg-white rounded-4 text-center shadow-sm h-100"
                          style={{
                            transition: "transform 0.3s, box-shadow 0.3s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-5px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 20px rgba(0,0,0,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.05)";
                          }}
                        >
                          <img
                            src={service.image}
                            alt={service.title}
                            className="img-fluid mb-3 rounded-3"
                            style={{ maxHeight: "170px" }}
                          />
                          <h5
                            className="fw-bold mb-2"
                            style={{ color: "#fe0707ff" }}
                          >
                            {service.title}
                          </h5>
                          <p className="fs-6">{service.desc}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Container>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* ⭐ TESTIMONIAL SECTION */}

      <section className="pt-2 bg-light">
        <Container>
          <h2
            className="fw-bold text-center mb-2 fs-3"
            style={{ color: "#111" }}
          >
            Our Happy Clients
          </h2>

          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={true} // 🔁 Enables infinite loop
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            style={{
              paddingBottom: "40px",
            }}
          >
            {testimonials.map((review, index) => (
              <SwiperSlide key={index}>
                <div
                  className="p-4 bg-white rounded-4 shadow-sm h-100"
                  style={{
                    border: "1px solid #eee",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Profile */}
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="rounded-circle me-3"
                      style={{
                        width: "55px",
                        height: "55px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <h6 className="fw-bold mb-0">{review.name}</h6>
                      <small className="text-muted">{review.date}</small>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-2">
                    {Array(review.rating)
                      .fill()
                      .map((_, i) => (
                        <i
                          key={i}
                          className="bi bi-star-fill me-1"
                          style={{ color: "#ff3333ff" }} // Ungal preferred color
                        ></i>
                      ))}
                  </div>

                  {/* Review */}
                  <h6 className="fw-bold">{review.title}</h6>
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.95rem", lineHeight: "1.6" }}
                  >
                    {review.text}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </Container>
      </section>
    </>
  );
};

export default Service;
