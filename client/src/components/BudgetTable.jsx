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
      background: "#1e1e1e", border: "1px solid #B8860B", borderRadius: 14,
      overflow: "hidden", margin: "12px 0", fontFamily: "'Inter',sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#B8860B,#DAA520)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Preliminary Budget Estimate
          </div>
          <div style={{ fontSize: 11, color: "#5a3a00", marginTop: 2 }}>
            {sqft > 0 ? `${sqft.toLocaleString()} sf` : ""}
            {meta.exterior_tier ? ` · Exterior: ${TIER_LABELS[meta.exterior_tier]}` : ""}
            {meta.interior_tier ? ` · Interior: ${TIER_LABELS[meta.interior_tier]}` : ""}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#1a1a1a", padding: "0 4px" }}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Total always visible */}
      <div style={{ padding: "16px 20px", borderBottom: expanded ? "1px solid #2a2a2a" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Total Estimate
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#DAA520" }}>{fmt(total)}</div>
            {perSf && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>≈ {fmt(perSf)}/sf all-in</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Subtotal: {fmt(subtotal)}</div>
            <div style={{ fontSize: 12, color: "#666" }}>10% Contingency: {fmt(contingency)}</div>
          </div>
        </div>
      </div>

      {/* Line items */}
      {expanded && (
        <div style={{ padding: "0 0 8px" }}>
          <div style={{ padding: "8px 20px 4px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Category</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, textAlign: "right" }}>Estimate</div>
          </div>
          {lineItems.map((li, i) => (
            <div key={li.id} style={{
              padding: "7px 20px",
              background: i % 2 === 0 ? "transparent" : "#242424",
              display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "baseline",
            }}>
              <div>
                <span style={{ fontSize: 11, color: "#555", marginRight: 6 }}>{li.id}</span>
                <span style={{ fontSize: 13, color: "#ccc" }}>{li.name}</span>
                {li.notes && <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>{li.notes}</span>}
              </div>
              <div style={{ fontSize: 13, color: "#e0e0e0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {fmt(li.amount)}
              </div>
            </div>
          ))}
          {/* Subtotals */}
          <div style={{ borderTop: "1px solid #333", margin: "8px 0 0", padding: "8px 20px 4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "4px 0" }}>
              <div style={{ fontSize: 13, color: "#aaa" }}>Subtotal</div>
              <div style={{ fontSize: 13, color: "#aaa", textAlign: "right" }}>{fmt(subtotal)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "4px 0" }}>
              <div style={{ fontSize: 12, color: "#666" }}>10% Contingency</div>
              <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>{fmt(contingency)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "8px 0 4px", borderTop: "1px solid #B8860B", marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#DAA520" }}>TOTAL</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#DAA520", textAlign: "right" }}>{fmt(total)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #2a2a2a" }}>
        <p style={{ fontSize: 10, color: "#444", margin: 0, lineHeight: 1.5 }}>
          Preliminary estimate for planning purposes only. Final costs depend on design documents, site conditions, and current material pricing.
          A copy has been sent to your email.
        </p>
      </div>
    </div>
  );
}
