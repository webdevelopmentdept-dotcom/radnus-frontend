import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom"; // ✅ Added for navigation

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
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016369/ccpinimg_xrslpe.webp",
      },
      {
        title: "Display Change",
        desc: "Fix cracked or unresponsive displays using original parts.",
        image:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016464/displayimg_qxpjne.webp",
      },
      {
        title: "Battery Change",
        desc: "Boost performance with a new, genuine battery replacement.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016353/batteryimg_iehndz.webp",
      },
      {
        title: "Backdoor Change",
        desc: "Restore your phone’s back panel for a fresh, premium look.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016352/backdoorimg_vuowfy.webp",
      },
      {
        title: "Camera Change",
        desc: "Repair or replace faulty front/rear cameras with OEM modules.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016368/cameraimg_wevszu.webp",
      },
      {
        title: "Frame Change",
        desc: "Fix bent or damaged mobile frames for better durability.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016491/frameimg_ohdd5i.webp",
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
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016352/audioimg_bxls30.webp",
      },
      {
        title: "Speaker / Air Speaker Change",
        desc: "Replace damaged speakers to restore clear and crisp sound.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016352/audioimg_bxls30.webp",
      },
      {
        title: "Charging Port Fix / Replacement",
        desc: "Solve loose or damaged charging ports with secure replacements.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016352/audioimg_bxls30.webp",
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
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016780/waterlockimg_z5mriz.webp",
      },
      {
        title: "Dead Mobile Repair",
        desc: "Revive completely dead devices through advanced board-level diagnostics and component repair. Our skilled technicians identify and replace faulty ICs, power lines, and circuits to bring non-responsive phones back to life with precision and reliability.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016464/deadmobile_pjsldl.webp",
      },
      {
        title: "Restart Problem Fix",
        desc: "Fix restart, hang, and boot-loop issues with expert IC rework and software calibration. Our technicians diagnose the root cause at the board level to ensure stable performance and prevent future system crashes or random restarts.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016644/restartimg_usfajp.webp",
      },
      {
        title: "IC Repairs",
        desc: "Repair Charger IC, Power IC, Network IC, Lighting IC, Graphics IC, and Touch IC failures with advanced micro-soldering and precision rework techniques. Our skilled engineers use professional tools to accurately diagnose and replace damaged ICs, restoring full functionality and long-term performance to your device.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016537/icrepairsimg_bdmqjy.webp",
      },
      {
        title: "RAM / eMMC / CPU Reballing",
        desc: "Reball or replace IC components such as RAM, eMMC, and CPU using advanced rework stations and precision tools. Our experts ensure perfect solder alignment and thermal balance to restore stable performance, fix boot failures, and extend your device’s lifespan.",
        image: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016644/reballingimg_oxgy7d.webp",
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
        <title>Mobile Repair Services | Radnus Communication</title>
        <meta
          name="description"
          content="Radnus offers fast, reliable mobile repair and maintenance services including software flashing, hardware tools, and OEM accessories."
        />
        <meta
          name="keywords"
          content="mobile repair, service center, Radnus service, mobile tools, accessories, smartphone repair"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Radnus Communication" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Mobile Repair Services | Radnus Communication"
        />
        <meta
          property="og:description"
          content="Get professional mobile service and repair solutions at Radnus Communication — trusted experts since 2003."
        />
        <meta property="og:url" content="https://www.radnus.in/service" />
        <meta property="og:image" content="https://www.radnus.in/logo2.png" />
        <link rel="canonical" href="https://www.radnus.in/service" />
      </Helmet>

      {/* HERO SECTION */}
      <section
        className="position-relative d-flex align-items-center text-start overflow-hidden"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016645/servicebg1_qy30vn.webp)`,
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
          {/* ✅ Updated Contact Us Button (Anchor + Conversion) */}
          <a
            href="#contact"
            onClick={() => {
              if (typeof window.gtag === "function") {
                window.gtag("event", "conversion", {
                  send_to: "AW-16969684439/DsacCMykhbsbENer45s_", // 🔁 Replace with actual label
                  event_label: "Book a Service - Hero Click", // ✅ Updated label
                });
              }

              const section = document.querySelector("#contact");
              section?.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn mt-3 px-4 py-2"
            style={{
              background: "linear-gradient(90deg, #9c7777ff, #b10f0fff)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",

              transition: "all 0.3s ease",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Book a Service
          </a>
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
                          src="https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016352/audioimg_bxls30.webp"
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
