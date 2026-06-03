import React, { useState } from "react";
import LeadGate from "./components/LeadGate.jsx";
import ChatWindow from "./components/ChatWindow.jsx";

const styles = {
  app: {
    height: "100%",
    width: "100%",
    background: "#FAFAF8",
    display: "flex",
    flexDirection: "column",
  },
};

export default function App() {
  const [leadData, setLeadData] = useState(null);

  const handleLeadSubmit = async (data) => {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Lead save error:", err.message);
      // Never block the user on a DB error
    }
    setLeadData(data);
  };

  return (
    <div style={styles.app}>
      {leadData === null ? (
        <LeadGate onSubmit={handleLeadSubmit} />
      ) : (
        <ChatWindow leadData={leadData} />
      )}
    </div>
  );
}
