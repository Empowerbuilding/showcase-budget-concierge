import React from "react";

const styles = {
  row:           { display: "flex", gap: 8, padding: "4px 20px", maxWidth: "100%" },
  userRow:       { justifyContent: "flex-end" },
  assistantRow:  { justifyContent: "flex-start" },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, #B8860B, #DAA520)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 4, color: "#1a1a1a",
  },
  bubble: {
    maxWidth: "75%", padding: "12px 18px", borderRadius: 18,
    fontSize: 15, lineHeight: 1.5, wordBreak: "break-word",
    fontFamily: "'Inter',sans-serif",
  },
  userBubble: {
    background: "linear-gradient(135deg, #B8860B, #DAA520)",
    color: "#1a1a1a", borderRadius: "18px 18px 4px 18px", fontWeight: 500,
  },
  assistantBubble: {
    background: "#2a2a2a", color: "#f0f0f0", borderRadius: "18px 18px 18px 4px",
  },
};

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div style={{ ...styles.row, ...(isUser ? styles.userRow : styles.assistantRow) }}>
      {!isUser && <div style={styles.avatar}>B</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>
        {message.text}
      </div>
    </div>
  );
}
