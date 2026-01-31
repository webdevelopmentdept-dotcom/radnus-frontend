import React, { useState, useEffect, useRef } from "react";

import Galleryimg1 from "../../images/galleryimg01.webp";
import Galleryimg2 from "../../images/galleryimg02.webp";
import Galleryimg3 from "../../images/galleryimg03.webp";
import Galleryimg4 from "../../images/galleryimg04.webp";
import Galleryimg5 from "../../images/galleryimg05.webp";
import Galleryimg6 from "../../images/galleryimg06.webp";
import Galleryimg7 from "../../images/galleryimg07.webp";
import Galleryimg8 from "../../images/galleryimg08.webp";
import Galleryimg9 from "../../images/galleryimg09.webp";
import Galleryimg10 from "../../images/galleryimg010.webp";
import Galleryimg11 from "../../images/galleryimg011.webp";
import Galleryimg12 from "../../images/galleryimg012.webp";
import Galleryimg13 from "../../images/galleryimg013.webp";

const Gallery = () => {
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const images = [
    { id: 1, url: Galleryimg1, title: "Engineer in Action", type: "standard" },
    { id: 2, url: Galleryimg3, title: "The Decision Desk", type: "tall" },
    { id: 3, url: Galleryimg4, title: "Moments That Matter", type: "wide" },
    { id: 4, url: Galleryimg2, title: "Smiles at Work", type: "standard" },
    { id: 5, url: Galleryimg5, title: "Focused & Happy", type: "standard" },
    { id: 6, url: Galleryimg6, title: "Shared Smiles", type: "standard" },
    { id: 7, url: Galleryimg7, title: "Celebrating Together", type: "big" },
    { id: 8, url: Galleryimg8, title: "Learning by Doing", type: "standard" },
    { id: 9, url: Galleryimg9, title: "Supporting the Workforce", type: "tall" },
    { id: 10, url: Galleryimg10, title: "Together We Rise", type: "standard" },
    { id: 11, url: Galleryimg11, title: "Growing with Purpose", type: "wide" },
    { id: 12, url: Galleryimg12, title: "Every Step Counts", type: "standard" },
    { id: 13, url: Galleryimg13, title: "Quiet Confidence", type: "standard" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.2 }
    );
    sectionRef.current && observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const openLightbox = (img, index) => {
    setSelectedImg(img);
    setCurrentIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImg(null);
    document.body.style.overflow = "auto";
  };

  const navigate = (dir, e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + dir + images.length) % images.length;
    setSelectedImg(images[newIndex]);
    setCurrentIndex(newIndex);
  };

  return (
    <section ref={sectionRef} className={`gallery ${isVisible ? "show" : ""}`}>
      <style>{`

   

        .gallery {
        padding: 20px 5% 90px;
          max-width: 1400px;
          margin: auto;
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease;
        }
        .gallery.show { opacity: 1; transform: translateY(0); }

      .gallery-header {
  max-width: 100%;
  margin-bottom: 30px;
}

        .gallery-header h2 {
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(90deg,#111,#555);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gallery-header p { color:#666; margin-top:10px; }

        /* DESKTOP */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          grid-auto-rows: 260px;
          gap: 18px;
          grid-auto-flow: dense;
        }

        .gallery-item {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 15px 40px rgba(0,0,0,.1);
          transition: .4s ease;
        }

        .gallery-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 60px rgba(0,0,0,.2);
        }

        .gallery-item.tall { grid-row: span 2; }
        .gallery-item.wide { grid-column: span 2; }
        .gallery-item.big { grid-column: span 2; grid-row: span 2; }

        .gallery-item img {
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .overlay {
          position:absolute;
          inset:0;
          background: linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,.1));
          display:flex;
          align-items:flex-end;
          padding:20px;
          opacity:0;
          transition:.3s;
        }

        .gallery-item:hover .overlay { opacity:1; }
        .overlay span { color:#fff; font-size:18px; }

        /* TABLET */
        @media (max-width: 900px) {
          .gallery-grid {
            grid-template-columns: repeat(2,1fr);
          }
          .gallery-item.big,
          .gallery-item.wide {
            grid-column: span 2;
          }
        }

        /* MOBILE – ONE IMAGE PER ROW */
        @media (max-width: 600px) {
          .gallery-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
          }

          .gallery-item,
          .gallery-item.big,
          .gallery-item.wide,
          .gallery-item.tall {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
          }

          .gallery-item img {
            height: 240px;
          }
        }

        /* LIGHTBOX */
        .lightbox {
          position:fixed;
          inset:0;
          background:rgba(10,10,10,.75);
          backdrop-filter: blur(14px);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:2000;
        }

        .lightbox-main { position:relative; max-width:90%; }
        .lightbox-img { max-height:80vh; border-radius:8px; }

        .close {
          position:absolute;
          top:-45px;
          right:0;
          color:#fff;
          font-size:30px;
          background:none;
          border:none;
          cursor:pointer;
        }

        .nav {
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          width:45px;
          height:45px;
          border-radius:50%;
          border:none;
          background:rgba(255,255,255,.85);
          cursor:pointer;
        }

        .prev { left:-60px; }
        .next { right:-60px; }
      `}</style>
<div className="gallery-header text-center mb-3">
  <h2 className=" mb-2">Moments at Work</h2>

  <div className="d-flex justify-content-center mb-2">
    <span
      className="border-bottom border-danger"
      style={{ width: "60px" }}
    ></span>
  </div>

  <p className="text-muted mb-0">
    A glimpse into our creative and professional journey.
  </p>
</div>



      <div className="gallery-grid">
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`gallery-item ${img.type}`}
            onClick={() => openLightbox(img, i)}
          >
            <img src={img.url} alt={img.title} />
            <div className="overlay">
              <span>{img.title}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedImg && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-main" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeLightbox}>✕</button>
            <button className="nav prev" onClick={(e) => navigate(-1, e)}>‹</button>
            <img src={selectedImg.url} className="lightbox-img" alt="" />
            <button className="nav next" onClick={(e) => navigate(1, e)}>›</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
