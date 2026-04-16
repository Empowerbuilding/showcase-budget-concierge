import sharp from "sharp";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Parse a floor plan PDF or image with Gemini 2.5 Flash (multimodal).
 * Images are resized to max 1200px to keep payload small.
 * PDFs are sent as-is (Gemini handles them natively).
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

  // Resize images to keep payload manageable
  if (isImage) {
    try {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      finalMime = "image/jpeg";
    } catch (e) {
      console.warn("sharp resize failed, using original:", e.message);
    }
  }

  const b64 = finalBuffer.toString("base64");
  console.log(`Sending to Gemini: ${finalMime}, ${Math.round(b64.length / 1024)}KB base64`);

  try {
    const res = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: finalMime, data: b64 } },
            { text: 'This is a floor plan or building plan. Extract: (1) total conditioned square footage, (2) number of stories, (3) number of garage bays. Output ONLY valid JSON — no prose: {"sqft":<number|null>,"stories":<number|null>,"garage_bays":<number|null>}' }
          ]
        }],
        generationConfig: { maxOutputTokens: 256 }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${data?.error?.message}`);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Gemini vision response:", text);
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);

  } catch (err) {
    console.error("Plan parse error:", err.message);
  }

  return { sqft: null, stories: null, garage_bays: null };
}
