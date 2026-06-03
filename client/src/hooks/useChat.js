import { useState, useRef, useCallback } from "react";

function generateId() {
  return "s_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages]               = useState([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [isComplete, setIsComplete]           = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const [sessionData, setSessionData]         = useState(null);

  const sessionId  = useRef(generateId());
  const hasGreeted = useRef(false);

  const handleResponse = useCallback((data) => {
    const aiMsg = { role: "assistant", text: data.message };
    setMessages(prev => [...prev, aiMsg]);

    if (data.conversationComplete) {
      setActiveComponent(null);
      setSessionData(data.sessionData || null);
      setIsComplete(true);
    } else if (data.component) {
      setActiveComponent(data.component);
    } else {
      setActiveComponent(null);
    }
  }, []);

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
      handleResponse(data);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isComplete, handleResponse]);

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
      setMessages([{ role: "assistant", text: "Hi! I'm the Showcase Builders Design Concierge. Let's build your blueprint." }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissComponent = useCallback(() => setActiveComponent(null), []);

  return {
    messages, isLoading, isComplete, activeComponent, sessionData,
    sendMessage, startConversation, dismissComponent,
  };
}
