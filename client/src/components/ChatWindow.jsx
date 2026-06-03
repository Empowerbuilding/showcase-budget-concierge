import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import FieldCard from "./FieldCard.jsx";
import ChecklistCard from "./ChecklistCard.jsx";
import TierCard from "./TierCard.jsx";
import BudgetTable from "./BudgetTable.jsx";
import MeetingsEmbed from "./MeetingsEmbed.jsx";
import { useChat } from "../hooks/useChat.js";

const LOGO_URL = "https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/object/public/website-images/Showcase/showcase-builders-logo.png";

const s = {
  container:     { display: "flex", flexDirection: "column", height: "100%", maxWidth: 700, margin: "0 auto" },
  header:        { padding: "14px 24px 10px", borderBottom: "1px solid #E5E0D8", textAlign: "center", flexShrink: 0, background: "#FAFAF8" },
  logoImg:       { height: 44, width: "auto", display: "block", margin: "0 auto 4px" },
  logoText:      { fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "0.04em", fontFamily: "'Playfair Display',serif" },
  logoAccent:    { color: "#C5A572" },
  subtitle:      { fontSize: 11, color: "#6B7280", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500 },
  progressWrap:  { padding: "4px 0 8px", flexShrink: 0 },
  progressTrack: { height: 3, background: "#E5E0D8", borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%", background: "#C5A572", borderRadius: 99, transition: "width 0.4s ease" },
  progressLabel: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  messagesArea:  { flex: 1, overflowY: "auto", padding: "20px 0", display: "flex", flexDirection: "column", gap: 12 },
  componentArea: { padding: "0 20px 4px", flexShrink: 0 },
  inputArea:     { padding: "12px 20px", borderTop: "1px solid #E5E0D8", flexShrink: 0, background: "#FAFAF8" },
  inputRow:      { display: "flex", gap: 8, alignItems: "center" },
  input:         { flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid #D1D5DB", background: "#F5F3EF", color: "#111827", fontSize: 15, outline: "none", fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s" },
  sendBtn:       { width: 44, height: 44, borderRadius: "50%", border: "none", background: "#C5A572", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  hint:          { fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 6, fontFamily: "'Inter',sans-serif" },
  completeWrap:  { flex: 1, overflowY: "auto", padding: "28px 20px" },
  completeHeader: { textAlign: "center", marginBottom: 24 },
  checkMark:     { fontSize: 48, marginBottom: 8 },
  completeTitle: { fontSize: 22, fontWeight: 700, color: "#111827", fontFamily: "'Playfair Display',serif", marginBottom: 6 },
  completeText:  { fontSize: 14, color: "#6B7280", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
};

function ProgressBar({ step, totalSteps }) {
  if (!step || !totalSteps) return null;
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div style={s.progressWrap}>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${pct}%` }} />
      </div>
      <div style={s.progressLabel}>
        <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>
          Step {step} of {totalSteps}
        </span>
        <span style={{ fontSize: 10, color: "#C5A572", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
          {pct}% complete
        </span>
      </div>
    </div>
  );
}

function ActiveComponent({ component, onSubmit, onBack, onUpload }) {
  if (!component) return null;
  const { type } = component;

  const withBack = (inner) => (
    <div>
      {inner}
      {onBack && (
        <button onClick={onBack}
          style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", fontFamily: "'Inter',sans-serif", padding: "4px 0" }}>
          ← Go back
        </button>
      )}
    </div>
  );

  if (type === "contact" || type === "home_details") {
    return withBack(<FieldCard component={component} onSubmit={onSubmit} onUpload={type === "contact" ? onUpload : undefined} />);
  }
  if (type === "checklist") {
    return withBack(<ChecklistCard component={component} onSubmit={onSubmit} />);
  }
  if (type === "tier_cards") {
    return withBack(<TierCard component={component} onSubmit={onSubmit} />);
  }
  if (type === "confirm") {
    return withBack(
      <div style={{ padding: "12px 0 4px" }}>
        <button onClick={() => onSubmit("I confirm — please generate my budget estimate.", null)}
          style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: "pointer", background: "#C5A572", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif", transition: "background 0.2s" }}
          onMouseEnter={e => (e.target.style.background = "#B39460")}
          onMouseLeave={e => (e.target.style.background = "#C5A572")}
        >
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

  const [input, setInput]     = useState("");
  const [logoErr, setLogoErr] = useState(false);
  const messagesEnd            = useRef(null);
  const lastMessageRef         = useRef(null);
  const inputRef               = useRef(null);

  useEffect(() => { startConversation(); }, [startConversation]);

  // When a component appears, scroll to the last message so the question stays visible
  // When no component, scroll to bottom as normal
  useEffect(() => {
    if (activeComponent) {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeComponent]);
  useEffect(() => {
    if (!isComplete && !activeComponent && !isLoading) inputRef.current?.focus();
  }, [messages, isLoading, activeComponent, isComplete]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleComponentSubmit = (humanText, componentData) => {
    dismissComponent();
    sendMessage(humanText, componentData);
  };

  const handleBack = () => {
    dismissComponent();
    sendMessage("Actually, let me go back and change my previous answer.");
  };

  const step = activeComponent?.step;
  const totalSteps = activeComponent?.total_steps;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        {!logoErr
          ? <img src={LOGO_URL} alt="Showcase Builders" style={s.logoImg} onError={() => setLogoErr(true)} />
          : <div style={s.logoText}>SHOWCASE <span style={s.logoAccent}>BUILDERS</span></div>
        }
        <div style={s.subtitle}>Build Concierge</div>
      </div>



      {/* Complete view */}
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
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Playfair Display',serif", textAlign: "center", marginBottom: 6 }}>Get Hard Numbers. Book Your Site &amp; Design Review.</div>
            <div style={{ fontSize: 14, color: "#6B7280", fontFamily: "'Inter',sans-serif", textAlign: "center", lineHeight: 1.6, marginBottom: 4 }}>Schedule your complimentary 15-minute intro call with our design team.</div>
            <MeetingsEmbed />
            <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 24 }}>
              <a href="https://www.showcasebuilders.com" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "12px 28px", borderRadius: 8, border: "2px solid #C5A572", color: "#C5A572", fontSize: 14, fontFamily: "'Inter',sans-serif", fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#C5A572"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C5A572"; }}
              >
                Visit ShowcaseBuilders.com →
              </a>
            </div>
          </div>
        </div>

      ) : (
        <>
          <div style={s.messagesArea}>
            {messages.map((msg, i) => (
              <div key={i} ref={i === messages.length - 1 ? lastMessageRef : null}>
                <MessageBubble message={msg} />
              </div>
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEnd} />
          </div>

          {activeComponent && (
            <div style={s.componentArea}>
              <ProgressBar step={step} totalSteps={totalSteps} />
              <ActiveComponent
                component={activeComponent}
                onSubmit={handleComponentSubmit}
                onBack={messages.length > 2 ? handleBack : null}
                onUpload={uploadPlan}
              />
            </div>
          )}

          <div style={s.inputArea}>
            <div style={s.inputRow}>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or answer above…"
                style={s.input}
                onFocus={e => (e.target.style.borderColor = "#C5A572")}
                onBlur={e => (e.target.style.borderColor = "#D1D5DB")}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                style={{ ...s.sendBtn, ...(isLoading || !input.trim() ? s.sendBtnDisabled : {}) }}
                disabled={isLoading || !input.trim()}
                onMouseEnter={e => { if (!isLoading && input.trim()) e.currentTarget.style.background = "#B39460"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#C5A572"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
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
