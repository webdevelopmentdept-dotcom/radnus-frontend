import React, { useState, useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiPackage,
  FiTool,
  FiHeadphones,
  FiShoppingBag,
  FiTrendingUp,
  FiBriefcase,
  FiClock,
} from "react-icons/fi";

function RadnusNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // ✅ Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Perfect close (no reload + guaranteed collapse)
  const closeMenu = (e, path, isHash = false) => {
    e?.preventDefault?.();

    // Navigate first
    if (path && !isHash) navigate(path);

    // ✅ Smooth scroll to #contact if it’s a hash link
    if (isHash) {
      navigate("/");
      setTimeout(() => {
        const contact = document.getElementById("contact");
        if (contact) contact.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }

    // ✅ Force collapse close after route change
    setTimeout(() => {
      const navbarCollapse = document.getElementById("navbarNav");
      if (!navbarCollapse) return;
      navbarCollapse.classList.remove("show");

      const collapse =
        window.bootstrap.Collapse.getInstance(navbarCollapse) ||
        new window.bootstrap.Collapse(navbarCollapse, { toggle: false });
      collapse.hide();
    }, 300);
  };

  // ✅ Google Ads Conversion Trigger for "Get In Touch"
  const handleGetInTouchConversion = () => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/P2pCCLCCh7sbENer45s_", // 👈 replace with your real label
        event_label: "Navbar Get In Touch Click",
      });
      console.log("✅ Conversion tracked: Get In Touch Click");
    } else {
      console.warn("⚠️ gtag not found — check if Google Ads script is loaded");
    }
  };
  // ✅ Spacer fix
  useEffect(() => {
    const setNavbarSpacer = () => {
      const navbar = document.querySelector(".navbar");
      const spacer = document.getElementById("navbar-spacer");
      if (navbar && spacer)
        spacer.style.height = `${navbar.offsetHeight - 1}px`;
    };
    setNavbarSpacer();
    window.addEventListener("resize", setNavbarSpacer);
    return () => window.removeEventListener("resize", setNavbarSpacer);
  }, []);

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg fixed-top ${
          scrolled ? "shadow-sm bg-white" : "bg-white"
        }`}
        style={{
          paddingTop: "0.3rem",
          paddingBottom: "0.3rem",
          transition: "background-color 0.4s ease, box-shadow 0.3s ease",
        }}
      >
        <div className="container-fluid">
          {/* Brand */}
          <Link
            className="navbar-brand ms-4"
            to="/"
            onClick={(e) => closeMenu(e, "/")}
          >
            <img src="/image.png" alt="Radnus Logo" height="55px" />
          </Link>

          {/* Toggler */}
          <button
            className="navbar-toggler navbar-toggler-dark"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu */}
          <div
            className="collapse navbar-collapse justify-content-center"
            id="navbarNav"
          >
            <ul className="navbar-nav fs-5">
              <li className="nav-item mx-3">
                <Link
                  className="nav-link text-danger"
                  to="/"
                  onClick={(e) => closeMenu(e, "/")}
                >
                  Home
                </Link>
              </li>

              <li className="nav-item mx-3">
                <Link
                  className="nav-link text-danger"
                  to="/about"
                  onClick={(e) => closeMenu(e, "/about")}
                >
                  Who we are
                </Link>
              </li>
              {/* Mega Dropdown */}
              <li className="nav-item dropdown mx-3 position-static">
                <button
                  className="nav-link dropdown-toggle text-danger bg-transparent border-0"
                  id="whatWeDoDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  What we do
                </button>

                <div
                  className="dropdown-menu p-4 border-0 shadow-lg mega-menu-mobile"
                  aria-labelledby="whatWeDoDropdown"
                >
                  <div className="container">
                    <div className="row">
                      {/* Column 1 */}
                      <div className="col-md-4">
                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/academy"
                          onClick={(e) => closeMenu(e, "/academy")}
                        >
                          <FiBookOpen className="me-2" /> Radnus Academy
                        </Link>
                        <p className=" fs-6 ms-4 mb-4">
                          Skill development, certification & placement
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/whitelabel"
                          onClick={(e) => closeMenu(e, "/whitelabel")}
                        >
                          <FiPackage className="me-2" /> OEM Solutions
                        </Link>
                        <p className="fs-6  ms-4 mb-4">
                          Custom brand mobile accessories manufacturing
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/tools-tech"
                          onClick={(e) => closeMenu(e, "/tools-tech")}
                        >
                          <FiTool className="me-2" /> Tools & Technologies
                        </Link>
                        <p className="fs-6  ms-4 mb-4">
                          Repair tools & service equipment supply
                        </p>
                      </div>

                      {/* Column 2 */}
                      <div className="col-md-4">
                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/service"
                          onClick={(e) => closeMenu(e, "/service")}
                        >
                          <FiHeadphones className="me-2" /> Service Pro
                        </Link>
                        <p className="fs-6  ms-4 mb-4">
                          Advanced repair solutions for B2B support
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/accessories"
                          onClick={(e) => closeMenu(e, "/accessories")}
                        >
                          <FiShoppingBag className="me-2" /> Accessories
                        </Link>
                        <p className="fs-6  ms-4 mb-4">
                          Retail distribution of branded accessories
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/startup"
                          onClick={(e) => closeMenu(e, "/startup")}
                        >
                          <FiTrendingUp className="me-2" /> Startup Support
                        </Link>
                        <p className="fs-6  ms-4 mb-4">
                          Business setup & loan assistance (PMEGP)
                        </p>
                      </div>

                      {/* Column 3 */}
                      <div className="col-md-4 border-start ps-4">
                        <Link
                          className="dropdown-item mb-3 d-flex align-items-center"
                          to="/placement"
                          onClick={(e) => closeMenu(e, "/placement")}
                        >
                          <FiBriefcase className="me-2 fs-6 " /> Placement
                        </Link>
                        <Link
                          className="dropdown-item mb-3 d-flex align-items-center"
                          to="/timeline"
                          onClick={(e) => closeMenu(e, "/timeline")}
                        >
                          <FiClock className="me-2 fs-6 " /> Timeline
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Join Us */}
              <li className="nav-item mx-3">
                <Link
                  className="nav-link text-danger"
                  to="/careers"
                  onClick={(e) => closeMenu(e, "/careers")}
                >
                  Join Us
                </Link>
              </li>

              {/* Smooth scroll to footer */}
              <li className="nav-item mx-3">
                <a
                  href="/#contact"
                  className="nav-link text-danger"
                  onClick={(e) => {
                    handleGetInTouchConversion(); // ✅ Trigger Google Ads conversion
                    closeMenu(e, "/#contact", true); // ✅ Existing scroll & collapse logic
                  }}
                >
                  Get In Touch
                </a>
              </li>

              <li className="nav-item mx-3">
                <Link
                  className="nav-link text-danger"
                  to="/login"
                  onClick={(e) => closeMenu(e, "/login")}
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Styles */}
        <style>{`
          .navbar {
            transition: background-color 0.4s ease, box-shadow 0.3s ease;
          }

          .navbar-toggler {
            border: none;
          }

          .navbar-toggler-icon {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba(0,0,0,0.9)' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
          }

          .navbar-brand img {
            max-height: 68px;
            width: auto;
          }

          @media (max-width: 767px) {
            .navbar {
              padding: 0.4rem !important;
            }
            .navbar-brand img {
              max-height: 36px;
            }
            .dropdown-menu {
              position: static !important;
              width: 100% !important;
              box-shadow: none !important;
              border: none !important;
            }
            .dropdown-menu .row {
              flex-direction: column !important;
            }
          }
        `}</style>
      </nav>

      {/* Spacer */}
      <div
        id="navbar-spacer"
        style={{ height: "0px", marginBottom: "-1px" }}
      ></div>
    </>
  );
}

export default RadnusNavbar;
