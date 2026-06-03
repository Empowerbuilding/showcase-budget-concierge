import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { chat } from "./claude.js";
import { writeBudgetSession, writeLead } from "./supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static React build
app.use(express.static(path.join(__dirname, "../client/dist")));

// In-memory session store
const sessions = new Map();

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// ── Lead capture ────────────────────────────────────────────────────────────
app.post("/api/lead", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    await writeLead({ firstName, lastName, email, phone });
    res.json({ success: true });
  } catch (err) {
    console.error("Lead save error:", err.message);
    res.json({ success: true }); // never block the user on a DB error
  }
});

// ── Chat endpoint ───────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { history: [] });
    }
    const session = sessions.get(sessionId);

    // Add user message to history
    session.history.push({ role: "user", content: message });

    // Call Claude
    const aiResponse = await chat(session.history);

    // Add assistant response to history
    session.history.push({ role: "assistant", content: aiResponse });

    // Parse JSON block for component / conversationComplete / sessionData
    let component = null;
    let conversationComplete = false;
    let claudeSessionData = null;

    const jsonMatch = aiResponse.match(/```json\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.conversation_complete) {
          conversationComplete = true;
          claudeSessionData = parsed.session_data || {};
        } else if (parsed.component) {
          component = parsed.component;
        }
      } catch (e) {
        console.error("JSON parse error in AI response:", e.message);
      }
    }

    // Clean response text — strip JSON blocks
    const cleanText = aiResponse
      .replace(/```json\s*\n?[\s\S]*?```/gs, "")
      .trim();

    res.json({ message: cleanText, component, conversationComplete, sessionData: claudeSessionData });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// ── Complete endpoint — save session ────────────────────────────────────────
app.post("/api/complete", async (req, res) => {
  try {
    const { sessionId, sessionData: clientSessionData } = req.body;
    await writeBudgetSession({ sessionData: clientSessionData || {} });
    res.json({ success: true });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

// ── SPA fallback ────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Showcase Builders Budget Concierge running on port ${PORT}`);
});
