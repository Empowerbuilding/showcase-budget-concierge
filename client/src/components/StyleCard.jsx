import React, { useState } from "react";

const STYLES = [
  {
    id: "Modern",
    label: "Modern",
    desc: "Clean lines, flat or low-pitch roofs, open concept",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
  },
  {
    id: "Modern Farmhouse",
    label: "Modern Farmhouse",
    desc: "Board & batten, metal roofs, warm and rustic feel",
    img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
  },
  {
    id: "Traditional",
    label: "Traditional",
    desc: "Classic symmetry, brick or stone, timeless details",
    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
  },
  {
    id: "Transitional",
    label: "Transitional",
    desc: "Best of both — modern layout, traditional warmth",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  },
];

export default function StyleCard({ onSubmit }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (style) => {
    setSelected(style.id);
    setTimeout(() => {
      onSubmit(`${style.id}`, { key: "style", values: { style: style.id } });
    }, 300);
  };

  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}>
        {STYLES.map(style => (
          <button
            key={style.id}
            onClick={() => handleSelect(style)}
            style={{
              position: "relative",
              border: selected === style.id ? "2px solid #C5A572" : "2px solid transparent",
              borderRadius: 12,
              overflow: "hidden",
              cursor: "pointer",
              padding: 0,
              background: "none",
              transition: "all 0.2s",
              boxShadow: selected === style.id ? "0 0 0 2px #C5A572" : "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <img
              src={style.img}
              alt={style.label}
              style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
              padding: "20px 10px 8px",
            }}>
              <div style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                textAlign: "left",
                lineHeight: 1.2,
              }}>{style.label}</div>
              <div style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10,
                fontFamily: "'Inter', sans-serif",
                textAlign: "left",
                marginTop: 2,
                lineHeight: 1.3,
              }}>{style.desc}</div>
            </div>
            {selected === style.id && (
              <div style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#C5A572",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
        Or type your style in the box below
      </p>
    </div>
  );
}
