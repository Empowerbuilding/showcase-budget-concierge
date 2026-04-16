import React from "react";

const styles = {
  card: {
    background: "#F5F3EF",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #E5E0D8",
    maxWidth: 320,
    marginTop: 8,
    marginBottom: 4,
    transition: "border-color 0.2s",
  },
  image: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
    background: "#E5E0D8",
  },
  body: {
    padding: "14px 16px",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 6,
    color: "#111827",
    fontFamily: "'Playfair Display', serif",
  },
  specs: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    fontFamily: "'Inter', sans-serif",
  },
  button: {
    display: "inline-block",
    padding: "8px 20px",
    background: "#C5A572",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    fontFamily: "'Inter', sans-serif",
    transition: "background 0.2s",
  },
};

export default function FloorPlanCard({ plan }) {
  // Link to DesignVault archive page with scroll to plan
  const planUrl = `https://designvault.barnhaussteelbuilders.com/?plan=${plan.id}`;

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C5A572")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
    >
      {plan.image_url && (
        <img
          src={plan.image_url}
          alt={plan.title}
          style={styles.image}
          onError={(e) => (e.target.style.display = "none")}
        />
      )}
      <div style={styles.body}>
        <div style={styles.title}>{plan.title}</div>
        <div style={styles.specs}>
          {plan.area && `${plan.area.toLocaleString()} sqft`}
          {plan.beds && ` · ${plan.beds} bed`}
          {plan.baths && ` · ${plan.baths} bath`}
        </div>
        <a
          href={planUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
          onMouseEnter={(e) => (e.target.style.background = "#B39460")}
          onMouseLeave={(e) => (e.target.style.background = "#C5A572")}
        >
          View Plan
        </a>
      </div>
    </div>
  );
}
