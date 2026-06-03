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
  const [extractedDefaults, setExtractedDefaults] = useState({});

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
      // Inject extracted plan defaults into home_details fields
      let comp = data.component;
      if (comp.type === "home_details" && Object.keys(extractedDefaults).length) {
        comp = {
          ...comp,
          fields: comp.fields.map(f => ({
            ...f,
            default: extractedDefaults[f.key] !== undefined ? extractedDefaults[f.key] : (f.default ?? "")
          }))
        };
      }
      setActiveComponent(comp);
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
      const summary = uploadData.extracted?.summary || null;

      // Store for injection into home_details form
      if (Object.keys(extracted).some(k => extracted[k] !== null && k !== "summary")) {
        setExtractedDefaults({
          sqft: extracted.sqft || "",
          stories: extracted.stories ? String(extracted.stories) : "",
          garage_bays: extracted.garage_bays || 0,
        });
      }
      const parts = [];
      if (extracted.sqft)        parts.push(`${extracted.sqft.toLocaleString()} sf`);
      if (extracted.stories)     parts.push(`${extracted.stories} stor${extracted.stories === 1 ? "y" : "ies"}`);
      if (extracted.garage_bays) parts.push(`${extracted.garage_bays}-car garage`);

      // Use summary if available, otherwise fall back to extracted parts
      const context = summary
        ? `I've uploaded my floor plan (${file.name}). Here's what I can see: ${summary}${parts.length ? " Extracted: " + parts.join(", ") + "." : ""}`
        : parts.length
          ? `I've uploaded my floor plan (${file.name}). Extracted: ${parts.join(", ")}.`
          : `I've uploaded my floor plan (${file.name}). Please help me fill in the details.`;

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

    // -- Initial greeting -- instant, no API call
  const INSTANT_COMPONENT = {type:'home_details',step:1,total_steps:9,fields:[{key:'sqft',label:'Square Footage',type:'number',placeholder:'e.g. 2400'},{key:'bedrooms',label:'Bedrooms',type:'select',options:[{value:'2',label:'2 Bed'},{value:'3',label:'3 Bed'},{value:'4',label:'4 Bed'},{value:'5',label:'5 Bed'},{value:'6',label:'6 Bed'},{value:'7',label:'7 Bed'}]},{key:'full_baths',label:'Full Baths',type:'select',options:[{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'}]},{key:'half_baths',label:'Half Baths',type:'select',options:[{value:'0',label:'None'},{value:'1',label:'1'},{value:'2',label:'2'}]},{key:'stories',label:'Stories',type:'select',options:[{value:'1',label:'Single story'},{value:'1.5',label:'1.5 story'},{value:'2',label:'Two story'},{value:'3',label:'Three story'}]},{key:'garage_bays',label:'Garage Bays',type:'select',options:[{value:'0',label:'No garage'},{value:'1',label:'1 bay'},{value:'2',label:'2 bays'},{value:'3',label:'3 bays'},{value:'4',label:'4+ bays'}]},{key:'bonus_room',label:'Bonus Room?',type:'boolean'}]};

  const startConversation = useCallback(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setMessages([{ role: 'assistant', text: 'Welcome to Showcase Builders! I’m your Design Concierge — let’s build your preliminary budget estimate in about 2 minutes. Start by telling me about your home.' }]);
    setActiveComponent(INSTANT_COMPONENT);
  }, []);

  const dismissComponent = useCallback(() => setActiveComponent(null), []);

  return {
    messages, isLoading, isComplete, budget, sessionData,
    activeComponent, dismissComponent, extractedDefaults,
    sendMessage, uploadPlan, startConversation,
  };
}
