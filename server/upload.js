const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Parse a floor plan PDF or image with Gemini vision.
 * Returns { sqft, stories, garage_bays } — any field may be null if not found.
 */
export async function parsePlan(buffer, mimeType) {
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error("Only images and PDFs are supported");
  }

  const inlinePart = {
    inlineData: {
      mimeType: isPdf ? "application/pdf" : mimeType,
      data: buffer.toString("base64")
    }
  };

  try {
    const res = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            inlinePart,
            {
              text: 'This is a floor plan or building plan. Extract: (1) total conditioned square footage, (2) number of stories, (3) number of garage bays. Output ONLY valid JSON — no prose: {"sqft":<number|null>,"stories":<number|null>,"garage_bays":<number|null>}'
            }
          ]
        }],
        generationConfig: { maxOutputTokens: 256 }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini vision error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error("Plan parse error:", err.message);
  }

  return { sqft: null, stories: null, garage_bays: null };
}
