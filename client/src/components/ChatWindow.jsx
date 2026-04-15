import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import FieldCard from "./FieldCard.jsx";
import ChecklistCard from "./ChecklistCard.jsx";
import TierCard from "./TierCard.jsx";
import BudgetTable from "./BudgetTable.jsx";
import { useChat } from "../hooks/useChat.js";

const LOGO_URL = "https://barnhaussteelbuilders.com/assets/images/logo-BbjiAVC6.png";

const s = {
  container:   { display: "flex", flexDirection: "column", height: "100%", maxWidth: 700, margin: "0 auto" },
  header:      { padding: "16px 24px", borderBottom: "1px solid #2a2a2a", textAlign: "center", flexShrink: 0, background: "#1a1a1a" },
  logoImg:     { height: 44, width: "auto", display: "block", margin: "0 auto 6px" },
  logoText:    { fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", fontFamily: "'Inter',sans-serif" },
  logoAccent:  { color: "#B8860B" },
  subtitle:    { fontSize: 12, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500 },
  messagesArea: { flex: 1, overflowY: "auto", padding: "20px 0", display: "flex", flexDirection: "column", gap: 12 },
  componentArea: { padding: "0 20px 4px", flexShrink: 0 },
  inputArea:   { padding: "16px 20px", borderTop: "1px solid #2a2a2a", flexShrink: 0, background: "#1a1a1a" },
  inputRow:    { display: "flex", gap: 8, alignItems: "center" },
  input:       { flex: 1, padding: "14px 18px", borderRadius: 24, border: "1px solid #3a3a3a", background: "#222", color: "#fff", fontSize: 15, outline: "none", fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s" },
  sendBtn:     { width: 46, height: 46, borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#B8860B,#DAA520)", color: "#1a1a1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  hint:        { fontSize: 11, color: "#555", textAlign: "center", marginTop: 8, fontFamily: "'Inter',sans-serif" },

  completeWrap: { flex: 1, overflowY: "auto", padding: "28px 20px" },
  completeHeader: { textAlign: "center", marginBottom: 24 },
  checkMark:   { fontSize: 48, marginBottom: 8 },
  completeTitle: { fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", marginBottom: 6 },
  completeText:  { fontSize: 14, color: "#888", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
};

// Renders the active inline component
function ActiveComponent({ component, onSubmit, onUpload }) {
  if (!component) return null;
  const type = component.type;

  if (type === "contact" || type === "home_details" || type === "contact_upload") {
    return <FieldCard component={component} onSubmit={onSubmit} onUpload={type === "contact" ? onUpload : undefined} />;
  }
  if (type === "checklist") {
    return <ChecklistCard component={component} onSubmit={onSubmit} />;
  }
  if (type === "tier_cards") {
    return <TierCard component={component} onSubmit={onSubmit} />;
  }
  if (type === "confirm") {
    return (
      <div style={{ padding: "12px 0 4px" }}>
        <button onClick={() => onSubmit("I confirm — please generate my budget estimate.", null)}
          style={{
            width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#B8860B,#DAA520)", color: "#1a1a1a",
            fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif", letterSpacing: "0.02em",
          }}>
          {component.label || "Generate My Budget Estimate"} ⚡
        </button>
      </div>
    );
  }
  return null;
}

export default function ChatWindow() {
  const {
    messages, isLoading, isComplete, budget, sessionData,
    activeComponent, dismissComponent,
    sendMessage, uploadPlan, startConversation,
  } = useChat();

  const [input, setInput]       = useState("");
  const [logoErr, setLogoErr]   = useState(false);
  const messagesEnd              = useRef(null);

  useEffect(() => { startConversation(); }, [startConversation]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, activeComponent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Called when any inline component is submitted
  const handleComponentSubmit = (humanText, componentData) => {
    dismissComponent();
    sendMessage(humanText, componentData);
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        {!logoErr
          ? <img src={LOGO_URL} alt="Barnhaus" style={s.logoImg} onError={() => setLogoErr(true)} />
          : <div style={s.logoText}>BARN<span style={s.logoAccent}>HAUS</span></div>
        }
        <div style={s.subtitle}>Budget Concierge</div>
      </div>

      {/* Complete view — shows budget table */}
      {isComplete ? (
        <div style={s.completeWrap}>
          <div style={s.completeHeader}>
            <div style={s.checkMark}>✓</div>
            <div style={s.completeTitle}>Your Estimate Is Ready</div>
            <div style={s.completeText}>
              {sessionData?.email ? `A copy has been sent to ${sessionData.email}.` : ""}
            </div>
          </div>
          {budget && <BudgetTable budget={budget} sessionData={sessionData} />}
        </div>

      ) : (
        <>
          {/* Messages */}
          <div style={s.messagesArea}>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEnd} />
          </div>

          {/* Inline component (checklist / tier cards / form / confirm) */}
          {activeComponent && (
            <div style={s.componentArea}>
              <ActiveComponent
                component={activeComponent}
                onSubmit={handleComponentSubmit}
                onUpload={uploadPlan}
              />
            </div>
          )}

          {/* Text input */}
          <div style={s.inputArea}>
            <div style={s.inputRow}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or answer above…"
                style={s.input}
                onFocus={e => (e.target.style.borderColor = "#B8860B")}
                onBlur={e => (e.target.style.borderColor = "#3a3a3a")}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                style={{ ...s.sendBtn, ...(isLoading || !input.trim() ? s.sendBtnDisabled : {}) }}
                disabled={isLoading || !input.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={s.hint}>Answer in the form above or type your response here</div>
          </div>
        </>
      )}
    </div>
  );
}
