import { useState, useRef, useCallback } from "react";

function generateId() {
  return "s_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function useChat(leadData) {
  const [messages, setMessages]       = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [isComplete, setIsComplete]   = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const sessionId  = useRef(generateId());
  const hasGreeted = useRef(false);

  // ── Handle server response ──────────────────────────────────────────────
  const handleResponse = useCallback((data) => {
    const aiMsg = { role: "assistant", text: data.message };
    setMessages(prev => [...prev, aiMsg]);

    if (data.conversationComplete) {
      setSessionData(data.sessionData || null);
      setIsComplete(true);
    }
  }, []);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (isLoading || isComplete) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      handleResponse(data);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isComplete, handleResponse]);

  // ── Initial greeting — send user name so Claude greets them ──────────────
  const startConversation = useCallback(async () => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setIsLoading(true);
    const firstName = leadData?.firstName || "";
    const lastName  = leadData?.lastName  || "";
    const greeting  = `Hello, my name is ${firstName} ${lastName}`.trim();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: greeting }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setMessages([{ role: "assistant", text: data.message }]);
      if (data.conversationComplete) {
        setSessionData(data.sessionData || null);
        setIsComplete(true);
      }
    } catch {
      setMessages([{
        role: "assistant",
        text: `Hi ${firstName}! I'm the Showcase Builders Design Concierge. Let's get started on your build blueprint.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [leadData]);

  return {
    sessionId: sessionId.current,
    messages,
    isLoading,
    isComplete,
    sessionData,
    sendMessage,
    startConversation,
  };
}
