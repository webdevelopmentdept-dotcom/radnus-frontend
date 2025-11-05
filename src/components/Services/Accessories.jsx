import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Zap, ShieldCheck, Gem, CheckCircle2, Headphones } from "lucide-react";
import { Helmet } from "react-helmet";
import HeroImage from "../../images/accessoriesbackground3.webp";
import Speaker1 from "../../images/speakerimg1.webp";
import Speaker2 from "../../images/speakerimg2.webp";
import Speaker3 from "../../images/speakerimg3.webp";
import Speaker4 from "../../images/speakerimg4.webp";
import TreamsLogo from "../../images/treamslogo2.webp";
import RivieraLogo from "../../images/rivieralogo.webp";

import Headsets1 from "../../images/headphoneimg.webp";
import Headsets2 from "../../images/neckbandimg.webp";
import Headsets3 from "../../images/earpodsimg.webp";

import OtgImg from "../../images/otgimage1.webp";
import Datacable1 from "../../images/datacableimg.webp";
import Datacable2 from "../../images/datacableimg1.webp";
import Datacable3 from "../../images/datacableimg3.webp";
import Battery from "../../images/batteryimage.webp";

import Charger1 from "../../images/chargerimg3.webp";
import Charger2 from "../../images/chargerimg1.webp";
import Charger3 from "../../images/chargerimg2.webp";
import Charger4 from "../../images/carchargerimg.webp";
import Charger5 from "../../images/universalchargerimg.webp";
import Charger6 from "../../images/normalchargerimg.webp";

import { motion } from "framer-motion";
import mobileImg from "../../images/powerbankimg.webp";
import mobileImg1 from "../../images/powerbankimg1.webp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { EffectCreative } from "swiper/modules";
import { Card } from "react-bootstrap";

const products = [
  {
    img: Charger1,
    name: "Super Fast Charger",
  },
  {
    img: Charger2,
    name: "Dual USB Charger",
  },
  {
    img: Charger3,
    name: "Smart Charger",
  },
  {
    img: Charger4,
    name: "Car Charger",
  },
  {
    img: Charger5,
    name: "Universal Charger",
  },
  {
    img: Charger6,
    name: "Basic Charger",
  },
];

const mobiles = [
  {
    name: "Bluetooth Speaker",
    img: Speaker1,
  },
  {
    name: "MTIJIEY MJ-1618",
    img: Speaker4,
  },
  {
    name: "MTIJIEY MJ-5329",
    img: Speaker3,
  },
  {
    name: "WIRELESS SPEAKER",
    img: Speaker2,
  },
];

