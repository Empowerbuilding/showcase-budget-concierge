import { useState, useRef, useCallback } from "react";

function generateId() {
  return "s_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages]           = useState([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isComplete, setIsComplete]       = useState(false);
  const [budget, setBudget]               = useState(null);
  const [sessionData, setSessionData]     = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);

  const sessionId    = useRef(generateId());
  const hasGreeted   = useRef(false);

  // ── Handle server response ──────────────────────────────────────────────
  const handleResponse = useCallback(async (data) => {
    const aiMsg = { role: "assistant", text: data.message };
    setMessages(prev => [...prev, aiMsg]);

    if (data.conversationComplete) {
      // Fire complete endpoint to get budget
      setActiveComponent(null);
      try {
        const res = await fetch("/api/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current, sessionData: data.sessionData }),
        });
        const result = await res.json();
        if (result.budget) {
          setBudget(result.budget);
          setSessionData(data.sessionData);
        }
      } catch (err) {
        console.error("Complete error:", err);
      }
      setIsComplete(true);
    } else if (data.component) {
      setActiveComponent(data.component);
    } else {
      setActiveComponent(null);
    }
  }, []);

  // ── Send a message (with optional component data) ────────────────────────
  const sendMessage = useCallback(async (text, componentData) => {
    if (isLoading || isComplete) return;
    setActiveComponent(null);
    setMessages(prev => [...prev, { role: "user", text }]);
    setIsLoading(true);
    try {
      const body = { sessionId: sessionId.current, message: text };
      if (componentData) body.componentData = componentData;

      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      await handleResponse(data);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isComplete, handleResponse]);

  // ── Upload plan PDF/image, then send extracted data ──────────────────────
  const uploadPlan = useCallback(async (file) => {
    if (isLoading || isComplete) return;
    setActiveComponent(null);
    setIsLoading(true);

    // Show preview message
    setMessages(prev => [...prev, {
      role: "user",
      text: `Uploaded floor plan: ${file.name}`,
    }]);

    try {
      const formData = new FormData();
      formData.append("plan", file);
      const uploadRes  = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      const extracted = uploadData.extracted || {};
      const parts = [];
      if (extracted.sqft)        parts.push(`${extracted.sqft.toLocaleString()} sf`);
      if (extracted.stories)     parts.push(`${extracted.stories} stor${extracted.stories === 1 ? "y" : "ies"}`);
      if (extracted.garage_bays) parts.push(`${extracted.garage_bays}-car garage`);

      const context = parts.length
        ? `I've uploaded my floor plan (${file.name}). Extracted: ${parts.join(", ")}.`
        : `I've uploaded my floor plan (${file.name}). Please extract what you can.`;

      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          message: context,
          componentData: parts.length
            ? { key: "home_details", values: { sqft: extracted.sqft, stories: String(extracted.stories || ""), garage_bays: extracted.garage_bays || 0 } }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      await handleResponse(data);
    } catch (err) {
      console.error("Upload error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "I had trouble reading that file. Let's fill in the details manually." }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isComplete, handleResponse]);

  // ── Initial greeting ─────────────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setIsLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: "Hello" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setMessages([{ role: "assistant", text: data.message }]);
      if (data.component) setActiveComponent(data.component);
    } catch {
      setMessages([{ role: "assistant", text: "Hi! I'm the Showcase Builders Budget Concierge. Let's build your preliminary estimate." }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissComponent = useCallback(() => setActiveComponent(null), []);

  return {
    messages, isLoading, isComplete, budget, sessionData,
    activeComponent, dismissComponent,
    sendMessage, uploadPlan, startConversation,
  };
}
