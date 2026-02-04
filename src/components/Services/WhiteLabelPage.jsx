import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function WhiteLabelPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);
  // ✅ Google Conversion Tracking Function
  const trackConversion = (eventLabel) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/rSMKCOSglbwbENer45s_", // 🔁 Replace with actual label later
        event_label: eventLabel,
      });
      console.log("✅ Conversion tracked:", eventLabel);
    } else {
      console.log("⚠️ gtag not found:", eventLabel);
    }
  };

  const toggleWishlist = (productId, productName) => {
    if (wishlist.includes(productId)) {
      // Remove
      setWishlist(wishlist.filter((id) => id !== productId));
      toast.info(`${productName} removed from wishlist `, {
        autoClose: 2000,
      });
    } else {
      setWishlist([...wishlist, productId]);
      toast.success(`${productName} added to wishlist `, { autoClose: 2000 });

      // ✅ Track Google Ads Conversion
      trackConversion(`${productName} added to wishlist`);
    }
  };

  const products = [
    {
      id: 1,
      category: "Charger",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger21av8_uzngss.webp",
          name: "Charger 2.1A (V8)",
          description: "Single-port charger with reliable performance",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger21atypec_votsw6.webp",
          name: "Charger 2.1A (Type-C)",
          description:
            "Single-port charger designed for safe and efficient charging.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger21aiphone_ikt4nm.webp",
          name: "Charger 2.1A (Iphone)",
          description:
            "Single-port charger durable build and consistent output.",
        },
      ],
    },
    {
      id: 2,
      category: "Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger15wv8_s6xyzl.webp",
          name: "Charger 15W (V8)",
          description: "Dual-port charger with fast and stable charging.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger15wtypec_rxgwde.webp",
          name: "Charger 15W (Type-C)",
          description: "Dual-port charger with over-current protection.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger25wc_oomx3h.webp",
          name: "Charger 15W (Iphone)",
          description: "Dual-port charger with compact and durable design.",
        },
      ],
    },
    {
      id: 3,
      category: "Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger25wv8_xe0sbv.webp",
          name: "Charger 25W (V8)",
          description: "Dual-port charger for efficient daily charging.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger25wc_oomx3h.webp",
          name: "Charger 25W (Type-C)",
          description: "Dual-port charger with premium build quality.",
        },
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016387/charger25wiphone_iisfrk.webp",
          name: "Charger 25W (Iphone)",
          description: "Dual-port charger built with durable materials.",
        },
      ],
    },
    {
      id: 4,
      name: "Charger TC-38PD",
      description: "Compatible with USB-C and Type-C devices.",
      category: "Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016388/chargertc38pd_r50pu9.webp",
          name: "Charger TC-38PD",
          description: "Compatible with USB-C and Type-C devices.",
        },
      ],
    },
    {
      id: 5,
      category: "Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016388/chargertc698v8_jt4qdv.webp",
          name: "Charger TC-698 (V8)",
          description:
            "Dual-port charger with sleek design and safe operation.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016388/chargert698typec_gyndlg.webp",
          name: "Charger TC-698 (Type-C)",
          description: "Dual-port charger with reliable current output.",
        },
      ],
    },
    {
      id: 6,
      category: "Charger",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016408/chargertc699v8_w2ykia.webp",
          name: "Charger TC-699 (V8)",
          description:
            "Compact dual-port charger with intelligent safety features.",
        },

        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016389/chargertc699iphone_jkknfl.webp",
          name: "Charger TC-699 (Iphone)",
          description: "Durable Dual-port charger with sleek modern design.",
        },
      ],
    },
    {
      id: 7,
      category: "Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016408/chargertc755v8_jfilsy.webp",
          name: "Charger TC-755 (V8)",
          description: "Reliable single-port charger ideal for everyday use.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016691/tc175image_fiiflv.webp",
          name: "Charger 3.4A (TC-175)",
          description: "Fast single-port charger with Auto-ID and 3.4A output.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016408/chargertc755iphone_sxsosh.webp",
          name: "Charger TC-755 (Iphone)",
          description:
            "Lightweight single-port charger for convenient portability.",
        },
      ],
    },

    {
      id: 9,
      category: "Neckband",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016577/neckbandx4_kfv97d.webp",
          name: "NeckBand X4 450MAH",
          description: "Bluetooth NeckBand  450mAh battery and clear audio.",
        },
      ],
    },
    {
      id: 10,
      category: "Neckband",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016577/neckbandx6_jwtsjh.webp",
          name: "NeckBand X6",
          description: "Bluetooth NeckBand X6 with balanced audio.",
        },
      ],
    },
    {
      id: 11,
      category: "Neckband",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016576/neckbandbtclassic_oh1mry.webp",
          name: "NeckBand BT classic",
          description: "Bluetooth NeckBand  with  high-fidelity audio.",
        },
      ],
    },
    {
      id: 12,
      category: "Neckband",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016577/neckbandnb3_qlskpm.webp",
          name: "NeckBand NB-03",
          description: "Bluetooth NeckBand with deep bass",
        },
      ],
    },
    {
      id: 13,
      category: "Data Cable",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016409/datacable2av8_lgswdu.webp",
          name: "Data Cable 2.1A (V8)",
          description: "Compact V8 cable with 2.1A fast charging support.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016410/datacable21atypec_i0xoem.webp",
          name: "Data Cable 2.1A (Type-C)",
          description: "Durable Type-C cable with 2.1A output for smartphones.",
        },
      ],
    },
    {
      id: 14,
      category: "Data Cable",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016429/datacable24atypec_wts6sa.webp",
          name: "Data Cable 2.4A (V8)",
          description: "High-speed V8 data cable for quick sync and charging.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016429/datacable24atypec_wts6sa.webp",
          name: "Data Cable 2.4A (Type-C)",
          description: "Premium Type-C cable supporting 2.4A fast charging.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016424/datacable24aiphone_srl0zs.webp",
          name: "Data Cable 2.4A (iPhone)",
          description: "Reliable Lightning cable for iPhone fast charging.",
        },
      ],
    },
    {
      id: 15,
      category: "Data Cable",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016446/datacable35av8_nfekt4.webp",
          name: "Data Cable 3.5A (V8)",
          description: "Ultra-fast V8 cable with 3.5A output for power users.",
        },
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016410/datacable3atypec_msulzr.webp",
          name: "Data Cable 3.5A (Type-C)",
          description: "3.5A Type-C cable with reinforced braided design.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016429/datacable35aiphone_pifwhu.webp",
          name: "Data Cable 3.5A (iPhone)",
          description: "Lightning 3.5A cable for iPhone ultra-fast charging.",
        },
      ],
    },

    {
      id: 16,
      category: "Data Cable",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016459/datacable65w6atypec_iybn5h.webp",
          name: "Data Cable 65W 6A(C)",
          description: "USB-C 65W/6A fast charge for laptops & phones.",
        },
      ],
    },
    {
      id: 17,
      category: "Data Cable",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016429/datacable25wctoiphone_argnwz.webp",
          name: "Data Cable 25W(C-Iphone)",
          description:
            "Durable 25W cable for iPhone fast charging and data transfer.",
        },
      ],
    },
    {
      id: 18,
      category: "Data Cable",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016460/datacable120wtypec_qastny.webp",
          name: "Data Cable 120W (Type-C)",
          description:
            "Ultra-fast 120W USB-C for high-power charging and syncing.",
        },
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016459/datacable120wctoc_flsemk.webp",
          name: "Data Cable 120W(C to C)",
          description:
            "Premium 120W Type-C to Type-C cable in laptops and mobiles.",
        },
      ],
    },
    {
      id: 19,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016537/hfsuperbasspouch_dwips1.webp",
          name: "HF Superbass (Pouch)",
          description: "Over-ear handsfree with deep bass and portable pouch.",
        },
      ],
    },
    {
      id: 20,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016537/hficecream_owpive.webp",
          name: "HF Ice Cream",
          description: "Lightweight colorful handsfree with crisp sound.",
        },
      ],
    },
    {
      id: 21,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016536/hfclothwire_kt89ch.webp",
          name: "HF Cloth Wire",
          description:
            "Durable wired HF braided cloth cable for tangle-free usage.",
        },
      ],
    },
    {
      id: 22,
      category: "Handsfree",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016536/hfblackring_ygklmi.webp",
          name: "HF Black Ring",
          description: "Black HF headphones, balanced sound, comfy cushions.",
        },
      ],
    },
    {
      id: 23,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016537/hfmagnetic_oufrvp.webp",
          name: "HF Magnetic",
          description:
            "Magnetic earbuds, tangle-free, snap together for easy storage.",
        },
      ],
    },
    {
      id: 24,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016645/silverring_ylqahf.webp",
          name: "HF Sliver Ring",
          description:
            "Silver-accent Handsfree with clear audio and comfy fit.",
        },
      ],
    },
    {
      id: 25,
      category: "Handsfree",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016537/hfechoxtypec_z5cz0l.webp",
          name: "HF Echo-X (Type-c)",
          description: "Type-C Hi-Fi Handsfree, echo-free, immersive sound.",
        },
      ],
    },
    {
      id: 26,
      category: "PD & Car Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016614/pdcharger25w_ivbsyt.webp",
          name: "PD Charger 25W",
          description: "Compact 25W PD charger with Type-C to iPhone support",
        },
      ],
    },
    {
      id: 27,
      category: "PD & Car Charger",
      images: [
        {
          src: "https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016614/pdcharger45w_r15al3.webp",
          name: "PD Charger 45W",
          description: "Compact 45W PD charger with Type-C to Type-C support.",
        },
      ],
    },
    {
      id: 28,
      category: "PD & Car Charger",
      images: [
        {
          src:"https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016614/pdcharger80wtc38_jw9lx4.webp",
          name: "PD Charger 80W (TC-38))",
          description: "Compact 80W PD charger with USB-C support..",
        },
      ],
    },
  ];

  const filteredProducts =
    category === "All"
      ? products
      : products.filter((item) => item.category === category);
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          White Label & OEM Solutions | Build Your Brand – Radnus Communication
        </title>
        <meta
          name="description"
          content="Start your own brand with Radnus White Label & OEM mobile accessories — chargers, cables, neckbands, and more with 6-month warranty."
        />
        <meta
          name="keywords"
          content="white label mobile accessories, OEM mobile chargers, private label electronics, custom brand business, radnus oem, mobile accessories manufacturer"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Radnus Communication" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Radnus White Label & OEM Solutions | Build Your Own Brand"
        />
        <meta
          property="og:description"
          content="Create your own brand with Radnus White Label OEM mobile accessories. Premium quality and marketing-ready solutions for entrepreneurs."
        />
        <meta property="og:url" content="https://www.radnus.in/whitelabel" />
        <meta property="og:image" content="https://www.radnus.in/logo2.png" />
        <link rel="canonical" href="https://www.radnus.in/whitelabel" />
      </Helmet>

      {/* Hero Section */}
      <div
        className="container-fluid d-flex justify-content-center align-items-center white-label-hero position-relative pb-1"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016691/trainingform_dqahx7.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "55vh",
          color: "#fff",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 0 }}
        ></div>

        <div
          className="text-center position-relative hero-text d-flex flex-column justify-content-center align-items-center"
          style={{ zIndex: 1, maxWidth: "800px", height: "100%" }}
        >
          <h1 className="display-6 fw-bold mb-3">
            White Label Services by Radnus OEM Solutions
          </h1>
          <h4 className="" style={{ color: "red" }}>
            Custom Brand Supply Division
          </h4>
          <p className="fs-5 fw-semibold" style={{ color: "#ddebe1ff" }}>
            Build your own brand with our premium custom-labeled mobile
            accessories, white label products, and OEM solutions. Perfect for
            retailers and entrepreneurs looking to launch private label
            electronics.
          </p>
        </div>

        <style>
          {`
            @media (max-width: 575.98px) {
              .white-label-hero {
                height: 40vh !important;
                padding: 1rem;
              }
              .white-label-hero .hero-text h1 {
                font-size: 1.5rem !important;
              }
              .white-label-hero .hero-text h4 {
                font-size: 1rem !important;
              }
              .white-label-hero .hero-text p {
                font-size: 1rem !important;
              }
            }
          `}
        </style>
      </div>

      {/* Product Section */}
      <section>
        <div className="container pt-3">
          <h2 className="text-center fw-bold mb-4 fs-3">
            Custom Brand Solutions
          </h2>

          {/* Category Filter */}
          <div
            className="d-flex flex-wrap justify-content-center gap-2 mb-4"
            style={{}}
          >
            {[
              "All",
              "PD & Car Charger",
              "Charger",
              "Neckband",
              "Data Cable",
              "Handsfree",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  trackConversion(`Category Clicked: ${cat}`);
                }}
                className={`btn ${
                  category === cat ? "btn-danger" : "btn-outline-danger"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards */}
          <div className="row justify-content-center">
            {filteredProducts.map((product) => (
              <div key={product.id} className="col-md-3 col-sm-6 mb-4">
                <div
                  className="card product-card shadow-sm border-0"
                  style={{
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Swiper
                    modules={[Pagination, Navigation]}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation
                    pagination={false}
                    autoplay={{ delay: 2500, disableOnInteraction: false }}
                    loop={true}
                    speed={600}
                    style={{
                      borderRadius: "0.5rem",
                      width: "100%",
                      height: "100%",
                      "--swiper-navigation-size": "20px",
                      "--swiper-navigation-color": "#000",
                    }}
                  >
                    {product.images.map((imgObj, idx) => (
                      <SwiperSlide key={idx}>
                        <div className="text-center">
                          <img
                            src={imgObj.src}
                            alt={`White label ${imgObj.name}`}
                            style={{
                              width: "100%",
                              height: "220px",
                              objectFit: "cover",
                            }}
                          />
                          <span
                            onClick={() =>
                              toggleWishlist(product.id, imgObj.name)
                            }
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              cursor: "pointer",
                              fontSize: "1.2rem",
                              zIndex: 10,
                            }}
                          >
                            {wishlist.includes(product.id) ? (
                              <i className="bi bi-heart-fill text-danger"></i>
                            ) : (
                              <i className="bi bi-heart text-danger"></i>
                            )}
                          </span>
                          <div className="p-3">
                            <h5
                              className="fw-bold"
                              style={{ fontSize: "1.1rem" }}
                            >
                              {imgObj.name}
                            </h5>
                            <p className="text-muted mb-0" style={{}}>
                              {imgObj.description}
                            </p>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warranty Section */}
      <section
        className="position-relative pb-2"
        style={{ overflow: "hidden", minHeight: "290px" }}
      >
        <h5 className="text-center " style={{ fontSize: "1.3rem" }}>
          Start your own brand today create custom-labeled accessories!
        </h5>
        <br />
        <div
          className="position-absolute top-0 start-0 opacity-25 rounded-circle"
          style={{ width: "150px", height: "150px", filter: "blur(60px)" }}
        ></div>
        <div
          className="position-absolute bottom-0 end-0 bg-dark opacity-10 rounded-circle"
          style={{ width: "180px", height: "180px", filter: "blur(80px)" }}
        ></div>

        <div
          className="container position-relative text-center text-white"
          style={{ zIndex: 2 }}
        >
          <div
            className="mx-auto shadow-lg rounded-4 p-2 border border-danger warranty-card"
            style={{
              maxWidth: "500px",
              backgroundColor: "#CED4D3",
              height: "240px",
              lineHeight: "1.1",
            }}
          >
            <div className="d-flex justify-content-center mb-3 position-relative">
              <div
                className="position-absolute rounded-circle pulse-bg"
                style={{
                  width: "60px",
                  height: "60px",
                  background: "rgba(255,255,255,0.2)",
                  filter: "blur(15px)",
                }}
              ></div>
              <img
                src="https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016725/warrantylogo_zm423a.webp"
                alt="Warranty Icon - White label products"
                className="position-relative float-icon"
                style={{ width: "70px", height: "70px" }}
              />
            </div>
            <h2 className="fw-bold mb-2" style={{ color: "#f50c0cff" }}>
              6 Months Warranty
            </h2>
            <p
              style={{
                color: "black",
                marginBottom: 0,
                lineHeight: "1.9",
                fontSize: "1rem",
              }}
            >
              Experience peace of mind with our{" "}
              <strong>6-month warranty</strong>, ensuring lasting quality and
              care for every white label product you choose.
            </p>
          </div>
        </div>

        <svg
          className="position-absolute bottom-0 start-0 w-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: "rotate(180deg)", opacity: 0.3 }}
        >
          <path
            d="M985.66 83.03C906.67 51 823.78 33 740 33s-166.67 18-245.66 50.03C406.67 115 323.78 133 240 133S73.33 115 0 83.03V120h1200V83.03z"
            fill="#ffffff"
          ></path>
        </svg>
      </section>

      <ToastContainer position="top-right" autoClose={1500} />
    </>
  );
}

export default WhiteLabelPage;
