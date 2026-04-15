import React, { useState } from "react";

export default function ChecklistCard({ component, onSubmit }) {
  const { title, subtitle, items = [], key } = component;
  const [checked, setChecked] = useState(() => Object.fromEntries(items.map(i => [i.key, false])));

  const toggle = (k) => setChecked(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSubmit = () => {
    const selected  = items.filter(i => checked[i.key]).map(i => i.label);
    const humanText = selected.length
      ? `${title}: ${selected.join(", ")}`
      : `${title}: none selected`;
    onSubmit(humanText, { key, values: checked });
  };

  return (
    <div style={{
      background: "#242424", border: "1px solid #B8860B", borderRadius: 12,
      padding: "16px 18px", marginBottom: 8,
    }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#B8860B", marginBottom: subtitle ? 2 : 10, letterSpacing: "0.04em", fontFamily: "'Inter',sans-serif" }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 11, color: "#666", marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>{subtitle}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {items.map(item => (
          <button key={item.key} onClick={() => toggle(item.key)}
            style={{
              padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
              transition: "all 0.15s",
              border: `1px solid ${checked[item.key] ? "#B8860B" : "#3a3a3a"}`,
              background: checked[item.key] ? "#B8860B22" : "#1a1a1a",
              color: checked[item.key] ? "#DAA520" : "#888",
            }}>
            {checked[item.key] ? "✓ " : ""}{item.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSubmit}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#B8860B,#DAA520)", color: "#1a1a1a",
            fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
          }}>
          Continue →
        </button>
      </div>
    </div>
  );
}
