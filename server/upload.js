import sharp from "sharp";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

/**
 * Parse a floor plan image with Gemini 2.5 Pro vision.
 * Resizes large images first to stay within inline data limits.
 * Returns { sqft, stories, garage_bays } — any field may be null if not found.
 */
export async function parsePlan(buffer, mimeType) {
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error("Only images and PDFs are supported");
  }

  let finalBuffer = buffer;
  let finalMime   = mimeType;

  // Resize images to max 1200px and convert to JPEG to keep payload small
  if (isImage) {
    finalBuffer = await sharp(buffer)
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    finalMime = "image/jpeg";
  }

  const inlinePart = {
    inlineData: {
      mimeType: finalMime,
      data: finalBuffer.toString("base64")
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
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Gemini vision raw:", text);
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error("Plan parse error:", err.message);
  }

  return { sqft: null, stories: null, garage_bays: null };
}
