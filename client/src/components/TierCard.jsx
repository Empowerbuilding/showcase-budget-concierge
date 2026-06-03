import React, { useState } from "react";

const TIER_IMAGES = {
  exterior_tier: {
    standard: "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/DSC_9658.webp?width=800&quality=80&resize=cover",
    elevated:  "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/Copy%20of%20DSC_3691.webp?width=800&quality=80&resize=cover",
    premium:   "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/Kaatz5.webp?width=800&quality=80&resize=cover",
  },
  interior_tier: {
    standard: "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/DSC_9546.webp?width=800&quality=80&resize=cover",
    elevated:  "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/DSC_3802.webp?width=800&quality=80&resize=cover",
    premium:   "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/render/image/public/website-images/Showcase/kaatz2.webp?width=800&quality=80&resize=cover",
  },
};

export default function TierCard({ component, onSubmit }) {
  const { title, tiers = [], key } = component;
  const [selected, setSelected] = useState(null);

  const images = TIER_IMAGES[key] || {};
  const hasImages = Object.keys(images).length > 0;

  const handleSelect = (id) => setSelected(id);

  const handleSubmit = () => {
    if (!selected) return;
    const tier = tiers.find(t => t.id === selected);
    onSubmit(`${title}: ${tier?.label || selected}`, { key, values: selected });
  };

  return (
    <div style={{
      background: "#FAFAF8", border: "1px solid #C5A572", borderRadius: 12,
      padding: "16px 18px", marginBottom: 8,
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#C5A572", marginBottom: 12, letterSpacing: "0.04em", fontFamily: "'Inter',sans-serif" }}>
          {title}
        </div>
      )}

      {/* Image grid when photos available */}
      {hasImages ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {tiers.map(tier => {
            const isSelected = selected === tier.id;
            const img = images[tier.id];
            return (
              <button key={tier.id} onClick={() => handleSelect(tier.id)}
                style={{
                  position: "relative", padding: 0, border: "none", cursor: "pointer",
                  borderRadius: 10, overflow: "hidden",
                  outline: isSelected ? "3px solid #C5A572" : "2px solid transparent",
                  outlineOffset: isSelected ? 2 : 0,
                  transition: "all 0.15s",
                  boxShadow: isSelected ? "0 0 0 1px #C5A572" : "0 1px 4px rgba(0,0,0,0.1)",
                }}>
                {img && (
                  <img src={img} alt={tier.label}
                    style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                  />
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: isSelected
                    ? "linear-gradient(transparent, rgba(197,165,114,0.88))"
                    : "linear-gradient(transparent, rgba(0,0,0,0.65))",
                  padding: "18px 8px 7px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display',serif", lineHeight: 1.2 }}>
                      {tier.label}
                    </span>
                    {tier.badge && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {tier.badge}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 6, right: 6,
                    background: "#C5A572", borderRadius: "50%",
                    width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Fallback: text list when no images */
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {tiers.map(tier => {
            const isSelected = selected === tier.id;
            return (
              <button key={tier.id} onClick={() => handleSelect(tier.id)}
                style={{
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  fontFamily: "'Inter',sans-serif", transition: "all 0.15s",
                  border: `1px solid ${isSelected ? "#C5A572" : "#E5E0D8"}`,
                  background: isSelected ? "rgba(197,165,114,0.1)" : "#fff",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? "#C5A572" : "#D1D5DB"}`,
                    background: isSelected ? "#C5A572" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#C5A572" : "#374151" }}>{tier.label}</span>
                  {tier.badge && (
                    <span style={{ fontSize: 11, color: isSelected ? "#C5A572" : "#9CA3AF", letterSpacing: "0.08em", marginLeft: "auto", fontWeight: 700 }}>{tier.badge}</span>
                  )}
                </div>
                {tier.description && (
                  <div style={{ fontSize: 12, color: isSelected ? "#6B7280" : "#9CA3AF", lineHeight: 1.5, paddingLeft: 28 }}>{tier.description}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Description of selected tier */}
      {selected && (
        <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'Inter',sans-serif", lineHeight: 1.5, marginBottom: 12, padding: "8px 10px", background: "rgba(197,165,114,0.08)", borderRadius: 8, borderLeft: "3px solid #C5A572" }}>
          {tiers.find(t => t.id === selected)?.description}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSubmit} disabled={!selected}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none", cursor: selected ? "pointer" : "not-allowed",
            background: selected ? "#C5A572" : "#E5E0D8",
            color: selected ? "#fff" : "#9CA3AF",
            fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (selected) e.currentTarget.style.background = "#B39460"; }}
          onMouseLeave={e => { e.currentTarget.style.background = selected ? "#C5A572" : "#E5E0D8"; }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