const Accessories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [bgStyle, setBgStyle] = useState(products[products.length - 1].bg);

  const prevItem = () => {
    setActiveIndex((prev) => {
      const newIndex = (prev - 1 + products.length) % products.length;
      setBgStyle(products[newIndex].bg);
      return newIndex;
    });
  };

  const nextItem = () => {
    setActiveIndex((prev) => {
      const newIndex = (prev + 1) % products.length;
      setBgStyle(products[newIndex].bg);
      return newIndex;
    });
  };

  const handleClick = (index) => {
    if (index === activeIndex) {
      setFullscreenItem(products[index]);
    } else {
      setActiveIndex(index);
      setBgStyle(products[index].bg);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextItem();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const expoSlides = [
    {
      img: OtgImg,
      title: "Otg",
      desc: "Compact OTG for fast and easy data transfer between devices.",
    },
    {
      img: Datacable1,
      title: "Connector",
      desc: "Durable connector for reliable and efficient device connectivity.",
    },
    {
      img: Datacable2,
      title: "3in1 Datacable",
      desc: "Versatile 3-in-1 data cable for charging and syncing multiple devices with a single cable.",
    },
    {
      img: Datacable3,
      title: "Datacables",
      desc: "High-quality data cable ensuring quick charging and reliable connectivity.",
    },
    {
      img: Battery,
      title: "Battery",
      desc: "Compact button phone battery delivering reliable power for essential usage.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Best Mobile Accessories | Premium Chargers, Speakers & Headphones
        </title>
        <meta
          name="description"
          content="Explore our premium collection of mobile accessories including chargers, power banks, speakers, and headphones. High quality, fast delivery, and reliable performance for all your devices."
        />
        <meta
          name="keywords"
          content="best mobile accessories shop near me, best mobile accessories shop in pondicherry, mobile accessories shop in pondicherry, best bluetooth speaker under ₹1000, best budget friendly headphones, fast charging chargers"
        />
        <meta name="author" content="Radnus Communication" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Best Mobile Accessories | Premium Chargers, Speakers & Headphones"
        />
        <meta
          property="og:description"
          content="Discover our premium range of chargers, power banks, speakers, and headphones for all your devices. Quality products with fast delivery."
        />
        <meta property="og:image" content="https://www.radnus.in/logo2.png" />
        <meta property="og:url" content="https://www.radnus.in/accessories" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Best Mobile Accessories | Premium Chargers, Speakers & Headphones"
        />
        <meta
          name="twitter:description"
          content="Discover premium chargers, speakers, and headphones with fast delivery and trusted quality."
        />
        <meta name="twitter:image" content="https://www.radnus.in/logo2.png" />

        <link rel="canonical" href="https://www.radnus.in/accessories" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {`
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Radnus Communication",
    "url": "https://www.radnus.in",
    "logo": "https://www.radnus.in/logo2.png",
    "description": "Radnus Communication offers premium mobile accessories and service support across India."
  }
  `}
        </script>
      </Helmet>

      {/* 🌟 Hero Section */}
      <section
        className="hero-section d-flex align-items-center"
        style={{
          backgroundImage: `url(${HeroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          position: "relative",
          height: "320px", // optional fallback
        }}
      >
        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-md-6 text-start">
              <h1 className="fw-bold display-6 mb-3">
                Explore the Latest <br /> Mobile Accessories
              </h1>
              <p className="fw-semibold mb-4 fs-5">
                Discover our premium range of headphones, chargers, and smart
                gadgets designed to complement your lifestyle.
              </p>
              <a
                href="#contact"
                onClick={() => {
                  if (typeof window.gtag === "function") {
                    window.gtag("event", "conversion", {
                      send_to: "AW-16969684439/your_conversion_label_here",
                      event_label: "Shop Accessories - Hero Click",
                    });
                  }
                  const section = document.querySelector("#contact");
                  section?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn  mt-3 px-4 py-2"
                style={{
                  background: "linear-gradient(90deg, #ff2a2a, #ccb9acff)",
                  color: "#0a0a0aff",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 0 14px rgba(255, 60, 60, 0.4)",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                }}
              >
                Shop Now
              </a>
            </div>
          </div>
        </div>

        <style>{`
          .hero-section {
            height: 60vh; /* desktop height */
            background-position: center;
            background-size: cover;
          }

          @media (max-width: 768px) {
            .hero-section {
              height: 20vh; /* mobile height */
              background-position: center top;
            }
          }
        `}</style>
      </section>

      {/* PowerBank section */}
      <section
        className="position-relative pt-2"
        style={{
          background: "linear-gradient(180deg, #fdfdfd 0%, #f6f8fb 100%)",
          minHeight: "700px",
          overflow: "hidden",
        }}
      >
        {/* 🔹 Static Header (doesn’t change) */}
        <div className="text-center mb-5 fw-bold">
          <h2 style={{ fontSize: "1.8rem", color: "#111" }}>
            PowerBank Collection
          </h2>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>
            Discover compact power and smart charging built for every journey.
          </p>
        </div>
        {/* React logic */}
        {(() => {
          const [currentSet, setCurrentSet] = React.useState(0);

          const dataSets = [
            {
              img: mobileImg,
              features: [
                {
                  id: 1,
                  title: "Model",
                  desc: "TT-14 Model PowerBank With Dual USB Port Support.",
                },
                {
                  id: 2,
                  title: "Battery Capacity",
                  desc: "Stay powered all day with 12000mAh battery.",
                },
                {
                  id: 3,
                  title: "Type",
                  desc: "Fast Charging,High Capacity,Portable Support.",
                },
                {
                  id: 4,
                  title: "Voltage",
                  desc: "Experience 2.1A Output rapid charging for phones, tablets, and more.",
                },
              ],
              positions: [
                { top: "10%", left: "15%" },
                { bottom: "10%", left: "18%" },
                { top: "10%", right: "15%" },
                { bottom: "10%", right: "18%" },
              ],
            },
            {
              img: mobileImg1,
              features: [
                {
                  id: 1,
                  title: "Model",
                  desc: "Quick Power Model PowerBank With Dual USB Port Support.",
                },
                {
                  id: 2,
                  title: "Battery Capacity",
                  desc: "Stay powered all day with 20000mAh battery.",
                },
                {
                  id: 3,
                  title: "Type",
                  desc: "Fast Charging,High Capacity,Portable,LED Display.",
                },
                {
                  id: 4,
                  title: "Voltage",
                  desc: "High-performance 2.4A output and 5V/2.4A input for smarter, faster charging.",
                },
              ],
              positions: [
                { top: "12%", left: "14%" },
                { bottom: "12%", left: "17%" },
                { top: "12%", right: "14%" },
                { bottom: "12%", right: "17%" },
              ],
            },
          ];

          React.useEffect(() => {
            const interval = setInterval(() => {
              setCurrentSet((prev) => (prev + 1) % dataSets.length);
            }, 5000); // change every 5 seconds
            return () => clearInterval(interval);
          }, []);

          const current = dataSets[currentSet];

          return (
            <>
              {/* Header */}
              <div className="text-center mb-5">
                <motion.h2
                  key={current.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    fontWeight: "700",
                    fontSize: "2.8rem",
                    color: "#111",
                  }}
                >
                  {current.title}
                </motion.h2>
                <motion.p
                  key={current.subtitle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  style={{ fontSize: "1.1rem", color: "#666" }}
                >
                  {current.subtitle}
                </motion.p>
              </div>

              <>
                {/* 🌟 Main Display (Desktop only) */}
                <div
                  className="position-relative d-none d-md-flex justify-content-center align-items-center"
                  style={{ minHeight: "500px" }}
                >
                  {/* Dotted Circle */}
                  <div
                    className="highlight-circle"
                    style={{
                      position: "absolute",
                      width: "570px",
                      height: "570px",
                      border: "2px dotted rgba(0,0,0,0.12)",
                      borderRadius: "50%",
                      zIndex: 1,
                    }}
                  ></div>

                  {/* Animated Main Image */}
                  <motion.img
                    key={current.img}
                    src={current.img}
                    alt="highlight-product"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      width: "450px",
                      height: "auto",
                      filter: "drop-shadow(0px 20px 45px rgba(0,0,0,0.25))",
                      transform: "translateY(10px)",
                      zIndex: 3,
                    }}
                  />

                  {/* Feature Boxes */}
                  {current.features.map((f, i) => (
                    <motion.div
                      key={`${f.id}-${current.title}`}
                      className="feature-box bg-white rounded-4 shadow-sm p-3 position-absolute text-start"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      style={{
                        width: "240px",
                        zIndex: 4,
                        ...current.positions[i],
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "rgba(255,82,33,0.9)",
                          color: "#fff",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "absolute",
                          top: "-18px",
                          left: "-18px",
                          border: "3px solid #fff",
                        }}
                      >
                        {f.id}
                      </div>
                      <h5 style={{ fontSize: "1.2rem", color: "#111" }}>
                        {f.title}
                      </h5>
                      <p style={{ fontSize: "0.95rem", color: "#444" }}>
                        {f.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* 📱 Mobile View */}
                <div className="d-block d-md-none mt-4 text-center">
                  <motion.img
                    key={current.img}
                    src={current.img}
                    alt="highlight-product"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      width: "75%",
                      maxWidth: "320px",
                      height: "auto",
                      marginBottom: "1.5rem",
                      filter: "drop-shadow(0px 10px 25px rgba(0,0,0,0.15))",
                    }}
                  />

                  {current.features.map((f, i) => (
                    <motion.div
                      key={f.id}
                      className="feature-mobile bg-white rounded-4 shadow-sm mx-auto mb-4 position-relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      style={{
                        width: "90%",
                        maxWidth: "360px",
                        padding: "1.2rem",
                      }}
                    >
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: "rgba(255,82,33,0.9)",
                          color: "#fff",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "absolute",
                          top: "-22px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          border: "3px solid #fff",
                        }}
                      >
                        {f.id}
                      </div>
                      <h5
                        style={{
                          fontWeight: "700",
                          color: "#111",
                          marginTop: "1.2rem",
                        }}
                      >
                        {f.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          color: "#444",
                          marginBottom: 0,
                        }}
                      >
                        {f.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </>
            </>
          );
        })()}
      </section>

      {/* 🆕 Speaker Section */}
      <section
        className="relative py-3"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, #ffffffff, #ffffffff)",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start", // 🔹 moved content to top
          paddingTop: "80px", // ⬅️ Added this
          paddingBottom: "60px", // 🔹 consistent bottom space
        }}
      >
        {/* Title Section */}
        <div className="container text-center mb-2 mt-0">
          <h2
            className="fw-bold mb-1  text-dark letter-spacing-1"
            style={{ fontSize: "1.8rem" }}
          >
            Speakers
          </h2>
          <p className=" fs-5 mt-1">Give Massive Energy To Phone</p>
        </div>

        {/* Horizontal Scroll Strip */}
        <div
          className="d-flex justify-content-center align-items-center flex-wrap gap-5 px-4"
          style={{
            rowGap: "3rem",
            columnGap: "4rem",
          }}
        >
          {mobiles.map((mobile, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08, rotateY: 10 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
              className="position-relative"
              style={{
                width: "260px",
                height: "340px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "25px",
                background: "transparent",
                boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              {/* Glowing Ring */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: "220px",
                  height: "220px",
                  borderRadius: "50%",
                  backgroundImage: `conic-gradient(from 0deg, ${mobile.bg}, transparent 80%)`,
                  filter: "blur(1.5px) brightness(1.3)",
                }}
              />

              {/* Product Image */}
              <motion.img
                src={mobile.img}
                alt={mobile.name}
                style={{
                  height: "200px",
                  zIndex: 2,
                  objectFit: "contain",
                  filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.35))",
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + i,
                  ease: "easeInOut",
                }}
              />
              {/* Label */}
              <motion.div
                className="position-absolute bottom-0 start-50 translate-middle-x mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  scale: 1.1,
                  rotateX: 2,
                  rotateY: 2,
                  textShadow:
                    "0 2px 6px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25)",
                }}
                transition={{ type: "spring", stiffness: 150, damping: 12 }}
                style={{
                  fontSize: "1rem",

                  textTransform: "uppercase",
                  color: "#000000",
                  textAlign: "center",
                }}
              >
                {mobile.name}
              </motion.div>

              <style>
                {`
          @keyframes shine {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          `}
              </style>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charger Carousel Section */}
      <section
        className="position-relative pt-1 text-center"
        style={{
          perspective: "900px",
          transition: "background 1s ease-in-out",
          background: "#f0f0f0",
          minHeight: "10px",
        }}
      >
        <h2 className="fw-bold ">Charger Showcase</h2>
        <p
          className="text-muted"
          style={{
            fontSize: "1.1rem",
            letterSpacing: "0.4px",
          }}
        ></p>
        Our chargers deliver speed, safety, and performance you can trust.
        <div
          className="d-flex justify-content-center align-items-center position-relative"
          style={{ height: "370px", overflow: "hidden" }}
        >
          {products.map((p, i) => {
            let offset = i - activeIndex;
            if (offset > products.length / 2) offset -= products.length;
            if (offset < -products.length / 2) offset += products.length;
            const rotateY = offset * 15;
            const translateX = offset * 0;
            const scale = Math.max(1 - Math.abs(offset) * 0.2, 0.6);
            const zIndex = products.length - Math.abs(offset);
            const opacity = Math.max(1 - Math.abs(offset) * 0.3, 0);

            return (
              <div
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  position: "absolute",
                  transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: "transform 0.6s ease, opacity 0.6s ease",
                  zIndex: zIndex,
                  opacity: opacity,
                  cursor: "pointer",
                  width: "300px",
                  height: "340px", // Added space for name below
                }}
              >
                {/* Background Blur Box */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "90%",
                    height: "70%",
                    background: "#ffffff55",
                    borderRadius: "20px",
                    transform: "translate(-50%, -50%)",
                    filter: "blur(15px)",
                    zIndex: 0,
                  }}
                />

                {/* Product Image */}
                <img
                  src={p.img}
                  alt={p.name || `Product ${i}`}
                  style={{
                    width: "100%",
                    height: "85%", // leave room for name below
                    objectFit: "cover",
                    objectPosition: "center",
                    position: "relative",
                    zIndex: 1,
                    borderRadius: "20px",
                    transition: "transform 0.4s ease",
                    filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.15))",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />

                {/* Product Name Below Image */}
                <div
                  style={{
                    marginTop: "10px",
                    color: "#222",
                    fontWeight: "600",
                    fontSize: "1rem",
                    textAlign: "center",
                    textShadow: "0 1px 3px rgba(255,255,255,0.5)",
                  }}
                >
                  {p.name}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Headphones Section */}
      <section
        className="py-1"
        style={{
          backgroundColor: "#ffffffff",
        }}
      >
        <div className="container text-center mb-4">
          <h2
            className="fw-bold "
            style={{
              fontSize: "1.8rem",
              color: "#111",
              letterSpacing: "1px",
            }}
          >
            Smart Audio Collection
          </h2>
          <p className="mb-4 fs-6">
            Smart sound technology designed for your everyday rhythm.
          </p>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            {[
              {
                img: Headsets1,
                title: "Hands Free",
                desc: "Clear sound wired headset with deep bass and comfortable fit more varieties available in our store.",
              },
              {
                img: Headsets2,
                title: "Neckband",
                desc: "Lightweight wired neckband, comfortable for day-to-day use more varieties available in our store.",
              },
              {
                img: Headsets3,
                title: "Airpods",
                desc: "Compact Airpods with lightweight design and clear sound. more varieties available in our store.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="col-md-4 col-sm-10 "
                style={{ transition: "transform 0.4s ease" }}
              >
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="card border-0 bg-transparent"
                  style={{
                    maxWidth: "370px",
                    margin: "0 auto",
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    className="card-img-top"
                    style={{
                      borderRadius: "2px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      height: "370px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="card-body text-center">
                    <h5 style={{ fontSize: "1.5rem" }}>{item.title}</h5>
                    <p
                      className="text-muted"
                      style={{ fontSize: "0.95rem", lineHeight: "1.6" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All cables Section */}
      <section
        className=" position-relative"
        style={{
          background: "linear-gradient(180deg, #ffffffff 0%, #ffffffff 100%)",
          overflow: "hidden",
          marginTop: "0px",
          paddingTop: "0px",
        }}
      >
        <div className="text-center ">
          <h2
            style={{
              fontSize: "1.8rem",
              color: "#111",
            }}
          >
            All-in-One Cables Collection
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            Explore our wide range of high-quality cables for all your charging
            and data transfer needs.
          </p>
        </div>

        <Swiper
          modules={[EffectCreative, Autoplay]}
          effect="creative"
          grabCursor={true}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          creativeEffect={{
            prev: {
              shadow: true,
              translate: ["-120%", 0, -500],
              rotate: [0, 100, 0],
            },
            next: {
              translate: ["120%", 0, -500],
              rotate: [0, -100, 0],
            },
          }}
          style={{ width: "90%", height: "50vh", borderRadius: "20px" }}
          className="mx-auto"
        >
          {expoSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "20px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="collection-image"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.85) contrast(1.05)",
                    borderRadius: "20px",
                    transition: "0.3s ease-in-out",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: "15%",
                    left: "10%",
                    color: "#fff",
                    textShadow: "0px 0px 10px rgba(0,0,0,0.7)",
                  }}
                >
                  <h3 style={{ fontWeight: "700", fontSize: "2rem" }}>
                    {slide.title}
                  </h3>
                  <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>
                    {slide.desc}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <style>
          {`
    @media (max-width: 768px) {
      .collection-image {
        width: 100% !important;
        height: 350px !important; /* 🔥 sets a proper height for mobile */
        object-fit: cover !important;
        border-radius: 18px !important;
        filter: brightness(1.05) contrast(1.1) !important;
      }

      .swiper {
        height: 420px !important; /* maintains overall swiper shape */
      }

      .swiper-slide {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
      }

      .swiper-slide h3 {
        font-size: 1.3rem !important;
      }

      .swiper-slide p {
        font-size: 0.95rem !important;
        line-height: 1.3 !important;
      }
    }
  `}
        </style>
      </section>

      {/* Benefits section */}
      <section
        className="benefits-section"
        style={{
          background: "#fff",
          padding: "0",
          margin: "0",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          {/* ⚡ Fast & Efficient */}
          <div
            className="benefit-box"
            style={{
              flex: 1,
              background: "#e3dac9",
              color: "#111",
              padding: "18px 0",
              fontWeight: "600",
              textAlign: "center",
              clipPath: "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Zap color="#000" size={22} style={{ marginRight: "6px" }} />
            Fast & Efficient
          </div>

          {/* 🛡️ Long Durability */}
          <div
            className="benefit-box"
            style={{
              flex: 1,
              background: "#d9c39e",
              color: "#111",
              padding: "18px 0",
              fontWeight: "600",
              textAlign: "center",
              clipPath:
                "polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)",
              marginLeft: "-1px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <ShieldCheck
              color="#000"
              size={22}
              style={{ marginRight: "6px" }}
            />
            Long Durability
          </div>

          {/* 💎 Premium Quality */}
          <div
            className="benefit-box"
            style={{
              flex: 1.3,
              background: "#111",
              color: "#fff",
              padding: "20px 0",
              fontWeight: "700",
              textAlign: "center",
              clipPath:
                "polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <Gem color="#fff" size={22} style={{ marginRight: "6px" }} />
            Premium Quality
          </div>

          {/* 🔰 Safe & Reliable */}
          <div
            className="benefit-box"
            style={{
              flex: 1,
              background: "#d9c39e",
              color: "#111",
              padding: "18px 0",
              fontWeight: "600",
              textAlign: "center",
              clipPath:
                "polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)",
              marginLeft: "-1px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <CheckCircle2
              color="#000"
              size={22}
              style={{ marginRight: "6px" }}
            />
            Safe & Reliable
          </div>

          {/* ☎️ Support */}
          <div
            className="benefit-box"
            style={{
              flex: 1,
              background: "#e3dac9",
              color: "#111",
              padding: "18px 0",
              fontWeight: "600",
              textAlign: "center",
              clipPath: "polygon(4% 0, 100% 0, 100% 100%, 4% 100%, 0 50%)",
              marginLeft: "-1px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Headphones color="#000" size={22} style={{ marginRight: "6px" }} />
            24/7 Support
          </div>
        </div>

        {/* ✅ Mobile fix — affects only this section */}
        <style>
          {`
      @media (max-width: 768px) {
        .benefits-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .benefits-section .benefit-box {
          clip-path: none !important;
          flex: 100% !important;
          margin: 6px 0 !important;
          border-radius: 10px !important;
          width: 90% !important;
        }
      }
    `}
        </style>
      </section>

      {/* Partners section */}
      {/* Partners section */}
      <section
        className="pt-3 pb-2 text-center"
        style={{
          background: "linear-gradient(135deg, #f8fafc, #eef2f7)",
        }}
      >
        <h3
          className="fw-bold mt-3 mb-3" // Reduced bottom margin for balance
          style={{
            color: "#111",
            fontSize: "1.6rem",
            letterSpacing: "0.5px",
          }}
        >
          Our Featured Brands
        </h3>

        <div
          className="d-flex justify-content-center align-items-center flex-wrap"
          style={{
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          {/* Logo Container */}
          <div
            style={{
              width: "150px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              src={TreamsLogo}
              alt="Treams"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                opacity: 0.95,
              }}
            />
          </div>

          <div
            style={{
              width: "150px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              src={RivieraLogo}
              alt="Riviera"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                opacity: 0.95,
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default Accessories;
