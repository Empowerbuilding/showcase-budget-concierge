import { formatCurrency } from "./budget.js";

function tierLabel(t) {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "Standard";
}

function fmtList(obj) {
  if (!obj) return "None";
  const items = Object.entries(obj).filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
  return items.length ? items.join(", ") : "None";
}

function buildEmailHTML({ name, budget, sessionData: sd }) {
  const { lineItems, subtotal, contingency, low, high, meta } = budget;
  const sqft = meta.sqft || sd?.sqft || 0;
  const perSfLow  = sqft > 0 ? Math.round(low  / sqft) : null;
  const perSfHigh = sqft > 0 ? Math.round(high / sqft) : null;

  const rows = lineItems.map((li, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#F9F7F4"}">
      <td style="padding:9px 16px;color:#374151;font-size:13px;border-bottom:1px solid #EDE9E2;">${li.name}</td>
      <td style="padding:9px 16px;color:#374151;font-size:13px;border-bottom:1px solid #EDE9E2;text-align:right;font-variant-numeric:tabular-nums;">${formatCurrency(li.amount)}</td>
    </tr>`).join("");

  const detailRow = (label, value) => value ? `
    <tr>
      <td style="padding:5px 16px;color:#6B7280;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;width:40%;">${label}</td>
      <td style="padding:5px 16px;color:#111827;font-size:13px;">${value}</td>
    </tr>` : "";

  const storyLabel = { "1": "Single story", "1.5": "1.5 story", "2": "Two story", "3": "Three story" };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Build Blueprint</title></head>
<body style="margin:0;padding:20px 0;background:#F0EDE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2417 100%);border-radius:12px 12px 0 0;padding:36px 32px;text-align:center;">
      <img src="https://ozhkjwcjsifdhfdexayd.supabase.co/storage/v1/object/public/website-images/Showcase/showcase-builders-logo.png"
           alt="Showcase Builders" style="height:64px;width:auto;display:block;margin:0 auto 16px;background:#fff;padding:8px 16px;border-radius:6px;" />
      <div style="color:#C5A572;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">Build Concierge</div>
    </div>

    <!-- Gold bar -->
    <div style="height:4px;background:linear-gradient(90deg,#B8960A,#C5A572,#B8960A);"></div>

    <!-- Intro -->
    <div style="background:#fff;padding:32px 32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:Georgia,serif;">Hi ${name || "there"},</h1>
      <p style="margin:0 0 20px;color:#6B7280;font-size:14px;line-height:1.7;">
        Here's your personalized build blueprint from Showcase Builders. This is a planning-level estimate based on your selections —
        final pricing is subject to site conditions, design development, and current material costs.
      </p>

      <!-- Budget Range — hero number -->
      <div style="background:linear-gradient(135deg,#1a1a1a,#2d2417);border-radius:10px;padding:24px 28px;margin-bottom:24px;text-align:center;">
        <div style="color:#C5A572;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:10px;font-weight:600;">Estimated Budget Range</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:20px;">
          <div>
            <div style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Low</div>
            <div style="color:#fff;font-size:26px;font-weight:700;font-family:Georgia,serif;">${formatCurrency(low)}</div>
          </div>
          <div style="color:#C5A572;font-size:22px;font-weight:200;">—</div>
          <div>
            <div style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">High</div>
            <div style="color:#C5A572;font-size:26px;font-weight:700;font-family:Georgia,serif;">${formatCurrency(high)}</div>
          </div>
        </div>
        ${perSfLow ? `<div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:10px;">≈ ${formatCurrency(perSfLow)} – ${formatCurrency(perSfHigh)}/sf all-in</div>` : ""}
      </div>

      <!-- Build Summary -->
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;color:#C5A572;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #C5A572;">Your Build Summary</div>
        <table style="width:100%;border-collapse:collapse;">
          ${detailRow("Location", sd?.build_location)}
          ${detailRow("Square Footage", sqft ? `${sqft.toLocaleString()} sf` : null)}
          ${detailRow("Bedrooms / Baths", (sd?.bedrooms || sd?.full_baths) ? `${sd.bedrooms || "—"} bed · ${sd.full_baths || 0} full / ${sd.half_baths || 0} half bath` : null)}
          ${detailRow("Stories", sd?.stories ? storyLabel[sd.stories] || sd.stories : null)}
          ${detailRow("Garage", sd?.garage_bays && sd.garage_bays !== "0" ? `${sd.garage_bays}-bay` : null)}
          ${detailRow("Bonus Room", sd?.bonus_room ? "Yes" : null)}
          ${detailRow("Site Terrain", fmtList(sd?.site_terrain) !== "None" ? fmtList(sd?.site_terrain) : null)}
          ${detailRow("Site Conditions", fmtList(sd?.site_conditions) !== "None" ? fmtList(sd?.site_conditions) : null)}
          ${detailRow("Exterior Finish", tierLabel(meta.exterior_tier))}
          ${detailRow("Interior Finish", tierLabel(meta.interior_tier))}
          ${detailRow("Special Features", fmtList(sd?.special_features) !== "None" ? fmtList(sd?.special_features) : null)}
          ${detailRow("Priorities", fmtList(sd?.priorities) !== "None" ? fmtList(sd?.priorities) : null)}
        </table>
      </div>
    </div>

    <!-- Cost Breakdown -->
    <div style="background:#FAFAF8;border-top:1px solid #EDE9E2;">
      <div style="padding:20px 32px 12px;">
        <div style="font-size:10px;color:#C5A572;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Cost Breakdown</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#F0EDE8;">
            <th style="padding:8px 16px;font-size:10px;color:#9CA3AF;letter-spacing:0.1em;text-transform:uppercase;text-align:left;font-weight:600;">Category</th>
            <th style="padding:8px 16px;font-size:10px;color:#9CA3AF;letter-spacing:0.1em;text-transform:uppercase;text-align:right;font-weight:600;">Estimate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:10px 16px;color:#6B7280;font-size:13px;border-top:1px solid #EDE9E2;">Subtotal</td>
            <td style="padding:10px 16px;color:#6B7280;font-size:13px;border-top:1px solid #EDE9E2;text-align:right;">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:6px 16px;color:#9CA3AF;font-size:12px;">10% Contingency</td>
            <td style="padding:6px 16px;color:#9CA3AF;font-size:12px;text-align:right;">${formatCurrency(contingency)}</td>
          </tr>
          <tr style="background:#F0EDE8;">
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#C5A572;border-top:2px solid #C5A572;">Estimated Range</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#C5A572;border-top:2px solid #C5A572;text-align:right;">${formatCurrency(low)} – ${formatCurrency(high)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- CTA -->
    <div style="background:#fff;padding:32px;text-align:center;border-top:1px solid #EDE9E2;">
      <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">Ready to Get a Hard Number?</div>
      <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0 0 20px;">
        This estimate is a starting point. Book a 15-minute call with our team and we'll walk through your site, your plan, and what it actually costs to build.
      </p>
      <a href="https://crm.showcasebuilders.com/book/30-minute-consultation"
         style="display:inline-block;background:#C5A572;color:#fff;font-size:13px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;">
        Book Your Site Review →
      </a>
    </div>

    <!-- Disclaimer + Footer -->
    <div style="background:#1a1a1a;border-radius:0 0 12px 12px;padding:20px 32px;">
      <p style="color:rgba(255,255,255,0.35);font-size:10px;line-height:1.6;margin:0 0 12px;">
        This estimate is preliminary and for planning purposes only. Actual costs will vary based on final plans, site conditions,
        material selections, and local labor markets. Contact your builder for a detailed bid based on construction documents.
      </p>
      <div style="color:#C5A572;font-size:10px;text-align:center;letter-spacing:0.12em;text-transform:uppercase;">
        Showcase Builders · showcasebuilders.com · Texas Hill Country &amp; Highland Lakes
      </div>
    </div>

  </div>
</body>
</html>`;
}

export async function sendBudgetEmail({ name, email, budget, sessionData }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }
  if (!email) {
    console.warn("No email address — skipping");
    return { skipped: true };
  }

  const sqft = sessionData?.sqft || budget?.meta?.sqft || 0;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Showcase Builders <sales@showcasebuilders.com>",
      reply_to: "mitchell@empowerbuilding.ai",
      to: email,
      subject: `Your Build Blueprint — ${sqft ? sqft.toLocaleString() + " sf " : ""}Custom Home on Lake LBJ`,
      html: buildEmailHTML({ name, budget, sessionData }),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("Resend error:", json);
    throw new Error(json.message || "Email send failed");
  }
  console.log("Email sent:", json.id);
  return json;
}
