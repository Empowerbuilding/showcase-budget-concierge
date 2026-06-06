import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { chat } from "./claude.js";
import { writeBudgetSession, writeLead, writeShowcaseCrmLead } from "./supabase.js";
import { calculateBudget } from "./budget.js";
import { sendBudgetEmail } from "./email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
app.use(express.json());

// Serve static React build
app.use(express.static(path.join(__dirname, "../client/dist")));

// In-memory session store
const sessions = new Map();

// ── Health check ────────────────────────────────────────────────────────────
// ── File upload — accept and acknowledge, no AI parsing ───────────────────────────
app.post("/api/upload", upload.single("plan"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    console.log(`File received: ${req.file.originalname} (${req.file.size} bytes)`);
    res.json({ success: true, filename: req.file.originalname, extracted: {} });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// ── Lead capture ────────────────────────────────────────────────────────────
app.post("/api/lead", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    if (!phone || phone.trim() === "") {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }
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
    const { sessionId, message, componentData } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { history: [], data: {} });
    }
    const session = sessions.get(sessionId);

    // Merge structured component data into session store
    if (componentData?.key && componentData?.values) {
      const { key, values } = componentData;
      if (key === "contact" || key === "home_details") {
        Object.assign(session.data, values);
      } else {
        session.data[key] = values;
      }
    }

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
          component.total_steps = 10; // always override — Claude sometimes hallucinates wrong count
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
    const session = sessions.get(sessionId);
    const mergedData = { ...(session?.data || {}), ...(clientSessionData || {}) };

    const budget = calculateBudget(mergedData);

    const [dbResult, emailResult, crmResult] = await Promise.allSettled([
      writeBudgetSession({ sessionData: mergedData, budget }),
      sendBudgetEmail({ name: mergedData.first_name || mergedData.name, email: mergedData.email, budget, sessionData: mergedData }),
      writeShowcaseCrmLead({ sessionData: mergedData, budget }),
    ]);

    if (crmResult.status === "rejected") console.error("CRM write failed:", crmResult.reason);

    if (dbResult.status === "rejected") console.error("DB write failed:", dbResult.reason);
    if (emailResult.status === "rejected") console.error("Email failed:", emailResult.reason);

    res.json({ success: true, budget });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ error: "Failed to generate budget" });
  }
});

// ── SPA fallback ────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Showcase Builders Build Concierge running on port ${PORT}`);
});
