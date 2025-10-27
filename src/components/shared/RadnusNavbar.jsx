import React, { useState, useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
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

  // Detect scroll for background change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set dynamic spacer to prevent hero content hiding
  useEffect(() => {
    const setNavbarSpacer = () => {
      const navbar = document.querySelector(".navbar");
      const spacer = document.getElementById("navbar-spacer");
      if (navbar && spacer) {
        // subtract 1px to remove the visual gap
        spacer.style.height = `${navbar.offsetHeight - 1}px`;
      }
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
        style={{ paddingTop: "0.3rem", paddingBottom: "0.3rem" }}
      >
        <div className="container-fluid">
          {/* Brand */}
          <Link className="navbar-brand ms-4" to="/">
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
            <ul
              className="navbar-nav"
              style={{ fontSize: "20px", fontWeight: "400" }}
            >
              <li className="nav-item mx-3">
                <Link className="nav-link text-danger " to="/">
                  Home
                </Link>
              </li>

              <li className="nav-item mx-3">
                <Link className="nav-link text-danger " to="/about">
                  Who we are
                </Link>
              </li>

              {/* Mega Dropdown */}
              <li className="nav-item dropdown mx-3 position-static">
                <a
                  className="nav-link dropdown-toggle text-danger "
                  href="#"
                  id="whatWeDoDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  What we do
                </a>

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
                        >
                          <FiBookOpen className="me-2" /> Radnus Academy
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Skill development, certification & placement
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/whitelabel"
                        >
                          <FiPackage className="me-2" /> OEM Solutions
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Custom brand mobile accessories manufacturing
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/tools-tech"
                        >
                          <FiTool className="me-2" /> Tools & Technologies
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Repair tools & service equipment supply
                        </p>
                      </div>

                      {/* Column 2 */}
                      <div className="col-md-4">
                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/service"
                        >
                          <FiHeadphones className="me-2" /> Service Pro
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Advanced repair solutions for B2B support
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/accessories"
                        >
                          <FiShoppingBag className="me-2" /> Accessories
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Retail distribution of branded accessories
                        </p>

                        <Link
                          className="dropdown-item mb-1 d-flex align-items-center"
                          to="/startup"
                        >
                          <FiTrendingUp className="me-2" /> Startup Support
                        </Link>
                        <p className="text-muted small ms-4 mb-4">
                          Business setup & loan assistance (PMEGP)
                        </p>
                      </div>

                      {/* Column 3 */}
                      <div className="col-md-4 border-start ps-4">
                        <Link
                          className="dropdown-item mb-3 d-flex align-items-center"
                          to="/placement"
                        >
                          <FiBriefcase className="me-2" /> Placement
                        </Link>
                        <Link
                          className="dropdown-item mb-3 d-flex align-items-center"
                          to="/timeline"
                        >
                          <FiClock className="me-2" /> Timeline
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Join Us */}
              <li className="nav-item mx-3">
                <Link className="nav-link text-danger" to="/careers">
                  Join Us
                </Link>
              </li>

              <li className="nav-item mx-3">
                <HashLink
                  smooth
                  to="/#contact"
                  className="nav-link text-danger "
                >
                  Get In Touch
                </HashLink>
              </li>
              <li className="nav-item mx-3">
                <Link className="nav-link text-danger " to="/login">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Styles */}
        <style>{`
          /* Remove unwanted margin between navbar and next section */
          body,
          main,
          section:first-of-type {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }

          .navbar-toggler {
            border: none;
          }

          .navbar-toggler-light .navbar-toggler-icon {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba(255,255,255,0.9)' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
          }

          .navbar-toggler-dark .navbar-toggler-icon {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba(0,0,0,0.9)' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
          }

          .navbar-brand img {
            max-height: 68px;
            width: auto;
          }

         @media (max-width: 767px) {
  .dropdown-menu {
    background-color: white !important;
  }

  .dropdown-item {
    color: red !important;
  }

  .dropdown-item:hover {
    background-color: #f8f9fa !important; /* light grey hover */
    color: #c8102e !important; /* darker red hover */
  }

  .navbar {
    padding-top: 0.4rem !important;
    padding-bottom: 0.4rem !important;
  }

  .navbar-brand {
    margin-left: 0 !important;
  }

  .navbar-brand img {
    max-height: 36px;
  }

  .navbar-toggler {
    margin-right: 1rem;
    padding: 0.25rem 0.5rem;
  }

  .navbar-brand,
  .navbar-toggler {
    display: flex;
    align-items: center;
  }

  .dropdown-menu {
    position: static !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0.5rem 1rem;
  }

  .dropdown-menu .row {
    flex-direction: column !important;
  }

  .dropdown-menu .col-md-4 {
    border: none !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .dropdown-item {
    padding-left: 0 !important;
    font-size: 0.95rem !important;
    text-align: left !important;
  }

  .dropdown-item + p {
    margin-left: 0 !important;
    font-size: 0.85rem;
  }
}

        `}</style>
      </nav>

      {/* Spacer div to prevent hero content hiding */}
      <div
        id="navbar-spacer"
        style={{ height: "0px", marginBottom: "-1px" }}
      ></div>
    </>
  );
}

export default RadnusNavbar;
