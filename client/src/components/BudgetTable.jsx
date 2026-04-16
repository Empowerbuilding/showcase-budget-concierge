import React, { useState } from "react";

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

const TIER_LABELS = { standard: "Standard", elevated: "Elevated", premium: "Premium" };

export default function BudgetTable({ budget, sessionData }) {
  const [expanded, setExpanded] = useState(true);
  if (!budget) return null;

  const { lineItems = [], subtotal = 0, contingency = 0, total = 0, meta = {} } = budget;
  const sqft   = meta.sqft || sessionData?.sqft || 0;
  const perSf  = sqft > 0 ? Math.round(total / sqft) : null;

  return (
    <div style={{
      background: "#FAFAF8", border: "1px solid #C5A572", borderRadius: 14,
      overflow: "hidden", margin: "12px 0", fontFamily: "'Inter',sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#C5A572",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Playfair Display',serif" }}>
            Preliminary Budget Estimate
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
            {sqft > 0 ? `${sqft.toLocaleString()} sf` : ""}
            {meta.exterior_tier ? ` · Exterior: ${TIER_LABELS[meta.exterior_tier]}` : ""}
            {meta.interior_tier ? ` · Interior: ${TIER_LABELS[meta.interior_tier]}` : ""}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#fff", padding: "0 4px" }}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Total always visible */}
      <div style={{ padding: "16px 20px", borderBottom: expanded ? "1px solid #E5E0D8" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Total Estimate
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#C5A572", fontFamily: "'Playfair Display',serif" }}>{fmt(total)}</div>
            {perSf && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>≈ {fmt(perSf)}/sf all-in</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Subtotal: {fmt(subtotal)}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>10% Contingency: {fmt(contingency)}</div>
          </div>
        </div>
      </div>

      {/* Line items */}
      {expanded && (
        <div style={{ padding: "0 0 8px" }}>
          <div style={{ padding: "8px 20px 4px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Category</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, textAlign: "right" }}>Estimate</div>
          </div>
          {lineItems.map((li, i) => (
            <div key={li.id} style={{
              padding: "7px 20px",
              background: i % 2 === 0 ? "transparent" : "#F5F3EF",
              display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "baseline",
            }}>
              <div>
                <span style={{ fontSize: 11, color: "#9CA3AF", marginRight: 6 }}>{li.id}</span>
                <span style={{ fontSize: 13, color: "#374151" }}>{li.name}</span>
                {li.notes && <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 8 }}>{li.notes}</span>}
              </div>
              <div style={{ fontSize: 13, color: "#374151", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {fmt(li.amount)}
              </div>
            </div>
          ))}
          {/* Subtotals */}
          <div style={{ borderTop: "1px solid #E5E0D8", margin: "8px 0 0", padding: "8px 20px 4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "4px 0" }}>
              <div style={{ fontSize: 13, color: "#6B7280" }}>Subtotal</div>
              <div style={{ fontSize: 13, color: "#6B7280", textAlign: "right" }}>{fmt(subtotal)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "4px 0" }}>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>10% Contingency</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>{fmt(contingency)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "8px 0 4px", borderTop: "1px solid #C5A572", marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#C5A572" }}>TOTAL</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#C5A572", textAlign: "right" }}>{fmt(total)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #E5E0D8" }}>
        <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
          Preliminary estimate for planning purposes only. Final costs depend on design documents, site conditions, and current material pricing.
          A copy has been sent to your email.
        </p>
      </div>
    </div>
  );
}
