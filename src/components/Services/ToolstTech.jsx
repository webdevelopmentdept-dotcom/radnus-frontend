import React from "react";
import SoftwareTool from "../../images/softwaretool.webp";
import HardwareTool from "../../images/hardwaretool.webp";
import Bowler from "../../images/bowler.webp";
import Tempercut from "../../images/tempercut.webp";
import Thermal from "../../images/thermal.webp";
import Skincut from "../../images/skincut.webp";
import Microscope from "../../images/microscope.webp";
import Dcpower from "../../images/dcpower.webp";
import Uvfluxpaste from "../../images/uvfluxpaste.webp";
import Tthree from "../../images/tthree.webp";
import Androidbooster from "../../images/androidbooster.webp";
import Soldering from "../../images/soldering.webp";
import Borneo1 from "../../images/borneo1.webp";
import Unlock from "../../images/unlock.webp";
import Bornedual from "../../images/bornedual.webp";
import Umt from "../../images/umt.webp";
import Griffen from "../../images/griffen.webp";
import Pragmafix from "../../images/pragmafix.webp";
import Chimera from "../../images/chimera.webp";
import ChimeraPro from "../../images/chimerapro.webp";

import Eft from "../../images/eft.webp";
import { Helmet } from "react-helmet";

const ToolsTech = () => {
  const hardwareTools = [
    { img: Bowler, name: "Bowler" },
    { img: Tempercut, name: "Temper Cut" },
    { img: Thermal, name: "Thermal Tool" },
    { img: Skincut, name: "Skin Cutter" },
    { img: Microscope, name: "Microscope" },
    { img: Dcpower, name: "DC Power" },
    { img: Uvfluxpaste, name: "UV Flux Paste" },
    { img: Tthree, name: "T3 Tool" },
    { img: Androidbooster, name: "Android Booster" },
    { img: Soldering, name: "Soldering Tool" },
  ];

  const softwareTools = [
    { img: Borneo1, name: "Borneo Schematics", note: "Single User" },
    { img: Bornedual, name: "Borneo Schematics", note: "Double User" },
    { img: Unlock, name: "UNLOCK Tool", note: "Single User Only" },
    { img: Umt, name: "UMT (Ultimate Multi Tool)" },
    { img: Griffen, name: "Griffen Unlocker" },
    { img: Pragmafix, name: "Pragmafix Schematic" },
    { img: Chimera, name: "Chimera Tool (Samsung)" },
    { img: ChimeraPro, name: "Chimera Pro Tool" },
    { img: Eft, name: "EFT Pro", note: "With Dongle" },
  ];

  return (
    <>
      <Helmet>
        <title>Mobile Repair Tools & Technology | Radnus Communication</title>
        <meta
          name="description"
          content="Shop premium hardware and software tools for mobile repair technicians in India — Chimera, Pragmafix, UMT, and more."
        />
        <meta
          name="keywords"
          content="mobile repair tools, technician tools, Chimera tool, Pragmafix schematic, hardware tools for mobile repair, UMT tool"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Radnus Communication" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Tools & Technology for Mobile Repair | Radnus"
        />
        <meta
          property="og:description"
          content="Find high-quality hardware and software tools for mobile and laptop repair technicians at Radnus Communication."
        />
        <meta property="og:url" content="https://www.radnus.in/tools-tech" />
        <meta property="og:image" content="https://www.radnus.in/logo2.png" />
        <link rel="canonical" href="https://www.radnus.in/tools-tech" />
      </Helmet>

      {/* Header Section */}
      <section className="position-relative overflow-hidden banner-section">
        {/* Desktop view */}
        <div className="d-none d-md-flex h-100">
          <div
            className="flex-fill"
            style={{
              backgroundImage: `url(${SoftwareTool})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div
            className="flex-fill"
            style={{
              backgroundImage: `url(${HardwareTool})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>

        {/* Mobile view */}
        <div
          className="d-md-none h-100 mobile-banner"
          style={{
            backgroundImage: `url(${SoftwareTool})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Overlay text */}
        <div className="position-absolute top-50 start-50 translate-middle text-center p-4 rounded overlay-content">
          <h2 className="mb-3 fs-2 fw-bold">
            Discover the Best Tools & Technology for Mobile Repair
          </h2>
          <p className="mb-3 " style={{ fontSize: "1.4rem" }}>
            Find advanced hardware and software tools for technicians, shop
            owners, and laptop repair experts — all in one place.
          </p>
          <button
            className="btn btn-light text-dark px-3 py-1 fw-semibold"
            onClick={() =>
              document
                .getElementById("software-tools")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Tools
          </button>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="pt-3 container" id="software-tools">
        <h2 className="text-center mb-2 fw-bold text-danger">
          Our Mobile Repair Tools & Technologies
        </h2>
        <p className="text-center fs-5 mb-5">
          At Radnus Communication, we offer high-quality{" "}
          <strong>mobile repair tools</strong>,{" "}
          <strong>hardware tools for mobile repair</strong>, and{" "}
          <strong>software tools for technicians</strong> designed to boost
          accuracy, productivity, and customer satisfaction.
        </p>

        {/* Hardware Tools */}
        <h3 id="hardware-tools" className="mb-4 text-primary border-bottom">
          Hardware Tools for Mobile Repair
        </h3>
        <div className="row g-4">
          {hardwareTools.map(({ img, name }, i) => (
            <div className="col-6 col-md-4 col-lg-3" key={i}>
              <div className="card border-0 shadow-sm rounded-4 text-center h-100 tool-card">
                <img
                  src={img}
                  alt={name}
                  className="card-img-top mb-2"
                  style={{
                    objectFit: "contain",
                    height: "130px",
                  }}
                />
                <div className="card-body">
                  <h6 className="card-title text-dark">{name}</h6>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Software Tools */}
        <h3 className="mt-5 mb-3 text-primary border-bottom">
          Software Tools for Technicians
        </h3>
        <p className=" mb-4" style={{ fontSize: "1.1rem" }}>
          Whether you’re using <strong>Chimera</strong>,{" "}
          <strong>UMT (Ultimate Multi Tool)</strong>, or{" "}
          <strong>Pragmafix schematic tools</strong>, we’ve got everything you
          need to handle flashing, unlocking, and diagnostics efficiently.
        </p>
        <div className="row g-4 pb-2">
          {softwareTools.map(({ img, name }, i) => (
            <div className="col-6 col-md-3" key={i}>
              <div className="card border-0 shadow-sm rounded-4 text-center h-100 tool-card">
                <img
                  src={img}
                  alt={name}
                  className="card-img-top mb-2"
                  style={{
                    objectFit: "contain",
                    height: "130px",
                  }}
                />
                <div className="card-body">
                  <h6 className="card-title text-dark">{name}</h6>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="pt-3 pb-1 text-white text-center"
        style={{ backgroundColor: "rgba(44, 44, 44, 0.5)" }}
      >
        <div className="container">
          <h2 style={{ color: "#dc3545" }}>
            Boost Your Mobile Repair Business
          </h2>
          <p className="mb-4 fs-5  fw-semibold">
            Access the best <strong>mobile repair equipment</strong> and{" "}
            <strong>tools for technicians</strong> to improve productivity,
            accuracy, and customer trust.
          </p>

          <div className="d-flex justify-content-center flex-wrap gap-3 mb-1">
            <button
              className="btn btn-danger fw-bold px-3 py-2"
              onClick={() =>
                document
                  .getElementById("hardware-tools")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Tools
            </button>
          </div>
        </div>
      </section>

      <style>
        {`
          /* ===========================
             Mobile View Optimization
          ============================ */

          .banner-section {
            height: 450px;
          }

          .overlay-content {
            background-color: rgba(0, 51, 102, 0.5);
            color: #fff;
            max-width: 450px;
          }

          .tool-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
          }

          .tool-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          }

          @media (max-width: 576px) {
            .banner-section {
              height: 360px !important;
            }

            .overlay-content {
              padding: 15px !important;
              max-width: 85%;
            }

            .overlay-content h2 {
              font-size: 1rem !important;
              line-height: 1.4;
            }

            .overlay-content p {
              font-size: 0.8rem !important;
              margin-bottom: 12px !important;
            }

            .overlay-content button {
              font-size: 0.8rem !important;
              padding: 6px 14px !important;
            }

            .tool-card img {
              height: 100px !important;
            }

            .tool-card h6 {
              font-size: 0.9rem !important;
            }

            .container h2 {
              font-size: 1.1rem !important;
            }

            .text-muted {
              font-size: 0.85rem !important;
            }

            .row.g-4 {
              row-gap: 1rem !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default ToolsTech;
