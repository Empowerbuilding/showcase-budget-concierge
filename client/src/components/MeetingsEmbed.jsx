import React from "react";

const s = {
  wrap: {
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #E5E0D8",
    background: "#FFFFFF",
  },
  iframe: {
    width: "100%",
    height: 680,
    border: "none",
    display: "block",
  },
  fallback: {
    padding: "32px 24px",
    textAlign: "center",
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
    fontFamily: "'Inter', sans-serif",
    marginBottom: 10,
  },
  fallbackText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  fallbackBtn: {
    display: "inline-block",
    padding: "13px 28px",
    borderRadius: 10,
    background: "#C5A572",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    textDecoration: "none",
    transition: "background 0.2s",
  },
};

// Update BOOKING_URL to your actual Calendly / HubSpot / etc. booking link
const BOOKING_URL = "https://crm.showcasebuilders.com/book/30-minute-consultation?embed=true";

export default function MeetingsEmbed() {
  return (
    <div style={s.wrap}>
      <iframe
        src={BOOKING_URL}
        style={s.iframe}
        title="Book a Design Review with Showcase Builders"
        loading="lazy"
        allow="fullscreen"
      />
    </div>
  );
}
