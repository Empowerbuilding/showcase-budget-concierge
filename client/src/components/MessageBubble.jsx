import React from "react";

const styles = {
  row:             { display: "flex", gap: 8, padding: "4px 20px", maxWidth: "100%" },
  userRow:         { justifyContent: "flex-end" },
  assistantRow:    { justifyContent: "flex-start" },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#C5A572",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 4, color: "#fff",
  },
  bubble: {
    maxWidth: "78%", padding: "12px 18px", borderRadius: 18,
    fontSize: 15, lineHeight: 1.6, wordBreak: "break-word",
    fontFamily: "'Inter',sans-serif",
  },
  userBubble: {
    background: "#C5A572", color: "#fff",
    borderRadius: "18px 18px 4px 18px", fontWeight: 500,
  },
  assistantBubble: {
    background: "#F5F3EF", color: "#374151",
    borderRadius: "18px 18px 18px 4px",
  },
};

// Parse basic markdown into React elements
function parseMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip separator lines
    if (line.trim() === "---") {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.1)", margin: "8px 0" }} />);
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: 6 }} />);
      continue;
    }

    // Parse inline bold (**text**) and italic (*text*)
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const inline = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pi} style={{ fontWeight: 700, color: "inherit" }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={pi}>{part.slice(1, -1)}</em>;
      }
      return part;
    });

    elements.push(<div key={key++} style={{ marginBottom: 2 }}>{inline}</div>);
  }

  return elements;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div style={{ ...styles.row, ...(isUser ? styles.userRow : styles.assistantRow) }}>
      {!isUser && <div style={styles.avatar}>S</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>
        {isUser ? message.text : parseMarkdown(message.text)}
      </div>
    </div>
  );
}
