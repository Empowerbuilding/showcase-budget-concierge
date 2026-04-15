import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Parse a floor plan PDF or image with Claude vision.
 * Returns { sqft, stories, garage_bays } — any field may be null if not found.
 */
export async function parsePlan(buffer, mimeType) {
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error("Only images and PDFs are supported");
  }

  const contentBlock = isImage
    ? { type: "image",    source: { type: "base64", media_type: mimeType,           data: buffer.toString("base64") } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf",  data: buffer.toString("base64") } };

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: 'This is a floor plan or building plan. Extract: (1) total conditioned square footage, (2) number of stories, (3) number of garage bays. Output ONLY valid JSON — no prose: {"sqft":<number|null>,"stories":<number|null>,"garage_bays":<number|null>}',
          },
        ],
      }],
    });

    const text  = response.content[0]?.text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error("Plan parse error:", err.message);
  }
  return { sqft: null, stories: null, garage_bays: null };
}
