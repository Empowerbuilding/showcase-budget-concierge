import React, { useState } from "react";

export default function TierCard({ component, onSubmit }) {
  const { title, tiers = [], key } = component;
  const [selected, setSelected] = useState(null);

  const handleSelect = (id) => setSelected(id);

  const handleSubmit = () => {
    if (!selected) return;
    const tier = tiers.find(t => t.id === selected);
    onSubmit(`${title}: ${tier?.label || selected}`, { key, values: selected });
  };

  return (
    <div style={{
      background: "#242424", border: "1px solid #B8860B", borderRadius: 12,
      padding: "16px 18px", marginBottom: 8,
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#B8860B", marginBottom: 12, letterSpacing: "0.04em", fontFamily: "'Inter',sans-serif" }}>
          {title}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {tiers.map(tier => {
          const isSelected = selected === tier.id;
          return (
            <button key={tier.id} onClick={() => handleSelect(tier.id)}
              style={{
                padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                fontFamily: "'Inter',sans-serif", transition: "all 0.15s",
                border: `1px solid ${isSelected ? "#B8860B" : "#333"}`,
                background: isSelected ? "#B8860B18" : "#1a1a1a",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isSelected ? "#B8860B" : "#444"}`,
                  background: isSelected ? "#B8860B" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a1a1a", display: "block" }} />}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#DAA520" : "#e0e0e0" }}>
                  {tier.label}
                </span>
                {tier.badge && (
                  <span style={{
                    fontSize: 11, color: isSelected ? "#B8860B" : "#555", letterSpacing: "0.08em",
                    marginLeft: "auto", fontWeight: 700,
                  }}>{tier.badge}</span>
                )}
              </div>
              {tier.description && (
                <div style={{ fontSize: 12, color: isSelected ? "#aaa" : "#666", lineHeight: 1.5, paddingLeft: 28 }}>
                  {tier.description}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSubmit} disabled={!selected}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none", cursor: selected ? "pointer" : "not-allowed",
            background: selected ? "linear-gradient(135deg,#B8860B,#DAA520)" : "#333",
            color: selected ? "#1a1a1a" : "#666",
            fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
            transition: "all 0.15s",
          }}>
          Continue →
        </button>
      </div>
    </div>
  );
}
