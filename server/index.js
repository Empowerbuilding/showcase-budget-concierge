import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { chat } from "./claude.js";
import { writeBudgetSession } from "./supabase.js";
import { calculateBudget } from "./budget.js";
import { sendBudgetEmail } from "./email.js";
import { parsePlan } from "./upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Multer — in-memory storage for plan uploads (PDF + images, 20MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(ok ? null : new Error("Only images and PDFs allowed"), ok);
  },
});

// In-memory session store
const sessions = new Map();

// Serve static React build
app.use(express.static(path.join(__dirname, "../client/dist")));

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// ── Plan upload & parse ─────────────────────────────────────────────────────
app.post("/api/upload", upload.single("plan"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const extracted = await parsePlan(req.file.buffer, req.file.mimetype);
    res.json({ extracted });
  } catch (err) {
    console.error("Upload/parse error:", err.message);
    res.status(500).json({ error: err.message });
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

    // Merge structured component data into session
    if (componentData?.key && componentData?.values) {
      const { key, values } = componentData;
      if (key === "contact") {
        Object.assign(session.data, values);
      } else if (key === "home_details") {
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

    // Parse component JSON from response
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

// ── Complete endpoint — calculate budget, email, save ───────────────────────
app.post("/api/complete", async (req, res) => {
  try {
    const { sessionId, sessionData: clientSessionData } = req.body;

    // Merge session store data with what Claude reported
    const session = sessions.get(sessionId);
    const mergedData = { ...(session?.data || {}), ...(clientSessionData || {}) };

    // Calculate budget
    const budget = calculateBudget(mergedData);

    // Save to Supabase + send email in parallel
    const [dbResult, emailResult] = await Promise.allSettled([
      writeBudgetSession({ sessionData: mergedData, budget }),
      sendBudgetEmail({ name: mergedData.name, email: mergedData.email, budget, sessionData: mergedData }),
    ]);

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
  console.log(`Showcase Builders Budget Concierge running on port ${PORT}`);
});
